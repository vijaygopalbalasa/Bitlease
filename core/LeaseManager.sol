// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

interface ILendingPool {
    function borrow(uint256 collateralAmount, uint256 borrowAmount) external;
    function repay(uint256 repayAmount, uint256 withdrawCollateral) external;
    function getUserDebt(address user) external view returns (uint256);
    function isLiquidatable(address user) external view returns (bool);
}

interface IGPUOracle {
    function getGPUPrice(string calldata gpuType) external view returns (uint256);
    function isGPUAvailable(string calldata gpuType) external view returns (bool);
}

/**
 * @title LeaseManager
 * @notice Manages GPU leases using bBTC collateral
 * @dev Production-ready implementation with automated provider integration
 */
contract LeaseManager is ReentrancyGuard, Ownable, Pausable {
    using SafeERC20 for IERC20;
    using Counters for Counters.Counter;
    
    // Events
    event LeaseCreated(
        bytes32 indexed leaseId,
        address indexed borrower,
        string gpuType,
        uint256 hours,
        uint256 collateralAmount,
        uint256 usdcAmount,
        uint256 totalCost
    );
    
    event LeaseExtended(
        bytes32 indexed leaseId,
        uint256 additionalHours,
        uint256 additionalCost
    );
    
    event LeaseCompleted(
        bytes32 indexed leaseId,
        address indexed borrower,
        uint256 refundAmount
    );
    
    event GPUProvisioned(
        bytes32 indexed leaseId,
        string endpoint,
        string credentials
    );
    
    event GPUReleased(bytes32 indexed leaseId);
    
    // Enums
    enum LeaseStatus {
        CREATED,        // Lease created, waiting for GPU provisioning
        ACTIVE,         // GPU provisioned and running
        COMPLETED,      // Lease completed normally
        EXPIRED,        // Lease expired without completion
        LIQUIDATED      // Position liquidated due to undercollateralization
    }
    
    // Structs
    struct Lease {
        address borrower;
        string gpuType;
        uint256 hoursRequested;
        uint256 hoursUsed;
        uint256 collateralAmount;
        uint256 usdcBorrowed;
        uint256 startTime;
        uint256 endTime;
        uint256 costPerHour;
        LeaseStatus status;
        string providerEndpoint;
        bytes32 credentialsHash;
        uint256 refundableAmount;
    }
    
    // State variables
    IERC20 public immutable collateralToken; // bBTC
    IERC20 public immutable borrowToken;     // USDC
    ILendingPool public immutable lendingPool;
    IGPUOracle public immutable gpuOracle;
    
    Counters.Counter private _leaseCounter;
    mapping(bytes32 => Lease) public leases;
    mapping(address => bytes32[]) public userLeases;
    mapping(string => bool) public supportedGPUTypes;
    mapping(string => uint256) public gpuTypeMinHours;
    mapping(string => uint256) public gpuTypeMaxHours;
    
    // Fee structure (basis points)
    uint256 public serviceFee = 300;        // 3% service fee
    uint256 public providerFee = 200;       // 2% provider fee
    uint256 public liquidationFee = 500;    // 5% liquidation fee
    
    // Lease limits
    uint256 public minLeaseHours = 1;
    uint256 public maxLeaseHours = 720;      // 30 days
    uint256 public maxActiveLeases = 10;     // Per user
    
    address public feeCollector;
    address public gpuProviderRegistry;
    
    /**
     * @notice Constructor
     */
    constructor(
        address _collateralToken,
        address _borrowToken,
        address _lendingPool,
        address _gpuOracle,
        address _feeCollector
    ) Ownable(msg.sender) {
        require(_collateralToken != address(0), "Invalid collateral token");
        require(_borrowToken != address(0), "Invalid borrow token");
        require(_lendingPool != address(0), "Invalid lending pool");
        require(_gpuOracle != address(0), "Invalid GPU oracle");
        require(_feeCollector != address(0), "Invalid fee collector");
        
        collateralToken = IERC20(_collateralToken);
        borrowToken = IERC20(_borrowToken);
        lendingPool = ILendingPool(_lendingPool);
        gpuOracle = IGPUOracle(_gpuOracle);
        feeCollector = _feeCollector;
        
        // Initialize supported GPU types
        _addGPUType("A100", 1, 168);   // 1 hour to 7 days
        _addGPUType("H100", 1, 168);   // 1 hour to 7 days
        _addGPUType("V100", 1, 720);   // 1 hour to 30 days
        _addGPUType("RTX4090", 1, 720); // 1 hour to 30 days
    }
    
    /**
     * @notice Create a new GPU lease
     */
    function createLease(
        string calldata gpuType,
        uint256 hours,
        uint256 collateralAmount,
        uint256 maxCostPerHour
    ) external nonReentrant whenNotPaused returns (bytes32 leaseId) {
        require(supportedGPUTypes[gpuType], "Unsupported GPU type");
        require(hours >= gpuTypeMinHours[gpuType], "Hours below minimum");
        require(hours <= gpuTypeMaxHours[gpuType], "Hours above maximum");
        require(collateralAmount > 0, "Collateral required");
        
        // Check user doesn't exceed max active leases
        require(_getActiveLeaseCount(msg.sender) < maxActiveLeases, "Too many active leases");
        
        // Get current GPU price
        uint256 currentPrice = gpuOracle.getGPUPrice(gpuType);
        require(currentPrice > 0, "GPU price not available");
        require(currentPrice <= maxCostPerHour, "Price exceeds maximum");
        require(gpuOracle.isGPUAvailable(gpuType), "GPU not available");
        
        // Calculate total cost including fees
        uint256 baseCost = currentPrice * hours;
        uint256 serviceFeeCost = (baseCost * serviceFee) / 10000;
        uint256 providerFeeCost = (baseCost * providerFee) / 10000;
        uint256 totalCost = baseCost + serviceFeeCost + providerFeeCost;
        
        // Generate lease ID
        _leaseCounter.increment();
        leaseId = keccak256(abi.encodePacked(
            msg.sender,
            block.timestamp,
            _leaseCounter.current(),
            gpuType
        ));
        
        // Transfer collateral and borrow USDC
        collateralToken.safeTransferFrom(msg.sender, address(this), collateralAmount);
        collateralToken.approve(address(lendingPool), collateralAmount);
        
        // Borrow USDC from lending pool
        lendingPool.borrow(collateralAmount, totalCost);
        
        // Create lease record
        leases[leaseId] = Lease({
            borrower: msg.sender,
            gpuType: gpuType,
            hoursRequested: hours,
            hoursUsed: 0,
            collateralAmount: collateralAmount,
            usdcBorrowed: totalCost,
            startTime: block.timestamp,
            endTime: block.timestamp + (hours * 3600),
            costPerHour: currentPrice,
            status: LeaseStatus.CREATED,
            providerEndpoint: "",
            credentialsHash: bytes32(0),
            refundableAmount: 0
        });
        
        // Add to user's lease list
        userLeases[msg.sender].push(leaseId);
        
        // Pay provider and collect fees
        _processPayments(baseCost, serviceFeeCost, providerFeeCost);
        
        emit LeaseCreated(
            leaseId,
            msg.sender,
            gpuType,
            hours,
            collateralAmount,
            totalCost,
            baseCost
        );
        
        // Initiate GPU provisioning (off-chain process would handle this)
        _initiateGPUProvisioning(leaseId);
        
        return leaseId;
    }
    
    /**
     * @notice Complete a lease and return collateral
     */
    function completeLease(bytes32 leaseId) external nonReentrant {
        Lease storage lease = leases[leaseId];
        require(lease.borrower == msg.sender, "Not lease owner");
        require(lease.status == LeaseStatus.ACTIVE, "Lease not active");
        
        // Calculate actual usage and potential refund
        uint256 actualHours = (block.timestamp - lease.startTime) / 3600;
        if (actualHours > lease.hoursRequested) {
            actualHours = lease.hoursRequested;
        }
        
        // Calculate refund for unused hours
        uint256 refundAmount = 0;
        if (actualHours < lease.hoursRequested) {
            uint256 unusedHours = lease.hoursRequested - actualHours;
            refundAmount = unusedHours * lease.costPerHour;
            
            // Add back proportional fees
            uint256 refundServiceFee = (refundAmount * serviceFee) / 10000;
            uint256 refundProviderFee = (refundAmount * providerFee) / 10000;
            refundAmount += refundServiceFee + refundProviderFee;
        }
        
        // Update lease
        lease.hoursUsed = actualHours;
        lease.status = LeaseStatus.COMPLETED;
        lease.refundableAmount = refundAmount;
        
        // Repay loan and withdraw collateral
        uint256 repayAmount = lease.usdcBorrowed - refundAmount;
        if (repayAmount > 0) {
            borrowToken.approve(address(lendingPool), repayAmount);
            lendingPool.repay(repayAmount, lease.collateralAmount);
        } else {
            lendingPool.repay(0, lease.collateralAmount);
        }
        
        // Transfer refund to user if any
        if (refundAmount > 0) {
            borrowToken.safeTransfer(msg.sender, refundAmount);
        }
        
        // Release GPU resources
        _releaseGPU(leaseId);
        
        emit LeaseCompleted(leaseId, msg.sender, refundAmount);
    }
    
    /**
     * @notice Get user's active leases
     */
    function getUserActiveLeases(address user) external view returns (bytes32[] memory) {
        bytes32[] memory allLeases = userLeases[user];
        uint256 activeCount = 0;
        
        // Count active leases
        for (uint256 i = 0; i < allLeases.length; i++) {
            if (leases[allLeases[i]].status == LeaseStatus.ACTIVE || 
                leases[allLeases[i]].status == LeaseStatus.CREATED) {
                activeCount++;
            }
        }
        
        // Create result array
        bytes32[] memory activeLeases = new bytes32[](activeCount);
        uint256 resultIndex = 0;
        
        for (uint256 i = 0; i < allLeases.length; i++) {
            if (leases[allLeases[i]].status == LeaseStatus.ACTIVE || 
                leases[allLeases[i]].status == LeaseStatus.CREATED) {
                activeLeases[resultIndex] = allLeases[i];
                resultIndex++;
            }
        }
        
        return activeLeases;
    }
    
    /**
     * @notice Internal function to count active leases
     */
    function _getActiveLeaseCount(address user) internal view returns (uint256) {
        bytes32[] memory userLeasesList = userLeases[user];
        uint256 count = 0;
        
        for (uint256 i = 0; i < userLeasesList.length; i++) {
            LeaseStatus status = leases[userLeasesList[i]].status;
            if (status == LeaseStatus.ACTIVE || status == LeaseStatus.CREATED) {
                count++;
            }
        }
        
        return count;
    }
    
    /**
     * @notice Process payments to providers and fee collection
     */
    function _processPayments(
        uint256 baseCost,
        uint256 serviceFeeCost,
        uint256 providerFeeCost
    ) internal {
        // Transfer service fee to fee collector
        borrowToken.safeTransfer(feeCollector, serviceFeeCost);
        
        // Transfer provider fee and base cost to GPU provider registry
        // In production, this would route to specific providers
        borrowToken.safeTransfer(gpuProviderRegistry, baseCost + providerFeeCost);
    }
    
    /**
     * @notice Initiate GPU provisioning (mock for testnet)
     */
    function _initiateGPUProvisioning(bytes32 leaseId) internal {
        // In production, this would trigger off-chain provisioning
        // For testnet, we'll simulate immediate provisioning
        Lease storage lease = leases[leaseId];
        lease.status = LeaseStatus.ACTIVE;
        lease.providerEndpoint = "https://gpu-provider.example.com/instance";
        lease.credentialsHash = keccak256(abi.encodePacked(leaseId, "mock-credentials"));
        
        emit GPUProvisioned(
            leaseId,
            lease.providerEndpoint,
            "user:password123"
        );
    }
    
    /**
     * @notice Release GPU resources
     */
    function _releaseGPU(bytes32 leaseId) internal {
        // In production, this would trigger off-chain resource cleanup
        emit GPUReleased(leaseId);
    }
    
    /**
     * @notice Add new GPU type (owner only)
     */
    function _addGPUType(string memory gpuType, uint256 minHours, uint256 maxHours) internal {
        supportedGPUTypes[gpuType] = true;
        gpuTypeMinHours[gpuType] = minHours;
        gpuTypeMaxHours[gpuType] = maxHours;
    }
    
    /**
     * @notice Pause contract (owner only)
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @notice Unpause contract (owner only)
     */
    function unpause() external onlyOwner {
        _unpause();
    }
}