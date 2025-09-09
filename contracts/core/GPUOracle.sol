// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";

contract GPUOracle is Ownable {
    mapping(string => uint256) public gpuPrices;
    
    event PriceUpdate(string gpuType, uint256 price);
    
    constructor() Ownable() {
        // Set initial prices (in USDC with 6 decimals)
        gpuPrices["A100"] = 2500000; // $2.50/hour
        gpuPrices["V100"] = 1500000; // $1.50/hour  
        gpuPrices["H100"] = 4000000; // $4.00/hour
    }
    
    function getGPUPrice(string memory gpuType) external view returns (uint256) {
        return gpuPrices[gpuType];
    }
    
    function setGPUPrice(string memory gpuType, uint256 price) external onlyOwner {
        gpuPrices[gpuType] = price;
        emit PriceUpdate(gpuType, price);
    }
}