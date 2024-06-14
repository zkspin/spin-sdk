import { getAccount, writeContract, readContract } from "@wagmi/core";
import { config } from "./config";
import { abi } from "./ABI";
import { waitForTransactionReceipt } from "wagmi/actions";
const CONTRACT_ADDRESS = "0x3e84b7f9563853e1e7622e00f228D33e215723A8";

export async function getUserAccount() {
    const userWallet = await getAccount(config);

    if (userWallet.address === undefined) {
        throw new Error("User wallet not connected.");
    }
    return userWallet;
}

// READ FUNCTIONS

export async function getGameLeaderboard(gameID: string) {
    try {
        const result = await readContract(config, {
            abi,
            address: CONTRACT_ADDRESS,
            functionName: "getGameLeaderboard",
            args: [gameID],
        });
        return result;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function getPlayerGameRecords(gameID: string) {
    try {
        const userWallet = await getUserAccount();
        const result = await readContract(config, {
            abi,
            address: CONTRACT_ADDRESS,
            functionName: "getPlayerGameRecords",
            args: [gameID, userWallet.address],
        });
        return result;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function getGame(gameID: string) {
    try {
        const result = await readContract(config, {
            abi,
            address: CONTRACT_ADDRESS,
            functionName: "getGame",
            args: [gameID],
        });
        return result;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

// WRITE FUNCTION

export async function createGame(
    name: string,
    description: string,
    commitment: BigInt[]
) {
    try {
        const result = await writeContract(config, {
            abi,
            address: CONTRACT_ADDRESS,
            functionName: "createGame",
            args: [name, description, commitment],
        });

        const receipt = await waitForTransactionReceipt(config, {
            hash: result,
        });

        console.log("Receipt: ", receipt);
        return result;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function submitGame({
    proof,
    verify_instance,
    aux,
    instances,
    status,
}: {
    proof: BigInt[];
    verify_instance: BigInt[];
    aux: BigInt[];
    instances: BigInt[];
    status: any;
}) {
    try {
        const result = await writeContract(config, {
            abi,
            address: CONTRACT_ADDRESS,
            functionName: "submitGame",
            args: [proof, verify_instance, aux, [instances]],
        });
        return result;
    } catch (error) {
        console.log(error);
        throw error;
    }
}
