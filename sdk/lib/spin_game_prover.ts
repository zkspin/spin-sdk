import { SpinGameProverAbstract } from "./interface";
import { ZKProver } from "./zkwasm";
import {
    computeSegmentMetaHash,
    computeHashUint64Array,
    encodeU64ArrayToBytes,
    bytes32ToBigIntArray,
    EMPTY_STATE_HASH,
} from "./dataHasher";

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
        onChainGameStateHash: initialStates.every((x) => x === BigInt(0))
            ? bytes32ToBigIntArray(EMPTY_STATE_HASH) // no state stored on-chain, use empty state
            : computeHashUint64Array(initialStates),
        gameInputHash: computeHashUint64Array(playerActions),
    });

    const publicInputs = onchain_meta_transaction_hash;

    const privateInputs = [
        metaData.game_id,
        ...initialStates,
        BigInt(playerActions.length),
        ...playerActions,
    ];

    return { publicInputs, privateInputs };
}

export interface SpinZKProverSubmissionData {
    game_id: bigint;
    finalState: string;
    playerInputsHash: bigint[];
    proof: bigint[];
    verify_instance: bigint[];
    aux: bigint[];
    instances: bigint[];
}

export class SpinZKProver extends SpinGameProverAbstract<SpinZKProverSubmissionData> {
    zkProver: ZKProver;

    constructor(zkProver: ZKProver) {
        super();
        this.zkProver = zkProver;
    }

    async generateSubmission(
        initialState: bigint[],
        playerActions: bigint[],
        metaData: SubmissionMetaData
    ): Promise<SpinZKProverSubmissionData> {
        const proof = await this.generateProof(
            initialState,
            playerActions,
            metaData
        );

        if (!proof) {
            throw new Error("Failed to generate proof");
        }

        return {
            game_id: metaData.game_id,
            finalState: encodeU64ArrayToBytes(initialState),
            playerInputsHash: computeHashUint64Array(playerActions),
            proof: proof.proof,
            verify_instance: proof.verify_instance,
            aux: proof.aux,
            instances: proof.instances,
        };
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

        console.log("initialState = ", initialState);
        console.log("playerActions = ", playerActions);
        console.log("metaData = ", metaData);
        console.log("publicInputs = ", publicInputs);
        console.log("privateInputs = ", privateInputs);

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

export class SpinOPZKProver extends SpinGameProverAbstract<any> {
    async generateSubmission(): Promise<string> {
        throw new Error("Method not implemented.");
    }
}

export class SpinDummyProver extends SpinGameProverAbstract<any> {
    async generateSubmission(): Promise<string> {
        throw new Error("Method not implemented.");
    }
}
