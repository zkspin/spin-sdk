import { useEffect, useState } from "react";
import "./App.css";
import { ethers } from "ethers";
import { abi } from "./abi/SpinZKGameContract.json";
import { abi as stateABI } from "./abi/GameStateStorage.json";
import { config } from "./web3";
import { readContract, getAccount, signMessage } from "wagmi/actions";
import { SpinGame } from "../../../lib/spin_game";
import {
    SpinOPZKProver,
    SpinOPZKProverInput,
    SpinOPZKProverOutput,
} from "../../../lib/spin_game_prover";
import { Gameplay } from "./gameplay/gameplay";
import { decodeBytesToU64Array } from "../../../lib/dataHasher";

const GAME_CONTRACT_ADDRESS = import.meta.env.VITE_OPZK_GAME_CONTRACT_ADDRESS;
const OPZK_OPERATOR_URL = import.meta.env.VITE_OPZK_OPERATOR_URL;

interface GameState {
    total_steps: bigint;
    current_position: bigint;
}

/* This function is used to verify the proof on-chain */
async function submit_to_operator(submission: SpinOPZKProverOutput) {
    console.log("submission = ", submission);
}

/* This function is used to get the on-chain game states */
async function getOnchainGameStates() {
    // return [BigInt(0), BigInt(0)];
    const storageContractAddress = (await readContract(config, {
        abi,
        address: GAME_CONTRACT_ADDRESS,
        functionName: "getStorageContract",
        args: [],
    })) as `0x${string}`;

    const userAccount = getAccount(config);

    const result = (await readContract(config, {
        abi: stateABI,
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

let spin: SpinGame<SpinOPZKProverInput, SpinOPZKProverOutput>;

function App() {
    useEffect(() => {
        getOnchainGameStates().then(async (result): Promise<any> => {
            const total_steps = result[0];
            const current_position = result[1];

            console.log("total_steps = ", total_steps);
            console.log("current_position = ", current_position);

            setOnChainGameStates({
                total_steps,
                current_position,
            });

            spin = new SpinGame({
                gameplay: new Gameplay(),
                gameplayProver: new SpinOPZKProver(
                    {
                        operator_url: OPZK_OPERATOR_URL,
                    },
                    getPlayerNonce,
                    getPlayerSignature
                ),
            });

            await spin.newGame({
                initialStates: [total_steps, current_position],
            });

            updateDisplay();
        });
    }, []);

    const getPlayerNonce = async () => {
        return BigInt(0);
    };

    const getPlayerSignature = async (submissionHash: string) => {
        // get player address

        const player_address = getAccount(config).address;

        if (!player_address) {
            console.error("player address not found");
            throw new Error("player address not found");
        }

        const player_signature = await signMessage(config, {
            message: {
                raw: ethers.getBytes(submissionHash),
            },
        });

        console.log("signature = ", player_signature);

        return { player_address, player_signature };
    };

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
            game_id: BigInt(123),
            segments: [
                {
                    initial_states: [
                        onChainGameStates.total_steps,
                        onChainGameStates.current_position,
                    ],
                    player_action_inputs: moves,
                    final_state: [
                        gameState.total_steps,
                        gameState.current_position,
                    ],
                },
            ],
        });

        console.log("submission = ", submission);

        const submissionResult = await submit_to_operator(submission);

        console.log("submissionResult = ", submissionResult);

        // wait for the transaction to be broadcasted, better way is to use event listener
        await new Promise((r) => setTimeout(r, 1000));

        const gameStates = await getOnchainGameStates();

        setOnChainGameStates({
            total_steps: gameStates[0],
            current_position: gameStates[1],
        });

        // await spin.resetGame();
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