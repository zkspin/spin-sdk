export abstract class GameplayAbstract {
    protected constructor() {}

    abstract newGame(args: bigint[]): Promise<void>;

    abstract step(command: bigint): void;

    abstract getGameState(): any;

    abstract resetGame(): Promise<void>;
}

export abstract class ProofCacheAbstract {}

export abstract class SpinGameProverAbstract {
    abstract generateSubmission(): Promise<string>;
}
interface SegmentData {
    initial_states: bigint[];
    player_action_inputs: bigint[];
    final_state: bigint[];
}

interface SubmissionData {
    game_id: bigint;
    segments: SegmentData[];
    submission_nonce: bigint;
    submission_hash: string;
    player_address: string;
    player_signature: string;
}

enum SubmissionStatus {
    Pending = "PENDING",
    Success = "SUCCESS",
    Failed = "FAILED",
}

enum DAType {
    S3 = "S3",
}

interface SubmissionResponse {
    status: SubmissionStatus;
    da_type: DAType;
    da_uri: string;
    operator_signature: string;
    baselayer_transaction_hash: string;
}

export {
    SegmentData,
    SubmissionData,
    SubmissionStatus,
    DAType,
    SubmissionResponse,
};
