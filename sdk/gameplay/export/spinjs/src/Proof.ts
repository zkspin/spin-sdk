/* SDK FILE*/

import { ethers } from "ethers";
import {
    ProofSubmitMode,
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
        proof_submit_mode: ProofSubmitMode.Manual,
    };

    const msgString = ZkWasmUtil.createProvingSignMessage(info);

    let signature: string;
    try {
        // change to use whitelisted pkey to sign message
        signature = await signMessage(msgString, cloudCredential);
    } catch (e: unknown) {
        console.log("error signing message", e);
        throw Error("Signing transaction failed");
    }

    const task: WithSignature<ProvingParams> = {
        ...info,
        signature: signature,
    };
    const tasksInfo = await helper.addProvingTask(task);

    console.log("tasksInfo = ", tasksInfo);
    return tasksInfo;
}

export async function getImageCommitmentBigInts(
    cloudCredential: ProveCredentials
): Promise<BigInt[]> {
    const helper = new ZkWasmServiceHelper(
        cloudCredential.CLOUD_RPC_URL,
        "",
        ""
    );
    const imageInfo = await helper.queryImage(cloudCredential.IMAGE_HASH);

    if (!imageInfo || !imageInfo.checksum) {
        throw Error("Image not found");
    }

    const commitment = commitmentUint8ArrayToVerifyInstanceBigInts(
        imageInfo.checksum.x,
        imageInfo.checksum.y
    );

    return commitment;
}

export async function load_proving_taks_util_result(
    task_id: string,
    cloudCredential: ProveCredentials,
    retry_interval: number = 10000 // 10 seconds
) {
    let INITIAL_RETRY_INTERVAL = 40000;
    let init_flag = true;
    while (true) {
        const result = await load_proving_taks(task_id, cloudCredential);
        if (result!.status == "Done") {
            return result;
        }

        if (result!.status == "Pending") {
            console.log("Pending");
        } else if (result!.status == "Processing") {
            console.log("Processing");
        } else {
            throw new Error(`Proof generation failed, ${result}`);
        }

        let sleep_time: number;

        if (init_flag) {
            sleep_time = INITIAL_RETRY_INTERVAL;
            init_flag = false;
        } else {
            sleep_time = retry_interval;
        }
        console.log(
            `waiting for proof generation... sleeping for ${sleep_time}ms`
        );
        await new Promise((_) => setTimeout(_, sleep_time));
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

    let retryCount = 0;

    let tasksInfo;

    while (retryCount < 4) {
        try {
            tasksInfo = (await helper.loadTasks(query)).data;
            console.log("proof data = ", tasksInfo);
            break;
        } catch (error: any) {
            console.error(`Caught error: ${error.message}`);
            if (
                (error.response && error.response.status === 429) ||
                error.code == 429 ||
                error.message.includes("Too many requests")
            ) {
                console.log(`Caught 429 error. Retrying in 5 seconds...`);
                await new Promise((resolve) => setTimeout(resolve, 5000));
                retryCount++;
            } else {
                throw error;
            }
        }
    }

    if (!tasksInfo || tasksInfo.length == 0) {
        return null;
    }

    // multiple tasks can be returned, but we only care about the first one
    const task = tasksInfo[0];
    const proof = ZkWasmUtil.bytesToBigIntArray(task.proof);
    const verify_instance = ZkWasmUtil.bytesToBigIntArray(
        task.shadow_instances
    );
    console.log("verify_instance = ", task.shadow_instances);
    const aux = ZkWasmUtil.bytesToBigIntArray(task.aux);
    const instances = ZkWasmUtil.bytesToBigIntArray(task.instances);

    return {
        proof,
        verify_instance,
        aux,
        instances,
        status: task.status,
    };
}

function hexStringToZkWasmCommitmentHex(hexString: string[]) {
    const x =
        "0x" +
        hexString[2].slice(hexString[2].length - 10, hexString[2].length) +
        hexString[1].slice(2);

    const y = "0x" + hexString[3].slice(2) + hexString[2].slice(2, 29);

    return { x, y };
}

/* This function is used to convert the commitment hex to hex string
 * in the format of verifying instance
 * @param x: x hex string
 * @param y: y hex string
 */
function commitmentHexToHexString(x: string, y: string) {
    const hexString1 = "0x" + x.slice(12);
    const hexString2 =
        "0x" + y.slice(39) + "00000000000000000" + x.slice(2, 12);
    const hexString3 = "0x" + y.slice(2, 39);

    return [hexString1, hexString2, hexString3];
}

function commitmentUint8ArrayToVerifyInstanceBigInts(
    xUint8Array: Uint8Array,
    yUint8Array: Uint8Array
) {
    const xHexString = ZkWasmUtil.bytesToHexStrings(xUint8Array);
    const yHexString = ZkWasmUtil.bytesToHexStrings(yUint8Array);
    console.log("xHexString = ", xHexString);
    console.log("yHexString = ", yHexString);
    const verifyInstances = commitmentHexToHexString(
        xHexString[0],
        yHexString[0]
    );
    console.log("verifyInstances = ", verifyInstances);

    const verifyingBytes = ZkWasmUtil.hexStringsToBytes(verifyInstances, 32);
    console.log("verifyingBytes = ", verifyingBytes);
    const verifyingBigInts = ZkWasmUtil.bytesToBigIntArray(verifyingBytes);
    console.log("verifyingBigInts = ", verifyingBigInts);
    return verifyingBigInts;
}
