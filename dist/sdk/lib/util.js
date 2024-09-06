"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.converToBigInts = void 0;
function converToBigInts(input) {
    try {
        if (Array.isArray(input)) {
            return input.map((i) => BigInt(i));
        }
        else {
            return [BigInt(input)];
        }
    }
    catch (e) {
        throw new Error(`Invalid input: ${e}`);
    }
}
exports.converToBigInts = converToBigInts;
