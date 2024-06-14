// /* THIS FILE WILL BE AUTO-GENERATED IN THE FUTURE*/
import init, {
    initialize_game,
    step,
    get_game_state,
    get_game_score,
} from "game_logic/gameplay.js";
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

    getGameState(): string {
        return get_game_state();
    }

    getGameScore(): number {
        return Number(get_game_score());
    }
}
