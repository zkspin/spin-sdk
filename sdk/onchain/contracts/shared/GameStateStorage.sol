// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

contract GameStateStorage {
    address creator;
    mapping(address => bytes) public states;

    constructor() {
        creator = msg.sender;
    }

    function updateStates(bytes calldata state, address player) external {
        require(msg.sender == creator, "Only creator can call this function");
        states[player] = state;
    }

    function getStates(address player) public view returns (bytes memory) {
        return states[player];
    }
}
