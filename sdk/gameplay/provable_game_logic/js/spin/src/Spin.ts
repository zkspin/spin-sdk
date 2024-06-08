import { GamePlay } from "./GamePlay.js";
import {
    add_proving_taks,
    load_proving_taks_util_result,
    ProveCredentials,
} from "./Proof.js";
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

    private add_public_input(input: number) {
        this.inputs.push(input);
    }

    private add_private_input(input: number) {
        this.witness.push(input);
    }

    // ================================================================================================
    // BELOW FUNCTIONS CAN BE AUTO-GENERATED

    /* Step the game
     * part of the private inputs
     */

    step(command: number) {
        this.gamePlay.step(BigInt(command));
        this.add_private_input(command);
    }

    /* Get the current game state */

    getGameState() {
        return this.gamePlay.getGameState();
    }

    init_game(...args: number[]) {
        this.gamePlay.init_game.apply(
            null,
            args.map((a) => BigInt(a))
        );
        args.map((a) => this.add_public_input(a));
    }

    // ================================================================================================

    async generateProof() {
        const tasksInfo = await add_proving_taks(
            this.inputs.map((i) => `${i}:i64`),
            [
                `${this.witness.length}:i64`,
                ...this.witness.map((m) => `${m}:i64`),
            ],
            this.cloudCredentials
        );

        console.debug("tasksInfo = ", tasksInfo);

        const task_id = tasksInfo.id;

        const proof = await load_proving_taks_util_result(
            task_id,
            this.cloudCredentials
        );

        console.debug("proof = ", proof);

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
