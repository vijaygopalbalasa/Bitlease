// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

contract SimpleTest {
    string public name = "BitLease Test";
    uint256 public value = 42;
    
    function setValue(uint256 _value) public {
        value = _value;
    }
    
    function getValue() public view returns (uint256) {
        return value;
    }
}