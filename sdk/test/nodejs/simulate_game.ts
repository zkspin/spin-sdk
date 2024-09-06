import { GameplaySimulator } from "../../lib/gameplay_simulator";
import { Gameplay } from "./gameplay";
import { converToBigInts } from "../../lib/util";

async function main() {
    const game_simulator = new GameplaySimulator();

    const gameplay = new Gameplay();

    console.log(`Simulating game...`);
    const simulationResult = await game_simulator.simulateGame(
        gameplay,
        converToBigInts([0, 0]),
        converToBigInts([1, 1])
    );

    console.log(simulationResult);

    return simulationResult;
}

main();
