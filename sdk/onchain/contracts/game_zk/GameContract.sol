//SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../shared/SpinContract.sol";

contract SpinZKGameContract is SpinContract {
    /* Trustless Application Settlement Template */
    constructor(address verifier_address) SpinContract(verifier_address) {}

    event GameSubmission(
        uint256 indexed gameId, address indexed playerAddress, uint64[4] metaTransactionHashFromOnChain
    );

    function submitGame(
        uint256 gameId,
        bytes calldata finalState,
        uint64[4] memory playerInputStateHash,
        uint256[] calldata proof,
        uint256[] calldata verify_instance,
        uint256[] calldata aux,
        uint256[][] calldata instances
    ) public {
        verifyProof(proof, verify_instance, aux, instances);

        (uint64[4] memory metaDataHashFromProof,) = parseProofInstances(instances);

        uint64[4] memory currentStateHash = hashBytes32ToUint64Array(sha256(storageContract.getStates(msg.sender)));

        uint64[4] memory metaTransactionHashFromOnChain =
            getMetaTransactionHash(gameId, currentStateHash, playerInputStateHash);

        require(
            equalUintArrays(metaTransactionHashFromOnChain, metaDataHashFromProof),
            "Start state does not match submission, no challenge"
        );

        storageContract.updateStates(finalState, msg.sender);

        emit GameSubmission(gameId, msg.sender, metaTransactionHashFromOnChain);
    }
}
