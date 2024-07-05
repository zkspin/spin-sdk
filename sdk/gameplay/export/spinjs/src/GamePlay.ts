// // /* THIS FILE WILL BE AUTO-GENERATED IN THE FUTURE*/
// let init: any;
let isESM: boolean = true;
// let initialize_game: ;
// let step: any;
// let get_game_state: any;
// let get_game_score: any;
// let SpinGameInitArgs: any;
// let SpinGameIntermediateStates: any;

import {
    default as init,
    initialize_game,
    step,
    get_game_state,
    SpinGameInitArgs,
    SpinGameIntermediateStates,
} from "game_logic_esm/gameplay";

// if (typeof require !== "undefined") {
//     // CommonJS environment
//     isESM = false;
//     let {
//         initialize_game: _initialize_game,
//         step: _step,
//         get_game_state: _get_game_state,
//         SpinGameInitArgs: _SpinGameInitArgs,
//         get_game_score: _get_game_score,
//         SpinGameIntermediateStates: _SpinGameIntermediateStates,
//     } = require("game_logic_common/gameplay.js");

//     initialize_game = _initialize_game;
//     step = _step;
//     get_game_state = _get_game_state;
//     get_game_score = _get_game_score;
//     SpinGameInitArgs = _SpinGameInitArgs;
//     SpinGameIntermediateStates = _SpinGameIntermediateStates;
// } else {
//     // ESM environment
//     isESM = true;

//     init = _init;
//     initialize_game = _initialize_game;
//     step = _step;
//     get_game_state = _get_game_state;
//     SpinGameInitArgs = _SpinGameInitArgs;
//     SpinGameIntermediateStates = _SpinGameIntermediateStates;
// }

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

    init_game(arg: SpinGameInitArgs) {
        initialize_game(arg);
    }

    step(command: bigint) {
        step(command);
    }

    getGameState(): SpinGameIntermediateStates {
        return get_game_state();
    }
}

export { SpinGameInitArgs, SpinGameIntermediateStates };
