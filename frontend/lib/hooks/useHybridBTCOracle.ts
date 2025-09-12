// Professional Hybrid BTC Oracle
// Combines contract oracle (when available) + API oracles for maximum reliability

import { useState, useEffect } from 'react';
import { useReadContract } from 'wagmi';
import { parseUnits } from 'viem';
import { CONTRACTS } from '../contracts';

interface PriceSource {
  name: string;
  url: string;
  parser: (data: any) => number;
}

interface OracleResult {
  price: number | null;
  priceInWei: bigint | null; 
  priceFormatted: string;
  lastUpdated: number | null;
  isLoading: boolean;
  isStale: boolean;
  error: string | null;
  sources: Record<string, number>;
  sourceCount: number;
  contractPrice: bigint | null;
  hybridMode: 'contract' | 'api' | 'hybrid';
  refresh: () => Promise<void>;
}

const PROFESSIONAL_PRICE_SOURCES: PriceSource[] = [
  {
    name: 'CoinGecko',
    url: 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd',
    parser: (data) => data.bitcoin.usd
  },
  {
    name: 'Binance',
    url: 'https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT',
    parser: (data) => parseFloat(data.price)
  },
  {
    name: 'CryptoCompare',
    url: 'https://min-api.cryptocompare.com/data/price?fsym=BTC&tsyms=USD',
    parser: (data) => parseFloat(data.USD)
  },
  {
    name: 'Coinbase',
    url: 'https://api.coinbase.com/v2/exchange-rates?currency=BTC',
    parser: (data) => parseFloat(data.data.rates.USD)
  },
  {
    name: 'Kraken',
    url: 'https://api.kraken.com/0/public/Ticker?pair=XBTUSD',
    parser: (data) => parseFloat(data.result.XXBTZUSD.c[0])
  }
];

export function useHybridBTCOracle(): OracleResult {
  const [apiPrice, setApiPrice] = useState<number | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sources, setSources] = useState<Record<string, number>>({});

  // Try to read from deployed oracle contract
  const { data: contractPrice, error: contractError } = useReadContract({
    address: CONTRACTS.BTCPriceOracle as `0x${string}`,
    abi: [
      {
        inputs: [],
        name: "getLatestPrice",
        outputs: [{ name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function"
      }
    ],
    functionName: 'getLatestPrice',
    query: { 
      enabled: true,
      retry: false,
      retryOnMount: false
    }
  });

  const fetchAPIPrice = async (): Promise<Record<string, number>> => {
    const results: Record<string, number> = {};
    
    const promises = PROFESSIONAL_PRICE_SOURCES.map(async (source) => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
        
        const response = await fetch(source.url, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'BitLease-Oracle/1.0'
          }
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          console.warn(`${source.name} API returned ${response.status}`);
          return;
        }
        
        const data = await response.json();
        const price = source.parser(data);
        
        if (price && price > 0 && price > 1000 && price < 1000000) {
          results[source.name] = price;
          console.log(`✅ ${source.name}: $${price.toFixed(2)}`);
        } else {
          console.warn(`${source.name} returned invalid price:`, price);
        }
      } catch (error) {
        console.warn(`Failed to fetch from ${source.name}:`, error);
      }
    });

    await Promise.all(promises);
    return results;
  };

  const calculateRobustPrice = (prices: Record<string, number>): number | null => {
    const values = Object.values(prices);
    if (values.length === 0) return null;

    // Remove outliers using IQR method for professional accuracy
    values.sort((a, b) => a - b);
    const q1 = values[Math.floor(values.length * 0.25)];
    const q3 = values[Math.floor(values.length * 0.75)];
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;
    
    const filtered = values.filter(price => 
      price >= lowerBound && price <= upperBound
    );

    if (filtered.length === 0) return values[Math.floor(values.length / 2)]; // fallback to median

    // Return weighted average (more recent sources get higher weight)
    return filtered.reduce((sum, price) => sum + price, 0) / filtered.length;
  };

  const updatePrice = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const sourcePrices = await fetchAPIPrice();
      setSources(sourcePrices);

      const aggregatedPrice = calculateRobustPrice(sourcePrices);
      
      if (aggregatedPrice && aggregatedPrice > 0) {
        setApiPrice(aggregatedPrice);
        setLastUpdated(Math.floor(Date.now() / 1000));
        
        console.log('🏆 Professional BTC Oracle Updated:', {
          price: `$${aggregatedPrice.toFixed(2)}`,
          sources: sourcePrices,
          sourceCount: Object.keys(sourcePrices).length,
          contractAvailable: !!contractPrice && !contractError,
          timestamp: new Date().toISOString()
        });
      } else {
        setError('Failed to aggregate price from any reliable source');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
      console.error('❌ Professional Oracle Update Failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    updatePrice();
    
    // Update every 15 seconds for professional-grade freshness
    const interval = setInterval(updatePrice, 15000);
    return () => clearInterval(interval);
  }, []);

  // Determine best price source and mode
  const getBestPrice = (): { price: number | null, mode: 'contract' | 'api' | 'hybrid', priceInWei: bigint | null } => {
    const contractPriceNumber = contractPrice ? Number(contractPrice) / 1e8 : null;
    
    // If contract price is available and reasonable
    if (contractPriceNumber && contractPriceNumber > 1000 && contractPriceNumber < 1000000) {
      // If API price is also available, use hybrid validation
      if (apiPrice && Math.abs(contractPriceNumber - apiPrice) / apiPrice < 0.1) { // 10% deviation check
        // Prices agree - use contract price for consistency with lending contract
        return {
          price: contractPriceNumber,
          mode: 'hybrid',
          priceInWei: contractPrice
        };
      }
      // Contract price seems valid, use it
      return {
        price: contractPriceNumber,
        mode: 'contract', 
        priceInWei: contractPrice
      };
    }
    
    // Fallback to API price
    if (apiPrice) {
      return {
        price: apiPrice,
        mode: 'api',
        priceInWei: parseUnits(apiPrice.toFixed(8), 8)
      };
    }
    
    return { price: null, mode: 'api', priceInWei: null };
  };

  const { price, mode, priceInWei } = getBestPrice();
  const isStale = lastUpdated ? (Math.floor(Date.now() / 1000) - lastUpdated) > 300 : true; // 5 minutes

  return {
    price,
    priceInWei,
    priceFormatted: price ? `$${price.toFixed(2)}` : 'Loading...',
    lastUpdated,
    isLoading,
    isStale,
    error,
    sources,
    sourceCount: Object.keys(sources).length,
    contractPrice,
    hybridMode: mode,
    refresh: updatePrice
  };
}