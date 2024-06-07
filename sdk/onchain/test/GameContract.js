const { expect } = require("chai");
const { ethers } = require("hardhat");
const {
    loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("Game contract", function () {

    async function deployGameFixture() {
        const [owner, addr1, addr2] = await ethers.getSigners();

        const constructorArguments = [process.env.SEPOLIA_VERIFIER_ADDRESS];
        const gameContract = await ethers.deployContract("GameContract", constructorArguments);
        // Fixtures can return anything you consider useful for your tests
        return { gameContract, owner, addr1, addr2 };
    }

    it("Test set verifier", async function () {
        const { gameContract, owner, addr1 } = await loadFixture(deployGameFixture);

        const newVerifier = addr1.address;
        await gameContract.setVerifier(newVerifier);

        const verifier = await gameContract.verifier();
        expect(verifier).to.equal(newVerifier);
    });
});