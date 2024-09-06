// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

contract GameStateStorage {
    mapping(address => bytes) public states;

    function updateStates(bytes calldata state, address player) public {
        states[player] = state;
    }

    function getStates(address player) public view returns (bytes memory) {
        if (states[player].length == 0) {
            return abi.encode(0, 0, 0, 0, 0);
        }

        return states[player];
    }
}
