"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const client_1 = __importDefault(require("react-dom/client"));
const App_tsx_1 = __importDefault(require("./App.tsx"));
require("./index.css");
const web3_tsx_1 = require("./web3.tsx");
client_1.default.createRoot(document.getElementById("root")).render(<react_1.default.StrictMode>
    <web3_tsx_1.Web3ModalProvider>
      <App_tsx_1.default />
    </web3_tsx_1.Web3ModalProvider>
  </react_1.default.StrictMode>);
//# sourceMappingURL=main.js.map