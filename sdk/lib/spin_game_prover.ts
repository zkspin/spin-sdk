import { SpinGameProverAbstract } from "./interface";
import { ZKProver, ProveCredentials } from "./zkwasm";

export class SpinZKProver extends SpinGameProverAbstract {
    cloudCredentials: ProveCredentials;
    zkProver: ZKProver;

    constructor(cloudCredentials: ProveCredentials) {
        super();
        this.cloudCredentials = cloudCredentials;
        this.zkProver = new ZKProver(cloudCredentials);
        this.zkProver = new ZKProver(cloudCredentials);
    }

    async generateSubmission(): Promise<string> {
        throw new Error("Method not implemented.");
    }

    // ================================================================================================

    async _generateProof() {
        const proof = await this.zkProver.prove(
            this.inputs.map((i) => `${i}:i64`),
            [...this.witness.map((m) => `${m}:i64`)]
        );

        return proof;
    }

    async generateProof(debug: boolean = false) {
        if (!debug) {
            return await this._generateProof();
        } else {
            // TODO ProofCacheAbstract
        }
    }
}

export class SpinOPZKProver extends SpinGameProverAbstract {
    async generateSubmission(): Promise<string> {
        throw new Error("Method not implemented.");
    }
}
