// // /* THIS FILE WILL BE AUTO-GENERATED IN THE FUTURE*/
// let init: any;
let init: any;
let isESM: boolean;
let initialize_game: any;
let step: any;
let get_game_state: any;
let SpinGameStates: any;

import {
    default as _init,
    initialize_game as _initialize_game,
    step as _step,
    get_game_state as _get_game_state,
    SpinGameStates as _SpinGameStates,
} from "game_logic_esm/gameplay";

if (typeof require !== "undefined") {
    // CommonJS environment
    isESM = false;
    console.log("CommonJS environments");
    let {
        initialize_game: _initialize_game,
        step: _step,
        get_game_state: _get_game_state,
        SpinGameStates: _SpinGameStates,
    } = require("game_logic_common/gameplay.js");
    initialize_game = _initialize_game;
    step = _step;
    get_game_state = _get_game_state;
    SpinGameStates = _SpinGameStates;
} else {
    // ESM environment
    isESM = true;

    init = _init;
    initialize_game = _initialize_game;
    step = _step;
    get_game_state = _get_game_state;
    SpinGameStates = _SpinGameStates;
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
        } else {
            delete require.cache[
                require.resolve("game_logic_common/gameplay.js")
            ];

            isESM = false;

            let {
                initialize_game: _initialize_game,
                step: _step,
                get_game_state: _get_game_state,
                SpinGameStates: _SpinGameStates,
                __wasm: _wasm,
            } = require("game_logic_common/gameplay.js");
            console.log("CommonJS environments", _wasm);
            initialize_game = _initialize_game;
            step = _step;
            get_game_state = _get_game_state;
            SpinGameStates = _SpinGameStates;
        }
    }

    getSpinGameStates() {
        return SpinGameStates;
    }

    // BELOW FUNCTIONS CAN BE AUTO-GENERATED

    init_game(arg: any) {
        initialize_game(arg);
    }

    step(command: bigint) {
        step(command);
    }

    getGameState(): any {
        return get_game_state();
    }
}
