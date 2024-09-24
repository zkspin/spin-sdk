import { SpinGameRegistryContractABI } from "@zkspin/lib";
import { ethers } from "ethers";
import { logger } from "./logger";

function getAccount(privateKey: string, rpcProviderURL: string) {
    return new ethers.Wallet(
        privateKey,
        new ethers.JsonRpcProvider(rpcProviderURL)
    );
}

async function publishGameOnchain(
    privateKey: string,
    rpcProviderURL: string,
    gameRegistryContractAddress: string,
    zkImageCommitment: [bigint, bigint, bigint],
    gameAuthorName: string,
    gameDescription: string,
    gameName: string
) {
    const account = getAccount(privateKey, rpcProviderURL);
    const contract = new ethers.Contract(
        gameRegistryContractAddress,
        SpinGameRegistryContractABI.abi,
        account
    );
    const tx = await contract.registerGame(
        zkImageCommitment,
        gameAuthorName,
        gameDescription,
        gameName
    );

    const result = await tx.wait();

    const eventLog = result.logs[0].topics;

    const gameId = Number(eventLog[1]);
    const gameStorageAddress = "0x" + eventLog[2].slice(-40);
    const txnHash = result.hash;

    return {
        gameId,
        gameStorageAddress,
        txnHash,
    };
}

export { publishGameOnchain };
