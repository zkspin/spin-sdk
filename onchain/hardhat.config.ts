import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "dotenv/config";

console.log(process.env);
const config: HardhatUserConfig = {
    solidity: "0.8.24",
    networks: {
        hardhat: {
            forking: {
                url: process.env.SEPOLIA_RPC_URL!,
            },
        },
        sepolia: {
            url: process.env.SEPOLIA_RPC_URL!,
            accounts: [process.env.DEPLOYER_PRIVATE_KEY!],
        },
    },
    etherscan: {
        apiKey: process.env.ETHERSCAN_API_KEY,
    },
};

export default config;
