import React, { useEffect, useState } from "react";
import "./App.css";
import { waitForTransactionReceipt, writeContract } from "@wagmi/core";
import { abi } from "../../onchain/artifacts/contracts/GameContract.sol/GameContract.json";
import { config } from "./web3";
import { readContract } from "wagmi/actions";
import { TaskStatus } from "zkwasm-service-helper";
import { SpinGame } from "../../lib/spin_game";
import { SpinDummyProver } from "../../lib/spin_game_prover";
import { Gameplay } from "./gameplay";

const GAME_CONTRACT_ADDRESS = import.meta.env.VITE_GAME_CONTRACT_ADDRESS;
const ZK_USER_ADDRESS = import.meta.env.VITE_ZK_CLOUD_USER_ADDRESS;
const ZK_USER_PRIVATE_KEY = import.meta.env.VITE_ZK_CLOUD_USER_PRIVATE_KEY;
const ZK_IMAGE_MD5 = import.meta.env.VITE_ZK_CLOUD_IMAGE_MD5;
const ZK_CLOUD_RPC_URL = import.meta.env.VITE_ZK_CLOUD_URL;

interface GameState {
    total_steps: bigint;
    current_position: bigint;
}

/* This function is used to verify the proof on-chain */
async function verify_onchain({
    proof,
    verify_instance,
    aux,
    instances,
}: {
    proof: BigInt[];
    verify_instance: BigInt[];
    aux: BigInt[];
    instances: BigInt[];
    status: TaskStatus;
}) {
    const result = await writeContract(config, {
        abi,
        address: GAME_CONTRACT_ADDRESS,
        functionName: "settleProof",
        args: [proof, verify_instance, aux, [instances]],
    });
    const transactionReceipt = waitForTransactionReceipt(config, {
        hash: result,
    });
    return transactionReceipt;
}

/* This function is used to get the on-chain game states */
async function getOnchainGameStates() {
    return [BigInt(0), BigInt(0)];
    const result = (await readContract(config, {
        abi,
        address: GAME_CONTRACT_ADDRESS,
        functionName: "getStates",
        args: [],
    })) as [bigint, bigint];
    return result;
}

let spin: SpinGame;

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
                gameplayProver: new SpinDummyProver(),
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
    // const submitProof = async () => {
    //     const proof = await spin.generateProof();

    //     if (!proof) {
    //         console.error("Proof generation failed");
    //         return;
    //     }
    //     // onchain verification operations
    //     console.log("submitting proof");
    //     const verificationResult = await verify_onchain(proof);

    //     console.log("verificationResult = ", verificationResult);

    //     // wait for the transaction to be broadcasted, better way is to use event listener
    //     await new Promise((r) => setTimeout(r, 1000));

    //     const gameStates = await getOnchainGameStates();

    //     setOnChainGameStates({
    //         total_steps: gameStates[0],
    //         current_position: gameStates[1],
    //     });

    //     await spin.reset();
    //     // awonGameInitReady(gameStates[0], gameStates[1]);
    // };

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
            {/* <button onClick={submitProof}>Submit</button> */}
        </div>
    );
}

export default App;
