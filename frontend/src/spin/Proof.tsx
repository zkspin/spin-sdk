/* SDK FILE*/

import { ethers } from "ethers";
import {
    ProvingParams,
    WithSignature,
    ZkWasmServiceHelper,
    ZkWasmUtil,
} from "zkwasm-service-helper";

export interface ProveCredentials {
    USER_ADDRESS: string;
    USER_PRIVATE_KEY: string;
    IMAGE_HASH: string;
    CLOUD_RPC_URL: string;
}

export async function signMessage(
    message: string,
    cloudCredential: ProveCredentials
) {
    /**
     * Sign a message with the zk's private key
     * @param message The message to sign
     * @returns The signature
     */

    const signer = new ethers.Wallet(cloudCredential.USER_PRIVATE_KEY);

    const signature = await signer.signMessage(message);

    return signature;
}

export async function add_proving_taks(
    inputs: string[],
    witness: string[],
    cloudCredential: ProveCredentials
) {
    const helper = new ZkWasmServiceHelper(
        cloudCredential.CLOUD_RPC_URL,
        "",
        ""
    );

    const info: ProvingParams = {
        user_address: cloudCredential.USER_ADDRESS,
        md5: cloudCredential.IMAGE_HASH,
        public_inputs: inputs,
        private_inputs: witness,
    };

    const msgString = ZkWasmUtil.createProvingSignMessage(info);

    let signature: string;
    try {
        // change to use whitelisted pkey to sign message
        signature = await signMessage(msgString, cloudCredential);
        console.log("signature = ", signature);
    } catch (e: unknown) {
        console.log("error signing message", e);
        throw Error("Unsigned Transaction");
    }

    const task: WithSignature<ProvingParams> = {
        ...info,
        signature: signature,
    };

    console.log("task = ", task);

    const tasksInfo = await helper.addProvingTask(task);

    return tasksInfo;
}

export async function load_proving_taks_util_result(
    task_id: string,
    cloudCredential: ProveCredentials,
    retry_interval: number = 10000 // 10 seconds
) {
    while (true) {
        const result = await load_proving_taks(task_id, cloudCredential);
        if (result.status !== "Pending" && result.status !== "Processing") {
            return result;
        }
        console.log(
            `waiting for proof generation... sleeping for ${retry_interval}ms`
        );
        await new Promise((r) => setTimeout(r, retry_interval));
    }
}

export async function load_proving_taks(
    task_id: string,
    cloudCredential: ProveCredentials
) {
    const helper = new ZkWasmServiceHelper(
        cloudCredential.CLOUD_RPC_URL,
        "",
        ""
    );

    const query = {
        md5: cloudCredential.IMAGE_HASH,
        id: task_id,
        user_address: cloudCredential.USER_ADDRESS,
        tasktype: "Prove",
        taskstatus: "",
    };

    const tasksInfo = await helper.loadTasks(query);

    if (tasksInfo.data.length == 0) {
        return null;
    }

    // multiple tasks can be returned, but we only care about the first one
    const task = tasksInfo.data[0];
    const proof = ZkWasmUtil.bytesToBigIntArray(task.proof);
    const verify_instance = ZkWasmUtil.bytesToBigIntArray(task.batch_instances);
    const aux = ZkWasmUtil.bytesToBigIntArray(task.aux);
    const instances = ZkWasmUtil.bytesToBigIntArray(task.instances);

    console.log("proof data = ", tasksInfo.data);
    console.log("verification succeeded.");

    return {
        proof,
        verify_instance,
        aux,
        instances,
        status: task.status,
    };
}
