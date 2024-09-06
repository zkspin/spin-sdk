"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpinDummyProver = exports.SpinOPZKProver = exports.SpinZKProver = exports.convertPlayerActionToPublicPrivateInputs = void 0;
const interface_1 = require("./interface");
const dataHasher_1 = require("./dataHasher");
function convertPlayerActionToPublicPrivateInputs(initialStates, playerActions, metaData) {
    const onchain_meta_transaction_hash = (0, dataHasher_1.computeSegmentMetaHash)({
        gameID: metaData.game_id,
        onChainGameStateHash: (0, dataHasher_1.computeHashUint64Array)(initialStates),
        gameInputHash: (0, dataHasher_1.computeHashUint64Array)(playerActions),
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
exports.convertPlayerActionToPublicPrivateInputs = convertPlayerActionToPublicPrivateInputs;
class SpinZKProver extends interface_1.SpinGameProverAbstract {
    constructor(zkProver) {
        super();
        this.zkProver = zkProver;
    }
    generateSubmission() {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error("Method not implemented.");
        });
    }
    // ================================================================================================
    _generateProof(initialState, playerActions, metaData) {
        return __awaiter(this, void 0, void 0, function* () {
            const { publicInputs, privateInputs } = convertPlayerActionToPublicPrivateInputs(initialState, playerActions, metaData);
            const proof = yield this.zkProver.prove(publicInputs.map((i) => `${i}:i64`), [...privateInputs.map((m) => `${m}:i64`)]);
            return proof;
        });
    }
    generateProof(initialState_1, playerActions_1, metaData_1) {
        return __awaiter(this, arguments, void 0, function* (initialState, playerActions, metaData, debug = false) {
            if (!debug) {
                return yield this._generateProof(initialState, playerActions, metaData);
            }
            else {
                // TODO ProofCacheAbstract
            }
        });
    }
}
exports.SpinZKProver = SpinZKProver;
class SpinOPZKProver extends interface_1.SpinGameProverAbstract {
    generateSubmission() {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error("Method not implemented.");
        });
    }
}
exports.SpinOPZKProver = SpinOPZKProver;
class SpinDummyProver extends interface_1.SpinGameProverAbstract {
    generateSubmission() {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error("Method not implemented.");
        });
    }
}
exports.SpinDummyProver = SpinDummyProver;
