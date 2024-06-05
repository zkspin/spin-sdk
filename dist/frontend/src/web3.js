"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Web3ModalProvider = exports.config = void 0;
const react_1 = require("@web3modal/wagmi/react");
const config_1 = require("@web3modal/wagmi/react/config");
const wagmi_1 = require("wagmi");
const chains_1 = require("wagmi/chains");
const react_query_1 = require("@tanstack/react-query");
// 0. Setup queryClient
const queryClient = new react_query_1.QueryClient();
// 1. Get projectId at https://cloud.walletconnect.com
const projectId = "e39541c63dd4b2d4f9e6387cde380da9";
// 2. Create wagmiConfig
const metadata = {
    name: "Web3Modal",
    description: "Web3Modal Example",
    url: "https://web3modal.com", // origin must match your domain & subdomain
    icons: ["https://avatars.githubusercontent.com/u/37784886"],
};
const chains = [chains_1.sepolia];
exports.config = (0, config_1.defaultWagmiConfig)({
    chains,
    projectId,
    metadata,
});
// 3. Create modal
(0, react_1.createWeb3Modal)({
    wagmiConfig: exports.config,
    projectId,
    enableAnalytics: true, // Optional - defaults to your Cloud configuration
    enableOnramp: true, // Optional - false as default
});
function Web3ModalProvider({ children }) {
    return (<wagmi_1.WagmiProvider config={exports.config}>
      <react_query_1.QueryClientProvider client={queryClient}>{children}</react_query_1.QueryClientProvider>
    </wagmi_1.WagmiProvider>);
}
exports.Web3ModalProvider = Web3ModalProvider;
//# sourceMappingURL=web3.js.map