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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getImageCommitmentBigInts = void 0;
const zkwasm_service_helper_1 = require("zkwasm-service-helper");
function getImageCommitmentBigInts(cloudCredentials) {
    return __awaiter(this, void 0, void 0, function* () {
        const imageHash = cloudCredentials.IMAGE_HASH;
        const helper = new zkwasm_service_helper_1.ZkWasmServiceHelper(cloudCredentials.CLOUD_RPC_URL, "", "");
        const imageInfo = yield helper.queryImage(imageHash);
        if (!imageInfo || !imageInfo.checksum) {
            throw new Error(`Image not found: ${imageHash}`);
        }
        const { x, y } = imageInfo.checksum;
        const commitment = commitmentUint8ArrayToVerifyInstanceBigInts(x, y);
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
    const verifyInstances = commitmentHexToHexString("0x" + xHexString[0].slice(2).padStart(64, "0"), "0x" + yHexString[0].slice(2).padStart(64, "0"));
    const verifyingBytes = zkwasm_service_helper_1.ZkWasmUtil.hexStringsToBytes(verifyInstances, 32);
    const verifyingBigInts = zkwasm_service_helper_1.ZkWasmUtil.bytesToBigIntArray(verifyingBytes);
    return verifyingBigInts;
}
