import {
    SegmentData,
    SpinGameProverAbstract,
    SubmissionData,
} from "./interface";
import { ZKProver } from "./zkwasm";
import {
    computeSegmentMetaHash,
    computeHashUint64Array,
    encodeU64ArrayToBytes,
    bytes32ToBigIntArray,
    EMPTY_STATE_HASH,
    computeHashBytes32,
    computeOPZKSubmissionHash,
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

export interface SpinZKProverInput {
    initialState: bigint[];
    playerActions: bigint[];
    metaData: SubmissionMetaData;
}

export class SpinZKProver extends SpinGameProverAbstract<
    SpinZKProverInput,
    SpinZKProverSubmissionData
> {
    zkProver: ZKProver;

    constructor(zkProver: ZKProver) {
        super();
        this.zkProver = zkProver;
    }

    async generateSubmission(
        submissionInput: SpinZKProverInput
    ): Promise<SpinZKProverSubmissionData> {
        const proof = await this.generateProof(
            submissionInput.initialState,
            submissionInput.playerActions,
            submissionInput.metaData
        );

        if (!proof) {
            throw new Error("Failed to generate proof");
        }

        return {
            game_id: submissionInput.metaData.game_id,
            finalState: encodeU64ArrayToBytes(submissionInput.initialState),
            playerInputsHash: computeHashUint64Array(
                submissionInput.playerActions
            ),
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

export interface SpinOPZKProverOutput {
    data: SubmissionData;
}

export interface SpinOPZKCredential {
    operator_url: string;
}

export interface SpinOPZKProverInput {
    game_id: bigint;
    segments: SegmentData[];
}

export class SpinOPZKProver extends SpinGameProverAbstract<
    SpinOPZKProverInput,
    SpinOPZKProverOutput
> {
    credential: SpinOPZKCredential;

    getSubmissionNonce: () => Promise<bigint>;
    getPlayerSignature: (submissionHash: string) => Promise<{
        player_address: string;
        player_signature: string;
    }>;

    constructor(
        credential: SpinOPZKCredential,
        getSubmissionNonce: () => Promise<bigint>,
        getPlayerSignature: (submissionHash: string) => Promise<{
            player_address: string;
            player_signature: string;
        }>
    ) {
        super();
        this.credential = credential;
        this.getSubmissionNonce = getSubmissionNonce;
        this.getPlayerSignature = getPlayerSignature;
    }

    async generateSubmission(
        submissionInput: SpinOPZKProverInput
    ): Promise<SpinOPZKProverOutput> {
        const submissionNonce = await this.getSubmissionNonce();

        const submissionHash = computeOPZKSubmissionHash({
            game_id: submissionInput.game_id,
            submission_nonce: submissionNonce,
            segments: submissionInput.segments,
        });
        const { player_address, player_signature } =
            await this.getPlayerSignature(submissionHash);

        return {
            data: {
                game_id: submissionInput.game_id,
                segments: submissionInput.segments,
                submission_nonce: submissionNonce,
                submission_hash: submissionHash,
                player_address,
                player_signature,
            },
        };
    }
}

export class SpinDummyProver extends SpinGameProverAbstract<any, any> {
    async generateSubmission(): Promise<string> {
        throw new Error("Method not implemented.");
    }
}
