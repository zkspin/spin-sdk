import { SpinGameProverAbstract } from "./interface";
import { ZKProver } from "./zkwasm";
import { computeSegmentMetaHash, computeHashUint64Array } from "./dataHasher";

export interface SubmissionMetaData {
    game_id: bigint;
}

export function convertPlayerActionToPublicPrivateInputs(
    initialStates: bigint[],
    playerActions: bigint[],
    metaData: SubmissionMetaData
): {
    publicInputs: bigint[];
    privateInputs: bigint[];
} {
    const onchain_meta_transaction_hash = computeSegmentMetaHash({
        gameID: metaData.game_id,
        onChainGameStateHash: computeHashUint64Array(initialStates),
        gameInputHash: computeHashUint64Array(playerActions),
    });

    const publicInputs = onchain_meta_transaction_hash;
    // spin.witness = Array(30).fill(BigInt(0));
    const privateInputs = [
        metaData.game_id,
        ...initialStates,
        BigInt(playerActions.length),
        ...playerActions,
    ];

    return { publicInputs, privateInputs };
}

export class SpinZKProver extends SpinGameProverAbstract {
    zkProver: ZKProver;

    constructor(zkProver: ZKProver) {
        super();
        this.zkProver = zkProver;
    }

    async generateSubmission(): Promise<string> {
        throw new Error("Method not implemented.");
    }

    // ================================================================================================

    async _generateProof(
        initialState: bigint[],
        playerActions: bigint[],

        metaData: SubmissionMetaData
    ) {
        const { publicInputs, privateInputs } =
            convertPlayerActionToPublicPrivateInputs(
                initialState,
                playerActions,
                metaData
            );
        const proof = await this.zkProver.prove(
            publicInputs.map((i) => `${i}:i64`),
            [...privateInputs.map((m) => `${m}:i64`)]
        );

        return proof;
    }

    async generateProof(
        initialState: bigint[],
        playerActions: bigint[],
        metaData: SubmissionMetaData,
        debug: boolean = false
    ) {
        if (!debug) {
            return await this._generateProof(
                initialState,
                playerActions,
                metaData
            );
        } else {
            // TODO ProofCacheAbstract
        }
    }
}

export class SpinOPZKProver extends SpinGameProverAbstract {
    async generateSubmission(): Promise<string> {
        throw new Error("Method not implemented.");
    }
}

export class SpinDummyProver extends SpinGameProverAbstract {
    async generateSubmission(): Promise<string> {
        throw new Error("Method not implemented.");
    }
}
