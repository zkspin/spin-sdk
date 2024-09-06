import { GameplaySimulator } from "../../lib/gameplay_simulator";
import { Gameplay } from "./gameplay";
import { converToBigInts } from "../../lib/util";

async function main() {
    const INITIAL_STATE = [1, 0];
    const PLAYER_ACTION = [1, 1, 1];

    const game_simulator = new GameplaySimulator();

    const gameplay = new Gameplay();

    console.log(`Simulating game...`);
    const simulationResult = await game_simulator.simulateGame(
        gameplay,
        converToBigInts(INITIAL_STATE),
        converToBigInts(PLAYER_ACTION)
    );

    console.log(simulationResult);

    return simulationResult;
}

main();
