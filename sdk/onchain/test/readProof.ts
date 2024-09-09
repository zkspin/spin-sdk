import * as fs from "fs";
import * as path from "path";

export function readZKWasmProof(fileName: string = "proof.json") {
    const currentFileDirectory = __dirname;
    const filePath = path.join(currentFileDirectory, "sampleProofs", fileName);

    const proofInStringFormat = JSON.parse(fs.readFileSync(filePath, "utf-8"));

    // parse proof to BigInt
    proofInStringFormat["proof"] = {
        proof: proofInStringFormat["proof"]["proof"].map((x: string) =>
            BigInt(x)
        ),
        verify_instance: proofInStringFormat["proof"]["verify_instance"].map(
            (x: string) => BigInt(x)
        ),
        aux: proofInStringFormat["proof"]["aux"].map((x: string) => BigInt(x)),
        instances: proofInStringFormat["proof"]["instances"].map((x: string) =>
            BigInt(x)
        ),
    };

    const PROOF = proofInStringFormat["proof"]["proof"];
    const AUX = proofInStringFormat["proof"]["aux"];
    const TARGET_INSTANCE = [proofInStringFormat["proof"]["instances"]];
    const VERIFYING_INSTANCE = proofInStringFormat["proof"]["verify_instance"];
    return { PROOF, VERIFYING_INSTANCE, AUX, TARGET_INSTANCE };
}
