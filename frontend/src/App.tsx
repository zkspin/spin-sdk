import React, { useEffect, useState } from "react";
import logo from "./logo.svg";
import "./App.css";
import init, {
  init_game,
  step,
  get_fib_number_0,
  get_fib_number_1,
} from "game_logic";

function App() {
  useEffect(() => {
    init().then(() => {
      init_game();
    });
  }, []);

  const [fibNumber, setFibNumber] = useState(0);

  const onClick = (command: number) => {
    return async () => {
      init().then(() => {
        step(BigInt(command));

        const fibNumber = get_fib_number_1();
        setFibNumber(Number(fibNumber));

        console.log(
          "Fib number 0: ",
          get_fib_number_0(),
          "Fib number 1: ",
          get_fib_number_1()
        );
      });
    };
  };

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />

        <header>current Fibonacci number: {fibNumber}</header>

        <button onClick={onClick(0)}>Decrement</button>
        <button onClick={onClick(1)}>Increment</button>
      </header>
    </div>
  );
}

export default App;
