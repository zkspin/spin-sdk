"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const modules_1 = require("@nomicfoundation/hardhat-ignition/modules");
const SEPOLIA_VERIFIER_ADDRESS = "0xfD74dce645Eb5EB65D818aeC544C72Ba325D93B0";
const GameModule = (0, modules_1.buildModule)("GameModule", (m) => {
    const constructorParameterVerifierAddress = m.getParameter("verifier_address", SEPOLIA_VERIFIER_ADDRESS);
    const gameContract = m.contract("GameContract", [
        constructorParameterVerifierAddress,
    ]);
    return { gameContract };
});
exports.default = GameModule;
//# sourceMappingURL=GameContract.js.map