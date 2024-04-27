//SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import "./IVerifier.sol";

contract DummyContract {
    IDelphinusVerifier public verifier;

    constructor(address verifier_address) {
        verifier = IDelphinusVerifier(verifier_address);
    }

    event VerificationSucceeded(address indexed player_address);

    event UpdateState(uint256 fib0, uint256 fib1);

    /* SETTER FUNCTIONS */

    function submitScore(
        uint256[] calldata proof,
        uint256[] calldata verify_instance,
        uint256[] calldata aux,
        uint256[][] calldata instances
    ) external {
        (uint256 fib0, uint256 fib1) = verify(
            proof,
            verify_instance,
            aux,
            instances
        );

        emit UpdateState(fib0, fib1);
    }

    /* VERIFY ZK FUNCTIONS */

    function reverseBytes(uint64 input) internal pure returns (uint64) {
        uint64 reversed = 0;
        for (uint i = 0; i < 8; i++) {
            reversed = (reversed << 8) | ((input >> (8 * i)) & 0xFF);
        }
        return reversed;
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
    ) public returns (uint256 fib0, uint256 fib1) {
        verifier.verify(proof, verify_instance, aux, instances);

        fib0 = instances[0][3];
        fib1 = instances[0][4];

        uint64 reversed1 = reverseBytes(uint64(instances[0][0]));
        uint64 reversed2 = reverseBytes(uint64(instances[0][1]));
        uint64 reversed3 = reverseBytes(uint64(instances[0][2]));
        uint256 combined = (uint256(reversed1) << 96) |
            (uint256(reversed2) << 32) |
            (uint256(reversed3) >> 32);
        address player_address = address(uint160(combined));

        require(player_address == msg.sender, "Player address mismatch");

        emit VerificationSucceeded(player_address);
    }
}
