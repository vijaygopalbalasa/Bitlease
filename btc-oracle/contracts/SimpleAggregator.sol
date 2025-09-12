// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title SimpleAggregator
 * @notice A simple price aggregator contract that stores BTC/USD price data
 * @dev Production-ready oracle aggregator with owner controls
 */
contract SimpleAggregator {
    address public owner;
    uint8 public decimals;
    int256 public latestAnswer;
    uint256 public latestTimestamp;
    uint256 public latestRound;
    
    event AnswerUpdated(int256 current, uint256 roundId);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "SimpleAggregator: caller is not the owner");
        _;
    }
    
    /**
     * @notice Constructor to initialize the aggregator
     * @param _owner The owner address who can update prices
     * @param _decimals The number of decimals for the price (typically 8 for BTC/USD)
     */
    constructor(address _owner, uint8 _decimals) {
        require(_owner != address(0), "SimpleAggregator: owner cannot be zero address");
        require(_decimals > 0, "SimpleAggregator: decimals must be greater than 0");
        
        owner = _owner;
        decimals = _decimals;
        latestRound = 0;
        latestTimestamp = block.timestamp;
        latestAnswer = 0;
    }
    
    /**
     * @notice Transfer ownership to a new owner
     * @param newOwner The new owner address
     */
    function setOwner(address newOwner) external onlyOwner {
        require(newOwner != address(0), "SimpleAggregator: new owner cannot be zero address");
        
        address previousOwner = owner;
        owner = newOwner;
        
        emit OwnershipTransferred(previousOwner, newOwner);
    }
    
    /**
     * @notice Update the latest price answer
     * @param answer The new price answer (scaled by decimals)
     */
    function updateAnswer(int256 answer) external onlyOwner {
        require(answer > 0, "SimpleAggregator: answer must be positive");
        
        latestRound += 1;
        latestAnswer = answer;
        latestTimestamp = block.timestamp;
        
        emit AnswerUpdated(answer, latestRound);
    }
    
    /**
     * @notice Get the latest round data (Chainlink compatible interface)
     * @return roundId The round ID
     * @return answer The price answer
     * @return startedAt The timestamp when the round started
     * @return updatedAt The timestamp when the round was updated
     * @return answeredInRound The round ID in which the answer was computed
     */
    function latestRoundData() 
        external 
        view 
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        ) 
    {
        return (
            uint80(latestRound),
            latestAnswer,
            latestTimestamp,
            latestTimestamp,
            uint80(latestRound)
        );
    }
    
    /**
     * @notice Get the number of decimals for the price
     * @return The number of decimals
     */
    function getDecimals() external view returns (uint8) {
        return decimals;
    }
    
    /**
     * @notice Get the description of the price feed
     * @return The description string
     */
    function description() external pure returns (string memory) {
        return "BTC / USD";
    }
    
    /**
     * @notice Get the version of the aggregator
     * @return The version number
     */
    function version() external pure returns (uint256) {
        return 1;
    }
}