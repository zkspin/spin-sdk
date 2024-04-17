import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import { vars } from "hardhat/config";

const ETHERSCAN_API_KEY = vars.get("ETHERSCAN_API_KEY");

const config: HardhatUserConfig = {
  solidity: "0.8.24",
  networks: {
    hardhat: {
      forking: {
        // url: "https://eth-sepolia.g.alchemy.com/v2/MXuvmxv3aXZixmNN792h_CaDlYYDE95A",
        url: "https://sepolia.infura.io/v3/029ae7e31fa8491ab71d15c1976f8867",
      },
    },
    sepolia: {
      url: "https://sepolia.infura.io/v3/029ae7e31fa8491ab71d15c1976f8867",
      accounts: [
        "0523267457b16e08e82f6aa1a81ff03043cfd9e80a2b3b5d6949caafee99b6ff",
      ],
    },
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
  },
};

export default config;
