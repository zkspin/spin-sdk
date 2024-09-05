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
exports.ZKProver = exports.getImageCommitmentBigInts = void 0;
/* SDK FILE*/
const zkwasm_service_helper_1 = require("zkwasm-service-helper");
function getImageCommitmentBigInts(cloudCredentials) {
    return __awaiter(this, void 0, void 0, function* () {
        const imageHash = cloudCredentials.IMAGE_HASH;
        const helper = new zkwasm_service_helper_1.ZkWasmServiceHelper(cloudCredentials.CLOUD_RPC_URL, "", "");
        const imageInfo = yield helper.queryImage(imageHash);
        if (!imageInfo || !imageInfo.checksum) {
            throw new Error(`Image not found: ${imageHash}`);
        }
        const { x, y } = imageInfo.checksum;
        const commitment = commitmentUint8ArrayToVerifyInstanceBigInts(x, y);
        return commitment;
    });
}
exports.getImageCommitmentBigInts = getImageCommitmentBigInts;
/* This function is used to convert the commitment hex to hex string
 * in the format of verifying instance
 * @param x: x hex string
 * @param y: y hex string
 */
function commitmentHexToHexString(x, y) {
    const hexString1 = "0x" + x.slice(12, 66);
    const hexString2 = "0x" + y.slice(39) + "00000000000000000" + x.slice(2, 12);
    const hexString3 = "0x" + y.slice(2, 39);
    return [hexString1, hexString2, hexString3];
}
function commitmentUint8ArrayToVerifyInstanceBigInts(xUint8Array, yUint8Array) {
    const xHexString = zkwasm_service_helper_1.ZkWasmUtil.bytesToHexStrings(xUint8Array);
    const yHexString = zkwasm_service_helper_1.ZkWasmUtil.bytesToHexStrings(yUint8Array);
    const verifyInstances = commitmentHexToHexString("0x" + xHexString[0].slice(2).padStart(64, "0"), "0x" + yHexString[0].slice(2).padStart(64, "0"));
    const verifyingBytes = zkwasm_service_helper_1.ZkWasmUtil.hexStringsToBytes(verifyInstances, 32);
    const verifyingBigInts = zkwasm_service_helper_1.ZkWasmUtil.bytesToBigIntArray(verifyingBytes);
    return verifyingBigInts;
}
class ZKProver {
    constructor(cloudCredentials) {
        this.cloudCredentials = cloudCredentials;
        this.zkwasmHelper = new zkwasm_service_helper_1.ZkWasmServiceHelper(cloudCredentials.CLOUD_RPC_URL, "", "");
    }
    prove(inputs, witness) {
        return __awaiter(this, void 0, void 0, function* () {
            const taskInfo = yield this.add_proving_taks(inputs, witness);
            const task_id = taskInfo.id;
            const proof = yield this.load_proving_taks_util_result(task_id);
            return proof;
        });
    }
    _add_proving_taks(inputs, witness) {
        return __awaiter(this, void 0, void 0, function* () {
            const info = {
                user_address: this.cloudCredentials.USER_ADDRESS,
                md5: this.cloudCredentials.IMAGE_HASH,
                public_inputs: inputs,
                private_inputs: witness,
                proof_submit_mode: zkwasm_service_helper_1.ProofSubmitMode.Manual,
            };
            const msgString = zkwasm_service_helper_1.ZkWasmUtil.createProvingSignMessage(info);
            const signature = yield zkwasm_service_helper_1.ZkWasmUtil.signMessage(msgString, this.cloudCredentials.USER_PRIVATE_KEY);
            const task = Object.assign(Object.assign({}, info), { signature: signature });
            const tasksInfo = yield this.zkwasmHelper.addProvingTask(task);
            return tasksInfo;
        });
    }
    load_proving_taks_util_result(task_id_1) {
        return __awaiter(this, arguments, void 0, function* (task_id, retry_interval = 10000 // 10 seconds
        ) {
            let INITIAL_RETRY_INTERVAL = 50000;
            let init_flag = true;
            while (true) {
                const result = yield this.load_proving_taks(task_id);
                if (result.status == "Done") {
                    return result;
                }
                if (result.status != "Pending" &&
                    result.status != "Processing" &&
                    result.status != "DryRunSuccess") {
                    console.error("Error result:", result);
                    throw new Error(`Proof generation failed, ${result.status}`);
                }
                let sleep_time;
                if (init_flag) {
                    sleep_time = INITIAL_RETRY_INTERVAL;
                    init_flag = false;
                }
                else {
                    sleep_time = retry_interval;
                }
                console.log(`waiting for proof generation... sleeping for ${sleep_time}ms`);
                yield new Promise((_) => setTimeout(_, sleep_time));
            }
        });
    }
    _load_proving_taks(task_id) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = {
                md5: this.cloudCredentials.IMAGE_HASH,
                id: task_id,
                user_address: this.cloudCredentials.USER_ADDRESS,
                tasktype: "Prove",
                taskstatus: "",
            };
            let tasksInfo;
            tasksInfo = (yield this.zkwasmHelper.loadTasks(query)).data;
            if (!tasksInfo || tasksInfo.length == 0) {
                return null;
            }
            // multiple tasks can be returned, but we only care about the first one
            const task = tasksInfo[0];
            const proof = zkwasm_service_helper_1.ZkWasmUtil.bytesToBigIntArray(task.proof);
            const verify_instance = zkwasm_service_helper_1.ZkWasmUtil.bytesToBigIntArray(task.shadow_instances);
            const aux = zkwasm_service_helper_1.ZkWasmUtil.bytesToBigIntArray(task.aux);
            const instances = zkwasm_service_helper_1.ZkWasmUtil.bytesToBigIntArray(task.instances);
            return {
                proof,
                verify_instance,
                aux,
                instances,
                status: task.status,
            };
        });
    }
    load_proving_taks(task_id) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.asyncErrorHandler(this._load_proving_taks.bind(this))(task_id);
        });
    }
    add_proving_taks(inputs, witness) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.asyncErrorHandler(this._add_proving_taks.bind(this))(inputs, witness);
        });
    }
    /**
     * A generic async function wrapper that catches errors.
     * @param fn - The async function to be wrapped.
     * @returns A new function that when called, will invoke the original function with all provided arguments and catch any errors that are thrown.
     */
    asyncErrorHandler(fn) {
        return (...args) => __awaiter(this, void 0, void 0, function* () {
            let retryCount = 0;
            while (retryCount < 3) {
                try {
                    const result = yield fn(...args);
                    return result;
                }
                catch (error) {
                    if ((error.response && error.response.status === 429) ||
                        error.code == 429 ||
                        error.message.includes("Too many requests")) {
                        console.log(`Caught 429 error. Retrying in 5 seconds...`);
                        yield new Promise((resolve) => setTimeout(resolve, 5000));
                        retryCount++;
                    }
                    else {
                        console.error(error);
                        throw error;
                    }
                }
            }
            throw new Error("Too many retries");
        });
    }
}
exports.ZKProver = ZKProver;
