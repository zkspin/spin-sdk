"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("@nomicfoundation/hardhat-toolbox");
require("dotenv/config");
console.log(process.env);
const config = {
    solidity: "0.8.24",
    networks: {
        hardhat: {
            forking: {
                url: process.env.SEPOLIA_RPC_URL,
            },
        },
        sepolia: {
            url: process.env.SEPOLIA_RPC_URL,
            accounts: [process.env.DEPLOYER_PRIVATE_KEY],
        },
    },
    etherscan: {
        apiKey: process.env.ETHERSCAN_API_KEY,
    },
};
exports.default = config;
//# sourceMappingURL=hardhat.config.js.map