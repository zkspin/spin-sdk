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
}

export class GamePlay {
    constructor({ callback }: GamePlayContructor) {
        init().then().finally(callback);
    }

    // BELOW FUNCTIONS CAN BE AUTO-GENERATED

    init_game({ total_steps, current_position }: GameInitParameters) {
        init_game(BigInt(total_steps), BigInt(current_position));
    }

    step(command: number) {
        console.log("command = ", command);
        step(BigInt(command));
    }

    getGameState(): GameState {
        return JSON.parse(get_game_state());
    }
}
