#!/usr/bin/env node
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const zkwasm_1 = require("./zkwasm");
const ethers_1 = require("ethers");
const args = process.argv.slice(2);
const FOLDER_IGNORE_LIST = [
    "node_modules",
    ".git",
    "target",
    "dist",
    "params",
    "artifacts",
    "cache",
    "typechain-types",
];
const FILE_IGNORE_LIST = [".env"];
const ZK_CLOUD_USER_ADDRESS = "0xd8f157Cc95Bc40B4F0B58eb48046FebedbF26Bde";
const ZK_CLOUD_USER_PRIVATE_KEY = "2763537251e2f27dc6a30179e7bf1747239180f45b92db059456b7da8194995a";
const ZK_CLOUD_URL = "https://rpc.zkwasmhub.com:8090";
/**
 * Copy the contents of one folder to another.
 * Ignore file in the .gitignore file.
 * @param src The source folder path.
 * @param dest The destination folder path.
 */
function copyFolderSync(src, dest) {
    if (!fs_1.default.existsSync(src)) {
        console.error(`Source folder does not exist: ${src}`);
        return;
    }
    // Create destination folder if it doesn't exist
    if (fs_1.default.existsSync(dest)) {
        console.error(`Destination folder already exists: ${dest}`);
    }
    fs_1.default.mkdirSync(dest, { recursive: true });
    // Read the contents of the source folder
    const entries = fs_1.default.readdirSync(src, { withFileTypes: true });
    // Iterate through each entry in the source folder
    for (const entry of entries) {
        const srcPath = path_1.default.join(src, entry.name);
        const destPath = path_1.default.join(dest, entry.name);
        if (entry.isDirectory() && !FOLDER_IGNORE_LIST.includes(entry.name)) {
            // Recursively copy directories
            copyFolderSync(srcPath, destPath);
        }
        else if (entry.isFile() && !FILE_IGNORE_LIST.includes(entry.name)) {
            // Copy files
            fs_1.default.copyFileSync(srcPath, destPath);
        }
    }
}
function init() {
    // Argument Parsing and Validation
    if (args.length < 2) {
        console.error("Please provide a folder name.");
        console.error(" Usage: npx spin init [folderName] --[optionalArgs]");
        process.exit(1);
    }
    const optionalArgs = args.filter((arg) => arg.startsWith("--"));
    const folderName = args[1];
    if (optionalArgs.includes(folderName)) {
        console.error("Please provide a valid folder name. Provided: ", folderName);
        console.error(" Usage: npx spin init [folderName] --[optionalArgs]");
    }
    const sourcePath = path_1.default.join(__dirname, "..", "sdk");
    const destinationPath = path_1.default.join(process.cwd(), folderName);
    if (optionalArgs.includes("--hackathon")) {
        // Copy Rust Gameplay Contract Example
        const sourceDirGameplay = path_1.default.join(sourcePath, "terminal-based-game-demo", "gameplay");
        const destinationDirGameplay = path_1.default.join(destinationPath, "gameplay");
        copyFolderSync(sourceDirGameplay, destinationDirGameplay);
        // Copy Frontend Example
        const sourceDirFrontend = path_1.default.join(sourcePath, "terminal-based-game-demo", "frontend");
        const destinationDirFrontend = path_1.default.join(destinationPath, "frontend");
        copyFolderSync(sourceDirFrontend, destinationDirFrontend);
        // No need for a onchain contract for the hackathon
        // Everyone shares the same contract, deployed by the organizers
        console.log(`Successfully initialized under folder for hackathon: ${destinationPath}`);
        return;
    }
    // Copy Frontend Example
    const sourceDirFrontend = path_1.default.join(sourcePath, "frontend");
    const destinationDirFrontend = path_1.default.join(destinationPath, "frontend");
    copyFolderSync(sourceDirFrontend, destinationDirFrontend);
    // Copy OnChain Contract Example
    const sourceDirOnChain = path_1.default.join(sourcePath, "onchain");
    const destinationDirOnChain = path_1.default.join(destinationPath, "onchain");
    copyFolderSync(sourceDirOnChain, destinationDirOnChain);
    // Copy Rust Gameplay Contract Example
    const sourceDirGameplay = path_1.default.join(sourcePath, "gameplay");
    const destinationDirGameplay = path_1.default.join(destinationPath, "gameplay");
    copyFolderSync(sourceDirGameplay, destinationDirGameplay);
    console.log(`Successfully initialized under folder: ${destinationPath}`);
}
function help() {
    console.log("Usage: npx spin [command] \n");
    console.log("Commands:");
    console.log("  init [folderName]  Initialize project with gameplay folder");
    console.log("  help               Show help information");
    console.log("  build-image        Build the project wasm image");
    console.log("  publish-image      Publish the project wasm image");
    console.log("  dry-run            Run a dry-run of the wasm image");
    console.log("  version            Show the version of spin");
    console.log("Options:");
    console.log("  --path             Path to the provable_game_logic folder");
    console.log("  --zkwasm           Path to the zkwasm-cli folder");
    console.log("  --public           Public inputs for the dry-run");
    console.log("  --private          Private inputs for the dry-run");
    console.log("  --seed             Seed for the dry-run");
    console.log("  --keyCode          KeyCode for the dry-run");
    console.log("  --hackathon        Initialize for the hackathon");
}
function build() {
    console.log("Building project...");
    const optionalArgs = args.filter((arg) => arg.startsWith("--"));
    if (!optionalArgs.includes("--path")) {
        console.error("--path flag is required, a path to provable_game_logic folder.");
        console.error("Usage: npx spin build-image --path [path]");
        process.exit(1);
    }
    const projectPath = parsePath(args[args.indexOf("--path") + 1]);
    console.log("Building project at path:", projectPath);
    const { spawnSync } = require("child_process");
    const runMakefile = spawnSync("make", ["build"], { cwd: projectPath });
    console.log(`stdout: ${runMakefile.stdout.toString()} ${runMakefile.stderr.toString()}`);
    // """
    // @cargo build && wasm-pack build --release --out-name $(OUT_NAME) --target web --out-dir pkg
    // # Append the JS import helper to the front of the generated JS file
    // cat misc/wasm_import_template.js > temp.js && tail -n +2 pkg/$(OUT_NAME).js >> temp.js && mv temp.js pkg/$(OUT_NAME).js
    // cd js/spin && npm install && npm run build
    // """
}
function publish() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("Publishing project...");
        const optionalArgs = args.filter((arg) => arg.startsWith("--"));
        if (!optionalArgs.includes("--path")) {
            console.error("--path flag is required, a path to provable_game_logic folder.");
            console.error("Usage: npx spin publish-image --path [path]");
            process.exit(1);
        }
        const folderPath = parsePath(args[args.indexOf("--path") + 1]);
        const filePath = path_1.default.join(folderPath, "pkg", "gameplay_bg.wasm");
        if (!fs_1.default.existsSync(filePath)) {
            console.error("Path does not exist: ", filePath);
            process.exit(1);
        }
        if (!filePath.endsWith(".wasm")) {
            console.error("Path must contain a .wasm file.");
            process.exit(1);
        }
        console.log("Publishing wasm image at path:", filePath);
        const { imageCommitment, md5 } = yield (0, zkwasm_1.addImage)({
            USER_ADDRESS: ZK_CLOUD_USER_ADDRESS,
            USER_PRIVATE_KEY: ZK_CLOUD_USER_PRIVATE_KEY,
            IMAGE_HASH: "",
            CLOUD_RPC_URL: ZK_CLOUD_URL,
        }, filePath);
        function createCommit2() {
            return ethers_1.ethers.solidityPackedKeccak256(["uint256", "uint256", "uint256"], [imageCommitment[0], imageCommitment[1], imageCommitment[2]]);
        }
        const gameID = createCommit2();
        console.log("--------------------");
        console.log("Record The Following Information:");
        console.log("Game ID: ", gameID);
        console.log("Image Hash", md5);
        console.log("Image Commitments: ", imageCommitment);
        return imageCommitment;
    });
}
function version() {
    return;
}
function parsePath(_path) {
    // check if wasmPath is absolute or relative
    if (!path_1.default.isAbsolute(_path)) {
        return path_1.default.join(process.cwd(), _path);
    }
    else {
        return _path;
    }
}
function dryRun() {
    // get the working directory
    const optionalArgs = args.filter((arg) => arg.startsWith("--"));
    if (!optionalArgs.includes("--path") ||
        !optionalArgs.includes("--zkwasm")) {
        console.error("--path flag is required, a path to provable_game_logic folder.");
        console.error("--zkwasm flag is required, a path to folder containing zkwasm-cli");
        console.error("Usage: npx spin dry-run --path [path] --zkwasm [zkwasm path] --public [public inputs] ... --private [private inputs] --private [private inputs] ...", "Hackathon Usage: npx spin dry-run --path [path] --zkwasm [zkwasm path] --seed [seed] --keyCode [keyCode] --keyCode [keyCode] ...");
        process.exit(1);
    }
    const filePath = parsePath(args[args.indexOf("--path") + 1]);
    const wasmPath = parsePath(args[args.indexOf("--zkwasm") + 1]);
    if (!fs_1.default.existsSync(filePath)) {
        console.error("Path does not exist: ", filePath);
        process.exit(1);
    }
    if (!fs_1.default.existsSync(wasmPath)) {
        console.error("Zkwasm Path does not exist: ", wasmPath);
        process.exit(1);
    }
    let publicInputs = [];
    for (let i = 0; i < args.length; i++) {
        if (args[i].startsWith("--public") || args[i].startsWith("--seed")) {
            publicInputs.push(args[i + 1]);
        }
    }
    let privateInputs = [];
    for (let i = 0; i < args.length; i++) {
        if (args[i].startsWith("--private") ||
            args[i].startsWith("--keyCode")) {
            privateInputs.push(args[i + 1]);
        }
    }
    console.log("Running dry-run for wasm at path:", filePath);
    const { spawnSync } = require("child_process");
    const runSetup = spawnSync(`${wasmPath}/zkwasm-cli`, [
        "--params",
        `${filePath}/params`,
        "wasm_output",
        "setup",
        "--wasm",
        `${filePath}/pkg/gameplay_bg.wasm`,
    ]);
    console.log(`${runSetup.stdout.toString()} ${runSetup.stderr.toString()}`);
    const wasmArgs = [
        "--params",
        `${filePath}/params`,
        "wasm_output",
        "dry-run",
        "--wasm",
        `${filePath}/pkg/gameplay_bg.wasm`,
        "--output",
        `${filePath}/output`,
        ...publicInputs.flatMap((i) => ["--public", `${i}:i64`]),
        "--private",
        `${privateInputs.length}:i64`,
        ...privateInputs.flatMap((i) => ["--private", `${i}:i64`]),
    ];
    console.log("Running dry-run with args:", wasmArgs.join(" "));
    const runDryRun = spawnSync(`${wasmPath}/zkwasm-cli`, wasmArgs);
    console.log(`${runDryRun.stdout.toString()} ${runDryRun.stderr.toString()}`);
}
const VERSION = "0.0.1";
const INTERNAL_VERSION = "0.2";
function entry() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("Running Spin version", VERSION, INTERNAL_VERSION);
        if (args[0] === "init") {
            init();
        }
        else if (args[0] === "build-image") {
            build();
        }
        else if (args[0] === "publish-image") {
            yield publish();
        }
        else if (args[0] === "dry-run") {
            dryRun();
        }
        else if (args[0] === "version") {
            version();
        }
        else if (args[0] === "help") {
            help();
        }
        else {
            console.error("Invalid command.");
            help();
        }
    });
}
entry();
