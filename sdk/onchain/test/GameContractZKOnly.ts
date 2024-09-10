import { expect } from "chai";
import { ethers, ignition } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import ZkwasmVerifier from "../ignition/modules/ZKVerifier";
import zkGameModule from "../ignition/modules/GameContractZK";
import { readZKWasmProof } from "./readProof";
import { computeHashUint64Array } from "../../lib/dataHasher";
function generateOutputBytes(output: bigint[]): string {
    // return abi.encodePacked(output);

    if (output.length !== 5) {
        throw new Error("Invalid output length");
    }

    return ethers.AbiCoder.defaultAbiCoder().encode(
        ["uint256", "uint256", "uint256", "uint256", "uint256"],
        output
    );
}

describe("ZK only game contract", function () {
    async function deployGameContractFixture() {
        const [owner, addr1, addr2] = await ethers.getSigners();

        const { zkwasmVerifier } = await ignition.deploy(ZkwasmVerifier);

        const { gameContract } = await ignition.deploy(zkGameModule, {
            parameters: {
                ZKOnlyGameModule: {
                    verifier_address: await zkwasmVerifier.getAddress(),
                },
            },
        });
        // Fixtures can return anything you consider useful for your tests
        return { gameContract, owner, addr1, addr2 };
    }

    it("Test set verifier", async function () {
        const { gameContract, owner, addr1 } = await loadFixture(
            deployGameContractFixture
        );

        const newVerifier = addr1.address;
        await gameContract.setVerifier(newVerifier);

        const verifier = await gameContract.verifier();
        expect(verifier).to.equal(newVerifier);

        await gameContract.setVerifier(process.env.SEPOLIA_VERIFIER_ADDRESS);
    });

    it("Test set verifier with non-owner", async function () {
        const { gameContract, addr1 } = await loadFixture(
            deployGameContractFixture
        );

        const newVerifier = addr1.address;
        await expect(
            gameContract.connect(addr1).setVerifier(newVerifier)
        ).to.be.revertedWith("Only owner can call this function");
    });

    it("Test Settle", async function () {
        const { gameContract, owner, addr1 } = await loadFixture(
            deployGameContractFixture
        );

        const { PROOF, VERIFYING_INSTANCE, AUX, TARGET_INSTANCE } =
            readZKWasmProof("i0000.json");

        const playerInputHash = computeHashUint64Array([
            BigInt(1),
            BigInt(1),
            BigInt(1),
        ]);

        const finalState = generateOutputBytes([
            BigInt(5),
            BigInt(14),
            BigInt(6),
            BigInt(147),
            BigInt(1),
        ]);

        expect(
            await gameContract.submitGame(
                123n,
                finalState,
                playerInputHash,
                PROOF,
                VERIFYING_INSTANCE,
                AUX,
                TARGET_INSTANCE
            )
        ).to.emit(gameContract, "GameSubmission");
    });
});
