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
    let fileSelected: Buffer = fs.readFileSync(wasm_path);

    let md5 = ZkWasmUtil.convertToMd5(new Uint8Array(fileSelected));

    console.log("md5 = ", md5);
    console.log("filename = ", filename);
    console.log("fileSelected = ", fileSelected);

    let info: AddImageParams = {
        name: filename,
        image_md5: md5,
        image: fileSelected,
        user_address: cloudCredential.USER_ADDRESS.toLowerCase(),
        description_url: "Lg4",
        avator_url: "",
        circuit_size: 22,
        auto_submit_network_ids: [],
        prove_payment_src: ProvePaymentSrc.Default,
    };

    console.log("info is:", info);

    let msgString = ZkWasmUtil.createAddImageSignMessage(info);

    // TEMP FIX FOR ZKWASM's createAddImageSignMessage returning undefined
    // msgString = msgString.substring(0, msgString.length - "undefined".length);

    let signature: string = await ZkWasmUtil.signMessage(
        msgString,
        cloudCredential.USER_PRIVATE_KEY
    ); //Need user private key to sign the msg
    console.log("msgString = ", msgString);
    console.log("signature = ", signature);
    let task: WithSignature<AddImageParams> = {
        ...info,
        signature,
    };

    try {
        await helper.addNewWasmImage(task);

        // sleep for 2 seconds to wait for the image to be added
        await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (e) {
        if (
            e instanceof Error &&
            e.message ===
                `Image with md5 CaseInsensitiveMD5("${md5.toUpperCase()}") already exists`
        ) {
            console.error("Image already exists");
        } else {
            console.error("AddImage Error", e);
            throw e;
        }
    }

    cloudCredential.IMAGE_HASH = md5;
    const imageCommitment = getImageCommitmentBigInts(cloudCredential);
    return imageCommitment;
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
/* This function is used to convert the commitment hex to hex string
 * in the format of verifying instance
 * @param x: x hex string
 * @param y: y hex string
 */
function commitmentHexToHexString(x: string, y: string) {
    const hexString1 = "0x" + x.slice(11);
    const hexString2 =
        "0x" + y.slice(39) + "000000000000000000" + x.slice(2, 11);
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
