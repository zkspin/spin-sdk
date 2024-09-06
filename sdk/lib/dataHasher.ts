import { ethers } from "ethers";
import { SubmissionData } from "./interface";

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

function computeHashBytes32(gameInputs: bigint[]) {
    const _rawBytes = ethers.AbiCoder.defaultAbiCoder().encode(
        gameInputs.map((x) => "uint256"),
        gameInputs
    );

    return ethers.sha256(_rawBytes);
}

function computeHashUint64Array(
    gameInputs: bigint[]
): [bigint, bigint, bigint, bigint] {
    const _hash = computeHashBytes32(gameInputs);

    return bytes32ToBigIntArray(_hash);
}

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

function computeSubmissionHash(submissionData: SubmissionData): string {
    const _hash = ethers.sha256(
        ethers.AbiCoder.defaultAbiCoder().encode(
            ["uint256", "uint256", "address", "bytes32[]", "bytes32[]"],
            [
                submissionData.game_id,
                submissionData.submission_nonce,
                submissionData.player_address,
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
    computeSubmissionHash,
    bytes32ToBigIntArray,
};
