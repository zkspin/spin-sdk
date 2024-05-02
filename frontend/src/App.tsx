import React, { useEffect, useState } from "react";
import "./App.css";

import { add_proving_taks, load_proving_taks_util_result } from "./spin/Proof";

import { GamePlay, GameState } from "./spin/GamePlay";
import { waitForTransactionReceipt, writeContract } from "@wagmi/core";
import { abi } from "./ABI.json";

import { config } from "./web3";
import { call } from "viem/actions";
const CONTRACT_ADDRESS = "0x3372bb6772E75c5F015A640155aaD8a12CadE987";

async function verify_onchain({ proof, verify_instance, aux, instances }) {
    // const result = await writeContract(config, {
    //     abi,
    //     address: CONTRACT_ADDRESS,
    //     functionName: "submitScore",
    //     args: [proof, verify_instance, aux, [instances]],
    // });
    // const transactionReceipt = waitForTransactionReceipt(config, {
    //     hash: result,
    // });
    // return transactionReceipt;
}

let gp: GamePlay;

function App() {
    useEffect(() => {
        gp = new GamePlay({
            callback: updateDisplay,
            init_parameters: { total_steps: 0, current_position: 0 },
        });
    }, []);

    const [gameState, setGameState] = useState<GameState>({
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
        console.log("newGameState = ", newGameState);
        setGameState(newGameState);
    };

    const submitProof = async () => {
        const tasksInfo = await add_proving_taks(
            [
                `${gp.getInitialGameParameter().total_steps}:i64`,
                `${gp.getInitialGameParameter().current_position}:i64`,
            ],
            [`${moves.length}:i64`, ...moves.map((m) => `${m}:i64`)]
        );

        console.log("tasksInfo = ", tasksInfo);

        const task_id = tasksInfo.id;

        load_proving_taks_util_result(task_id).then(async (result) => {
            console.log("proof result = ", result);

            // onchain verification operations
            const verificationResult = await verify_onchain(result);
            console.log("verificationResult = ", verificationResult);
        });

        console.log("submitProof");
        gp = new GamePlay({
            callback: updateDisplay,
            init_parameters: { total_steps: 0, current_position: 0 },
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
                    the position, while keep track of the total steps so far and
                    current position. When submitted on-chain, the progress on
                    updated and recorded on-chain{" "}
                </header>
                <header>Game State: {JSON.stringify(gameState)}</header>
                <button onClick={onClick(0)}>Decrement</button>
                <button onClick={onClick(1)}>Increment</button>
            </header>
            <button onClick={submitProof}>Submit</button>
        </div>
    );
}

export default App;
