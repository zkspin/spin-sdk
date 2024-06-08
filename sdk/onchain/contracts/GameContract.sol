//SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./SpinContract.sol";

contract GameContract is SpinContract {
    /* Trustless Application Settlement Template */
    constructor(address verifier_address) SpinContract(verifier_address) {}

    /* Application On-chain Business Logic */

    // Here we use a simple example where the player can move a cursor in a 1-D space and
    // keep track of the total steps.

    uint64 public total_steps;
    uint64 public current_position;

    event UpdateState(
        uint64 previous_total_steps, uint64 previous_position, uint64 total_steps, uint64 current_position
    );

    // Get the current state of the game contract
    function getStates() external view returns (uint64, uint64) {
        return (total_steps, current_position);
    }

    struct ZKInput {
        uint64 start_total_steps;
        uint64 start_position;
    }

    struct ZKOutput {
        uint64 end_total_steps;
        uint64 end_position;
    }

    // Settle a verified proof
    function settle(uint256[][] calldata instances) internal override {
        ZKInput memory zk_input = ZKInput(uint64(instances[0][0]), uint64(instances[0][1]));

        ZKOutput memory zk_output = ZKOutput(uint64(instances[0][2]), uint64(instances[0][3]));

        require(
            zk_input.start_total_steps == total_steps && zk_input.start_position == current_position,
            "Invalid start state"
        );

        total_steps = zk_output.end_total_steps;
        current_position = zk_output.end_position;

        emit UpdateState(
            zk_input.start_total_steps, zk_input.start_position, zk_output.end_total_steps, zk_output.end_position
        );
    }
}
