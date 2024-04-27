import React, { useEffect, useState } from "react";
import "./App.css";
import init, {
  init_game,
  step,
  get_fib_number_0,
  get_fib_number_1,
} from "game_logic";
import { add_proving_taks, load_proving_taks_util_result } from "./proof";
import { useAccount } from "wagmi";
import { waitForTransactionReceipt, writeContract } from "@wagmi/core";
import { abi } from "./ABI.json";

import { config } from "./web3";
const CONTRACT_ADDRESS = "0x3372bb6772E75c5F015A640155aaD8a12CadE987";

async function verify_onchain({ proof, verify_instance, aux, instances }) {
  const result = await writeContract(config, {
    abi,
    address: CONTRACT_ADDRESS,
    functionName: "submitScore",
    args: [proof, verify_instance, aux, [instances]],
  });

  const transactionReceipt = waitForTransactionReceipt(config, {
    hash: result,
  });

  return transactionReceipt;
}

function App() {
  useEffect(() => {
    init().then(() => {
      init_game();
    });
  }, []);

  const [fibNumber, setFibNumber] = useState(0);

  const account = useAccount();

  const [moves, setMoves] = useState<number[]>([]);

  const onClick = (command: number) => {
    return async () => {
      init().then(() => {
        step(BigInt(command));

        const fibNumber = get_fib_number_1();
        setFibNumber(Number(fibNumber));

        setMoves([...moves, command]);

        console.log(
          "Fib number 0: ",
          get_fib_number_0(),
          "Fib number 1: ",
          get_fib_number_1()
        );
      });
    };
  };

  const submitProof = async () => {
    const tasksInfo = await add_proving_taks(
      [`${account.address}:bytes-packed`],
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
  };

  return (
    <div className="App">
      <header className="App-header">
        <w3m-button />
        <header>current Fibonacci number: {fibNumber}</header>
        <button onClick={onClick(0)}>Decrement</button>
        <button onClick={onClick(1)}>Increment</button>
      </header>
      <button onClick={submitProof}>Submit</button>
    </div>
  );
}

export default App;
