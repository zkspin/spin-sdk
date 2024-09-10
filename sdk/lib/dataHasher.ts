import { ethers } from "ethers";
import { SegmentData, SubmissionData } from "./interface";

function bytes32ToBigIntArray(
    bytes32: string
): [bigint, bigint, bigint, bigint] {
    return [
        BigInt("0x" + bytes32.slice(2, 18)),
        BigInt("0x" + bytes32.slice(18, 34)),
        BigInt("0x" + bytes32.slice(34, 50)),
        BigInt("0x" + bytes32.slice(50, 66)),
    ];
}

function computeHashBytes32(gameInputs: bigint[] | BigUint64Array) {
    // check type is BigUint64Array
    if (gameInputs instanceof BigUint64Array) {
        gameInputs = Array.from(gameInputs);
    }

    const _rawBytes = ethers.AbiCoder.defaultAbiCoder().encode(
        gameInputs.map((x) => "uint256"),
        gameInputs
    );

    return ethers.sha256(_rawBytes);
}

function decodeBytesToU64Array(bytes: string, uintLength: number): bigint[] {
    if (bytes === "0x") {
        return new Array(uintLength).fill(BigInt(0));
    }

    return ethers.AbiCoder.defaultAbiCoder().decode(
        new Array(uintLength).fill("uint64"),
        bytes
    );
}

function encodeU64ArrayToBytes(uint64Array: bigint[]): string {
    return ethers.AbiCoder.defaultAbiCoder().encode(
        new Array(uint64Array.length).fill("uint64"),
        uint64Array
    );
}

function computeHashUint64Array(
    gameInputs: bigint[] | BigUint64Array
): [bigint, bigint, bigint, bigint] {
    const _hash = computeHashBytes32(gameInputs);

    return bytes32ToBigIntArray(_hash);
}

// sha256("0x")
export const EMPTY_STATE_HASH =
    "0xe3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";

function computeSegmentMetaHash({
    gameID,
    onChainGameStateHash,
    gameInputHash,
}: {
    gameID: bigint;
    onChainGameStateHash: [bigint, bigint, bigint, bigint];
    gameInputHash: [bigint, bigint, bigint, bigint];
}): [bigint, bigint, bigint, bigint] {
    const _hash = ethers.sha256(
        ethers.AbiCoder.defaultAbiCoder().encode(
            [
                "uint256",
                "uint64",
                "uint64",
                "uint64",
                "uint64",
                "uint64",
                "uint64",
                "uint64",
                "uint64",
            ],
            [gameID, ...onChainGameStateHash, ...gameInputHash]
        )
    );

    return bytes32ToBigIntArray(_hash);
}

function computeOPZKSubmissionHash(submissionData: {
    game_id: bigint;
    submission_nonce: bigint;
    segments: SegmentData[];
}): string {
    const _hash = ethers.sha256(
        ethers.AbiCoder.defaultAbiCoder().encode(
            ["uint256", "uint256", "bytes32[]", "bytes32[]"],
            [
                submissionData.game_id,
                submissionData.submission_nonce,
                [
                    ...submissionData.segments.map((x) =>
                        computeHashBytes32(x.initial_states)
                    ),
                    computeHashBytes32(
                        submissionData.segments[
                            submissionData.segments.length - 1
                        ].final_state
                    ),
                ],
                [
                    ...submissionData.segments.map((x) =>
                        computeHashBytes32(x.player_action_inputs)
                    ),
                ],
            ]
        )
    );

    return _hash;
}

export {
    computeSegmentMetaHash,
    computeHashUint64Array,
    computeHashBytes32,
    computeOPZKSubmissionHash,
    bytes32ToBigIntArray,
    decodeBytesToU64Array,
    encodeU64ArrayToBytes,
};
