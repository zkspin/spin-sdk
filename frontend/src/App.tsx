import React, { useEffect, useState } from "react";
import "./App.css";

import { add_proving_taks, load_proving_taks_util_result } from "./spin/Proof";

import { GamePlay, GameState } from "./spin/GamePlay";
import { waitForTransactionReceipt, writeContract } from "@wagmi/core";
import { abi } from "./ABI.json";

import { config } from "./web3";
import { call } from "viem/actions";
import { readContract } from "wagmi/actions";

const GAME_CONTRACT_ADDRESS = "0xe054298AA62aC6D0Ab982A8a610f6D3406874D9D";

async function verify_onchain({ proof, verify_instance, aux, instances }) {
    const result = await writeContract(config, {
        abi,
        address: GAME_CONTRACT_ADDRESS,
        functionName: "submitScore",
        args: [proof, verify_instance, aux, [instances]],
    });
    const transactionReceipt = waitForTransactionReceipt(config, {
        hash: result,
    });
    return transactionReceipt;
}

async function getGameStates() {
    const result = (await readContract(config, {
        abi,
        address: GAME_CONTRACT_ADDRESS,
        functionName: "getStates",
        args: [],
    })) as [BigInt, BigInt];
    return result.map((r) => Number(r));
}

let gp: GamePlay;

function App() {
    useEffect(() => {
        getGameStates().then((result) => {
            const total_steps = result[0];
            const current_position = result[1];

            console.log("total_steps = ", total_steps);
            console.log("current_position = ", current_position);
            setOnChainGameStates({
                total_steps,
                current_position,
            });

            gp = new GamePlay({
                callback: updateDisplay,
                init_parameters: {
                    total_steps: total_steps,
                    current_position: current_position,
                },
            });
        });
    }, []);

    const [gameState, setGameState] = useState<GameState>({
        total_steps: 0,
        current_position: 0,
    });

    const [onChainGameStates, setOnChainGameStates] = useState<GameState>({
        total_steps: 0,
        current_position: 0,
    });

    const [moves, setMoves] = useState<number[]>([]);

    const onClick = (command: number) => () => {
        gp.step(command);
        updateDisplay();
        setMoves([...moves, command]);
    };

    const updateDisplay = () => {
        const newGameState = gp.getGameState();
        setGameState(newGameState);
    };

    const submitProof = async () => {
        console.log("generating proof");
        const tasksInfo = await add_proving_taks(
            [
                `${gp.getInitialGameParameter().total_steps}:i64`,
                `${gp.getInitialGameParameter().current_position}:i64`,
            ],
            [`${moves.length}:i64`, ...moves.map((m) => `${m}:i64`)]
        );

        console.log("tasks =", tasksInfo);

        const task_id = tasksInfo.id;

        const proof = await load_proving_taks_util_result(task_id);

        console.log("proof = ", proof);

        // onchain verification operations
        console.log("submitting proof");
        const verificationResult = await verify_onchain(proof);

        console.log("verificationResult = ", verificationResult);

        // wait for the transaction to be broadcasted, better way is to use event listener
        await new Promise((r) => setTimeout(r, 1000));

        const gameStates = await getGameStates();

        setOnChainGameStates({
            total_steps: gameStates[0],
            current_position: gameStates[1],
        });

        gp = new GamePlay({
            callback: updateDisplay,
            init_parameters: {
                total_steps: gameStates[0],
                current_position: gameStates[1],
            },
        });
        setMoves([]); // reset moves
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
                <header>Game State: {JSON.stringify(gameState)}</header>
                <header>
                    OnChain Game State: {JSON.stringify(onChainGameStates)}
                </header>
                <button onClick={onClick(0)}>Decrement</button>
                <button onClick={onClick(1)}>Increment</button>
            </header>
            <button onClick={submitProof}>Submit</button>
        </div>
    );
}

export default App;
