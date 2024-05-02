/* THIS FILE WILL BE AUTO-GENERATED IN THE FUTURE*/
import init, { init_game, step, get_game_state } from "game_logic";

// ================================================================================================
// DEFINE YOUR INTERFACES HERE
export interface GameInitParameters {
    total_steps: number;
    current_position: number;
}

export interface GameState {
    total_steps: number;
    current_position: number;
}
// ================================================================================================

export interface GamePlayContructor {
    callback: () => void;
    init_parameters: GameInitParameters;
}

// Helper function to convert any config object to an array
function interfaceToArray<T>(config: T): bigint[] {
    // Return an array of object values with type preservation
    return Object.values(config).map((v) => BigInt(v)) as bigint[];
}

export class GamePlay {
    constructor({ callback, init_parameters }: GamePlayContructor) {
        init()
            .then(() => {
                init_game.apply(null, interfaceToArray(init_parameters));
            })
            .finally(callback);
    }

    step(command: number) {
        console.log("command = ", command);
        step(BigInt(command));
    }

    getGameState(): GameState {
        return JSON.parse(get_game_state());
    }
}
