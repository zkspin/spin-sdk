// /* THIS FILE WILL BE AUTO-GENERATED IN THE FUTURE*/
import init, { initialize_game, step, get_game_state } from "game_logic";
// import init from "game_logic/gameplay.js";
// // ================================================================================================

export interface GamePlayContructor {
    callback: () => void;
}

export class GamePlay {
    constructor({ callback }: GamePlayContructor) {
        init().then().finally(callback);
    }

    // BELOW FUNCTIONS CAN BE AUTO-GENERATED

    init_game(...args: bigint[]) {
        initialize_game.apply(null, args as any);
    }

    step(command: bigint) {
        step(command);
    }

    getGameState() {
        return JSON.parse(get_game_state());
    }
}
