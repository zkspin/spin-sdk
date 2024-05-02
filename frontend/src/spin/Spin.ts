import { GamePlay, GameInitParameters } from "./GamePlay";
import {
    add_proving_taks,
    load_proving_taks_util_result,
    ProveCredentials,
} from "./Proof";
interface SpinConstructor {
    onReady: () => void;
    initParameters: GameInitParameters;
    cloudCredentials: ProveCredentials;
}

/* This Class is used to facilated core gameplay and zk proving*/
export class Spin {
    gamePlay: GamePlay;
    cloudCredentials: ProveCredentials;
    _onReady: () => void;
    inputs: number[] = []; // public inputs
    witness: number[] = []; // private inputs
    /* Get the current game state */

    getGameState() {
        return this.gamePlay.getGameState();
    }

    /* Constructor */
    constructor({
        initParameters,
        onReady,
        cloudCredentials,
    }: SpinConstructor) {
        this.gamePlay = new GamePlay({
            callback: onReady,
            init_parameters: initParameters,
        });
        this.cloudCredentials = cloudCredentials;
        this._onReady = onReady;

        // Add initial game parameters to the inputs
        this.inputs.push(initParameters.total_steps);
        this.inputs.push(initParameters.current_position);
    }

    /* Step the game
     * part of the private inputs
     */

    step(command: number) {
        this.gamePlay.step(command);
        this.witness.push(command);
    }

    async submitProof() {
        console.log("generating proof");
        const tasksInfo = await add_proving_taks(
            this.inputs.map((i) => `${i}:i64`),
            [
                `${this.witness.length}:i64`,
                ...this.witness.map((m) => `${m}:i64`),
            ],
            this.cloudCredentials
        );

        console.log("tasks =", tasksInfo);

        const task_id = tasksInfo.id;

        const proof = await load_proving_taks_util_result(
            task_id,
            this.cloudCredentials
        );

        console.log("proof = ", proof);

        return proof;
    }

    /* Reset the game
     * Keeping the same onReady callback and cloud credentials
     */

    reset(initParameters: GameInitParameters) {
        this.inputs = [];
        this.witness = [];

        this.gamePlay = new GamePlay({
            callback: this._onReady,
            init_parameters: initParameters,
        });
    }
}
