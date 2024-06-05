"use strict";
/* SDK FILE*/
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
exports.load_proving_taks = exports.load_proving_taks_util_result = exports.add_proving_taks = exports.signMessage = void 0;
const ethers_1 = require("ethers");
const zkwasm_service_helper_1 = require("zkwasm-service-helper");
function signMessage(message, cloudCredential) {
    return __awaiter(this, void 0, void 0, function* () {
        /**
         * Sign a message with the zk's private key
         * @param message The message to sign
         * @returns The signature
         */
        const signer = new ethers_1.ethers.Wallet(cloudCredential.USER_PRIVATE_KEY);
        const signature = yield signer.signMessage(message);
        return signature;
    });
}
exports.signMessage = signMessage;
function add_proving_taks(inputs, witness, cloudCredential) {
    return __awaiter(this, void 0, void 0, function* () {
        const helper = new zkwasm_service_helper_1.ZkWasmServiceHelper(cloudCredential.CLOUD_RPC_URL, "", "");
        const info = {
            user_address: cloudCredential.USER_ADDRESS,
            md5: cloudCredential.IMAGE_HASH,
            public_inputs: inputs,
            private_inputs: witness,
        };
        const msgString = zkwasm_service_helper_1.ZkWasmUtil.createProvingSignMessage(info);
        let signature;
        try {
            // change to use whitelisted pkey to sign message
            signature = yield signMessage(msgString, cloudCredential);
            console.log("signature = ", signature);
        }
        catch (e) {
            console.log("error signing message", e);
            throw Error("Unsigned Transaction");
        }
        const task = Object.assign(Object.assign({}, info), { signature: signature });
        console.log("task = ", task);
        const tasksInfo = yield helper.addProvingTask(task);
        return tasksInfo;
    });
}
exports.add_proving_taks = add_proving_taks;
function load_proving_taks_util_result(task_id_1, cloudCredential_1) {
    return __awaiter(this, arguments, void 0, function* (task_id, cloudCredential, retry_interval = 10000 // 10 seconds
    ) {
        while (true) {
            const result = yield load_proving_taks(task_id, cloudCredential);
            if (result.status !== "Pending" && result.status !== "Processing") {
                return result;
            }
            console.log(`waiting for proof generation... sleeping for ${retry_interval}ms`);
            yield new Promise((r) => setTimeout(r, retry_interval));
        }
    });
}
exports.load_proving_taks_util_result = load_proving_taks_util_result;
function load_proving_taks(task_id, cloudCredential) {
    return __awaiter(this, void 0, void 0, function* () {
        const helper = new zkwasm_service_helper_1.ZkWasmServiceHelper(cloudCredential.CLOUD_RPC_URL, "", "");
        const query = {
            md5: cloudCredential.IMAGE_HASH,
            id: task_id,
            user_address: cloudCredential.USER_ADDRESS,
            tasktype: "Prove",
            taskstatus: "",
        };
        const tasksInfo = yield helper.loadTasks(query);
        if (tasksInfo.data.length == 0) {
            return null;
        }
        // multiple tasks can be returned, but we only care about the first one
        const task = tasksInfo.data[0];
        const proof = zkwasm_service_helper_1.ZkWasmUtil.bytesToBigIntArray(task.proof);
        const verify_instance = zkwasm_service_helper_1.ZkWasmUtil.bytesToBigIntArray(task.batch_instances);
        const aux = zkwasm_service_helper_1.ZkWasmUtil.bytesToBigIntArray(task.aux);
        const instances = zkwasm_service_helper_1.ZkWasmUtil.bytesToBigIntArray(task.instances);
        console.log("proof data = ", tasksInfo.data);
        console.log("verification succeeded.");
        return {
            proof,
            verify_instance,
            aux,
            instances,
            status: task.status,
        };
    });
}
exports.load_proving_taks = load_proving_taks;
//# sourceMappingURL=Proof.js.map