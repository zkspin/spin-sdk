import { GameplayAbstract, SpinGameProverAbstract } from "./interface";

interface SpinConstructor<TInput, TOutput> {
    gameplay: GameplayAbstract;
    gameplayProver: SpinGameProverAbstract<TInput, TOutput>;
}

/* This Class is used to facilated core gameplay and zk proving*/
export class SpinGame<TInput, TOutput> {
    gamePlay: GameplayAbstract;
    gameplayProver: SpinGameProverAbstract<TInput, TOutput>;
    initialState: bigint[] = []; // public inputs
    playerInputs: bigint[] = []; // public inputs
    finalState: bigint[] = []; // private inputs

    /* Constructor */
    constructor({
        gameplay,
        gameplayProver,
    }: SpinConstructor<TInput, TOutput>) {
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

    async generateSubmission(submissionInput: TInput) {
        return await this.gameplayProver.generateSubmission(submissionInput);
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
