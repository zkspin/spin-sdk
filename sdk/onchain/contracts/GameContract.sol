//SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./IVerifier.sol";

abstract contract SpinContract {
    /* Trustless Application Settlement Template */

    address public verifier;
    address internal _owner;

    modifier onlyOwner() {
        require(msg.sender == _owner, "Only owner can call this function");
        _;
    }

    constructor(address _verifier_address) {
        _owner = msg.sender;
        verifier = _verifier_address;
    }

    event VerificationSucceeded(address indexed sender);

    // Submit and settle the proof
    function settleProof(
        uint256[] calldata proof,
        uint256[] calldata verify_instance,
        uint256[] calldata aux,
        uint256[][] calldata instances
    ) external {
        IZKVerifier(verifier).verify(proof, verify_instance, aux, instances);
        emit VerificationSucceeded(msg.sender);
        settle(instances);
    }

    function owner() external view returns (address) {
        return _owner;
    }

    function setOwner(address new_owner) external onlyOwner {
        _owner = new_owner;
    }

    function setVerifier(address verifier_address) external onlyOwner {
        verifier = verifier_address;
    }

    function settle(uint256[][] calldata instances) internal virtual;
}

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
