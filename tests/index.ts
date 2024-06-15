import { assert } from "console";
import { ZkWasmServiceHelper, ZkWasmUtil } from "zkwasm-service-helper";

const ZK_CLOUD_USER_ADDRESS = "0xd8f157Cc95Bc40B4F0B58eb48046FebedbF26Bde";
const ZK_CLOUD_USER_PRIVATE_KEY =
    "2763537251e2f27dc6a30179e7bf1747239180f45b92db059456b7da8194995a";
const ZK_CLOUD_URL = "https://rpc.zkwasmhub.com:8090";

export async function getImageCommitmentBigInts(
    imageHash: string
): Promise<String[]> {
    const helper = new ZkWasmServiceHelper(ZK_CLOUD_URL, "", "");
    const imageInfo = await helper.queryImage(imageHash);

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
    const hexString1 = "0x" + x.slice(13);
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
    // console.log("xHexString = ", xHexString);
    // console.log("yHexString = ", yHexString);
    const verifyInstances = commitmentHexToHexString(
        xHexString[0],
        yHexString[0]
    );
    // console.log("verifyInstances = ", verifyInstances);
    return verifyInstances;

    // Ignoring the following code for now
    // const verifyingBytes = ZkWasmUtil.hexStringsToBytes(verifyInstances, 32);
    // // console.log("verifyingBytes = ", verifyingBytes);
    // const verifyingBigInts = ZkWasmUtil.bytesToBigIntArray(verifyingBytes);
    // // console.log("verifyingBigInts = ", verifyingBigInts);
    // return verifyingBigInts;
}

async function test() {
    await getImageCommitmentBigInts("A316E0AE66003685AE4145847CD3A5E7").then(
        (commitment) => {
            assert(commitment.length === 3);

            const expectedShadowInstance = [
                "0x92b0c57b7169178c091b852dc7474c020198929631b19c5efecadb",
                "0x578468d280e2080820b3a5ea5a100000000000000000236643bfe8",
                "0x27e2964a83be91a266c751a2f424b5cbbddcc",
            ];
            assert(
                commitment[0] === expectedShadowInstance[0] &&
                    commitment[1] === expectedShadowInstance[1] &&
                    commitment[2] === expectedShadowInstance[2],
                `A316E0AE66003685AE4145847CD3A5E7 failed, commitment = ${commitment}`
            );
        }
    );

    await getImageCommitmentBigInts("CF98D442A32BC8A4FFB2D5DB707F2A2C").then(
        (commitment) => {
            const expectedShadowInstance = [
                "0xb090d521a850d2891f7acf95c2828e9541c6f43ac5142c3e6f552",
                "0x822be6b524440c4890df20a0afe00000000000000000192d8c44f1",
                "0x29f823ce2098afa4cd16daf7ed36e2412e875",
            ];
            assert(commitment.length === 3);

            assert(
                commitment[0] === expectedShadowInstance[0] &&
                    commitment[1] === expectedShadowInstance[1] &&
                    commitment[2] === expectedShadowInstance[2],
                `CF98D442A32BC8A4FFB2D5DB707F2A2C failed, commitment = ${commitment}`
            );
        }
    );

    await getImageCommitmentBigInts("08923C02DC9602F57AA20802D1497577").then(
        (commitment) => {
            assert(commitment.length === 3);

            const expectedShadowInstance = [
                "0x105e4d79583662194c7a3aa6b0b0f7c5131c8921954a53e31e44d6",
                "0xfcfd726361b006aa6c00c62eac3000000000000000000840b47d89",
                "0x2add9c6e9f49d76e67ee41f413ae849758ab1",
            ];

            assert(
                commitment[0] === expectedShadowInstance[0] &&
                    commitment[1] === expectedShadowInstance[1] &&
                    commitment[2] === expectedShadowInstance[2],
                `08923C02DC9602F57AA20802D1497577 failed, commitment = ${commitment}`
            );
        }
    );
}

test();
