import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';

/**
 * Professional BTC Price Widget
 * Displays current BTC/USD price from the oracle with staleness detection
 */
const PriceWidget = ({ 
  rpcUrl = 'https://rpc.test2.btcs.network',
  aggregatorAddress,
  consumerAddress,
  refreshInterval = 30000, // 30 seconds
  maxAge = 3600, // 1 hour
  className = '',
  showDetails = false 
}) => {
  // State
  const [priceData, setPriceData] = useState({
    price: null,
    scaledPrice: null,
    timestamp: null,
    roundId: null,
    isStale: false,
    decimals: null,
    isLoading: true,
    error: null
  });

  // Contract ABI definitions
  const aggregatorABI = [
    "function latestRoundData() external view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)",
    "function decimals() external view returns (uint8)"
  ];

  const consumerABI = [
    "function viewLatestPrice() external view returns (int256 price, uint256 timestamp, bool isStale)",
    "function getMaxAge() external view returns (uint256)"
  ];

  // Initialize provider and contracts
  const initializeContracts = useCallback(() => {
    try {
      const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
      
      const aggregator = aggregatorAddress ? 
        new ethers.Contract(aggregatorAddress, aggregatorABI, provider) : null;
      
      const consumer = consumerAddress ? 
        new ethers.Contract(consumerAddress, consumerABI, provider) : null;

      return { provider, aggregator, consumer };
    } catch (error) {
      console.error('Failed to initialize contracts:', error);
      return { provider: null, aggregator: null, consumer: null };
    }
  }, [rpcUrl, aggregatorAddress, consumerAddress]);

  // Fetch price data from aggregator
  const fetchFromAggregator = async (aggregator) => {
    try {
      const [roundData, decimals] = await Promise.all([
        aggregator.latestRoundData(),
        aggregator.decimals()
      ]);

      // Convert price to USD
      const priceUSD = parseFloat(ethers.utils.formatUnits(roundData.answer, decimals));
      
      // Check staleness
      const now = Math.floor(Date.now() / 1000);
      const age = now - roundData.updatedAt.toNumber();
      const isStale = age > maxAge;

      return {
        price: priceUSD,
        scaledPrice: roundData.answer.toString(),
        timestamp: roundData.updatedAt.toNumber(),
        roundId: roundData.roundId.toString(),
        decimals: decimals,
        isStale,
        error: null
      };
    } catch (error) {
      throw new Error(`Aggregator error: ${error.message}`);
    }
  };

  // Fetch price data from consumer
  const fetchFromConsumer = async (consumer) => {
    try {
      const [priceData, maxAgeContract] = await Promise.all([
        consumer.viewLatestPrice(),
        consumer.getMaxAge()
      ]);

      // Convert 18-decimal price to USD
      const priceUSD = parseFloat(ethers.utils.formatEther(priceData.price));

      return {
        price: priceUSD,
        scaledPrice: priceData.price.toString(),
        timestamp: priceData.timestamp.toNumber(),
        roundId: null, // Consumer doesn't expose round ID
        decimals: 18, // Consumer always returns 18 decimals
        isStale: priceData.isStale,
        maxAge: maxAgeContract.toNumber(),
        error: null
      };
    } catch (error) {
      throw new Error(`Consumer error: ${error.message}`);
    }
  };

  // Main fetch function
  const fetchPriceData = useCallback(async () => {
    setPriceData(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const { aggregator, consumer } = initializeContracts();

      let data;
      
      if (consumer) {
        // Prefer consumer for 18-decimal precision
        data = await fetchFromConsumer(consumer);
      } else if (aggregator) {
        // Fall back to aggregator
        data = await fetchFromAggregator(aggregator);
      } else {
        throw new Error('No contract addresses provided');
      }

      setPriceData({
        ...data,
        isLoading: false
      });

    } catch (error) {
      console.error('Failed to fetch price data:', error);
      setPriceData(prev => ({
        ...prev,
        isLoading: false,
        error: error.message
      }));
    }
  }, [initializeContracts, maxAge]);

  // Set up auto-refresh
  useEffect(() => {
    // Initial fetch
    fetchPriceData();

    // Set up interval
    const interval = setInterval(fetchPriceData, refreshInterval);

    // Cleanup
    return () => clearInterval(interval);
  }, [fetchPriceData, refreshInterval]);

  // Format price for display
  const formatPrice = (price) => {
    if (!price) return '--';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '--';
    return new Date(timestamp * 1000).toLocaleString();
  };

  // Calculate age in human-readable format
  const formatAge = (timestamp) => {
    if (!timestamp) return '--';
    const ageSeconds = Math.floor(Date.now() / 1000) - timestamp;
    
    if (ageSeconds < 60) return `${ageSeconds}s ago`;
    if (ageSeconds < 3600) return `${Math.floor(ageSeconds / 60)}m ago`;
    if (ageSeconds < 86400) return `${Math.floor(ageSeconds / 3600)}h ago`;
    return `${Math.floor(ageSeconds / 86400)}d ago`;
  };

  // Get status indicator
  const getStatusIndicator = () => {
    if (priceData.isLoading) return { color: '#fbbf24', text: 'Loading...' };
    if (priceData.error) return { color: '#ef4444', text: 'Error' };
    if (priceData.isStale) return { color: '#f59e0b', text: 'Stale' };
    return { color: '#10b981', text: 'Live' };
  };

  const status = getStatusIndicator();

  return (
    <div className={`btc-price-widget ${className}`}>
      <style jsx>{`
        .btc-price-widget {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 24px;
          border-radius: 16px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
          min-width: 280px;
          max-width: 400px;
        }

        .widget-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .widget-title {
          font-size: 18px;
          font-weight: 600;
          margin: 0;
        }

        .status-indicator {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 500;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .price-display {
          text-align: center;
          margin: 20px 0;
        }

        .price-value {
          font-size: 36px;
          font-weight: 700;
          margin: 0;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }

        .price-label {
          font-size: 14px;
          opacity: 0.8;
          margin-top: 4px;
        }

        .widget-details {
          border-top: 1px solid rgba(255, 255, 255, 0.2);
          padding-top: 16px;
          font-size: 12px;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
        }

        .detail-label {
          opacity: 0.8;
        }

        .detail-value {
          font-weight: 500;
        }

        .error-state {
          text-align: center;
          color: #fca5a5;
        }

        .refresh-button {
          background: rgba(255, 255, 255, 0.2);
          border: none;
          color: white;
          padding: 8px 16px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 12px;
          margin-top: 12px;
          width: 100%;
        }

        .refresh-button:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .refresh-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }

        .loading {
          animation: pulse 1.5s ease-in-out infinite;
        }
      `}</style>

      <div className="widget-header">
        <h3 className="widget-title">BTC/USD Oracle</h3>
        <div className="status-indicator">
          <div 
            className="status-dot" 
            style={{ backgroundColor: status.color }}
          />
          {status.text}
        </div>
      </div>

      {priceData.error ? (
        <div className="error-state">
          <p>❌ {priceData.error}</p>
          <button 
            className="refresh-button" 
            onClick={fetchPriceData}
            disabled={priceData.isLoading}
          >
            Retry
          </button>
        </div>
      ) : (
        <>
          <div className={`price-display ${priceData.isLoading ? 'loading' : ''}`}>
            <h2 className="price-value">
              {formatPrice(priceData.price)}
            </h2>
            <p className="price-label">
              Last updated: {formatAge(priceData.timestamp)}
            </p>
          </div>

          {showDetails && !priceData.isLoading && (
            <div className="widget-details">
              <div className="detail-row">
                <span className="detail-label">Round ID:</span>
                <span className="detail-value">{priceData.roundId || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Decimals:</span>
                <span className="detail-value">{priceData.decimals || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Raw Value:</span>
                <span className="detail-value" title={priceData.scaledPrice}>
                  {priceData.scaledPrice ? 
                    `${priceData.scaledPrice.slice(0, 8)}...` : 
                    'N/A'
                  }
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Updated:</span>
                <span className="detail-value">{formatTimestamp(priceData.timestamp)}</span>
              </div>
            </div>
          )}

          <button 
            className="refresh-button" 
            onClick={fetchPriceData}
            disabled={priceData.isLoading}
          >
            {priceData.isLoading ? 'Refreshing...' : 'Refresh'}
          </button>
        </>
      )}
    </div>
  );
};

// Example usage component
export const PriceWidgetExample = () => {
  return (
    <div style={{ padding: '20px', background: '#f3f4f6', minHeight: '100vh' }}>
      <h1>BTC Price Oracle Widget Demo</h1>
      
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginTop: '20px' }}>
        {/* Basic widget */}
        <PriceWidget
          aggregatorAddress="0x123..." // Replace with actual address
          refreshInterval={15000}
        />

        {/* Detailed widget */}
        <PriceWidget
          consumerAddress="0x456..." // Replace with actual address
          showDetails={true}
          refreshInterval={30000}
          maxAge={1800}
        />
      </div>

      <div style={{ marginTop: '40px', maxWidth: '600px' }}>
        <h2>Integration Guide</h2>
        <pre style={{ background: '#1f2937', color: '#f3f4f6', padding: '16px', borderRadius: '8px', overflow: 'auto' }}>
{`import { PriceWidget } from './PriceWidget';

// Basic usage
<PriceWidget 
  aggregatorAddress="0x123..."
/>

// Advanced usage  
<PriceWidget
  consumerAddress="0x456..."
  refreshInterval={30000}
  maxAge={3600}
  showDetails={true}
  className="my-custom-class"
/>`}
        </pre>
      </div>
    </div>
  );
};

export default PriceWidget;