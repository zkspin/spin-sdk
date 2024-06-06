import { GamePlay, GameInitParameters } from "./GamePlay";
import {
    add_proving_taks,
    load_proving_taks_util_result,
    ProveCredentials,
} from "./Proof";
interface SpinConstructor {
    onReady: () => void;
    cloudCredentials: ProveCredentials;
}

/* This Class is used to facilated core gameplay and zk proving*/
export class Spin {
    gamePlay: GamePlay;
    cloudCredentials: ProveCredentials;
    inputs: number[] = []; // public inputs
    witness: number[] = []; // private inputs

    /* Constructor */
    constructor({ onReady, cloudCredentials }: SpinConstructor) {
        this.gamePlay = new GamePlay({
            callback: onReady,
        });
        this.cloudCredentials = cloudCredentials;
    }

    add_public_input(input: number) {
        this.inputs.push(input);
    }

    add_private_input(input: number) {
        this.witness.push(input);
    }

    // ================================================================================================
    // BELOW FUNCTIONS CAN BE AUTO-GENERATED

    /* Step the game
     * part of the private inputs
     */

    step(command: number) {
        this.gamePlay.step(command);
    }

    /* Get the current game state */

    getGameState() {
        return this.gamePlay.getGameState();
    }

    init_game({ total_steps, current_position }: GameInitParameters) {
        this.gamePlay.init_game({ total_steps, current_position });
    }

    // ================================================================================================

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

    reset(onReady: () => void) {
        this.inputs = [];
        this.witness = [];

        this.gamePlay = new GamePlay({
            callback: onReady,
        });
    }
}
