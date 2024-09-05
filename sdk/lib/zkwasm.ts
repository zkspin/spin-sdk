/* SDK FILE*/
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

export async function getImageCommitmentBigInts(
    cloudCredentials: ProveCredentials
): Promise<BigInt[]> {
    const imageHash = cloudCredentials.IMAGE_HASH;
    const helper = new ZkWasmServiceHelper(
        cloudCredentials.CLOUD_RPC_URL,
        "",
        ""
    );
    const imageInfo = await helper.queryImage(imageHash);

    if (!imageInfo || !imageInfo.checksum) {
        throw new Error(`Image not found: ${imageHash}`);
    }

    const { x, y } = imageInfo.checksum;
    const commitment = commitmentUint8ArrayToVerifyInstanceBigInts(x, y);

    return commitment;
}

/* This function is used to convert the commitment hex to hex string
 * in the format of verifying instance
 * @param x: x hex string
 * @param y: y hex string
 */
function commitmentHexToHexString(x: string, y: string) {
    const hexString1 = "0x" + x.slice(12, 66);
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

    const verifyInstances = commitmentHexToHexString(
        "0x" + xHexString[0].slice(2).padStart(64, "0"),
        "0x" + yHexString[0].slice(2).padStart(64, "0")
    );

    const verifyingBytes = ZkWasmUtil.hexStringsToBytes(verifyInstances, 32);
    const verifyingBigInts = ZkWasmUtil.bytesToBigIntArray(verifyingBytes);
    return verifyingBigInts;
}

export class ZKProver {
    private cloudCredentials: ProveCredentials;
    private zkwasmHelper: ZkWasmServiceHelper;

    constructor(cloudCredentials: ProveCredentials) {
        this.cloudCredentials = cloudCredentials;
        this.zkwasmHelper = new ZkWasmServiceHelper(
            cloudCredentials.CLOUD_RPC_URL,
            "",
            ""
        );
    }

    async prove(inputs: string[], witness: string[]) {
        const taskInfo = await this.add_proving_taks(inputs, witness);

        const task_id = taskInfo.id;
        const proof = await this.load_proving_taks_util_result(task_id);

        return proof;
    }

    private async _add_proving_taks(inputs: string[], witness: string[]) {
        const info: ProvingParams = {
            user_address: this.cloudCredentials.USER_ADDRESS,
            md5: this.cloudCredentials.IMAGE_HASH,
            public_inputs: inputs,
            private_inputs: witness,
            proof_submit_mode: ProofSubmitMode.Manual,
        };

        const msgString = ZkWasmUtil.createProvingSignMessage(info);

        const signature = await ZkWasmUtil.signMessage(
            msgString,
            this.cloudCredentials.USER_PRIVATE_KEY
        );

        const task: WithSignature<ProvingParams> = {
            ...info,
            signature: signature,
        };
        const tasksInfo = await this.zkwasmHelper.addProvingTask(task);

        return tasksInfo;
    }

    private async load_proving_taks_util_result(
        task_id: string,
        retry_interval: number = 10000 // 10 seconds
    ) {
        let INITIAL_RETRY_INTERVAL = 50000;
        let init_flag = true;
        while (true) {
            const result = await this.load_proving_taks(task_id);
            if (result!.status == "Done") {
                return result;
            }

            if (
                result!.status != "Pending" &&
                result!.status != "Processing" &&
                result!.status != "DryRunSuccess"
            ) {
                console.error("Error result:", result);
                throw new Error(`Proof generation failed, ${result!.status}`);
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

    private async _load_proving_taks(task_id: string): Promise<null | {
        proof: BigInt[];
        verify_instance: BigInt[];
        aux: BigInt[];
        instances: BigInt[];
        status: string;
    }> {
        const query = {
            md5: this.cloudCredentials.IMAGE_HASH,
            id: task_id,
            user_address: this.cloudCredentials.USER_ADDRESS,
            tasktype: "Prove",
            taskstatus: "",
        };

        let tasksInfo;

        tasksInfo = (await this.zkwasmHelper.loadTasks(query)).data;

        if (!tasksInfo || tasksInfo.length == 0) {
            return null;
        }

        // multiple tasks can be returned, but we only care about the first one
        const task = tasksInfo[0];
        const proof = ZkWasmUtil.bytesToBigIntArray(task.proof);
        const verify_instance = ZkWasmUtil.bytesToBigIntArray(
            task.shadow_instances
        );

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

    async load_proving_taks(task_id: string): Promise<null | {
        proof: BigInt[];
        verify_instance: BigInt[];
        aux: BigInt[];
        instances: BigInt[];
        status: string;
    }> {
        return this.asyncErrorHandler(this._load_proving_taks.bind(this))(
            task_id
        );
    }

    async add_proving_taks(inputs: string[], witness: string[]) {
        return this.asyncErrorHandler(this._add_proving_taks.bind(this))(
            inputs,
            witness
        );
    }

    /**
     * A generic async function wrapper that catches errors.
     * @param fn - The async function to be wrapped.
     * @returns A new function that when called, will invoke the original function with all provided arguments and catch any errors that are thrown.
     */
    asyncErrorHandler<T extends Array<any>, U>(
        fn: (...args: T) => Promise<U>
    ): (...args: T) => Promise<U> {
        return async (...args: T): Promise<U> => {
            let retryCount = 0;

            while (retryCount < 3) {
                try {
                    const result = await fn(...args);
                    return result;
                } catch (error: any) {
                    if (
                        (error.response && error.response.status === 429) ||
                        error.code == 429 ||
                        error.message.includes("Too many requests")
                    ) {
                        console.log(
                            `Caught 429 error. Retrying in 5 seconds...`
                        );
                        await new Promise((resolve) =>
                            setTimeout(resolve, 5000)
                        );
                        retryCount++;
                    } else {
                        console.error(error);
                        throw error;
                    }
                }
            }
            throw new Error("Too many retries");
        };
    }
}
