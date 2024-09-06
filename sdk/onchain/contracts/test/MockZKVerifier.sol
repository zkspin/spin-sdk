// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

/**
 *
 * This is a mock contract for ZKVerifier, which is used for testing purposes.
 * It will success if the input proof is equal to MOCK_SUCCESS_PROOF.
 *
 * @title MockZKVerifier
 * @dev Mock contract for ZKVerifier
 */
contract MockZKVerifier {
    uint256[] public MOCK_SUCCESS_PROOF = [1, 2, 3, 4, 5];
    uint256[] public MOCK_SUCCESS_VERIFY_INSTANCE = [1, 2, 3, 4, 5];
    uint256[] public MOCK_SUCCESS_AUX = [1, 2, 3, 4, 5];
    uint256[][] public MOCK_TARGET_INSTANCE = [[1, 2, 3, 4, 5, 6]];

    /**
     * @dev snark verification stub
     */
    function verify(
        uint256[] calldata proof,
        uint256[] calldata verify_instance,
        uint256[] calldata aux,
        uint256[][] calldata target_instance
    ) external view {
        require(proof.length != 0, "MockZKVerifier: proof length mismatch");
        require(target_instance.length != 0, "MockZKVerifier: target_instance length mismatch");

        require(verify_instance.length != 0, "MockZKVerifier: verify_instance length mismatch");

        require(aux.length != 0, "MockZKVerifier: aux length mismatch");
    }
}
