import { GamePlay } from "./GamePlay.js";
import { ZKProver } from "./Proof.js";
import { ProveCredentials } from "../../../../lib/zkwasm";

interface SpinConstructor {
    cloudCredentials: ProveCredentials;
}

/* This Class is used to facilated core gameplay and zk proving*/
export class Spin {
    gamePlay: GamePlay;
    cloudCredentials: ProveCredentials;
    zkProver: ZKProver;
    inputs: bigint[] = []; // public inputs
    witness: bigint[] = []; // private inputs

    /* Constructor */
    constructor({ cloudCredentials }: SpinConstructor) {
        this.cloudCredentials = cloudCredentials;
        this.gamePlay = new GamePlay();
        this.zkProver = new ZKProver(cloudCredentials);
    }

    async newGame() {
        await this.gamePlay.init();
    }

    add_public_input(input: bigint) {
        this.inputs.push(input);
    }

    add_private_input(input: bigint) {
        this.witness.push(input);
    }

    // ================================================================================================
    // BELOW FUNCTIONS CAN BE AUTO-GENERATED

    /* Step the game
     * part of the private inputs
     */

    step(command: bigint) {
        this.gamePlay.step(BigInt(command));
        this.add_private_input(command);
    }

    /* Get the current game state */

    getGameState() {
        return this.gamePlay.getGameState();
    }

    init_game(arg: any) {
        // add the args first, because the gamePlay.init_game will free the args
        this.add_public_input(arg.score);
        this.add_public_input(arg.total_number_seen);
        this.add_public_input(arg.total_capture_tries);
        this.add_public_input(arg.current_number);
        this.add_public_input(arg.random_seed.seed);
        this.gamePlay.init_game(arg);
    }

    // ================================================================================================

    async _generateProof() {
        const proof = await this.zkProver.prove(
            this.inputs.map((i) => `${i}:i64`),
            [...this.witness.map((m) => `${m}:i64`)]
        );

        return proof;
    }

    async generateProof(debug: boolean = false) {
        if (!debug) {
            return await this._generateProof();
        } else {
        }
    }

    // DEV FUNCTION FOR CACHING PROOF LOCALLY FOR QUICK TESTING

    /* Reset the game
     * Keeping the same onReady callback and cloud credentials
     */

    async reset() {
        this.inputs = [];
        this.witness = [];

        this.gamePlay = new GamePlay();
        await this.gamePlay.init();
    }
}
