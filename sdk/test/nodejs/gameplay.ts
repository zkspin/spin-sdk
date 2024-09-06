// // /* THIS FILE WILL BE AUTO-GENERATED IN THE FUTURE*/

import { GameplayAbstract } from "../../lib/interface";

import {
    initialize_game,
    step as _step,
    get_game_state,
} from "../../gameplay/export/js/commonjs/gameplay";

export interface GamePlayContructor {
    callback: () => void;
}

export class Gameplay extends GameplayAbstract {
    constructor() {
        super();
    }

    async newGame(args: bigint[]): Promise<void> {
        initialize_game(new BigUint64Array(args));
    }

    step(command: bigint) {
        _step(command);
    }

    getGameState(): BigUint64Array {
        return get_game_state();
    }

    resetGame(): Promise<void> {
        throw new Error("Method not implemented.");
    }
}
