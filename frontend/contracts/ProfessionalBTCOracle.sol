// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title Professional BTC Oracle for BitLease
 * @notice Multi-source BTC price oracle with Pyth Network integration and API fallback
 * @dev Provides reliable BTC/USD pricing for DeFi applications on Core DAO
 */

interface IPyth {
    function getPrice(bytes32 id) external view returns (int64 price, uint64 conf, int32 expo, uint256 publishTime);
    function updatePriceFeeds(bytes[] calldata updateData) external payable;
    function getUpdateFee(bytes[] calldata updateData) external view returns (uint256 feeAmount);
}

contract ProfessionalBTCOracle {
    // Events
    event PriceUpdated(uint256 price, uint256 timestamp, string source);
    event OracleSourceChanged(address indexed oldOracle, address indexed newOracle);
    event PriceThresholdUpdated(uint256 oldThreshold, uint256 newThreshold);
    
    // State variables
    address public owner;
    IPyth public pythOracle;
    bytes32 public constant BTC_USD_PRICE_ID = 0xf9c0172ba10dfa4d19088d94f5bf61d3b54d5bd7483a322a982e1373ee8ea31b;
    
    // Price data
    uint256 public latestPrice;
    uint256 public lastUpdated;
    uint256 public constant PRICE_DECIMALS = 8; // BTC price in 8 decimals
    uint256 public constant STALENESS_THRESHOLD = 300; // 5 minutes
    uint256 public priceDeviationThreshold = 500; // 5% in basis points
    
    // Fallback mechanism
    mapping(address => bool) public authorizedUpdaters;
    uint256 public fallbackPrice;
    bool public useFallback;
    
    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    modifier onlyAuthorized() {
        require(authorizedUpdaters[msg.sender] || msg.sender == owner, "Not authorized");
        _;
    }
    
    constructor(address _pythOracle) {
        owner = msg.sender;
        pythOracle = IPyth(_pythOracle);
        authorizedUpdaters[msg.sender] = true;
        lastUpdated = block.timestamp;
    }
    
    /**
     * @notice Get the latest BTC price with freshness guarantee
     * @return price BTC price in USD (8 decimals)
     */
    function getLatestPrice() external view returns (uint256 price) {
        if (useFallback) {
            return fallbackPrice;
        }
        
        // Try to get price from Pyth
        if (address(pythOracle) != address(0)) {
            try pythOracle.getPrice(BTC_USD_PRICE_ID) returns (
                int64 pythPrice,
                uint64 conf,
                int32 expo,
                uint256 publishTime
            ) {
                // Check if price is fresh (within staleness threshold)
                if (block.timestamp - publishTime <= STALENESS_THRESHOLD && pythPrice > 0) {
                    // Adjust price to 8 decimals
                    if (expo >= 0) {
                        return uint256(uint64(pythPrice)) * (10 ** uint256(uint32(expo)));
                    } else {
                        return uint256(uint64(pythPrice)) / (10 ** uint256(uint32(-expo)));
                    }
                }
            } catch {
                // Pyth call failed, use fallback
            }
        }
        
        // Return stored price if available and fresh
        if (latestPrice > 0 && block.timestamp - lastUpdated <= STALENESS_THRESHOLD) {
            return latestPrice;
        }
        
        // If no fresh price available, revert
        revert("No fresh price available");
    }
    
    /**
     * @notice Update BTC price using Pyth Network
     * @param updateData Pyth price update data
     */
    function updatePythPrice(bytes[] calldata updateData) external payable {
        require(address(pythOracle) != address(0), "Pyth oracle not set");
        
        // Get update fee
        uint256 fee = pythOracle.getUpdateFee(updateData);
        require(msg.value >= fee, "Insufficient fee");
        
        // Update Pyth price feeds
        pythOracle.updatePriceFeeds{value: fee}(updateData);
        
        // Get updated price
        (int64 price, , int32 expo, uint256 publishTime) = pythOracle.getPrice(BTC_USD_PRICE_ID);
        
        // Convert to our format (8 decimals)
        uint256 adjustedPrice;
        if (expo >= 0) {
            adjustedPrice = uint256(uint64(price)) * (10 ** uint256(uint32(expo)));
        } else {
            adjustedPrice = uint256(uint64(price)) / (10 ** uint256(uint32(-expo)));
        }
        
        // Validate price sanity
        require(adjustedPrice > 10000 * (10**PRICE_DECIMALS), "Price too low"); // > $10k
        require(adjustedPrice < 1000000 * (10**PRICE_DECIMALS), "Price too high"); // < $1M
        
        latestPrice = adjustedPrice;
        lastUpdated = publishTime;
        
        emit PriceUpdated(adjustedPrice, publishTime, "Pyth");
        
        // Refund excess fee
        if (msg.value > fee) {
            payable(msg.sender).transfer(msg.value - fee);
        }
    }
    
    /**
     * @notice Emergency fallback price update (authorized updaters only)
     * @param price New BTC price (8 decimals)
     */
    function updateFallbackPrice(uint256 price) external onlyAuthorized {
        require(price > 10000 * (10**PRICE_DECIMALS), "Price too low");
        require(price < 1000000 * (10**PRICE_DECIMALS), "Price too high");
        
        // Validate price deviation if we have a recent price
        if (latestPrice > 0 && block.timestamp - lastUpdated <= STALENESS_THRESHOLD) {
            uint256 deviation = price > latestPrice 
                ? ((price - latestPrice) * 10000) / latestPrice
                : ((latestPrice - price) * 10000) / latestPrice;
            require(deviation <= priceDeviationThreshold, "Price deviation too high");
        }
        
        fallbackPrice = price;
        lastUpdated = block.timestamp;
        
        emit PriceUpdated(price, block.timestamp, "Fallback");
    }
    
    /**
     * @notice Toggle fallback mode
     */
    function toggleFallbackMode() external onlyOwner {
        useFallback = !useFallback;
    }
    
    /**
     * @notice Set Pyth oracle address
     */
    function setPythOracle(address _pythOracle) external onlyOwner {
        address oldOracle = address(pythOracle);
        pythOracle = IPyth(_pythOracle);
        emit OracleSourceChanged(oldOracle, _pythOracle);
    }
    
    /**
     * @notice Authorize/deauthorize price updaters
     */
    function setAuthorizedUpdater(address updater, bool authorized) external onlyOwner {
        authorizedUpdaters[updater] = authorized;
    }
    
    /**
     * @notice Set price deviation threshold
     */
    function setPriceDeviationThreshold(uint256 threshold) external onlyOwner {
        uint256 oldThreshold = priceDeviationThreshold;
        priceDeviationThreshold = threshold;
        emit PriceThresholdUpdated(oldThreshold, threshold);
    }
    
    /**
     * @notice Check if price is fresh
     */
    function isPriceFresh() external view returns (bool) {
        return block.timestamp - lastUpdated <= STALENESS_THRESHOLD;
    }
    
    /**
     * @notice Get price info
     */
    function getPriceInfo() external view returns (
        uint256 price,
        uint256 timestamp,
        bool fresh,
        bool fallbackMode
    ) {
        return (
            useFallback ? fallbackPrice : latestPrice,
            lastUpdated,
            block.timestamp - lastUpdated <= STALENESS_THRESHOLD,
            useFallback
        );
    }
    
    /**
     * @notice Emergency price update for critical situations
     */
    function emergencyPriceUpdate(uint256 price) external onlyOwner {
        latestPrice = price;
        lastUpdated = block.timestamp;
        emit PriceUpdated(price, block.timestamp, "Emergency");
    }
    
    /**
     * @notice Withdraw contract balance
     */
    function withdraw() external onlyOwner {
        payable(owner).transfer(address(this).balance);
    }
    
    /**
     * @notice Transfer ownership
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid address");
        owner = newOwner;
    }
    
    // Allow contract to receive ETH for Pyth fees
    receive() external payable {}
}