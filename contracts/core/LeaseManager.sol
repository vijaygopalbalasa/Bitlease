// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./LendingPool.sol";
import "./GPUOracle.sol";

contract LeaseManager {
    LendingPool public immutable lendingPool;
    GPUOracle public immutable oracle;
    
    struct Lease {
        address user;
        string gpuType;
        uint256 duration;
        uint256 costUSDC;
        uint256 startTime;
        bool active;
    }
    
    mapping(bytes32 => Lease) public leases;
    
    event LeaseCreated(bytes32 indexed leaseId, address indexed user, string gpuType, uint256 duration, uint256 cost);
    event LeaseCompleted(bytes32 indexed leaseId);
    
    constructor(address _lendingPool, address _oracle) {
        lendingPool = LendingPool(_lendingPool);
        oracle = GPUOracle(_oracle);
    }
    
    function createLease(
        uint256 collateralAmount,
        string memory gpuType,
        uint256 duration
    ) external returns (bytes32) {
        uint256 costUSDC = oracle.getGPUPrice(gpuType) * duration;
        bytes32 leaseId = keccak256(abi.encodePacked(msg.sender, block.timestamp));
        
        // Borrow USDC using bBTC collateral
        lendingPool.borrow(collateralAmount, costUSDC);
        
        leases[leaseId] = Lease({
            user: msg.sender,
            gpuType: gpuType,
            duration: duration,
            costUSDC: costUSDC,
            startTime: block.timestamp,
            active: true
        });
        
        emit LeaseCreated(leaseId, msg.sender, gpuType, duration, costUSDC);
        return leaseId;
    }
    
    function completeLease(bytes32 leaseId) external {
        require(leases[leaseId].user == msg.sender, "Not lease owner");
        require(leases[leaseId].active, "Lease not active");
        
        leases[leaseId].active = false;
        emit LeaseCompleted(leaseId);
    }
    
    function getLease(bytes32 leaseId) external view returns (Lease memory) {
        return leases[leaseId];
    }
}