import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("ZkwasmVerifier", (m) => {
    const zkwasmVerifierStep1 = m.contract("AggregatorVerifierCoreStep1");
    const zkwasmVerifierStep2 = m.contract("AggregatorVerifierCoreStep2");
    const zkwasmVerifierStep3 = m.contract("AggregatorVerifierCoreStep3");

    const zkwasmVerifier = m.contract("AggregatorVerifier", [
        [zkwasmVerifierStep1, zkwasmVerifierStep2, zkwasmVerifierStep3],
    ]);
    return { zkwasmVerifier };
});
