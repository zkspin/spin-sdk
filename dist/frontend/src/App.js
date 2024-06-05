"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importStar(require("react"));
require("./App.css");
const core_1 = require("@wagmi/core");
const ABI_json_1 = require("./ABI.json");
const web3_1 = require("./web3");
const Spin_1 = require("./spin/Spin");
const actions_1 = require("wagmi/actions");
const GAME_CONTRACT_ADDRESS = "0xe054298AA62aC6D0Ab982A8a610f6D3406874D9D";
const ZK_USER_ADDRESS = import.meta.env.VITE_ZK_USER_ADDRESS;
const ZK_USER_PRIVATE_KEY = import.meta.env.VITE_ZK_USER_PRIVATE_KEY;
const ZK_IMAGE_ID = import.meta.env.VITE_ZK_CLOUD_IMAGE_ID;
const ZK_CLOUD_RPC_URL = "https://rpc.zkwasmhub.com:8090";
/* This function is used to verify the proof on-chain */
function verify_onchain(_a) {
    return __awaiter(this, arguments, void 0, function* ({ proof, verify_instance, aux, instances }) {
        const result = yield (0, core_1.writeContract)(web3_1.config, {
            abi: ABI_json_1.abi,
            address: GAME_CONTRACT_ADDRESS,
            functionName: "submitScore",
            args: [proof, verify_instance, aux, [instances]],
        });
        const transactionReceipt = (0, core_1.waitForTransactionReceipt)(web3_1.config, {
            hash: result,
        });
        return transactionReceipt;
    });
}
/* This function is used to get the on-chain game states */
function getOnchainGameStates() {
    return __awaiter(this, void 0, void 0, function* () {
        const result = (yield (0, actions_1.readContract)(web3_1.config, {
            abi: ABI_json_1.abi,
            address: GAME_CONTRACT_ADDRESS,
            functionName: "getStates",
            args: [],
        }));
        return result.map((r) => Number(r));
    });
}
let spin;
function App() {
    (0, react_1.useEffect)(() => {
        getOnchainGameStates().then((result) => {
            const total_steps = result[0];
            const current_position = result[1];
            console.log("total_steps = ", total_steps);
            console.log("current_position = ", current_position);
            setOnChainGameStates({
                total_steps,
                current_position,
            });
            spin = new Spin_1.Spin({
                onReady: onGameInitReady(total_steps, current_position),
                cloudCredentials: {
                    CLOUD_RPC_URL: ZK_CLOUD_RPC_URL,
                    USER_ADDRESS: ZK_USER_ADDRESS,
                    USER_PRIVATE_KEY: ZK_USER_PRIVATE_KEY,
                    IMAGE_HASH: ZK_IMAGE_ID,
                },
            });
        });
    }, []);
    const [gameState, setGameState] = (0, react_1.useState)({
        total_steps: 0,
        current_position: 0,
    });
    const [onChainGameStates, setOnChainGameStates] = (0, react_1.useState)({
        total_steps: 0,
        current_position: 0,
    });
    const [moves, setMoves] = (0, react_1.useState)([]);
    const onClick = (command) => () => {
        spin.step(command);
        spin.add_private_input(command);
        updateDisplay();
    };
    const updateDisplay = () => {
        const newGameState = spin.getGameState();
        setGameState(newGameState);
        setMoves(spin.witness);
    };
    const onGameInitReady = (total_steps, current_position) => () => {
        spin.init_game({
            total_steps: total_steps,
            current_position: current_position,
        });
        spin.add_public_input(total_steps);
        spin.add_public_input(current_position);
        updateDisplay();
    };
    // Submit the proof to the cloud
    const submitProof = () => __awaiter(this, void 0, void 0, function* () {
        const proof = yield spin.submitProof();
        // onchain verification operations
        console.log("submitting proof");
        const verificationResult = yield verify_onchain(proof);
        console.log("verificationResult = ", verificationResult);
        // wait for the transaction to be broadcasted, better way is to use event listener
        yield new Promise((r) => setTimeout(r, 1000));
        const gameStates = yield getOnchainGameStates();
        setOnChainGameStates({
            total_steps: gameStates[0],
            current_position: gameStates[1],
        });
        spin.reset(onGameInitReady(gameStates[0], gameStates[1]));
    });
    return (<div className="App">
            <header className="App-header">
                <w3m-button />
                <header>GamePlay</header>
                <header>Number of Moves: {moves.length}</header>
                <header>
                    How to Play: this game let the player increase or decrease
                    the position. The position ranges from 0-10. It keeps track
                    of the total steps so far and current position. When
                    submitted on-chain, the progresses are updated and recorded
                    on-chain{" "}
                </header>
                <header>Game State: {JSON.stringify(gameState)}</header>
                <header>
                    OnChain Game State: {JSON.stringify(onChainGameStates)}
                </header>
                <button onClick={onClick(0)}>Decrement</button>
                <button onClick={onClick(1)}>Increment</button>
            </header>
            <button onClick={submitProof}>Submit</button>
        </div>);
}
exports.default = App;
//# sourceMappingURL=App.js.map