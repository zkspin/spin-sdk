import { defaultWagmiConfig } from "@web3modal/wagmi/react/config";

import { sepolia } from "wagmi/chains";

// Get projectId from https://cloud.walletconnect.com
export const projectId = "5a03482d1abec5089a22847f459daff7";

if (!projectId) throw new Error("Project ID is not defined");

const metadata = {
    name: "Web3Modal",
    description: "Web3Modal Example",
    url: "https://web3modal.com", // origin must match your domain & subdomain
    icons: ["https://avatars.githubusercontent.com/u/37784886"],
};

// Create wagmiConfig
const chains = [sepolia] as const;

export const config = defaultWagmiConfig({
    chains,
    projectId,
    metadata,
});
