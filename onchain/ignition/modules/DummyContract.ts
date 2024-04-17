import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const SEPOLIA_VERIFIER_ADDRESS = "0xfD74dce645Eb5EB65D818aeC544C72Ba325D93B0";

const GameModule = buildModule("GameModule", (m) => {
  const constructorParameterVerifierAddress = m.getParameter(
    "verifier_address",
    SEPOLIA_VERIFIER_ADDRESS
  );

  const gameContract = m.contract("DummyContract", [
    constructorParameterVerifierAddress,
  ]);

  return { gameContract };
});

export default GameModule;
