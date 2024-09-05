import { ZkWasmServiceHelper, ZkWasmUtil } from "zkwasm-service-helper";

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
