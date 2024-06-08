#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
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
    if (optionalArgs.includes("--plain")) {
        console.log("Initialized project with minimal setup.");
        console.log("TODO: Implement minimal setup.");
        return;
    }
    const sourcePath = path_1.default.join(__dirname, "..", "sdk");
    const destinationPath = path_1.default.join(process.cwd(), folderName);
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
const VERSION = "0.0.1";
const INTERNAL_VERSION = "0.1";
function entry() {
    console.log("Running Spin version", VERSION, INTERNAL_VERSION);
    if (args[0] === "init") {
        init();
    }
    else {
        console.log("Usage: npx spin [command]");
        console.log("Commands:");
        console.log("  init [folderName]  Initialize project with gameplay folder");
        console.log("  help               Show help information");
    }
}
entry();
