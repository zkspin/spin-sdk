# Goal

We have a ZK image that's off-chain. We want to verify on-chain that the proof we submit is indeed from this image and not any other image.

# Obtain ZK Image Commitment Hash Upon Publishing Image

The commitment is different from the image hash.
The commitment is two bytes32 size hexstrings that can be generated with the information the proof provided to be generated on-chain.
So far as we know, image hash is not trivial(or possible?) to be generated on-chain.

Therefore, we need to submit the commitment to on-chain.

# Proof Commitment Format

The proof has a field `verifying_instance`. This field has information needed to compute the commitment hash.
However, we'll not compute the commiment on-chain. Rather, we'll obtain a commitment when publishing and convert the
commitment into the format of `verifying_instance`.

## Commitment Hash Example

The code here are in Typescript.

The commitment the prover returns to us is in Uint8Array Format

### Initial Uint8Array Format

```ts
const x = new Uint8Array([
    118, 19, 147, 89, 248, 185, 39, 5, 194, 86, 167, 233, 1, 101, 148, 111, 16,
    73, 150, 203, 223, 159, 225, 111, 0, 17, 181, 74, 126, 133, 241, 44,
]);

const y = new Uint8Array([
    139, 5, 220, 129, 235, 79, 210, 182, 255, 252, 51, 163, 25, 161, 92, 28,
    239, 198, 3, 121, 167, 27, 147, 169, 239, 159, 45, 187, 183, 168, 225, 27,
]);
```

### Convert Uint8Array into HexString

```ts
const xHexString = ZkWasmUtil.bytesToHexStrings(xUint8Array);
const yHexString = ZkWasmUtil.bytesToHexStrings(yUint8Array);

console.log(xHexString);
console.log(yHexString);
```

```bash
['0x2cf1857e4ab511006fe19fdfcb9649106f946501e9a756c20527b9f859931376']
['0x1be1a8b7bb2d9fefa9931ba77903c6ef1c5ca119a333fcffb6d24feb81dc058b']
```

The above hex string format is in reverse order of the actual x, y on the ZkWasm explorer.

### Convert HexString into Verifying Instance Format

This part is a bit complicated because the verifying instance has the hex string shifted around and into 3 different hexstrings.

```ts
function commitmentHexToHexString(x: string, y: string) {
    const hexString1 = "0x" + x.slice(12);
    const hexString2 =
        "0x" + y.slice(39) + "00000000000000000" + x.slice(2, 12);
    const hexString3 = "0x" + y.slice(2, 39);

    return [hexString1, hexString2, hexString3];
}
```

```bash
['0xb511006fe19fdfcb9649106f946501e9a756c20527b9f859931376', '0x119a333fcffb6d24feb81dc058b000000000000000002cf1857e4a', '0x1be1a8b7bb2d9fefa9931ba77903c6ef1c5ca']
```

### Convert the Verifying Instance Hex Array into Bytes

This converts the 3 hex string into one uintarray

```ts
const verifyingBytes = ZkWasmUtil.hexStringsToBytes(verifyInstances, 32);

console.log(verifyingBytes);
```

```bash
{
    "0": 118,
    "1": 19,
    "2": 147,
    "3": 89,
    "4": 248,
    "5": 185,
    "6": 39,
    "7": 5,
    "8": 194,
    "9": 86,
    "10": 167,
    "11": 233,
    "12": 1,
    "13": 101,
    "14": 148,
    "15": 111,
    "16": 16,
    "17": 73,
    "18": 150,
    "19": 203,
    "20": 223,
    "21": 159,
    "22": 225,
    "23": 111,
    "24": 0,
    "25": 17,
    "26": 181,
    "27": 0,
    "28": 0,
    "29": 0,
    "30": 0,
    "31": 0,
    "32": 74,
    "33": 126,
    "34": 133,
    "35": 241,
    "36": 44,
    "37": 0,
    "38": 0,
    "39": 0,
    "40": 0,
    "41": 0,
    "42": 0,
    "43": 0,
    "44": 0,
    "45": 176,
    "46": 88,
    "47": 192,
    "48": 29,
    "49": 184,
    "50": 254,
    "51": 36,
    "52": 109,
    "53": 251,
    "54": 207,
    "55": 63,
    "56": 51,
    "57": 154,
    "58": 17,
    "59": 0,
    "60": 0,
    "61": 0,
    "62": 0,
    "63": 0,
    "64": 202,
    "65": 197,
    "66": 241,
    "67": 110,
    "68": 60,
    "69": 144,
    "70": 119,
    "71": 186,
    "72": 49,
    "73": 153,
    "74": 250,
    "75": 254,
    "76": 217,
    "77": 178,
    "78": 123,
    "79": 139,
    "80": 26,
    "81": 190,
    "82": 1,
    "83": 0,
    "84": 0,
    "85": 0,
    "86": 0,
    "87": 0,
    "88": 0,
    "89": 0,
    "90": 0,
    "91": 0,
    "92": 0,
    "93": 0,
    "94": 0,
    "95": 0
}
```

### Convert Bytes(Uint8Array) into BigInt Format (Finally!)

Lastly we convert the bytes into bigint format, which is the in the format
the on-chain contract expects.

```ts
const verifyingBigInts = ZkWasmUtil.bytesToBigIntArray(verifyingBytes);
console.log(verifyingBigInts);
```

```bash
[74486401908859591403229388291836529877789026897151807869554987894n, 7241184524295750919170342524462313244765660017617877986877734474n, 38861112272076482440397420477085650286396874n]
```

### Summarize

We obtained a image commitment upon publishing the WASM image.

Then using this image we converted the commitment into a format of 3 bigints.

When submitting a proof on-chain, we just need to compare the proof's `verifying_instance` with the commitment bigints we obtained.

Note here that the proof's `verifying_instance` has 4 elements, just ignore the first one.
