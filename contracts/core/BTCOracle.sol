// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title BTCOracle
 * @notice Simple BTC price oracle for lending pool
 * @dev In production, this would integrate with Chainlink, Pyth, or other price feeds
 */
contract BTCOracle is Ownable {
    uint256 public btcPrice;
    uint256 public lastUpdated;
    
    event PriceUpdate(uint256 newPrice, uint256 timestamp);
    
    /**
     * @notice Constructor with initial BTC price
     */
    constructor() Ownable() {
        // Set initial BTC price ($100,000 with 6 decimals for USDC format)
        btcPrice = 100000 * 1e6;
        lastUpdated = block.timestamp;
    }
    
    /**
     * @notice Get the latest BTC price
     * @return price BTC price in USDC format (6 decimals)
     */
    function getLatestPrice() external view returns (uint256 price) {
        return btcPrice;
    }
    
    /**
     * @notice Update BTC price (owner only)
     * @param newPrice New BTC price in USDC format (6 decimals)
     */
    function updatePrice(uint256 newPrice) external onlyOwner {
        require(newPrice > 0, "Price must be greater than 0");
        require(newPrice >= 10000 * 1e6, "Price too low (min $10k)");
        require(newPrice <= 1000000 * 1e6, "Price too high (max $1M)");
        
        btcPrice = newPrice;
        lastUpdated = block.timestamp;
        
        emit PriceUpdate(newPrice, block.timestamp);
    }
    
    /**
     * @notice Get price with timestamp
     * @return price BTC price
     * @return timestamp Last update timestamp
     */
    function getPriceWithTimestamp() external view returns (uint256 price, uint256 timestamp) {
        return (btcPrice, lastUpdated);
    }
}