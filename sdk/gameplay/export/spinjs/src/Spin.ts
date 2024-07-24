import { GamePlay, SpinGameInitArgs } from "./GamePlay.js";
import { ethers } from "ethers";
import {
    add_proving_taks,
    load_proving_taks_util_result,
    ProveCredentials,
} from "./Proof.js";
import { ZkWasmServiceHelper, ZkWasmUtil } from "zkwasm-service-helper";

interface SpinConstructor {
    cloudCredentials: ProveCredentials;
}

/* This Class is used to facilated core gameplay and zk proving*/
export class Spin {
    gamePlay: GamePlay;
    cloudCredentials: ProveCredentials;
    inputs: bigint[] = []; // public inputs
    witness: bigint[] = []; // private inputs

    /* Constructor */
    constructor({ cloudCredentials }: SpinConstructor) {
        this.cloudCredentials = cloudCredentials;
        console.log("cloudCredentials = ", cloudCredentials);
        this.gamePlay = new GamePlay();
    }

    private add_public_input(input: bigint) {
        this.inputs.push(input);
    }

    private add_private_input(input: bigint) {
        this.witness.push(input);
    }

    // ================================================================================================
    // BELOW FUNCTIONS CAN BE AUTO-GENERATED

    /* Step the game
     * part of the private inputs
     */

    step(command: bigint) {
        this.gamePlay.step(BigInt(command));
        this.add_private_input(command);
    }

    /* Get the current game state */

    getGameState() {
        return this.gamePlay.getGameState();
    }

    async initialize_import() {
        await this.gamePlay.init();
    }

    initialize_game(arg: SpinGameInitArgs) {
        this.add_public_input(arg.total_steps);
        this.add_public_input(arg.current_position);
        this.gamePlay.init_game(arg);

        // TODO: dynamic add public inputs
        // args.map((a) => this.add_public_input(a));
    }

    async getGameID() {
        const helper = new ZkWasmServiceHelper(
            this.cloudCredentials.CLOUD_RPC_URL,
            "",
            ""
        );

        let retryCount = 0;

        while (retryCount < 3) {
            try {
                const imageInfo = await helper.queryImage(
                    this.cloudCredentials.IMAGE_HASH
                );

                if (!imageInfo || !imageInfo.checksum) {
                    throw Error("Image not found");
                }
                const imageCommitment =
                    commitmentUint8ArrayToVerifyInstanceBigInts(
                        imageInfo.checksum.x,
                        imageInfo.checksum.y
                    );

                const gameID = ethers.solidityPackedKeccak256(
                    ["uint256", "uint256", "uint256"],
                    [imageCommitment[0], imageCommitment[1], imageCommitment[2]]
                );
                return gameID;
            } catch (error: any) {
                console.error(`Caught error: ${error}`);
                if (error.message.startsWith("Too many requests")) {
                    console.log(`Caught 429 error. Retrying in 5 seconds...`);
                    await new Promise((resolve) => setTimeout(resolve, 5000));
                    retryCount++;
                } else {
                    throw error;
                }
            }
        }
        throw Error("Failed to get image commitment");
    }

    // ================================================================================================

    async generateProof() {
        const tasksInfo = await add_proving_taks(
            this.inputs.map((i) => `${i}:i64`),
            [
                `${this.witness.length}:i64`,
                ...this.witness.map((m) => `${m}:i64`),
            ],
            this.cloudCredentials
        );

        const task_id = tasksInfo.id;

        const proof = await load_proving_taks_util_result(
            task_id,
            this.cloudCredentials
        );

        console.log("final proof = ", proof);

        return proof;
    }

    /* Reset the game
     * Keeping the same onReady callback and cloud credentials
     */

    async reset() {
        this.inputs = [];
        this.witness = [];

        this.gamePlay = new GamePlay();
        await this.gamePlay.init();
    }
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
        "0x" + xHexString[0].slice(2).padStart(64, "0"),
        "0x" + yHexString[0].slice(2).padStart(64, "0")
    );
    console.log("verifyInstances = ", verifyInstances);

    const verifyingBytes = ZkWasmUtil.hexStringsToBytes(verifyInstances, 32);
    console.log("verifyingBytes = ", verifyingBytes);
    const verifyingBigInts = ZkWasmUtil.bytesToBigIntArray(verifyingBytes);
    console.log("verifyingBigInts = ", verifyingBigInts);
    return verifyingBigInts;
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
