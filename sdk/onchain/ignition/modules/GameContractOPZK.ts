import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import zkverifierModule from "./ZKVerifier";

export default buildModule("OPZKGameModule", (m) => {
    const { zkwasmVerifier } = m.useModule(zkverifierModule);

    const gameSystem = m.contract("SpinOPZKGameContract", [zkwasmVerifier]);

    const stakingAddress = m.staticCall(gameSystem, "getStakingContract");

    const stakingContract = m.contractAt("StakingContract", stakingAddress);

    const storageAddress = m.staticCall(gameSystem, "getStorageContract");

    const storageContract = m.contractAt("GameStateStorage", storageAddress);

    const multiSender = m.contract("MultiSender");

    return {
        multiSender,
        gameSystem,
        stakingContract,
        storageContract,
    };
});
