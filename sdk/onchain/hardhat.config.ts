import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "dotenv/config";

const config: HardhatUserConfig = {
    solidity: {
        version: "0.8.24",
        settings: {
            viaIR: true, // fix stack too deep error
            optimizer: {
                enabled: true,
                runs: 100, // lower runs to fix ProviderError: max code size exceeded
            },
        },
    },

    defaultNetwork: "hardhat",

    networks: {
        hardhat: {
            // transaction are auto mined
            // mining: {
            //     auto: false,
            //     interval: 1500,
            // },
            // zkwasm verifier contracts are too large for the default hardhat contract size limit
            allowUnlimitedContractSize: true,
        },
        spin_glass: {
            url: "https://spin-glass-sepolia.rpc.caldera.xyz/http",
            accounts: [process.env.SPIN_GLASS_DEPLOYMENT_WALLET_PRIVATE_KEY!],
        },
    },
    etherscan: {
        apiKey: process.env.ETHERSCAN_API_KEY,
    },
};

export default config;
