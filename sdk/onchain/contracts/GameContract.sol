//SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import "./IVerifier.sol";

contract GameContract {
    IZKVerifier public verifier;

    uint64 public total_steps;
    uint64 public current_position;

    constructor(address verifier_address) {
        verifier = IZKVerifier(verifier_address);
    }

    event VerificationSucceeded(address indexed sender);

    event UpdateState(
        uint64 previous_total_steps,
        uint64 previos_position,
        uint64 total_steps,
        uint64 current_position
    );

    /* SETTERS
     * @dev Submit the score of the game
     */
    function submitScore(
        uint256[] calldata proof,
        uint256[] calldata verify_instance,
        uint256[] calldata aux,
        uint256[][] calldata instances
    ) external {
        (ZKInput memory zk_input, ZKOutput memory zk_output) = verify(
            proof,
            verify_instance,
            aux,
            instances
        );

        total_steps = zk_output.total_steps;
        current_position = zk_output.position;

        emit UpdateState(
            zk_input.total_steps,
            zk_input.position,
            zk_output.total_steps,
            zk_output.position
        );
    }

    /* GETTERS
     * @dev Get the current state of the game contract
     */
    function getStates() external view returns (uint64, uint64) {
        return (total_steps, current_position);
    }

    /* VERIFY ZK FUNCTIONS: THESE FUNCTIONS CAN BE EVENTUALLY AUTO-GENERATED */

    /*
     * @dev Reverse the bytes of a 64 bit integer
     */

    function reverseBytes(uint64 input) internal pure returns (uint64) {
        uint64 reversed = 0;
        for (uint i = 0; i < 8; i++) {
            reversed = (reversed << 8) | ((input >> (8 * i)) & 0xFF);
        }
        return reversed;
    }

    struct ZKInput {
        uint64 total_steps;
        uint64 position;
    }

    struct ZKOutput {
        uint64 total_steps;
        uint64 position;
    }

    /*
     * @dev Data encodes the delta functions with there verification in reverse order
     * data = opcode args; opcode' args'; ....
     */
    function verify(
        uint256[] calldata proof,
        uint256[] calldata verify_instance,
        uint256[] calldata aux,
        uint256[][] calldata instances
    ) public returns (ZKInput memory zk_input, ZKOutput memory zk_output) {
        verifier.verify(proof, verify_instance, aux, instances);

        zk_input = ZKInput({
            total_steps: uint64(instances[0][0]),
            position: uint64(instances[0][1])
        });

        zk_output = ZKOutput({
            total_steps: uint64(instances[0][2]),
            position: uint64(instances[0][3])
        });

        emit VerificationSucceeded(msg.sender);
    }
}
