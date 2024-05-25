//SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import "./IVerifier.sol";

contract GameContract {

    /* Trustless Application Settlement Template */

    IZKVerifier public verifier;
    constructor(address verifier_address) {
        verifier = IZKVerifier(verifier_address);
    }
    
    event VerificationSucceeded(address indexed sender);

    // Submit and settle the proof
    function settleProof(
        uint256[] calldata proof,
        uint256[] calldata verify_instance,
        uint256[] calldata aux,
        uint256[][] calldata instances
    ) external {
        verifier.verify(proof, verify_instance, aux, instances);
        emit VerificationSucceeded(msg.sender);
        settle(instances);
    }


    /* Application On-chain Business Logic */

    // Here we use a simple example where the player can move a cursor in a 1-D space and 
    // keep track of the total steps.

    uint64 public total_steps;
    uint64 public current_position;

    event UpdateState(
        uint64 previous_total_steps,
        uint64 previous_position,
        uint64 total_steps,
        uint64 current_position
    );

    // Get the current state of the game contract
    function getStates() external view returns (uint64, uint64) {
        return (total_steps, current_position);
    }

    struct ZKInput {
        uint64 total_steps;
        uint64 position;
    }

    struct ZKOutput {
        uint64 total_steps;
        uint64 position;
    }

    // Settle a verified proof
    function settle(uint256[][] calldata instances) {

        uint64 start_total_steps = uint64(instances[0][0]);
        uint64 start_position = uint64(instances[0][1]);
        uint64 end_total_steps = uint64(instances[0][2]);
        uint64 end_position = uint64(instances[0][3]);

        total_steps = end_total_steps;
        current_position = end_position;

        emit UpdateState(
            start_total_steps
            start_position,
            end_total_steps,
            end_position
        );
    }
}
