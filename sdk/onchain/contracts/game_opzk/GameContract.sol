// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import "./StakingContract.sol";
import "./GameStateStorage.sol";
import "./IZKVerifier.sol";
import "hardhat/console.sol";

contract GameContract {
    enum SubmissionStatus {
        PENDING, // the submission is pending settlement
        CHALLENGED, // the submission has been challenged
        SETTLED,
        // the submission has been settled
        DROPPED // the submission has been dropped because it doesn't match the current state

    }
    // This is the EIP-2098 compact representation, which reduces gas costs

    struct SignatureCompact {
        bytes32 r;
        bytes32 yParityAndS;
    }

    struct Challenge {
        uint256 submissionIndex;
        address challenger;
    }

    struct TimelockSubmission {
        uint256 gameId;
        uint256 blockNumber;
        address playerAddress;
        address operatorAddress;
        SubmissionStatus status;
        bytes32[] segmentInitialStateHashes; // the last initial state is the final state, meaning the initial state for the next segment
        bytes32[] segmentPlayerInputsHashes;
    }

    uint256 public constant CHALLENGING_WINDOW = 100; // unit in blocks

    StakingContract public stakingContract;
    GameStateStorage public storageContract;
    IZKVerifier public verifierContract;

    mapping(uint256 => TimelockSubmission) internal timelockSubmissionQueue; // submissionIndex => TimelockSubmission
    mapping(address => uint256) public playerSubmissionNonce;

    uint256[3] public zk_image_commitments;

    uint256 public nextSubmissionIndex; // the enxt submission index
    uint256 public nextSettleIndex; // the next settled submission index

    address public owner;

    event SubmissionEvent(uint256 indexed submissionIndex, uint256 indexed submissionNonce);

    event ChallengeEvent(uint256 indexed submissionIndex, address indexed challenger);

    event SettleEvent(uint256 indexed submissionIndex);

    event SettleSubmissionDroppedEvent(uint256 indexed submissionIndex);

    constructor(address _owner, address _storage, address _verifier) {
        stakingContract = new StakingContract(address(this));
        storageContract = GameStateStorage(_storage);
        verifierContract = IZKVerifier(_verifier);
        owner = _owner;

        nextSubmissionIndex = 1;
        nextSettleIndex = 1;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    /*
        The submit function is called by the operator to submit a new state update.
        The function checks if the nonce is correct and then adds the submission to the queue.
        The function also checks if the bond amount is correct and then stakes the bond.
        The function emits a SubmissionEvent.

    * @dev Submit a new state update
    * @param gameId The game ID
    * @param transactionNonce The nonce of the transaction
    * @param transactionInputHash The hash of the transaction input
    * @param playerAddress The address of the player
    * @param newStates The new states
    * @param playerSignature The signature of the player
    */
    function submit_submission(
        uint256 game_id,
        uint256 submission_nonce,
        address player_address,
        SignatureCompact calldata player_signature,
        bytes32[] calldata segmentInitialStateHashes,
        bytes32[] calldata segmentPlayerInputsHashes
    ) public {
        // TODO: compute a submission hash - to prevent replay attacks
        bytes32 computedSubmissionHash = sha256(
            abi.encode(game_id, submission_nonce, player_address, segmentInitialStateHashes, segmentPlayerInputsHashes)
        );

        address signer = recoverHashFromCompact(computedSubmissionHash, player_signature);

        require(signer == player_address, "Invalid player signature");
        require(playerSubmissionNonce[player_address] == submission_nonce, "Invalid submission nonce");

        playerSubmissionNonce[player_address] = submission_nonce + 1;

        uint256 currentSubmissionIndex = nextSubmissionIndex;

        address operator_address = msg.sender;

        // make sure segment_outputs matches

        timelockSubmissionQueue[currentSubmissionIndex] = TimelockSubmission({
            gameId: game_id,
            blockNumber: block.number,
            segmentInitialStateHashes: segmentInitialStateHashes,
            segmentPlayerInputsHashes: segmentPlayerInputsHashes,
            playerAddress: player_address,
            operatorAddress: operator_address,
            status: SubmissionStatus.PENDING
        });
        nextSubmissionIndex++;

        stakingContract.operator_submit_submission(1, operator_address);

        emit SubmissionEvent(currentSubmissionIndex, submission_nonce);
    }

    function batch_submit_submission() public {
        // TODO
    }

    /*
        The settle function is called by anyone to settle a submission.
        Only able to settle if the submission has not been challenged and the challenging window has passed.
        The function checks if the submission index is valid and if the submission is not already settled.
        The function then settles the submission and returns the bond to the submitter.

        optimization: this settle step could be batched and compressed somehow.
    */

    function settle(uint256 gameId, uint256 submissionIndex, bytes calldata finalState) public {
        require(submissionIndex <= nextSubmissionIndex, "Submission index out of bounds");
        require(nextSettleIndex == submissionIndex, "Submission already settled, Index out of order");

        // settlements needs to be done in order of submission

        TimelockSubmission storage submission = timelockSubmissionQueue[submissionIndex];

        require(submission.status != SubmissionStatus.SETTLED, "Submission already settled");
        require(submission.blockNumber != 0, "Submission does not exist");

        if (submission.status != SubmissionStatus.CHALLENGED) {
            // If the submission is not challenged, the submitter can settle it after the challenging window
            require(block.number >= submission.blockNumber + CHALLENGING_WINDOW, "Challenging window has not passed");

            // check if submission initial state matches the output of the current state
            bytes32 claimedSubmissionInitialStateHash = submission.segmentInitialStateHashes[0];
            bytes32 currentStateHash = sha256(storageContract.getStates(submission.playerAddress));

            // console.logBytes32(claimedSubmissionInitialStateHash);
            // console.logBytes32(currentStateHash);

            if (claimedSubmissionInitialStateHash == currentStateHash) {
                storageContract.updateStates(finalState, submission.playerAddress);

                submission.status = SubmissionStatus.SETTLED;

                emit SettleEvent(submissionIndex);
            } else {
                submission.status = SubmissionStatus.DROPPED;

                emit SettleSubmissionDroppedEvent(submissionIndex);
            }

            stakingContract.operator_settle_submission(1, submission.operatorAddress);
        }

        nextSettleIndex++;
    }

    function batch_settle() public {
        // TODO
    }

    /*
        The challenge function is called by anyone to challenge a submission.
        If the submission is challenged, the function verifies the zk proof and slashes the bond of the submitter.

        The function checks if the submission index is valid and if the challenging window has not passed.
        The function then challenges the submission and slashes the bond of the submitter.
    */

    function challenge_operator(
        uint256 gameId,
        uint256 submissionIndex,
        uint256 segmentIndex,
        uint256[] calldata proof,
        uint256[] calldata verify_instance,
        uint256[] calldata aux,
        uint256[][] calldata instances
    ) public {
        require(submissionIndex <= nextSubmissionIndex, "Submission index out of bounds");

        TimelockSubmission storage submission = timelockSubmissionQueue[submissionIndex];

        address challenger = msg.sender;

        require(block.number < submission.blockNumber + CHALLENGING_WINDOW, "Challenging window has passed");

        submission.status = SubmissionStatus.CHALLENGED;

        challenge(submissionIndex, segmentIndex, proof, verify_instance, aux, instances);

        stakingContract.operator_slash(1, challenger, submission.operatorAddress);

        emit ChallengeEvent(submissionIndex, challenger);
    }

    function challenge(
        uint256 submissionIndex,
        uint256 segmentIndex,
        uint256[] calldata proof,
        uint256[] calldata verify_instance,
        uint256[] calldata aux,
        uint256[][] calldata instances
    ) private view {
        TimelockSubmission storage submission = timelockSubmissionQueue[submissionIndex];

        (uint64[4] memory metaDataHashFromProof, uint64[4] memory endGameStateHashFromProof) =
            parseProofInstances(instances);

        // metaDataHashFromProof include:
        // transactionNonce, gameId, inputSigner0, inputSigner1, inputSigner2,
        // onchain_game_state_hash_0, onchain_game_state_hash_1, onchain_game_state_hash_2, onchain_game_state_hash_3

        uint64[4] memory endStateHashFromSubmission =
            hashBytes32ToUint64Array(submission.segmentInitialStateHashes[segmentIndex + 1]);

        require(
            !equalUintArrays(endGameStateHashFromProof, endStateHashFromSubmission),
            "Output from proof does match submission, no challenge"
        );

        uint64[4] memory startGameStateHashFromOnChain =
            hashBytes32ToUint64Array(submission.segmentInitialStateHashes[segmentIndex]);

        uint64[4] memory playerInputStateHashFromOnChain =
            hashBytes32ToUint64Array(submission.segmentPlayerInputsHashes[segmentIndex]);

        uint64[4] memory metaTransactionHashFromOnChain = hashBytes32ToUint64Array(
            sha256(
                abi.encode(
                    submission.gameId,
                    startGameStateHashFromOnChain[0],
                    startGameStateHashFromOnChain[1],
                    startGameStateHashFromOnChain[2],
                    startGameStateHashFromOnChain[3],
                    playerInputStateHashFromOnChain[0],
                    playerInputStateHashFromOnChain[1],
                    playerInputStateHashFromOnChain[2],
                    playerInputStateHashFromOnChain[3]
                )
            )
        );

        require(
            equalUintArrays(metaTransactionHashFromOnChain, metaDataHashFromProof),
            "Start state does not match submission, no challenge"
        );

        verifyZKProof(proof, verify_instance, aux, instances);
    }

    function challenge_idle_challenger(
        uint256 gameId,
        uint256 submissionIndex,
        uint256 segmentIndex,
        uint256[] calldata proof,
        uint256[] calldata verify_instance,
        uint256[] calldata aux,
        uint256[][] calldata instances
    ) public {
        require(submissionIndex <= nextSubmissionIndex, "Submission index out of bounds");

        TimelockSubmission storage submission = timelockSubmissionQueue[submissionIndex];

        address challengerToBeRewarded = msg.sender;

        require(block.number > submission.blockNumber + CHALLENGING_WINDOW, "Normal challenging window has not passed");

        challenge(submissionIndex, segmentIndex, proof, verify_instance, aux, instances);

        stakingContract.challenger_slashing(challengerToBeRewarded, submission.blockNumber);
    }

    // ****************** Permissioned functions ******************

    function setVerifier(address verifier_address) external onlyOwner {
        verifierContract = IZKVerifier(verifier_address);
    }

    function setVerifierImageCommitments(uint256[3] calldata commitments) external onlyOwner {
        zk_image_commitments[0] = commitments[0];
        zk_image_commitments[1] = commitments[1];
        zk_image_commitments[2] = commitments[2];
    }

    // ****************** Getter functions ******************

    function getStakingContract() public view returns (address) {
        return address(stakingContract);
    }

    function getStorage() public view returns (address) {
        return address(storageContract);
    }

    function getVerifier() public view returns (address) {
        return address(verifierContract);
    }

    function getSubmissionNonce(address player) public view returns (uint256) {
        return playerSubmissionNonce[player];
    }

    function getSubmission(uint256 submissionIndex)
        public
        view
        returns (
            uint256 gameId,
            uint256 blockNumber,
            address playerAddress,
            address operatorAddress,
            SubmissionStatus status,
            bytes32[] memory segmentInitialStateHashes
        )
    {
        TimelockSubmission storage submission = timelockSubmissionQueue[submissionIndex];

        return (
            submission.gameId,
            submission.blockNumber,
            submission.playerAddress,
            submission.operatorAddress,
            submission.status,
            submission.segmentInitialStateHashes
        );
    }

    // ****************** Helper functions ******************

    function recoverHashFromCompact(bytes32 hash, SignatureCompact calldata sig) public pure returns (address) {
        bytes memory prefixedMessage = abi.encodePacked(
            // Notice the length of the message is hard-coded to 32
            // here -----------------------v
            "\x19Ethereum Signed Message:\n32",
            hash
        );

        bytes32 digest = keccak256(prefixedMessage);

        // Decompose the EIP-2098 signature
        uint8 v = 27 + uint8(uint256(sig.yParityAndS) >> 255);
        bytes32 s = bytes32((uint256(sig.yParityAndS) << 1) >> 1);

        return ecrecover(digest, v, sig.r, s);
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

    // Compares two byte arrays for equality
    function equalUintArrays(uint64[4] memory a, uint64[4] memory b) public pure returns (bool) {
        for (uint256 i = 0; i < 4; i++) {
            if (a[i] != b[i]) {
                return false;
            }
        }
        return true;
    }

    function equalBytes(bytes memory a, bytes memory b) private pure returns (bool) {
        if (a.length != b.length) {
            return false;
        }
        for (uint256 i = 0; i < a.length; i++) {
            if (a[i] != b[i]) {
                return false;
            }
        }
        return true;
    }

    function parseAddress(uint256[3] memory addressParts) public pure returns (address) {
        uint64 reversed1 = _reverseBytes(uint64(addressParts[0]));
        uint64 reversed2 = _reverseBytes(uint64(addressParts[1]));
        uint64 reversed3 = _reverseBytes(uint64(addressParts[2]));
        uint256 combined = (uint256(reversed1) << 96) | (uint256(reversed2) << 32) | (uint256(reversed3) >> 32);
        address player_address = address(uint160(combined));

        return player_address;
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

    function verifyZKProof(
        uint256[] calldata proof,
        uint256[] calldata verify_instance,
        uint256[] calldata aux,
        uint256[][] calldata instances
    ) public view {
        // image commitments verification
        require(verify_instance[1] == zk_image_commitments[0], "Invalid image commitment 0");
        require(verify_instance[2] == zk_image_commitments[1], "Invalid image commitment 1");
        require(verify_instance[3] == zk_image_commitments[2], "Invalid image commitment 2");

        if (address(verifierContract) != address(0)) {
            verifierContract.verify(proof, verify_instance, aux, instances);
        }
    }

    function _reverseBytes(uint64 input) public pure returns (uint64) {
        uint64 reversed = 0;
        for (uint256 i = 0; i < 8; i++) {
            reversed = (reversed << 8) | ((input >> (8 * i)) & 0xFF);
        }
        return reversed;
    }
}
