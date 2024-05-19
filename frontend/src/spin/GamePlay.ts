/* THIS FILE IS AUTO-GENERATED, YOU'LL LIKELY NOT NEED TO EDIT THIS*/
import init, {
    initialize_game,
    step,
    get_game_state,
    RustInitializationParameters,
    RustGameState,
} from "gameplay";

export interface GamePlayContructor {
    callback: () => void;
}

export class GamePlay {
    constructor({ callback }: GamePlayContructor) {
        init().then().finally(callback);
    }

    init_game(gameInitParams: GameState) {
        let _params: bigint[] = Object.values(gameInitParams).map((value) =>
            BigInt(value)
        );
        // @ts-ignore
        let _RustGameInitParams: InitializationParameters =
            new RustInitializationParameters(..._params);
        initialize_game(_RustGameInitParams);
    }

    step(command: number) {
        step(BigInt(command));
    }

    getGameState(): GameState {
        return JSON.parse(get_game_state());
    }
}

// Helper type to convert bigint to number
type BigIntToNumber<T> = {
    [P in keyof T]: T[P] extends bigint ? number : T[P];
};
export type GameState = BigIntToNumber<Omit<RustGameState, "free">>;
