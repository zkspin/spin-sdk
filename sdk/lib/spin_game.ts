import { GameplayAbstract, SpinGameProverAbstract } from "./interface";
import { SubmissionMetaData } from "./spin_game_prover";

interface SpinConstructor<T> {
    gameplay: GameplayAbstract;
    gameplayProver: SpinGameProverAbstract<T>;
}

/* This Class is used to facilated core gameplay and zk proving*/
export class SpinGame<T> {
    gamePlay: GameplayAbstract;
    gameplayProver: SpinGameProverAbstract<T>;
    initialState: bigint[] = []; // public inputs
    playerInputs: bigint[] = []; // public inputs
    finalState: bigint[] = []; // private inputs

    /* Constructor */
    constructor({ gameplay, gameplayProver }: SpinConstructor<T>) {
        this.gamePlay = gameplay;
        this.gameplayProver = gameplayProver;
    }

    step(command: bigint) {
        this.gamePlay.step(command);
        this.playerInputs.push(command);
    }

    getCurrentGameState() {
        return this.gamePlay.getGameState();
    }

    async newGame({ initialStates }: { initialStates: bigint[] }) {
        for (const arg of initialStates) {
            this.initialState.push(arg);
        }

        await this.gamePlay.newGame(initialStates);
    }

    async generateSubmission(
        initialState: bigint[],
        playerActions: bigint[],
        metaData: SubmissionMetaData
    ) {
        return await this.gameplayProver.generateSubmission(
            initialState,
            playerActions,
            metaData
        );
    }

    /* Reset the game
     * Keeping the same onReady callback and cloud credentials
     */

    async resetGame() {
        this.initialState = [];
        this.playerInputs = [];
        this.finalState = [];

        await this.gamePlay.resetGame();
    }
}
