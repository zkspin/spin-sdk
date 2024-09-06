// // /* THIS FILE WILL BE AUTO-GENERATED IN THE FUTURE*/

import { GameplayAbstract } from "../../lib/interface";

import {
    initialize_game,
    step as _step,
    get_game_state,
    SpinGameStates,
} from "../../gameplay/export/js/commonjs";

export interface GamePlayContructor {
    callback: () => void;
}

export class Gameplay extends GameplayAbstract {
    constructor() {
        super();
    }

    async newGame(args: bigint[]): Promise<void> {
        // TODO
        initialize_game(new SpinGameStates(BigInt(args[0]), BigInt(args[1])));
    }

    step(command: bigint) {
        _step(command);
    }

    getGameState(): any {
        return get_game_state();
    }

    resetGame(): Promise<void> {
        throw new Error("Method not implemented.");
    }
}
