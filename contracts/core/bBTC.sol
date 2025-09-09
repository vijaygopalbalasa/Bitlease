// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract bBTC is ERC20, Ownable {
    IERC20 public immutable underlyingToken;
    uint256 public constant YIELD_RATE = 550; // 5.5% APY
    uint256 public lastYieldUpdate;
    
    constructor(address _underlyingToken) ERC20("BitLease BTC", "bBTC") Ownable() {
        underlyingToken = IERC20(_underlyingToken);
        lastYieldUpdate = block.timestamp;
    }
    
    function deposit(uint256 amount) external returns (uint256 shares) {
        require(amount > 0, "Amount must be > 0");
        
        underlyingToken.transferFrom(msg.sender, address(this), amount);
        shares = amount; // 1:1 for simplicity
        _mint(msg.sender, shares);
        
        return shares;
    }
    
    function withdraw(uint256 shares) external returns (uint256 amount) {
        require(shares > 0, "Shares must be > 0");
        require(balanceOf(msg.sender) >= shares, "Insufficient balance");
        
        amount = shares; // 1:1 for simplicity  
        _burn(msg.sender, shares);
        underlyingToken.transfer(msg.sender, amount);
        
        return amount;
    }
    
    function updateYield() external {
        uint256 timeElapsed = block.timestamp - lastYieldUpdate;
        uint256 totalAssets = totalSupply();
        
        if (totalAssets > 0 && timeElapsed > 0) {
            uint256 yieldAmount = (totalAssets * YIELD_RATE * timeElapsed) / (365 days * 10000);
            _mint(address(this), yieldAmount);
        }
        
        lastYieldUpdate = block.timestamp;
    }
}