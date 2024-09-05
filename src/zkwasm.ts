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
import { ProveCredentials, getImageCommitmentBigInts } from "../sdk/lib/zkwasm";

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
        .then(async () => {
            logger.info(`Image with md5 ${md5} added successfully`);
            await new Promise((resolve) => setTimeout(resolve, 2000));
            return;
        })
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
                logger.warn(
                    `Image not found: ${md5}, retrying... retry ${i}/${PUBLISH_IMAGE_RETRY_COUNT}`
                );
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
