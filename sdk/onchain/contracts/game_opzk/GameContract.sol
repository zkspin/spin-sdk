// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import "./StakingContract.sol";
import "../shared/GameStateStorage.sol";
import "../shared/SpinContract.sol";
import "../shared/IVerifier.sol";
import "hardhat/console.sol";

contract SpinOPZKGameContract is SpinContract {
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

    mapping(uint256 => TimelockSubmission) internal timelockSubmissionQueue; // submissionIndex => TimelockSubmission
    mapping(address => uint256) public playerSubmissionNonce;

    uint256 public nextSubmissionIndex; // the enxt submission index
    uint256 public nextSettleIndex; // the next settled submission index

    event SubmissionEvent(
        uint256 indexed submissionIndex, uint256 indexed submissionNonce, address indexed playerAddress
    );

    event ChallengeEvent(uint256 indexed submissionIndex, address indexed challenger);

    event SettleEvent(uint256 indexed submissionIndex);

    event SettleSubmissionDroppedEvent(uint256 indexed submissionIndex);

    constructor(address _verifier) SpinContract(_verifier) {
        stakingContract = new StakingContract(address(this));
        storageContract = new GameStateStorage();

        nextSubmissionIndex = 1;
        nextSettleIndex = 1;
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
        SignatureCompact calldata player_signature,
        bytes32[] calldata segmentInitialStateHashes,
        bytes32[] calldata segmentPlayerInputsHashes
    ) public {
        // TODO: compute a submission hash - to prevent replay attacks
        bytes32 computedSubmissionHash =
            sha256(abi.encode(game_id, submission_nonce, segmentInitialStateHashes, segmentPlayerInputsHashes));

        address signer = recoverHashFromCompact(computedSubmissionHash, player_signature);

        require(playerSubmissionNonce[signer] == submission_nonce, "Invalid submission nonce");

        playerSubmissionNonce[signer] = submission_nonce + 1;

        uint256 currentSubmissionIndex = nextSubmissionIndex;

        address operator_address = msg.sender;

        // make sure segment_outputs matches

        timelockSubmissionQueue[currentSubmissionIndex] = TimelockSubmission({
            gameId: game_id,
            blockNumber: block.number,
            segmentInitialStateHashes: segmentInitialStateHashes,
            segmentPlayerInputsHashes: segmentPlayerInputsHashes,
            playerAddress: signer,
            operatorAddress: operator_address,
            status: SubmissionStatus.PENDING
        });
        nextSubmissionIndex++;

        stakingContract.operator_submit_submission(1, operator_address);

        emit SubmissionEvent(currentSubmissionIndex, submission_nonce, signer);
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

        uint64[4] memory metaTransactionHashFromOnChain =
            getMetaTransactionHash(submission.gameId, startGameStateHashFromOnChain, playerInputStateHashFromOnChain);

        require(
            equalUintArrays(metaTransactionHashFromOnChain, metaDataHashFromProof),
            "Start state does not match submission, no challenge"
        );

        verifyProof(proof, verify_instance, aux, instances);
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

    // ****************** Getter functions ******************

    function getStakingContract() public view returns (address) {
        return address(stakingContract);
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
}
