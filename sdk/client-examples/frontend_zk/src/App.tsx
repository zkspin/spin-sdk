import { useEffect, useState } from "react";
import "./App.css";
import { waitForTransactionReceipt, writeContract } from "@wagmi/core";
import { config } from "./web3";
import { readContract, getAccount } from "wagmi/actions";
import {
    SpinGame,
    SpinZKProver,
    SpinZKProverInput,
    SpinZKProverSubmissionData,
    ZKProver,
    decodeBytesToU64Array,
    GameStateStorageABI,
    SpinZKGameContractABI,
} from "@zkspin/lib";
import { Gameplay } from "./gameplay/gameplay";

const GAME_CONTRACT_ADDRESS = import.meta.env.VITE_ZK_GAME_CONTRACT_ADDRESS;
const ZK_USER_ADDRESS = import.meta.env.VITE_ZK_CLOUD_USER_ADDRESS;
const ZK_USER_PRIVATE_KEY = import.meta.env.VITE_ZK_CLOUD_USER_PRIVATE_KEY;
const ZK_IMAGE_MD5 = import.meta.env.VITE_ZK_CLOUD_IMAGE_MD5;
const ZK_CLOUD_RPC_URL = import.meta.env.VITE_ZK_CLOUD_URL;

interface GameState {
    total_steps: bigint;
    current_position: bigint;
}

/* This function is used to verify the proof on-chain */
async function verify_onchain(submission: SpinZKProverSubmissionData) {
    const result = await writeContract(config, {
        abi: SpinZKGameContractABI.abi,
        address: GAME_CONTRACT_ADDRESS,
        functionName: "submitGame",
        args: [
            submission.game_id,
            submission.finalState,
            submission.playerInputsHash,
            submission.proof,
            submission.verify_instance,
            submission.aux,
            [submission.instances],
        ],
    });
    const transactionReceipt = waitForTransactionReceipt(config, {
        hash: result,
    });
    return transactionReceipt;
}

/* This function is used to get the on-chain game states */
async function getOnchainGameStates(): Promise<bigint[]> {
    // return [BigInt(0), BigInt(0)];
    const storageContractAddress = (await readContract(config, {
        abi: SpinZKGameContractABI.abi,
        address: GAME_CONTRACT_ADDRESS,
        functionName: "getStorageContract",
        args: [],
    })) as `0x${string}`;

    const userAccount = getAccount(config);

    const result = (await readContract(config, {
        abi: GameStateStorageABI.abi,
        address: storageContractAddress,
        functionName: "getStates",
        args: [userAccount.address],
    })) as string;

    console.log("onchain result = ", result);
    // result is in bytes, abi decode it, state is 2 u64 bigint
    const decoded = decodeBytesToU64Array(result, 2);

    console.log("onchain state = ", decoded);

    return decoded;
}

let spin: SpinGame<SpinZKProverInput, SpinZKProverSubmissionData>;

function App() {
    useEffect(() => {
        let total_steps = BigInt(0);
        let current_position = BigInt(0);

        getOnchainGameStates()
            .then(async (result): Promise<any> => {
                total_steps = result[0];
                current_position = result[1];
            })
            .catch((e) => {
                alert("Unable to connect to the chain, using default values.");
            })
            .finally(async () => {
                console.log("total_steps = ", total_steps);
                console.log("current_position = ", current_position);

                setOnChainGameStates({
                    total_steps,
                    current_position,
                });

                const zkprover = new ZKProver({
                    USER_ADDRESS: ZK_USER_ADDRESS,
                    USER_PRIVATE_KEY: ZK_USER_PRIVATE_KEY,
                    IMAGE_HASH: ZK_IMAGE_MD5,
                    CLOUD_RPC_URL: ZK_CLOUD_RPC_URL,
                });

                const spinZKProver = new SpinZKProver(zkprover);

                spin = new SpinGame({
                    gameplay: new Gameplay(),
                    gameplayProver: spinZKProver,
                });

                await spin.newGame({
                    initialStates: [total_steps, current_position],
                });
                updateDisplay();
            });
    }, []);

    const [gameState, setGameState] = useState<GameState>({
        total_steps: BigInt(0),
        current_position: BigInt(0),
    });

    const [onChainGameStates, setOnChainGameStates] = useState<GameState>({
        total_steps: BigInt(0),
        current_position: BigInt(0),
    });

    const [moves, setMoves] = useState<bigint[]>([]);

    const onClick = (command: bigint) => () => {
        spin.step(command);
        updateDisplay();
    };

    const updateDisplay = () => {
        const newGameState = spin.getCurrentGameState();
        setGameState({
            total_steps: newGameState[0],
            current_position: newGameState[1],
        });
        setMoves(spin.playerInputs);
    };

    // Submit the proof to the cloud
    const submitProof = async () => {
        if (!spin) {
            console.error("spin not initialized");
            return;
        }

        console.log("generating proof");

        const submission = await spin.generateSubmission({
            initialState: [
                onChainGameStates.total_steps,
                onChainGameStates.current_position,
            ],
            playerActions: moves,
            metaData: {
                game_id: BigInt(123),
            },
        });

        console.log("submission = ", submission);

        const verificationResult = await verify_onchain(submission);

        console.log("verificationResult = ", verificationResult);

        // wait for the transaction to be broadcasted, better way is to use event listener
        await new Promise((r) => setTimeout(r, 1000));

        const gameStates = await getOnchainGameStates();

        setOnChainGameStates({
            total_steps: gameStates[0],
            current_position: gameStates[1],
        });

        await spin.resetGame();
    };

    return (
        <div className="App">
            <header className="App-header">
                <w3m-button />
                <header>GamePlay</header>
                <header>Number of Moves: {moves.length}</header>
                <header>
                    How to Play: this game let the player increase or decrease
                    the position. The position ranges from 0-10. It keeps track
                    of the total steps so far and current position. When
                    submitted on-chain, the progresses are updated and recorded
                    on-chain{" "}
                </header>
                <header>
                    Game State:{" "}
                    {JSON.stringify(gameState, (_, v) =>
                        typeof v === "bigint" ? v.toString() : v
                    )}
                </header>
                <header>
                    OnChain Game State:{" "}
                    {JSON.stringify(onChainGameStates, (_, v) =>
                        typeof v === "bigint" ? v.toString() : v
                    )}
                </header>
                <button onClick={onClick(BigInt(0))}>Decrement</button>
                <button onClick={onClick(BigInt(1))}>Increment</button>
            </header>
            <button onClick={submitProof}>Submit</button>
        </div>
    );
}

export default App;
