/* SDK FILE*/
import fs from "fs";
import { parse } from "path";
import {
    AddImageParams,
    ProvePaymentSrc,
    WithSignature,
    ZkWasmServiceHelper,
    ZkWasmUtil,
} from "zkwasm-service-helper";
import { logger } from "./logger";
import {
    PUBLISH_IMAGE_RETRY_COUNT,
    PUBLISH_IMAGE_RETRY_DELAY_IN_SECONDS,
} from "./config";

export interface ProveCredentials {
    USER_ADDRESS: string;
    USER_PRIVATE_KEY: string;
    IMAGE_HASH: string;
    CLOUD_RPC_URL: string;
}

export async function addImage(
    cloudCredential: ProveCredentials,
    wasm_path: string
) {
    const helper = new ZkWasmServiceHelper(
        cloudCredential.CLOUD_RPC_URL,
        "",
        ""
    );

    const filename = parse(wasm_path).base;
    const fileSelected: Buffer = fs.readFileSync(wasm_path);

    const md5 = ZkWasmUtil.convertToMd5(new Uint8Array(fileSelected));

    logger.info(
        `Image MD5: ${md5} File name: ${filename} File size: ${fileSelected.length} bytes`
    );

    const info: AddImageParams = {
        name: filename,
        image_md5: md5,
        image: fileSelected,
        user_address: cloudCredential.USER_ADDRESS.toLowerCase(),
        description_url: "zkSpin Game",
        avator_url: "",
        circuit_size: 22,
        auto_submit_network_ids: [],
        prove_payment_src: ProvePaymentSrc.Default,
    };

    let msgString = ZkWasmUtil.createAddImageSignMessage(info);

    const signature: string = await ZkWasmUtil.signMessage(
        msgString,
        cloudCredential.USER_PRIVATE_KEY
    );

    const task: WithSignature<AddImageParams> = {
        ...info,
        signature,
    };

    await helper
        .addNewWasmImage(task)
        .then(await new Promise((resolve) => setTimeout(resolve, 2000)))
        .catch((e) => {
            if (
                e instanceof Error &&
                e.message ===
                    `Image with md5 CaseInsensitiveMD5("${md5.toUpperCase()}") already exists`
            ) {
                logger.info(`Image with md5 ${md5} already exists`);
            } else {
                logger.error(e);
                throw e;
            }
        });

    cloudCredential.IMAGE_HASH = md5;

    for (let i = 0; i < PUBLISH_IMAGE_RETRY_COUNT; i++) {
        try {
            const imageCommitment = await getImageCommitmentBigInts(
                cloudCredential
            );
            return { imageCommitment, md5 };
        } catch (e) {
            if (e instanceof Error && e.message.includes("Image not found")) {
                logger.warn(`Image not found: ${md5}, retrying... retry ${i}`);
                logger.warn(
                    `Sleeping for ${PUBLISH_IMAGE_RETRY_DELAY_IN_SECONDS} seconds...`
                );
                await new Promise((resolve) =>
                    setTimeout(
                        resolve,
                        PUBLISH_IMAGE_RETRY_DELAY_IN_SECONDS * 1000
                    )
                );
            } else {
                throw e;
            }
        }
    }
    throw new Error(`Image not found: ${md5}`);
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
