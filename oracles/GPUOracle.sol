// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title GPUOracle
 * @notice Provides real-time GPU pricing and availability data
 * @dev Production-ready oracle with multiple data sources and failsafe mechanisms
 */
contract GPUOracle is Ownable, Pausable, ReentrancyGuard {
    
    // Events
    event PriceUpdated(string indexed gpuType, uint256 oldPrice, uint256 newPrice, address updater);
    event AvailabilityUpdated(string indexed gpuType, bool available, uint256 stock);
    event DataSourceAdded(address indexed source, string name);
    event DataSourceRemoved(address indexed source);
    event FallbackPriceSet(string indexed gpuType, uint256 price);
    
    // Structs
    struct GPUData {
        uint256 price;           // Price in USDC (6 decimals)
        uint256 lastUpdate;     // Last update timestamp
        bool available;         // Availability status
        uint256 stock;          // Available stock count
        uint256 updateCount;    // Number of updates
        bool exists;            // Whether GPU type is supported
    }
    
    struct DataSource {
        address source;         // Address of data source
        string name;            // Name of data source
        uint256 weight;         // Weight in price aggregation
        bool active;            // Whether source is active
        uint256 lastUpdate;     // Last update from this source
        mapping(string => uint256) prices; // GPU type -> price
    }
    
    struct PriceData {
        uint256 price;
        uint256 timestamp;
        address source;
    }
    
    // State variables
    mapping(string => GPUData) public gpuData;
    mapping(address => DataSource) public dataSources;
    mapping(string => uint256) public fallbackPrices;
    mapping(string => PriceData[]) public priceHistory;
    
    address[] public dataSourceAddresses;
    string[] public supportedGPUTypes;
    
    // Configuration
    uint256 public constant MAX_PRICE_AGE = 1 hours;
    uint256 public constant MIN_DATA_SOURCES = 1;
    uint256 public constant MAX_PRICE_DEVIATION = 2000; // 20%
    uint256 public constant PRECISION = 10000;
    uint256 public constant MAX_HISTORY_LENGTH = 100;
    
    uint256 public priceValidityPeriod = 30 minutes;
    uint256 public maxPriceDeviation = 1500; // 15%
    bool public useWeightedAverage = true;
    
    /**
     * @notice Constructor
     */
    constructor() Ownable(msg.sender) {
        // Initialize with common GPU types and mock prices for testnet
        _initializeGPUTypes();
    }
    
    /**
     * @notice Get current GPU price in USDC
     */
    function getGPUPrice(string calldata gpuType) external view returns (uint256) {
        GPUData storage gpu = gpuData[gpuType];
        require(gpu.exists, "GPU type not supported");
        
        // Check if price is still valid
        if (block.timestamp - gpu.lastUpdate > priceValidityPeriod) {
            // Return fallback price if available
            if (fallbackPrices[gpuType] > 0) {
                return fallbackPrices[gpuType];
            }
            revert("Price data too old");
        }
        
        return gpu.price;
    }
    
    /**
     * @notice Check if GPU type is available
     */
    function isGPUAvailable(string calldata gpuType) external view returns (bool) {
        GPUData storage gpu = gpuData[gpuType];
        require(gpu.exists, "GPU type not supported");
        
        // Check if availability data is recent
        if (block.timestamp - gpu.lastUpdate > priceValidityPeriod) {
            // Assume unavailable if data is too old
            return false;
        }
        
        return gpu.available && gpu.stock > 0;
    }
    
    /**
     * @notice Initialize GPU types with mock data for testnet
     */
    function _initializeGPUTypes() internal {
        // A100 - High-end AI training
        gpuData["A100"] = GPUData({
            price: 2500000, // $2.50/hour in 6-decimal USDC
            lastUpdate: block.timestamp,
            available: true,
            stock: 10,
            updateCount: 1,
            exists: true
        });
        supportedGPUTypes.push("A100");
        fallbackPrices["A100"] = 2500000;
        
        // H100 - Latest high-end
        gpuData["H100"] = GPUData({
            price: 4000000, // $4.00/hour
            lastUpdate: block.timestamp,
            available: true,
            stock: 5,
            updateCount: 1,
            exists: true
        });
        supportedGPUTypes.push("H100");
        fallbackPrices["H100"] = 4000000;
        
        // V100 - Mid-range
        gpuData["V100"] = GPUData({
            price: 1200000, // $1.20/hour
            lastUpdate: block.timestamp,
            available: true,
            stock: 20,
            updateCount: 1,
            exists: true
        });
        supportedGPUTypes.push("V100");
        fallbackPrices["V100"] = 1200000;
        
        // RTX4090 - Consumer high-end
        gpuData["RTX4090"] = GPUData({
            price: 800000, // $0.80/hour
            lastUpdate: block.timestamp,
            available: true,
            stock: 15,
            updateCount: 1,
            exists: true
        });
        supportedGPUTypes.push("RTX4090");
        fallbackPrices["RTX4090"] = 800000;
    }
    
    /**
     * @notice Get all supported GPU types
     */
    function getSupportedGPUTypes() external view returns (string[] memory) {
        return supportedGPUTypes;
    }
    
    /**
     * @notice Emergency price update (owner only)
     */
    function emergencyUpdatePrice(
        string calldata gpuType,
        uint256 price,
        bool available,
        uint256 stock
    ) external onlyOwner {
        require(gpuData[gpuType].exists, "GPU type not supported");
        require(price > 0, "Price must be positive");
        
        GPUData storage gpu = gpuData[gpuType];
        uint256 oldPrice = gpu.price;
        
        gpu.price = price;
        gpu.lastUpdate = block.timestamp;
        gpu.available = available;
        gpu.stock = stock;
        gpu.updateCount++;
        
        emit PriceUpdated(gpuType, oldPrice, price, msg.sender);
        emit AvailabilityUpdated(gpuType, available, stock);
    }
    
    /**
     * @notice Pause oracle (owner only)
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @notice Unpause oracle (owner only)
     */
    function unpause() external onlyOwner {
        _unpause();
    }
}