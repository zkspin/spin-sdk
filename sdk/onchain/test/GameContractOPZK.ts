import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

import {
    loadFixture,
    mine,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { Signature, ethers } from "ethers";
import hre, { ignition } from "hardhat";
import {
    GameStateStorage,
    SpinOPZKGameContract,
    StakingContract,
} from "../typechain-types";
import { readZKWasmProof } from "./readProof";
import {
    computeSubmissionHash,
    computeHashBytes32,
    computeSegmentMetaHash,
    computeHashUint64Array,
    bytes32ToBigIntArray,
} from "../../lib/dataHasher";
import opzkGameModule from "../ignition/modules/GameContractOPZK";
import ZkwasmVerifier from "../ignition/modules/ZKVerifier";

// temporary only 1 game is supported
const GAMED_ID = BigInt(123);

// 1A0C6C292C6FDD7544951A608D1B3286
const IMAGE_COMMITMENTS: [bigint, bigint, bigint] = [
    11193174033370159521390584142419769751860779870463410815561808017n,
    71431214803462468228466910014054298767294634843963935727527295453n,
    26133185431088194003701578845230618912451585n,
];

function generateOutputBytes(output: bigint[]): string {
    // return abi.encodePacked(output);

    if (output.length !== 5) {
        throw new Error("Invalid output length");
    }

    return ethers.AbiCoder.defaultAbiCoder().encode(
        ["uint256", "uint256", "uint256", "uint256", "uint256"],
        output
    );
}

describe("GameContract", function () {
    // We define a fixture to reuse the same setup in every test.
    // We use loadFixture to run this setup once, snapshot that state,
    // and reset Hardhat Network to that snapshot in every test.
    async function deployGameContract() {
        // Contracts are deployed using the first signer/account by default
        const [owner] = await hre.ethers.getSigners();

        const { zkwasmVerifier } = await ignition.deploy(ZkwasmVerifier);

        // @ts-ignore
        const {
            storageContract,
            gameSystem,
            stakingContract,
        }: {
            storageContract: GameStateStorage;
            gameSystem: SpinOPZKGameContract;
            stakingContract: StakingContract;
        } = await ignition.deploy(opzkGameModule, {
            parameters: {
                OPZKGameModule: {
                    verifier_address: await zkwasmVerifier.getAddress(),
                },
            },
        });

        // 4958f20adcf65bd4c2870b58104e0e86 ID
        await gameSystem.setVerifierImageCommitments(IMAGE_COMMITMENTS);

        return {
            storageContract,
            stakingContract,
            gameSystem,
            owner,
        };
    }

    async function debug_check_operator_stake(
        stakingContract: StakingContract,
        operator: HardhatEthersSigner
    ) {
        const stakedAmount = await stakingContract.operatorStake(
            operator.getAddress()
        );

        const alreadySubmissionCount =
            await stakingContract.operatorSubmittingSubmissionCount(
                operator.getAddress()
            );

        console.log("stakedAmount", stakedAmount);
        console.log("alreadySubmissionCount", alreadySubmissionCount);
    }

    /**
     * Stakes one more amount if the operator has less than the amount
     * @param stakingContract
     * @param operator
     * @param amount
     */
    async function auto_operator_stake(
        stakingContract: StakingContract,
        operator: HardhatEthersSigner,
        submissionCount: number
    ) {
        const availStakedAmount =
            await stakingContract.operator_available_stake(
                operator.getAddress()
            );

        const BOND_AMOUNT =
            (await stakingContract.OPERATOR_ETH_STAKED_PER_SUBMISSION()) *
            BigInt(submissionCount);

        if (availStakedAmount < BOND_AMOUNT) {
            console.debug(
                "Staking more for operator",
                await operator.getAddress(),
                BOND_AMOUNT
            );
            await stakingContract
                .connect(operator)
                .operator_stake({ value: BOND_AMOUNT - availStakedAmount });
        }
    }

    async function loadPlayerFixture() {
        const [
            owner,
            operator1,
            operator2,
            player1,
            player2,
            player3,
            challenger1,
            challenger2,
        ] = await hre.ethers.getSigners();

        return {
            owner,
            operator1,
            operator2,
            player1,
            player2,
            player3,
            challenger1,
            challenger2,
        };
    }

    function reverseBytes(input: bigint) {
        let reversed = BigInt(0);
        for (let i = 0; i < 8; i++) {
            reversed =
                (reversed << BigInt(8)) |
                ((input >> BigInt(8 * i)) & BigInt(0xff));
        }
        return reversed;
    }

    function splitAddress(address: string) {
        const fullAddress = BigInt(address);
        const mask64Bits = BigInt("0xFFFFFFFFFFFFFFFF"); // Mask to isolate 64 bits

        // Split the address back into its parts
        const part3 = reverseBytes((fullAddress << BigInt(32)) & mask64Bits);
        const part2 = reverseBytes((fullAddress >> BigInt(32)) & mask64Bits);
        const part1 = reverseBytes((fullAddress >> BigInt(96)) & mask64Bits);

        return [part1, part2, part3];
    }

    async function submitMockTransaction(
        system: SpinOPZKGameContract,
        stakingContract: StakingContract,
        initialState: bigint[],
        playerInputs: bigint[],
        finalState: bigint[],
        player: HardhatEthersSigner
    ) {
        const { operator1: operator } = await loadPlayerFixture();
        await auto_operator_stake(stakingContract, operator, 1);
        // prepare the transaction args
        const submissionNonce = await system.getSubmissionNonce(player.address);

        const segmentInitialStateHashes: string[] = [
            ethers.sha256(generateOutputBytes(initialState)),
            ethers.sha256(generateOutputBytes(finalState)),
        ];

        const _submissionData = {
            game_id: GAMED_ID,
            segments: [
                {
                    initial_states: initialState,
                    player_action_inputs: playerInputs,
                    final_state: finalState,
                },
            ],
            submission_nonce: submissionNonce,
            submission_hash: "",
            player_address: player.address,
            player_signature: "",
        };

        _submissionData.submission_hash =
            computeSubmissionHash(_submissionData);

        _submissionData.player_signature = await player.signMessage(
            ethers.getBytes(_submissionData.submission_hash)
        );

        // console.log(
        //     "Submission data",
        //     _submissionData.player_signature,
        //     _submissionData.submission_hash,
        //     _submissionData.player_address
        // );

        console.log();

        const gameInputHashes = [computeHashBytes32(playerInputs)];

        const newSubmissionIndex = await system.nextSubmissionIndex();

        await expect(
            system
                .connect(operator)
                .submit_submission(
                    _submissionData.game_id,
                    _submissionData.submission_nonce,
                    _submissionData.player_address,
                    Signature.from(_submissionData.player_signature),
                    segmentInitialStateHashes,
                    gameInputHashes
                )
        )
            .to.emit(system, "SubmissionEvent")
            .withArgs(newSubmissionIndex, submissionNonce);

        const submission = await system.getSubmission(newSubmissionIndex);

        expect(submission.gameId).to.equal(GAMED_ID);
        expect(submission.playerAddress).to.equal(player.address);
        expect(submission.segmentInitialStateHashes).to.deep.equal(
            segmentInitialStateHashes
        );

        return { newSubmissionIndex, submissionNonce, submission };
    }

    /* Mocks the proof object returned by the verifier contract
     * @param success boolean to indicate if the proof is valid or not
     * @param target_instacne array of 6 integers to represent the target instance of the proof
     *     [transactioNonce, gameID, playerAddr1, playerAddr2, playerAddr3, stateChange[0]]
     * @returns object with PROOF, VERIFYING_INSTANCE, AUX, TARGET_INSTANCE
     *
     */

    async function loadMockProof(
        success: boolean,
        target_instacne: [
            bigint,
            bigint,
            bigint,
            bigint,
            bigint,
            bigint,
            bigint,
            bigint
        ],
        verifying_instance: [bigint, bigint, bigint, bigint] = [
            BigInt(0),
            IMAGE_COMMITMENTS[0],
            IMAGE_COMMITMENTS[1],
            IMAGE_COMMITMENTS[2],
        ]
    ) {
        // magic number 1,2,3,4,5 for success written in MockZKVerifier.sol
        const PROOF = success ? [1, 2, 3, 4, 5] : [6, 7, 8, 9, 10];
        const AUX = [4];
        const TARGET_INSTANCE = [target_instacne];
        const VERIFYING_INSTANCE = verifying_instance;
        return { PROOF, VERIFYING_INSTANCE, AUX, TARGET_INSTANCE };
    }

    async function loadZKWasmProof(proofFile: string) {
        return readZKWasmProof(proofFile);
    }

    describe("Deployment", function () {
        it("Constructor contracts are set correctly", async function () {
            const { gameSystem, storageContract } = await loadFixture(
                deployGameContract
            );

            expect(await gameSystem.getStorageContract()).to.equal(
                await storageContract.getAddress()
            );
        });

        it("Test submit", async function () {
            const { gameSystem, stakingContract } = await loadFixture(
                deployGameContract
            );

            const { player1 } = await loadPlayerFixture();

            // transaction inputs are not submitted on-chain by player

            const { newSubmissionIndex } = await submitMockTransaction(
                gameSystem,
                stakingContract,
                [BigInt(0), BigInt(0), BigInt(0), BigInt(0), BigInt(0)],
                [BigInt(1), BigInt(1), BigInt(1)],
                [BigInt(5), BigInt(14), BigInt(6), BigInt(147), BigInt(1)],
                player1
            );

            // check the submission
            const nextSubmissionIndex = await gameSystem.nextSubmissionIndex();

            expect(nextSubmissionIndex).to.equal(
                newSubmissionIndex + BigInt(1)
            );
        });

        it("Test settle", async function () {
            const { gameSystem, storageContract, stakingContract } =
                await loadFixture(deployGameContract);

            const { player1 } = await loadPlayerFixture();

            const submissionInitialState = [
                BigInt(0),
                BigInt(0),
                BigInt(0),
                BigInt(0),
                BigInt(0),
            ];

            // transaction inputs are not submitted on-chain by player
            const finalStates = [
                BigInt(5),
                BigInt(14),
                BigInt(6),
                BigInt(147),
                BigInt(1),
            ];

            const { newSubmissionIndex, submissionNonce } =
                await submitMockTransaction(
                    gameSystem,
                    stakingContract,
                    submissionInitialState,
                    [BigInt(1), BigInt(1), BigInt(1)],
                    finalStates,
                    player1
                );

            // expect settle to fail if challenge window has not passed

            await expect(
                gameSystem.settle(
                    GAMED_ID,
                    newSubmissionIndex,
                    generateOutputBytes(finalStates)
                )
            ).to.be.revertedWith("Challenging window has not passed");

            // simulate 100 blocks passed for challenge window to pass
            await mine(100);

            // settle the submission
            console.log("settle", finalStates);
            await expect(
                gameSystem.settle(
                    GAMED_ID,
                    newSubmissionIndex,
                    generateOutputBytes(finalStates)
                )
            )
                .to.emit(gameSystem, "SettleEvent")
                .withArgs(newSubmissionIndex);

            // check the storage contract for state changes
            const submission = await gameSystem.getSubmission(
                newSubmissionIndex
            );
            // submission[8] is enum SubmissionStatus, 2 is Settled
            expect(submission[4]).to.equal(2);

            const state = await storageContract.getStates(player1.address);
            expect(state).to.deep.equal(generateOutputBytes(finalStates));
        });

        it("Test challenge settled transaction fail", async function () {
            const { gameSystem, stakingContract } = await loadFixture(
                deployGameContract
            );

            const { player1 } = await loadPlayerFixture();

            const initialState = [
                BigInt(0),
                BigInt(0),
                BigInt(0),
                BigInt(0),
                BigInt(0),
            ];

            // transaction inputs are not submitted on-chain by player
            const mockTransactionOutputs = [
                BigInt(5),
                BigInt(14),
                BigInt(6),
                BigInt(147),
                BigInt(1),
            ];

            const playerInput = [BigInt(1), BigInt(1), BigInt(1)];

            const { newSubmissionIndex, submissionNonce } =
                await submitMockTransaction(
                    gameSystem,
                    stakingContract,
                    initialState,
                    playerInput,
                    mockTransactionOutputs,
                    player1
                );

            const onchain_meta_transaction_hash: [
                bigint,
                bigint,
                bigint,
                bigint
            ] = computeSegmentMetaHash({
                gameID: GAMED_ID,
                onChainGameStateHash: computeHashUint64Array(initialState),
                gameInputHash: computeHashUint64Array(playerInput),
            });

            const end_game_state_hash = computeHashUint64Array(
                mockTransactionOutputs
            );

            const { PROOF, VERIFYING_INSTANCE, AUX, TARGET_INSTANCE } =
                await loadMockProof(true, [
                    ...onchain_meta_transaction_hash,
                    ...end_game_state_hash,
                ]);

            // simulate 10 minutes passed for challenge window to pass

            await mine(100);

            // expect challenge to fail if submission is already settled

            await expect(
                gameSystem.challenge_operator(
                    GAMED_ID,
                    newSubmissionIndex,
                    0,
                    PROOF,
                    VERIFYING_INSTANCE,
                    AUX,
                    TARGET_INSTANCE
                )
            ).to.be.revertedWith("Challenging window has passed");
        });

        it("Test valid proof, but challenge fail because player is not malicious", async function () {
            const { gameSystem, stakingContract } = await loadFixture(
                deployGameContract
            );

            const { player1 } = await loadPlayerFixture();

            const initialState = [
                BigInt(0),
                BigInt(0),
                BigInt(0),
                BigInt(0),
                BigInt(0),
            ];

            // transaction inputs are not submitted on-chain by player
            const finalState = [
                BigInt(5),
                BigInt(14),
                BigInt(6),
                BigInt(147),
                BigInt(1),
            ];

            const playerInput = [BigInt(1), BigInt(1), BigInt(1)];

            const { newSubmissionIndex, submissionNonce } =
                await submitMockTransaction(
                    gameSystem,
                    stakingContract,
                    initialState,
                    playerInput,
                    finalState,
                    player1
                );

            const onchain_meta_transaction_hash: [
                bigint,
                bigint,
                bigint,
                bigint
            ] = computeSegmentMetaHash({
                gameID: GAMED_ID,
                onChainGameStateHash: computeHashUint64Array(initialState),
                gameInputHash: computeHashUint64Array(playerInput),
            });

            const end_game_state_hash = computeHashUint64Array(finalState);

            const { PROOF, VERIFYING_INSTANCE, AUX, TARGET_INSTANCE } =
                await loadMockProof(true, [
                    ...onchain_meta_transaction_hash,
                    ...end_game_state_hash,
                ]);

            // console.log("target instance", TARGET_INSTANCE);
            // expect challenge to fail if player is not malicious

            await expect(
                gameSystem.challenge_operator(
                    GAMED_ID,
                    newSubmissionIndex,
                    0,
                    PROOF,
                    VERIFYING_INSTANCE,
                    AUX,
                    TARGET_INSTANCE
                )
            ).to.be.revertedWith(
                "Output from proof does match submission, no challenge"
            );

            const invalid_nonce_onchain_meta_transaction_hash: [
                bigint,
                bigint,
                bigint,
                bigint
            ] = computeSegmentMetaHash({
                gameID: GAMED_ID + BigInt(1), // changed start state
                onChainGameStateHash: computeHashUint64Array(initialState),
                gameInputHash: computeHashUint64Array(playerInput),
            });

            const different_end_game_state_hash = computeHashUint64Array([
                BigInt(5),
                BigInt(14),
                BigInt(6),
                BigInt(147),
                BigInt(1) + BigInt(1),
            ]);

            await expect(
                gameSystem.challenge_operator(
                    GAMED_ID,
                    newSubmissionIndex,
                    0,
                    PROOF,
                    VERIFYING_INSTANCE,
                    AUX,
                    [
                        [
                            ...invalid_nonce_onchain_meta_transaction_hash,
                            ...different_end_game_state_hash,
                        ],
                    ]
                )
            ).to.be.revertedWith(
                "Start state does not match submission, no challenge"
            );

            // expect challenge to fail for invalid game state
        });

        it("Test invalid proof, challenge fail", async function () {
            const { gameSystem, stakingContract } = await loadFixture(
                deployGameContract
            );

            const { player1 } = await loadPlayerFixture();

            const initialState = [
                BigInt(0),
                BigInt(0),
                BigInt(0),
                BigInt(0),
                BigInt(0),
            ];

            // transaction inputs are not submitted on-chain by player
            const mockTransactionOutputs = [
                BigInt(5),
                BigInt(14),
                BigInt(6),
                BigInt(147),
                BigInt(1),
            ];

            const playerInput = [BigInt(1), BigInt(1), BigInt(1)];

            const { newSubmissionIndex, submissionNonce } =
                await submitMockTransaction(
                    gameSystem,
                    stakingContract,
                    initialState,
                    playerInput,
                    mockTransactionOutputs,
                    player1
                );

            const { PROOF, VERIFYING_INSTANCE, AUX, TARGET_INSTANCE } =
                await loadZKWasmProof("i0000_invalid.json");

            // expect challenge to fail if proof is invalid

            await expect(
                gameSystem.challenge_operator(
                    GAMED_ID,
                    newSubmissionIndex,
                    0,
                    PROOF,
                    VERIFYING_INSTANCE,
                    AUX,
                    TARGET_INSTANCE
                )
            ).to.be.revertedWith("div fail");
        });

        it("Test valid proof, challenge success", async function () {
            const { gameSystem, stakingContract } = await loadFixture(
                deployGameContract
            );

            const {
                player1: newPlayerWithNonce0,
                player2: challenger,
                player3,
            } = await loadPlayerFixture();

            const initialState = [
                BigInt(0),
                BigInt(0),
                BigInt(0),
                BigInt(0),
                BigInt(0),
            ];

            // transaction inputs are not submitted on-chain by player
            const finalState = [
                BigInt(5),
                BigInt(14),
                BigInt(6),
                BigInt(147),
                BigInt(1),
            ];

            const playerInput = [BigInt(1), BigInt(1), BigInt(1)];

            const { newSubmissionIndex, submissionNonce } =
                await submitMockTransaction(
                    gameSystem,
                    stakingContract,
                    initialState,
                    playerInput,
                    finalState,
                    newPlayerWithNonce0
                );

            const { PROOF, VERIFYING_INSTANCE, AUX, TARGET_INSTANCE } =
                await loadZKWasmProof("i0000.json");

            // expect challenge to pass if proof is valid

            await expect(
                gameSystem
                    .connect(challenger)
                    .challenge_operator(
                        GAMED_ID,
                        newSubmissionIndex,
                        0,
                        PROOF,
                        VERIFYING_INSTANCE,
                        AUX,
                        TARGET_INSTANCE
                    )
            )
                .to.emit(gameSystem, "ChallengeEvent")
                .withArgs(newSubmissionIndex, challenger.address);

            // check the storage contract for state changes
            const submission = await gameSystem.getSubmission(
                newSubmissionIndex
            );
            // submission[7] is enum SubmissionStatus, 1 is Challenged
            expect(submission[4]).to.equal(1);
        });

        it("Test multiple submission, multiple challenges, multiple settle", async function () {
            const { gameSystem, stakingContract } = await loadFixture(
                deployGameContract
            );

            const { player1, player2, player3 } = await loadPlayerFixture();

            const initialState1 = [
                BigInt(0),
                BigInt(0),
                BigInt(0),
                BigInt(0),
                BigInt(0),
            ];

            const playerInput1 = [BigInt(1), BigInt(1), BigInt(1)];
            // transaction inputs are not submitted on-chain by player
            const finalState1 = [
                BigInt(5),
                BigInt(14),
                BigInt(6),
                BigInt(147),
                BigInt(1),
            ];

            const playerInput2 = [BigInt(1), BigInt(1), BigInt(1)];

            const finalState2 = [
                BigInt(5),
                BigInt(14),
                BigInt(6),
                BigInt(147),
                BigInt(1),
            ];

            const playerInput3 = [BigInt(1), BigInt(1), BigInt(1)];

            const finalState3 = [
                BigInt(5),
                BigInt(14),
                BigInt(6),
                BigInt(147),
                BigInt(1),
            ];

            const { newSubmissionIndex: newSubmissionIndex1 } =
                await submitMockTransaction(
                    gameSystem,
                    stakingContract,
                    initialState1,
                    playerInput1,
                    finalState1,
                    player1
                );

            const { newSubmissionIndex: newSubmissionIndex2 } =
                await submitMockTransaction(
                    gameSystem,
                    stakingContract,
                    initialState1,
                    playerInput2,
                    finalState2,
                    player2
                );

            const { newSubmissionIndex: newSubmissionIndex3 } =
                await submitMockTransaction(
                    gameSystem,
                    stakingContract,
                    finalState2,
                    playerInput3,
                    finalState3,
                    player2
                );
            // simulate 100 blocks passed for challenge window to pass

            await mine(100);

            // the states are mocked and invalid, but since no challenger, they all settle

            // expect settle the submission
            await expect(
                gameSystem.settle(
                    GAMED_ID,
                    newSubmissionIndex1,
                    generateOutputBytes(finalState1)
                ),
                "SettleEvent1"
            )
                .to.emit(gameSystem, "SettleEvent")
                .withArgs(newSubmissionIndex1);

            // expect settle the submission

            await expect(
                gameSystem.settle(
                    GAMED_ID,
                    newSubmissionIndex2,
                    generateOutputBytes(finalState2)
                ),
                "SettleEvent2"
            )
                .to.emit(gameSystem, "SettleEvent")
                .withArgs(newSubmissionIndex2);

            // expect settle the submission

            await expect(
                gameSystem.settle(
                    GAMED_ID,
                    newSubmissionIndex3,
                    generateOutputBytes(finalState3)
                ),
                "SettleEvent3"
            )
                .to.emit(gameSystem, "SettleEvent")
                .withArgs(newSubmissionIndex3);
        });

        it("Test address parsing", async function () {
            // Example Usage:
            const address = "0x1234567890abcdef1234567890abcdef12345678"; // EVM address as a hex string
            const [part1, part2, part3] = splitAddress(address);
            // Check
            const { gameSystem } = await loadFixture(deployGameContract);

            const parsedAddress = await gameSystem.parseAddress([
                part1,
                part2,
                part3,
            ]);

            expect(parsedAddress.toLowerCase()).to.equal(address);
        });
    });
});

describe("StakingContract", function () {
    async function deployStakingContract() {
        // Contracts are deployed using the first signer/account by default
        const [mockGameContract] = await hre.ethers.getSigners();

        const StakingContract = await hre.ethers.getContractFactory(
            "StakingContract"
        );

        const stakingContract = await StakingContract.connect(
            mockGameContract
        ).deploy(mockGameContract.address);

        return { stakingContract, mockGameContract };
    }

    async function loadWalletsFixture() {
        const [
            owner,
            operator1,
            operator2,
            player1,
            player2,
            player3,
            challenger1,
            challenger2,
        ] = await hre.ethers.getSigners();

        return {
            owner,
            operator1,
            operator2,
            player1,
            player2,
            player3,
            challenger1,
            challenger2,
        };
    }

    describe("Deployment", function () {
        it("Constructor contracts are set correctly", async function () {
            const { stakingContract, mockGameContract } = await loadFixture(
                deployStakingContract
            );

            expect(await stakingContract.gameContract()).to.equal(
                mockGameContract.address
            );
        });

        it("Test stake", async function () {
            const { stakingContract, mockGameContract } = await loadFixture(
                deployStakingContract
            );

            const { operator1 } = await loadWalletsFixture();

            const availStakedAmount =
                await stakingContract.operator_available_stake(
                    operator1.address
                );

            expect(availStakedAmount).to.equal(BigInt(0));

            const BOND_AMOUNT =
                await stakingContract.OPERATOR_ETH_STAKED_PER_SUBMISSION();

            await stakingContract
                .connect(operator1)
                .operator_stake({ value: BOND_AMOUNT });

            const stakedAmount = await stakingContract.operatorStake(
                operator1.address
            );

            expect(stakedAmount).to.equal(BOND_AMOUNT);
        });

        it("Test stake, withdraw", async function () {
            const { stakingContract, mockGameContract } = await loadFixture(
                deployStakingContract
            );

            const { operator1 } = await loadWalletsFixture();

            const availStakedAmount =
                await stakingContract.operator_available_stake(
                    operator1.address
                );

            expect(availStakedAmount).to.equal(BigInt(0));

            const BOND_AMOUNT =
                await stakingContract.OPERATOR_ETH_STAKED_PER_SUBMISSION();

            await stakingContract
                .connect(operator1)
                .operator_stake({ value: BOND_AMOUNT });

            const stakedAmount = await stakingContract.operatorStake(
                operator1.address
            );

            expect(stakedAmount).to.equal(BOND_AMOUNT);

            await stakingContract
                .connect(operator1)
                .operator_withdraw(BOND_AMOUNT);

            const stakedAmountAfterWithdraw =
                await stakingContract.operatorStake(operator1.address);

            expect(stakedAmountAfterWithdraw).to.equal(BigInt(0));
        });

        it("Test stake, withdraw, stake", async function () {
            const { stakingContract, mockGameContract } = await loadFixture(
                deployStakingContract
            );

            const { operator1 } = await loadWalletsFixture();

            const availStakedAmount =
                await stakingContract.operator_available_stake(
                    operator1.address
                );

            expect(availStakedAmount).to.equal(BigInt(0));

            const BOND_AMOUNT =
                await stakingContract.OPERATOR_ETH_STAKED_PER_SUBMISSION();

            await stakingContract
                .connect(operator1)
                .operator_stake({ value: BOND_AMOUNT });

            const stakedAmount = await stakingContract.operatorStake(
                operator1.address
            );

            expect(stakedAmount).to.equal(BOND_AMOUNT);

            await stakingContract
                .connect(operator1)
                .operator_withdraw(BOND_AMOUNT);

            const stakedAmountAfterWithdraw =
                await stakingContract.operatorStake(operator1.address);

            expect(stakedAmountAfterWithdraw).to.equal(BigInt(0));

            await stakingContract
                .connect(operator1)
                .operator_stake({ value: BOND_AMOUNT });

            const stakedAmountAfterStake = await stakingContract.operatorStake(
                operator1.address
            );

            expect(stakedAmountAfterStake).to.equal(BOND_AMOUNT);
        });

        it("Test stake, submission", async function () {
            const { stakingContract, mockGameContract } = await loadFixture(
                deployStakingContract
            );

            const { operator1 } = await loadWalletsFixture();

            const availStakedAmount =
                await stakingContract.operator_available_stake(
                    operator1.address
                );

            expect(availStakedAmount).to.equal(BigInt(0));

            const BOND_AMOUNT =
                await stakingContract.OPERATOR_ETH_STAKED_PER_SUBMISSION();

            await stakingContract
                .connect(operator1)
                .operator_stake({ value: BOND_AMOUNT });

            const stakedAmount = await stakingContract.operatorStake(
                operator1.address
            );

            expect(stakedAmount).to.equal(BOND_AMOUNT);

            await stakingContract
                .connect(mockGameContract)
                .operator_submit_submission(1, operator1.address);

            const alreadySubmissionCount =
                await stakingContract.operatorSubmittingSubmissionCount(
                    operator1.address
                );

            expect(alreadySubmissionCount).to.equal(BigInt(1));

            const availStakedAmountAfterSubmission =
                await stakingContract.operator_available_stake(
                    operator1.address
                );

            expect(availStakedAmountAfterSubmission).to.equal(
                BigInt(0),
                "Operator stake should be locked after submission"
            );
        });

        it("Test stake, submission, settle", async function () {
            const { stakingContract, mockGameContract } = await loadFixture(
                deployStakingContract
            );

            const { operator1 } = await loadWalletsFixture();

            const availStakedAmount =
                await stakingContract.operator_available_stake(
                    operator1.address
                );

            expect(availStakedAmount).to.equal(BigInt(0));

            const BOND_AMOUNT =
                await stakingContract.OPERATOR_ETH_STAKED_PER_SUBMISSION();

            await stakingContract
                .connect(operator1)
                .operator_stake({ value: BOND_AMOUNT });

            const stakedAmount = await stakingContract.operatorStake(
                operator1.address
            );

            expect(stakedAmount).to.equal(BOND_AMOUNT);

            await stakingContract
                .connect(mockGameContract)
                .operator_submit_submission(1, operator1.address);

            const alreadySubmissionCount =
                await stakingContract.operatorSubmittingSubmissionCount(
                    operator1.address
                );

            expect(alreadySubmissionCount).to.equal(BigInt(1));

            const availStakedAmountAfterSubmission =
                await stakingContract.operator_available_stake(
                    operator1.address
                );

            expect(availStakedAmountAfterSubmission).to.equal(
                BigInt(0),
                "Operator stake should be locked after submission"
            );

            await stakingContract
                .connect(mockGameContract)
                .operator_settle_submission(1, operator1.address);

            const availStakedAmountAfterSettle =
                await stakingContract.operator_available_stake(
                    operator1.address
                );

            expect(availStakedAmountAfterSettle).to.equal(
                BOND_AMOUNT,
                "Operator stake should be unlocked after settle"
            );

            const alreadySubmissionCountAfterSettle =
                await stakingContract.operatorSubmittingSubmissionCount(
                    operator1.address
                );

            expect(alreadySubmissionCountAfterSettle).to.equal(
                BigInt(0),
                "Operator submission count should be reset after settle"
            );
        });

        it("Test stake, submission, slash", async function () {
            const { stakingContract, mockGameContract } = await loadFixture(
                deployStakingContract
            );

            const { operator1, operator2, challenger1 } =
                await loadWalletsFixture();

            const availStakedAmountOperator1 =
                await stakingContract.operator_available_stake(
                    operator1.address
                );

            expect(availStakedAmountOperator1).to.equal(BigInt(0));

            const availStakedAmountOperator2 =
                await stakingContract.operator_available_stake(
                    operator2.address
                );

            expect(availStakedAmountOperator2).to.equal(BigInt(0));

            const BOND_AMOUNT =
                await stakingContract.OPERATOR_ETH_STAKED_PER_SUBMISSION();

            await stakingContract
                .connect(operator1)
                .operator_stake({ value: BOND_AMOUNT });

            await stakingContract
                .connect(operator2)
                .operator_stake({ value: BOND_AMOUNT });

            const stakedAmountOperator1 = await stakingContract.operatorStake(
                operator1.address
            );

            expect(stakedAmountOperator1).to.equal(BOND_AMOUNT);

            const stakedAmountOperator2 = await stakingContract.operatorStake(
                operator2.address
            );

            expect(stakedAmountOperator2).to.equal(BOND_AMOUNT);

            await stakingContract
                .connect(mockGameContract)
                .operator_submit_submission(1, operator1.address);

            await stakingContract
                .connect(mockGameContract)
                .operator_submit_submission(1, operator2.address);

            const alreadySubmissionCountOperator1 =
                await stakingContract.operatorSubmittingSubmissionCount(
                    operator1.address
                );

            expect(alreadySubmissionCountOperator1).to.equal(BigInt(1));

            const alreadySubmissionCountOperator2 =
                await stakingContract.operatorSubmittingSubmissionCount(
                    operator2.address
                );

            expect(alreadySubmissionCountOperator2).to.equal(BigInt(1));

            const availStakedAmountAfterSubmissionOperator1 =
                await stakingContract.operator_available_stake(
                    operator1.address
                );

            expect(availStakedAmountAfterSubmissionOperator1).to.equal(
                BigInt(0),
                "Operator stake should be locked after submission"
            );

            const availStakedAmountAfterSubmissionOperator2 =
                await stakingContract.operator_available_stake(
                    operator2.address
                );

            expect(availStakedAmountAfterSubmissionOperator2).to.equal(
                BigInt(0),
                "Operator stake should be locked after submission"
            );

            await stakingContract
                .connect(mockGameContract)
                .operator_slash(1, challenger1.address, operator1.address);

            const availStakedAmountAfterSlashOperator1 =
                await stakingContract.operator_available_stake(
                    operator1.address
                );

            expect(availStakedAmountAfterSlashOperator1).to.equal(
                BigInt(0),
                "Operator stake should be slashed"
            );
        });

        it("Test challenger stake, withdraw", async function () {
            const { stakingContract, mockGameContract } = await loadFixture(
                deployStakingContract
            );

            const { challenger1 } = await loadWalletsFixture();

            const availStakedAmount = await stakingContract.challengerStake(
                challenger1.address
            );

            expect(availStakedAmount).to.equal(BigInt(0));

            const BOND_AMOUNT =
                (await stakingContract.CHALLENGER_ETH_STAKE_PER_BLOCK()) *
                (await stakingContract.CHALLENGER_ETH_BLOCK_WINDOW());

            await stakingContract
                .connect(challenger1)
                .challenger_stake({ value: BOND_AMOUNT });

            const stakedAmount = await stakingContract.challengerStake(
                challenger1.address
            );

            expect(stakedAmount).to.equal(BOND_AMOUNT);

            await stakingContract
                .connect(challenger1)
                .challenger_withdraw(BOND_AMOUNT);

            const stakedAmountAfterWithdraw =
                await stakingContract.challengerStake(challenger1.address);

            expect(stakedAmountAfterWithdraw).to.equal(BigInt(0));
        });

        it("Test challenger stake, commit, settle", async function () {
            const { stakingContract, mockGameContract } = await loadFixture(
                deployStakingContract
            );

            const { challenger1 } = await loadWalletsFixture();

            const availStakedAmount = await stakingContract.challengerStake(
                challenger1.address
            );

            expect(availStakedAmount).to.equal(BigInt(0));

            const BLOCK_WINDOW =
                await stakingContract.CHALLENGER_ETH_BLOCK_WINDOW();

            const BOND_AMOUNT =
                (await stakingContract.CHALLENGER_ETH_STAKE_PER_BLOCK()) *
                BLOCK_WINDOW;

            await stakingContract
                .connect(challenger1)
                .challenger_stake({ value: BOND_AMOUNT });

            const stakedAmount = await stakingContract.challengerStake(
                challenger1.address
            );

            expect(stakedAmount).to.equal(BOND_AMOUNT);

            const currentBlock = await hre.ethers.provider.getBlockNumber();

            const startBlock =
                currentBlock -
                (currentBlock % Number(BLOCK_WINDOW)) +
                Number(BLOCK_WINDOW);

            const endBlock = startBlock + Number(BLOCK_WINDOW);

            await stakingContract
                .connect(challenger1)
                .challenger_commit_block_window(startBlock, endBlock);

            const cahllengerCommittedBlockWindowCount =
                await stakingContract.challengerCommittedBlockWindowCount(
                    challenger1.address
                );

            expect(cahllengerCommittedBlockWindowCount).to.equal(
                BigInt(1),
                "Challenger committed block window count should be 1"
            );

            const availStakedAmountAfterCommit =
                await stakingContract.challenger_available_stake(
                    challenger1.address
                );

            expect(availStakedAmountAfterCommit).to.equal(
                BigInt(0),
                "Challenger stake should be locked after commit"
            );

            // fast forward to end block
            await mine(startBlock);

            // expect cannot settle before end block + settle window
            await expect(
                stakingContract
                    .connect(challenger1)
                    .challenger_settle_commit_block_window([startBlock], [0])
            ).to.be.revertedWith(
                "Invalid block window, need to be in the past"
            );

            await mine(
                BigInt(endBlock) +
                    (await stakingContract.CHALLENGER_SLASHING_CHALLENG_WINDOW())
            );

            await stakingContract
                .connect(challenger1)
                .challenger_settle_commit_block_window([startBlock], [0]);

            const availStakedAmountAfterSettle =
                await stakingContract.challengerStake(challenger1.address);

            expect(availStakedAmountAfterSettle).to.equal(
                BOND_AMOUNT,
                "Challenger stake should be unlocked after settle"
            );
        });
    });
});
