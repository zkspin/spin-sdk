// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

interface IZKVerifier {
    /**
     * @dev snark verification stub
     */
    function verify(
        uint256[] calldata proof,
        uint256[] calldata verify_instance,
        uint256[] calldata aux,
        uint256[][] calldata target_instance
    ) external view;
}
