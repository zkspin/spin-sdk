"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bytes32ToBigIntArray = exports.computeSubmissionHash = exports.computeHashBytes32 = exports.computeHashUint64Array = exports.computeSegmentMetaHash = void 0;
const ethers_1 = require("ethers");
function bytes32ToBigIntArray(bytes32) {
    return [
        BigInt("0x" + bytes32.slice(2, 18)),
        BigInt("0x" + bytes32.slice(18, 34)),
        BigInt("0x" + bytes32.slice(34, 50)),
        BigInt("0x" + bytes32.slice(50, 66)),
    ];
}
exports.bytes32ToBigIntArray = bytes32ToBigIntArray;
function computeHashBytes32(gameInputs) {
    const _rawBytes = ethers_1.ethers.AbiCoder.defaultAbiCoder().encode(gameInputs.map((x) => "uint256"), gameInputs);
    return ethers_1.ethers.sha256(_rawBytes);
}
exports.computeHashBytes32 = computeHashBytes32;
function computeHashUint64Array(gameInputs) {
    const _hash = computeHashBytes32(gameInputs);
    return bytes32ToBigIntArray(_hash);
}
exports.computeHashUint64Array = computeHashUint64Array;
function computeSegmentMetaHash({ gameID, onChainGameStateHash, gameInputHash, }) {
    const _hash = ethers_1.ethers.sha256(ethers_1.ethers.AbiCoder.defaultAbiCoder().encode([
        "uint256",
        "uint64",
        "uint64",
        "uint64",
        "uint64",
        "uint64",
        "uint64",
        "uint64",
        "uint64",
    ], [gameID, ...onChainGameStateHash, ...gameInputHash]));
    return bytes32ToBigIntArray(_hash);
}
exports.computeSegmentMetaHash = computeSegmentMetaHash;
function computeSubmissionHash(submissionData) {
    const _hash = ethers_1.ethers.sha256(ethers_1.ethers.AbiCoder.defaultAbiCoder().encode(["uint256", "uint256", "address", "bytes32[]", "bytes32[]"], [
        submissionData.game_id,
        submissionData.submission_nonce,
        submissionData.player_address,
        [
            ...submissionData.segments.map((x) => computeHashBytes32(x.initial_states)),
            computeHashBytes32(submissionData.segments[submissionData.segments.length - 1].final_state),
        ],
        [
            ...submissionData.segments.map((x) => computeHashBytes32(x.player_action_inputs)),
        ],
    ]));
    return _hash;
}
exports.computeSubmissionHash = computeSubmissionHash;
