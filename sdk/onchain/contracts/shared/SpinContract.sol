//SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../shared/GameStateStorage.sol";
import "./IVerifier.sol";

abstract contract SpinContract {
    /* Trustless Application Settlement Template */
    GameStateStorage public storageContract;
    IZKVerifier public verifier;
    address internal _owner;

    uint256[3] public zk_image_commitments;

    modifier onlyOwner() {
        require(msg.sender == _owner, "Only owner can call this function");
        _;
    }

    constructor(address _verifier_address) {
        _owner = msg.sender;
        verifier = IZKVerifier(_verifier_address);
        storageContract = new GameStateStorage();
    }

    function verifyProof(
        uint256[] calldata proof,
        uint256[] calldata verify_instance,
        uint256[] calldata aux,
        uint256[][] calldata instances
    ) internal view {
        // skip image commitments verification if it is not set
        if (zk_image_commitments[0] != 0) {
            require(verify_instance[1] == zk_image_commitments[0], "Invalid image commitment 0");
            require(verify_instance[2] == zk_image_commitments[1], "Invalid image commitment 1");
            require(verify_instance[3] == zk_image_commitments[2], "Invalid image commitment 2");
        }

        verifier.verify(proof, verify_instance, aux, instances);
    }

    function owner() external view returns (address) {
        return _owner;
    }

    function getStorageContract() external view returns (address) {
        return address(storageContract);
    }

    function getVerifierContract() external view returns (address) {
        return address(verifier);
    }

    function setOwner(address new_owner) external onlyOwner {
        _owner = new_owner;
    }

    function setVerifier(address verifier_address) external onlyOwner {
        verifier = IZKVerifier(verifier_address);
    }

    function setVerifierImageCommitments(uint256[3] calldata commitments) external onlyOwner {
        zk_image_commitments[0] = commitments[0];
        zk_image_commitments[1] = commitments[1];
        zk_image_commitments[2] = commitments[2];
    }

    function parseProofInstances(uint256[][] calldata instances)
        public
        pure
        returns (uint64[4] memory metaDataHash, uint64[4] memory endGameStateHash)
    {
        // meta transaction data hash
        metaDataHash[0] = uint64(instances[0][0]);
        metaDataHash[1] = uint64(instances[0][1]);
        metaDataHash[2] = uint64(instances[0][2]);
        metaDataHash[3] = uint64(instances[0][3]);
        // ending game state hash
        endGameStateHash[0] = uint64(instances[0][4]);
        endGameStateHash[1] = uint64(instances[0][5]);
        endGameStateHash[2] = uint64(instances[0][6]);
        endGameStateHash[3] = uint64(instances[0][7]);
    }

    function equalUintArrays(uint64[4] memory a, uint64[4] memory b) public pure returns (bool) {
        for (uint256 i = 0; i < 4; i++) {
            if (a[i] != b[i]) {
                return false;
            }
        }
        return true;
    }

    function hashBytes32ToUint64Array(bytes32 data) public pure returns (uint64[4] memory) {
        // Compute the SHA-256 hash of the data
        uint64[4] memory splitIntegers;
        // Split hash into four uint64 parts
        for (uint256 i = 0; i < 4; i++) {
            // Extract each part as uint64 from bytes32
            splitIntegers[i] = uint64(uint256(data) >> (192 - i * 64));
        }
        return splitIntegers;
    }

    function parseAddress(uint256[3] memory addressParts) public pure returns (address) {
        uint64 reversed1 = _reverseBytes(uint64(addressParts[0]));
        uint64 reversed2 = _reverseBytes(uint64(addressParts[1]));
        uint64 reversed3 = _reverseBytes(uint64(addressParts[2]));
        uint256 combined = (uint256(reversed1) << 96) | (uint256(reversed2) << 32) | (uint256(reversed3) >> 32);
        address player_address = address(uint160(combined));

        return player_address;
    }

    function _reverseBytes(uint64 input) public pure returns (uint64) {
        uint64 reversed = 0;
        for (uint256 i = 0; i < 8; i++) {
            reversed = (reversed << 8) | ((input >> (8 * i)) & 0xFF);
        }
        return reversed;
    }
}
