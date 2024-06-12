import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const GameModule = buildModule("GameModule", (m) => {
    const constructorParameterVerifierAddress = m.getParameter(
        "verifier_address",
        process.env.SEPOLIA_VERIFIER_ADDRESS
    );

    const gameContract = m.contract("GameContract", [
        constructorParameterVerifierAddress,
    ]);

    return { gameContract };
});

export default GameModule;
