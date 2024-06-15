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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getImageCommitmentBigInts = exports.addImage = void 0;
/* SDK FILE*/
const fs_1 = __importDefault(require("fs"));
const path_1 = require("path");
const zkwasm_service_helper_1 = require("zkwasm-service-helper");
function addImage(cloudCredential, wasm_path) {
    return __awaiter(this, void 0, void 0, function* () {
        const helper = new zkwasm_service_helper_1.ZkWasmServiceHelper(cloudCredential.CLOUD_RPC_URL, "", "");
        const filename = (0, path_1.parse)(wasm_path).base;
        let fileSelected = fs_1.default.readFileSync(wasm_path);
        let md5 = zkwasm_service_helper_1.ZkWasmUtil.convertToMd5(new Uint8Array(fileSelected));
        console.log("md5 = ", md5);
        console.log("filename = ", filename);
        console.log("fileSelected = ", fileSelected);
        let info = {
            name: filename,
            image_md5: md5,
            image: fileSelected,
            user_address: cloudCredential.USER_ADDRESS.toLowerCase(),
            description_url: "Lg4",
            avator_url: "",
            circuit_size: 22,
            auto_submit_network_ids: [],
            prove_payment_src: zkwasm_service_helper_1.ProvePaymentSrc.Default,
        };
        console.log("info is:", info);
        let msgString = zkwasm_service_helper_1.ZkWasmUtil.createAddImageSignMessage(info);
        let signature = yield zkwasm_service_helper_1.ZkWasmUtil.signMessage(msgString, cloudCredential.USER_PRIVATE_KEY); //Need user private key to sign the msg
        let task = Object.assign(Object.assign({}, info), { signature });
        try {
            yield helper.addNewWasmImage(task);
            // sleep for 2 seconds to wait for the image to be added
            yield new Promise((resolve) => setTimeout(resolve, 2000));
        }
        catch (e) {
            if (e instanceof Error &&
                e.message ===
                    `Image with md5 CaseInsensitiveMD5("${md5.toUpperCase()}") already exists`) {
                console.error("Image already exists");
            }
            else {
                console.error("AddImage Error", e);
                throw e;
            }
        }
        cloudCredential.IMAGE_HASH = md5;
        const imageCommitment = yield getImageCommitmentBigInts(cloudCredential);
        return { imageCommitment, md5 };
    });
}
exports.addImage = addImage;
function getImageCommitmentBigInts(cloudCredential) {
    return __awaiter(this, void 0, void 0, function* () {
        const helper = new zkwasm_service_helper_1.ZkWasmServiceHelper(cloudCredential.CLOUD_RPC_URL, "", "");
        const imageInfo = yield helper.queryImage(cloudCredential.IMAGE_HASH);
        if (!imageInfo || !imageInfo.checksum) {
            console.error(cloudCredential.IMAGE_HASH, imageInfo);
            throw Error("Image not found");
        }
        const commitment = commitmentUint8ArrayToVerifyInstanceBigInts(imageInfo.checksum.x, imageInfo.checksum.y);
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
    console.log("xHexString = ", xHexString);
    console.log("yHexString = ", yHexString);
    const verifyInstances = commitmentHexToHexString("0x" + xHexString[0].slice(2).padStart(64, "0"), "0x" + yHexString[0].slice(2).padStart(64, "0"));
    console.log("verifyInstances = ", verifyInstances);
    const verifyingBytes = zkwasm_service_helper_1.ZkWasmUtil.hexStringsToBytes(verifyInstances, 32);
    console.log("verifyingBytes = ", verifyingBytes);
    const verifyingBigInts = zkwasm_service_helper_1.ZkWasmUtil.bytesToBigIntArray(verifyingBytes);
    console.log("verifyingBigInts = ", verifyingBigInts);
    return verifyingBigInts;
}
