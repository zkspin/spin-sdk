import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import zkverifierModule from "./ZKVerifier";
export default buildModule("ZKOnlyGameModule", (m) => {
    const { zkwasmVerifier } = m.useModule(zkverifierModule);

    const gameContract = m.contract("SpinZKGameContract", [zkwasmVerifier]);

    return { gameContract };
});
