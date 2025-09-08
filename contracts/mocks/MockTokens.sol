// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title MockUSDC
 * @notice Mock USDC token for testing
 * @dev 6 decimal places like real USDC
 */
contract MockUSDC is ERC20, Ownable, Pausable {
    uint8 private constant DECIMALS = 6;
    uint256 public constant INITIAL_SUPPLY = 1000000 * 10**DECIMALS; // 1M USDC
    
    // Faucet functionality for testing
    mapping(address => uint256) public lastFaucetClaim;
    uint256 public faucetAmount = 1000 * 10**DECIMALS; // 1000 USDC per claim
    uint256 public faucetCooldown = 1 hours;
    
    event FaucetClaim(address indexed user, uint256 amount);
    
    constructor() ERC20("Mock USD Coin", "USDC") Ownable(msg.sender) {
        _mint(msg.sender, INITIAL_SUPPLY);
    }
    
    function decimals() public pure override returns (uint8) {
        return DECIMALS;
    }
    
    /**
     * @notice Claim free USDC from faucet (testnet only)
     */
    function faucetClaim() external whenNotPaused {
        require(
            block.timestamp >= lastFaucetClaim[msg.sender] + faucetCooldown,
            "Faucet cooldown not met"
        );
        
        lastFaucetClaim[msg.sender] = block.timestamp;
        _mint(msg.sender, faucetAmount);
        
        emit FaucetClaim(msg.sender, faucetAmount);
    }
    
    /**
     * @notice Mint tokens (owner only)
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
    
    /**
     * @notice Burn tokens
     */
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }
    
    /**
     * @notice Update faucet parameters (owner only)
     */
    function setFaucetParams(uint256 amount, uint256 cooldown) external onlyOwner {
        require(amount <= 10000 * 10**DECIMALS, "Faucet amount too high");
        require(cooldown <= 24 hours, "Cooldown too long");
        
        faucetAmount = amount;
        faucetCooldown = cooldown;
    }
    
    /**
     * @notice Pause transfers (owner only)
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @notice Unpause transfers (owner only)
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @notice Override transfer to include pause functionality
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal virtual override {
        super._beforeTokenTransfer(from, to, amount);
        require(!paused(), "Token transfers are paused");
    }
}

/**
 * @title MockBTC
 * @notice Mock BTC token for testing
 * @dev 8 decimal places like real Bitcoin
 */
contract MockBTC is ERC20, Ownable, Pausable {
    uint8 private constant DECIMALS = 8;
    uint256 public constant INITIAL_SUPPLY = 1000 * 10**DECIMALS; // 1000 BTC
    
    // Faucet functionality for testing
    mapping(address => uint256) public lastFaucetClaim;
    uint256 public faucetAmount = 1 * 10**DECIMALS; // 1 BTC per claim
    uint256 public faucetCooldown = 2 hours;
    
    event FaucetClaim(address indexed user, uint256 amount);
    
    constructor() ERC20("Mock Bitcoin", "BTC") Ownable(msg.sender) {
        _mint(msg.sender, INITIAL_SUPPLY);
    }
    
    function decimals() public pure override returns (uint8) {
        return DECIMALS;
    }
    
    /**
     * @notice Claim free BTC from faucet (testnet only)
     */
    function faucetClaim() external whenNotPaused {
        require(
            block.timestamp >= lastFaucetClaim[msg.sender] + faucetCooldown,
            "Faucet cooldown not met"
        );
        
        lastFaucetClaim[msg.sender] = block.timestamp;
        _mint(msg.sender, faucetAmount);
        
        emit FaucetClaim(msg.sender, faucetAmount);
    }
    
    /**
     * @notice Mint tokens (owner only)
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
    
    /**
     * @notice Burn tokens
     */
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }
    
    /**
     * @notice Update faucet parameters (owner only)
     */
    function setFaucetParams(uint256 amount, uint256 cooldown) external onlyOwner {
        require(amount <= 10 * 10**DECIMALS, "Faucet amount too high");
        require(cooldown <= 24 hours, "Cooldown too long");
        
        faucetAmount = amount;
        faucetCooldown = cooldown;
    }
    
    /**
     * @notice Pause transfers (owner only)
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @notice Unpause transfers (owner only)
     */
    function  Unpause (owner only)
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @notice Override transfer to include pause functionality
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal virtual override {
        super._beforeTokenTransfer(from, to, amount);
        require(!paused(), "Token transfers are paused");
    }
}

/**
 * @title MockCoreStaking
 * @notice Mock CoreDAO staking contract for testing
 */
contract MockCoreStaking is Ownable {
    
    struct StakeInfo {
        uint256 amount;
        uint256 startTime;
        uint256 lastRewardClaim;
    }
    
    mapping(address => StakeInfo) public stakes;
    mapping(address => uint256) public rewards;
    
    IERC20 public immutable btcToken;
    uint256 public constant REWARD_RATE = 550; // 5.5% APR in basis points
    uint256 public constant SECONDS_PER_YEAR = 31536000;
    
    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);
    event RewardsClaimed(address indexed user, uint256 amount);
    
    constructor(address _btcToken) Ownable(msg.sender) {
        btcToken = IERC20(_btcToken);
    }
    
    /**
     * @notice Stake BTC tokens
     */
    function stake(uint256 amount) external {
        require(amount > 0, "Amount must be positive");
        
        // Update rewards before staking
        _updateRewards(msg.sender);
        
        // Transfer BTC from user
        btcToken.transferFrom(msg.sender, address(this), amount);
        
        // Update stake info
        stakes[msg.sender].amount += amount;
        stakes[msg.sender].startTime = block.timestamp;
        stakes[msg.sender].lastRewardClaim = block.timestamp;
        
        emit Staked(msg.sender, amount);
    }
    
    /**
     * @notice Unstake BTC tokens
     */
    function unstake(uint256 amount) external {
        require(stakes[msg.sender].amount >= amount, "Insufficient staked amount");
        
        // Update rewards before unstaking
        _updateRewards(msg.sender);
        
        // Update stake info
        stakes[msg.sender].amount -= amount;
        
        // Transfer BTC back to user
        btcToken.transfer(msg.sender, amount);
        
        emit Unstaked(msg.sender, amount);
    }
    
    /**
     * @notice Get pending rewards for a user
     */
    function getRewards(address user) external view returns (uint256) {
        StakeInfo memory userStake = stakes[user];
        if (userStake.amount == 0) return rewards[user];
        
        uint256 timeDiff = block.timestamp - userStake.lastRewardClaim;
        uint256 pendingRewards = (userStake.amount * REWARD_RATE * timeDiff) / 
                                (10000 * SECONDS_PER_YEAR);
        
        return rewards[user] + pendingRewards;
    }
    
    /**
     * @notice Claim accumulated rewards
     */
    function claimRewards(address user) external returns (uint256) {
        _updateRewards(user);
        
        uint256 rewardAmount = rewards[user];
        if (rewardAmount > 0) {
            rewards[user] = 0;
            
            // Mint new BTC tokens as rewards (simplified for testing)
            MockBTC(address(btcToken)).mint(user, rewardAmount);
            
            emit RewardsClaimed(user, rewardAmount);
        }
        
        return rewardAmount;
    }
    
    /**
     * @notice Get staked amount for a user
     */
    function getStakedAmount(address user) external view returns (uint256) {
        return stakes[user].amount;
    }
    
    /**
     * @notice Internal function to update rewards
     */
    function _updateRewards(address user) internal {
        StakeInfo storage userStake = stakes[user];
        if (userStake.amount == 0) return;
        
        uint256 timeDiff = block.timestamp - userStake.lastRewardClaim;
        uint256 pendingRewards = (userStake.amount * REWARD_RATE * timeDiff) / 
                                (10000 * SECONDS_PER_YEAR);
        
        rewards[user] += pendingRewards;
        userStake.lastRewardClaim = block.timestamp;
    }
}