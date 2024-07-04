// // /* THIS FILE WILL BE AUTO-GENERATED IN THE FUTURE*/
let init: any;
let isESM: boolean;
let initialize_game: any;
let step: any;
let get_game_state: any;
let get_game_score: any;

import {
    default as _init,
    initialize_game as _initialize_game,
    step as _step,
    get_game_state as _get_game_state,
    get_game_score as _get_game_score,
} from "game_logic_esm/gameplay";

if (typeof require !== "undefined") {
    // CommonJS environment
    isESM = false;
    let {
        initialize_game: _initialize_game,
        step: _step,
        get_game_state: _get_game_state,
        get_game_score: _get_game_score,
    } = require("game_logic_common/gameplay.js");
    initialize_game = _initialize_game;
    step = _step;
    get_game_state = _get_game_state;
    get_game_score = _get_game_score;
} else {
    // ESM environment
    isESM = true;

    init = _init;
    initialize_game = _initialize_game;
    step = _step;
    get_game_state = _get_game_state;
    get_game_score = _get_game_score;
}

export interface GamePlayContructor {
    callback: () => void;
}

export class GamePlay {
    constructor() {}

    async init() {
        if (isESM) {
            await init().catch((e: any) =>
                console.error("Error initializing game logic", e)
            );
        }
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
