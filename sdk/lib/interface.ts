export abstract class GameplayAbstract {
    protected constructor() {}

    abstract newGame(args: bigint[]): Promise<void>;

    abstract step(command: bigint): Promise<void>;

    abstract getGameState(): Promise<any>;

    abstract resetGame(): Promise<void>;
}

export abstract class ProofCacheAbstract {
    abstract getProof(input: number): Promise<Proof | null>;
    abstract setProof(input: number, proof: Proof): Promise<void>;
}

export abstract class SpinGameProverAbstract {
    abstract generateSubmission(): Promise<string>;
}
