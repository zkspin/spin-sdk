import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const zkGameModule = buildModule("ZKOnlyGameModule", (m) => {
    const constructorParameterVerifierAddress =
        m.getParameter("verifier_address");

    const gameContract = m.contract("SpinZKGameContract", [
        constructorParameterVerifierAddress,
    ]);

    return { gameContract };
});

const opzkGameModule = buildModule("OPZKGameModule", (m) => {
    const constructorParameterVerifierAddress =
        m.getParameter("verifier_address");

    const gameSystem = m.contract("SpinOPZKGameContract", [
        constructorParameterVerifierAddress,
    ]);

    const stakingAddress = m.staticCall(gameSystem, "getStakingContract");

    const stakingContract = m.contractAt("StakingContract", stakingAddress);

    const storageAddress = m.staticCall(gameSystem, "getStorageContract");

    const storageContract = m.contractAt("GameStateStorage", storageAddress);

    return {
        gameSystem,
        stakingContract,
        storageContract,
    };
});

export { zkGameModule, opzkGameModule };
