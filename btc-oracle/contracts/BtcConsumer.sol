// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./SimpleAggregator.sol";

/**
 * @title BtcConsumer
 * @notice Consumer contract that reads from SimpleAggregator and scales prices to 18 decimals
 * @dev Production-ready consumer with staleness protection
 */
contract BtcConsumer {
    SimpleAggregator public immutable aggregator;
    uint256 public immutable maxAge;
    
    event PriceRequested(int256 rawPrice, int256 scaledPrice, uint256 timestamp);
    event StalePriceRejected(uint256 priceAge, uint256 maxAge);
    
    /**
     * @notice Constructor to initialize the consumer
     * @param _aggregator Address of the SimpleAggregator contract
     * @param _maxAge Maximum age of price data in seconds (e.g., 3600 for 1 hour)
     */
    constructor(address _aggregator, uint256 _maxAge) {
        require(_aggregator != address(0), "BtcConsumer: aggregator cannot be zero address");
        require(_maxAge > 0, "BtcConsumer: maxAge must be greater than 0");
        
        aggregator = SimpleAggregator(_aggregator);
        maxAge = _maxAge;
    }
    
    /**
     * @notice Get the latest BTC price scaled to 18 decimals
     * @return price The BTC price scaled to 18 decimals
     * @return timestamp The timestamp when the price was last updated
     */
    function getLatestPrice() external returns (int256 price, uint256 timestamp) {
        (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        ) = aggregator.latestRoundData();
        
        require(answer > 0, "BtcConsumer: invalid price data");
        require(updatedAt > 0, "BtcConsumer: invalid timestamp");
        
        // Check for stale data
        uint256 priceAge = block.timestamp - updatedAt;
        if (priceAge > maxAge) {
            emit StalePriceRejected(priceAge, maxAge);
            revert("BtcConsumer: price data is stale");
        }
        
        // Get aggregator decimals
        uint8 aggregatorDecimals = aggregator.getDecimals();
        
        // Scale to 18 decimals
        int256 scaledPrice;
        if (aggregatorDecimals < 18) {
            // Scale up
            scaledPrice = answer * int256(10 ** (18 - aggregatorDecimals));
        } else if (aggregatorDecimals > 18) {
            // Scale down
            scaledPrice = answer / int256(10 ** (aggregatorDecimals - 18));
        } else {
            // Already 18 decimals
            scaledPrice = answer;
        }
        
        emit PriceRequested(answer, scaledPrice, updatedAt);
        
        return (scaledPrice, updatedAt);
    }
    
    /**
     * @notice Get the latest BTC price (view function, no staleness check)
     * @return price The BTC price scaled to 18 decimals
     * @return timestamp The timestamp when the price was last updated
     * @return isStale Whether the price is considered stale
     */
    function viewLatestPrice() external view returns (int256 price, uint256 timestamp, bool isStale) {
        (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        ) = aggregator.latestRoundData();
        
        if (answer <= 0 || updatedAt == 0) {
            return (0, 0, true);
        }
        
        // Check staleness
        uint256 priceAge = block.timestamp - updatedAt;
        bool stale = priceAge > maxAge;
        
        // Get aggregator decimals
        uint8 aggregatorDecimals = aggregator.getDecimals();
        
        // Scale to 18 decimals
        int256 scaledPrice;
        if (aggregatorDecimals < 18) {
            scaledPrice = answer * int256(10 ** (18 - aggregatorDecimals));
        } else if (aggregatorDecimals > 18) {
            scaledPrice = answer / int256(10 ** (aggregatorDecimals - 18));
        } else {
            scaledPrice = answer;
        }
        
        return (scaledPrice, updatedAt, stale);
    }
    
    /**
     * @notice Get the maximum age for price data
     * @return The maximum age in seconds
     */
    function getMaxAge() external view returns (uint256) {
        return maxAge;
    }
    
    /**
     * @notice Get the aggregator address
     * @return The aggregator contract address
     */
    function getAggregator() external view returns (address) {
        return address(aggregator);
    }
    
    /**
     * @notice Check if current price is stale
     * @return Whether the current price is stale
     */
    function isStale() external view returns (bool) {
        (, uint256 updatedAt, bool stale) = this.viewLatestPrice();
        return stale;
    }
}