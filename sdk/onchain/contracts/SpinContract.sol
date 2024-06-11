//SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./IVerifier.sol";

abstract contract SpinContract {
    /* Trustless Application Settlement Template */

    address public verifier;
    address internal _owner;

    uint256[3] public zk_image_commitments;

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
    ) internal {
        // skip image commitments verification if it is not set
        if (zk_image_commitments[0] != 0) {
            require(verify_instance[1] == zk_image_commitments[0], "Invalid image commitment 0");
            require(verify_instance[2] == zk_image_commitments[1], "Invalid image commitment 1");
            require(verify_instance[3] == zk_image_commitments[2], "Invalid image commitment 2");
        }

        IZKVerifier(verifier).verify(proof, verify_instance, aux, instances);

        emit VerificationSucceeded(msg.sender);
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

    function setVerifierImageCommitments(uint256[3] calldata commitments) external onlyOwner {
        zk_image_commitments[0] = commitments[0];
        zk_image_commitments[1] = commitments[1];
        zk_image_commitments[2] = commitments[2];
    }
}
