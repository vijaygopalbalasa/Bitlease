// Professional BTC Price Oracle Hook
// Aggregates prices from multiple sources for reliability

import { useState, useEffect } from 'react';
import { parseUnits } from 'viem';

interface PriceSource {
  name: string;
  url: string;
  parser: (data: any) => number;
}

const PRICE_SOURCES: PriceSource[] = [
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
  }
];

export function useProfessionalBTCPrice() {
  const [price, setPrice] = useState<number | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sources, setSources] = useState<Record<string, number>>({});

  const fetchPriceFromSources = async () => {
    const results: Record<string, number> = {};
    const promises = PRICE_SOURCES.map(async (source) => {
      try {
        const response = await fetch(source.url);
        const data = await response.json();
        const price = source.parser(data);
        if (price && price > 0) {
          results[source.name] = price;
        }
      } catch (error) {
        console.warn(`Failed to fetch from ${source.name}:`, error);
      }
    });

    await Promise.all(promises);
    return results;
  };

  const calculateAggregatedPrice = (prices: Record<string, number>) => {
    const values = Object.values(prices);
    if (values.length === 0) return null;

    // Remove outliers (prices that are >5% different from median)
    values.sort((a, b) => a - b);
    const median = values[Math.floor(values.length / 2)];
    const filtered = values.filter(price => 
      Math.abs(price - median) / median < 0.05 // 5% threshold
    );

    // Return average of filtered prices
    return filtered.reduce((sum, price) => sum + price, 0) / filtered.length;
  };

  const updatePrice = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const sourcePrices = await fetchPriceFromSources();
      setSources(sourcePrices);

      const aggregatedPrice = calculateAggregatedPrice(sourcePrices);
      
      if (aggregatedPrice) {
        setPrice(aggregatedPrice);
        setLastUpdated(Math.floor(Date.now() / 1000));
        console.log('✅ BTC Price Updated:', {
          price: `$${aggregatedPrice.toFixed(2)}`,
          sources: sourcePrices,
          timestamp: new Date().toISOString()
        });
      } else {
        setError('Failed to aggregate price from any source');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unknown error');
      console.error('Price fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    updatePrice();
    
    // Update every 30 seconds
    const interval = setInterval(updatePrice, 30000);
    return () => clearInterval(interval);
  }, []);

  const isStale = lastUpdated ? (Math.floor(Date.now() / 1000) - lastUpdated) > 300 : true; // 5 minutes

  return {
    price,
    priceFormatted: price ? `$${price.toFixed(2)}` : 'Loading...',
    priceInWei: price ? parseUnits(price.toString(), 8) : null,
    lastUpdated,
    isLoading,
    isStale,
    error,
    sources,
    sourceCount: Object.keys(sources).length,
    refresh: updatePrice
  };
}