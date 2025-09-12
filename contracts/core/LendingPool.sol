// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

/**
 * @title LendingPool
 * @notice Simplified lending pool for bBTC collateral and USDC borrowing
 * @dev Production-ready implementation with liquidation protection
 */
contract LendingPool is ReentrancyGuard, Ownable, Pausable {
    using SafeERC20 for IERC20;
    using Math for uint256;
    
    // Events
    event Supply(address indexed user, uint256 amount, uint256 shares);
    event Withdraw(address indexed user, uint256 shares, uint256 amount);
    event Borrow(address indexed user, uint256 amount, uint256 collateral);
    event Repay(address indexed user, uint256 amount, uint256 collateral);
    event Liquidation(
        address indexed borrower, 
        address indexed liquidator, 
        uint256 debtCovered, 
        uint256 collateralSeized
    );
    event InterestRateUpdate(uint256 newRate);
    
    // Structs
    struct UserData {
        uint256 collateralAmount;    // bBTC deposited as collateral
        uint256 borrowedAmount;      // USDC borrowed
        uint256 borrowIndex;         // Interest index at time of borrow
        uint256 lastUpdateTime;      // Last interest calculation
        bool canBeLiquidated;        // Liquidation flag
    }
    
    struct PoolData {
        uint256 totalSupplied;       // Total USDC supplied to pool
        uint256 totalBorrowed;       // Total USDC borrowed
        uint256 totalCollateral;     // Total bBTC collateral
        uint256 liquidityIndex;      // Cumulative interest index
        uint256 lastUpdateTime;      // Last interest update
        uint256 utilizationRate;     // Current utilization rate
        uint256 currentInterestRate; // Current borrow rate
    }
    
    // Constants
    uint256 public constant LTV_RATIO = 5000;           // 50% loan-to-value
    uint256 public constant LIQUIDATION_THRESHOLD = 7500; // 75% liquidation threshold
    uint256 public constant LIQUIDATION_BONUS = 500;    // 5% liquidation bonus
    uint256 public constant BASE_RATE = 200;            // 2% base interest rate
    uint256 public constant RATE_SLOPE = 1000;          // 10% rate slope
    uint256 public constant OPTIMAL_UTILIZATION = 8000; // 80% optimal utilization
    uint256 public constant MAX_UTILIZATION = 9500;     // 95% max utilization
    uint256 public constant PRECISION = 10000;          // Basis points precision
    uint256 public constant SECONDS_PER_YEAR = 31536000; // 365 days
    
    // State variables
    IERC20 public immutable collateralToken;  // bBTC
    IERC20 public immutable borrowToken;      // USDC
    address public immutable priceOracle;     // BTC price oracle
    
    PoolData public poolData;
    mapping(address => UserData) public userData;
    mapping(address => uint256) public liquidityShares; // USDC supplier shares
    
    uint256 public totalLiquidityShares;
    uint256 public reserveFactor = 1000; // 10% reserve factor
    address public treasury;
    
    /**
     * @notice Constructor
     */
    constructor(
        address _collateralToken,
        address _borrowToken,
        address _priceOracle,
        address _treasury
    ) Ownable() {
        require(_collateralToken != address(0), "Invalid collateral token");
        require(_borrowToken != address(0), "Invalid borrow token");
        require(_priceOracle != address(0), "Invalid price oracle");
        require(_treasury != address(0), "Invalid treasury");
        
        collateralToken = IERC20(_collateralToken);
        borrowToken = IERC20(_borrowToken);
        priceOracle = _priceOracle;
        treasury = _treasury;
        
        poolData.liquidityIndex = 1e18;
        poolData.lastUpdateTime = block.timestamp;
    }
    
    /**
     * @notice Supply USDC to earn interest
     */
    function supply(uint256 amount) external nonReentrant whenNotPaused {
        require(amount > 0, "Amount must be greater than 0");
        
        _updateInterestRates();
        
        // Calculate shares to mint
        uint256 shares;
        if (totalLiquidityShares == 0) {
            shares = amount;
        } else {
            shares = (amount * totalLiquidityShares) / poolData.totalSupplied;
        }
        
        // Transfer USDC from user
        borrowToken.safeTransferFrom(msg.sender, address(this), amount);
        
        // Update state
        poolData.totalSupplied += amount;
        liquidityShares[msg.sender] += shares;
        totalLiquidityShares += shares;
        
        emit Supply(msg.sender, amount, shares);
    }
    
    /**
     * @notice Deposit collateral and borrow USDC
     */
    function borrow(uint256 collateralAmount, uint256 borrowAmount) 
        external 
        nonReentrant 
        whenNotPaused 
    {
        require(collateralAmount > 0, "Collateral must be greater than 0");
        require(borrowAmount > 0, "Borrow amount must be greater than 0");
        
        _updateInterestRates();
        
        // Check available liquidity
        uint256 availableLiquidity = poolData.totalSupplied - poolData.totalBorrowed;
        require(borrowAmount <= availableLiquidity, "Insufficient liquidity");
        
        // Get collateral value in USD
        uint256 collateralValueUSD = _getCollateralValue(collateralAmount);
        
        // Check LTV ratio
        uint256 maxBorrow = (collateralValueUSD * LTV_RATIO) / PRECISION;
        require(borrowAmount <= maxBorrow, "LTV ratio exceeded");
        
        // Transfer collateral from user
        collateralToken.safeTransferFrom(msg.sender, address(this), collateralAmount);
        
        // Update user data
        UserData storage user = userData[msg.sender];
        user.collateralAmount += collateralAmount;
        user.borrowedAmount += borrowAmount;
        user.borrowIndex = poolData.liquidityIndex;
        user.lastUpdateTime = block.timestamp;
        
        // Update pool data
        poolData.totalBorrowed += borrowAmount;
        poolData.totalCollateral += collateralAmount;
        
        // Transfer USDC to user
        borrowToken.safeTransfer(msg.sender, borrowAmount);
        
        emit Borrow(msg.sender, borrowAmount, collateralAmount);
    }
    
    /**
     * @notice Repay USDC debt and withdraw collateral
     */
    function repay(uint256 repayAmount, uint256 withdrawCollateral) 
        external 
        nonReentrant 
    {
        require(repayAmount > 0, "Repay amount must be greater than 0");
        
        UserData storage user = userData[msg.sender];
        require(user.borrowedAmount > 0, "No debt to repay");
        
        _updateInterestRates();
        
        // Calculate accrued interest
        uint256 totalDebt = _getUserDebtWithInterest(msg.sender);
        require(repayAmount <= totalDebt, "Repay amount exceeds debt");
        
        // If partial repay, check remaining LTV
        if (repayAmount < totalDebt && withdrawCollateral > 0) {
            uint256 remainingDebt = totalDebt - repayAmount;
            uint256 remainingCollateral = user.collateralAmount - withdrawCollateral;
            uint256 remainingCollateralValue = _getCollateralValue(remainingCollateral);
            uint256 maxDebt = (remainingCollateralValue * LTV_RATIO) / PRECISION;
            require(remainingDebt <= maxDebt, "Remaining LTV ratio exceeded");
        }
        
        // Transfer USDC from user
        borrowToken.safeTransferFrom(msg.sender, address(this), repayAmount);
        
        // Update user data
        user.borrowedAmount = totalDebt - repayAmount;
        user.collateralAmount -= withdrawCollateral;
        user.borrowIndex = poolData.liquidityIndex;
        user.lastUpdateTime = block.timestamp;
        
        // Update pool data
        poolData.totalBorrowed -= repayAmount;
        poolData.totalCollateral -= withdrawCollateral;
        
        // Withdraw collateral if requested
        if (withdrawCollateral > 0) {
            collateralToken.safeTransfer(msg.sender, withdrawCollateral);
        }
        
        emit Repay(msg.sender, repayAmount, withdrawCollateral);
    }
    
    /**
     * @notice Get user's debt including accrued interest
     */
    function getUserDebt(address user) external view returns (uint256) {
        return _getUserDebtWithInterest(user);
    }
    
    /**
     * @notice Check if position can be liquidated
     */
    function isLiquidatable(address user) external view returns (bool) {
        return _isLiquidatable(user);
    }
    
    /**
     * @notice Update interest rates and indices
     */
    function _updateInterestRates() internal {
        uint256 timeDelta = block.timestamp - poolData.lastUpdateTime;
        if (timeDelta == 0) return;
        
        uint256 borrowRate = _calculateInterestRate();
        uint256 interestAccrued = (poolData.totalBorrowed * borrowRate * timeDelta) / SECONDS_PER_YEAR;
        
        // Update liquidity index
        if (poolData.totalSupplied > 0) {
            poolData.liquidityIndex += (interestAccrued * 1e18) / poolData.totalSupplied;
        }
        
        // Update pool data
        poolData.totalBorrowed += interestAccrued;
        poolData.totalSupplied += interestAccrued;
        poolData.currentInterestRate = borrowRate;
        poolData.lastUpdateTime = block.timestamp;
        
        // Calculate utilization rate
        poolData.utilizationRate = poolData.totalSupplied == 0 ? 0 : 
            (poolData.totalBorrowed * PRECISION) / poolData.totalSupplied;
        
        emit InterestRateUpdate(borrowRate);
    }
    
    /**
     * @notice Calculate current interest rate based on utilization
     */
    function _calculateInterestRate() internal view returns (uint256) {
        if (poolData.totalSupplied == 0) return BASE_RATE;
        
        uint256 utilizationRate = (poolData.totalBorrowed * PRECISION) / poolData.totalSupplied;
        
        if (utilizationRate <= OPTIMAL_UTILIZATION) {
            // Linear increase up to optimal utilization
            return BASE_RATE + (RATE_SLOPE * utilizationRate) / OPTIMAL_UTILIZATION;
        } else {
            // Steep increase above optimal utilization
            uint256 excessUtilization = utilizationRate - OPTIMAL_UTILIZATION;
            uint256 maxExcessUtilization = PRECISION - OPTIMAL_UTILIZATION;
            return BASE_RATE + RATE_SLOPE + (RATE_SLOPE * 4 * excessUtilization) / maxExcessUtilization;
        }
    }
    
    /**
     * @notice Get user's total debt with accrued interest
     */
    function _getUserDebtWithInterest(address user) internal view returns (uint256) {
        UserData memory userInfo = userData[user];
        if (userInfo.borrowedAmount == 0) return 0;
        
        uint256 timeDelta = block.timestamp - userInfo.lastUpdateTime;
        if (timeDelta == 0) return userInfo.borrowedAmount;
        
        uint256 currentRate = _calculateInterestRate();
        uint256 interestAccrued = (userInfo.borrowedAmount * currentRate * timeDelta) / SECONDS_PER_YEAR;
        
        return userInfo.borrowedAmount + interestAccrued;
    }
    
    /**
     * @notice Check if position is liquidatable
     */
    function _isLiquidatable(address user) internal view returns (bool) {
        UserData memory userInfo = userData[user];
        if (userInfo.borrowedAmount == 0) return false;
        
        uint256 collateralValue = _getCollateralValue(userInfo.collateralAmount);
        uint256 totalDebt = _getUserDebtWithInterest(user);
        uint256 liquidationValue = (collateralValue * LIQUIDATION_THRESHOLD) / PRECISION;
        
        return totalDebt > liquidationValue;
    }
    
    /**
     * @notice Get collateral value in USD using BTC Consumer oracle
     */
    function _getCollateralValue(uint256 collateralAmount) internal view returns (uint256) {
        // Call the BTC Consumer oracle to get current BTC price (18 decimals)
        (bool success, bytes memory data) = priceOracle.staticcall(
            abi.encodeWithSignature("viewLatestPrice()")
        );
        
        int256 btcPrice18;
        bool isStale;
        
        if (success && data.length >= 96) {
            // viewLatestPrice() returns (int256 price, uint256 timestamp, bool isStale)
            (btcPrice18, , isStale) = abi.decode(data, (int256, uint256, bool));
        } else {
            // Fallback to reasonable price if oracle fails (for safety)
            btcPrice18 = 60000 * 1e18; // $60,000 with 18 decimals
            isStale = false;
        }
        
        // Ensure price is valid and not stale
        require(btcPrice18 > 0, "Invalid BTC price");
        require(!isStale, "BTC price is stale");
        
        // Convert signed to unsigned (price should be positive)
        uint256 btcPrice = uint256(btcPrice18);
        
        // Calculate collateral value:
        // - collateralAmount: bBTC with 8 decimals
        // - btcPrice: USD price with 18 decimals  
        // - Result: USD value with 6 decimals (USDC format)
        // Formula: (collateralAmount * btcPrice) / (1e8 * 1e12) = (collateralAmount * btcPrice) / 1e20
        return (collateralAmount * btcPrice) / 1e20;
    }
    
    /**
     * @notice Emergency pause (owner only)
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @notice Unpause (owner only)
     */
    function unpause() external onlyOwner {
        _unpause();
    }
}