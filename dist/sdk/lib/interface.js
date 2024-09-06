"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DAType = exports.SubmissionStatus = exports.SpinGameProverAbstract = exports.ProofCacheAbstract = exports.GameplayAbstract = void 0;
class GameplayAbstract {
    constructor() { }
}
exports.GameplayAbstract = GameplayAbstract;
class ProofCacheAbstract {
}
exports.ProofCacheAbstract = ProofCacheAbstract;
class SpinGameProverAbstract {
}
exports.SpinGameProverAbstract = SpinGameProverAbstract;
var SubmissionStatus;
(function (SubmissionStatus) {
    SubmissionStatus["Pending"] = "PENDING";
    SubmissionStatus["Success"] = "SUCCESS";
    SubmissionStatus["Failed"] = "FAILED";
})(SubmissionStatus || (exports.SubmissionStatus = SubmissionStatus = {}));
var DAType;
(function (DAType) {
    DAType["S3"] = "S3";
})(DAType || (exports.DAType = DAType = {}));
