#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const args = process.argv.slice(2);
console.log("arguments:", args);
/**
 * Copy the contents of one folder to another.
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
        if (entry.isDirectory()) {
            // Recursively copy directories
            copyFolderSync(srcPath, destPath);
        }
        else {
            // Copy files
            fs_1.default.copyFileSync(srcPath, destPath);
        }
    }
}
if (args[0] === "init") {
    const folderName = args[1] || "gameplay";
    const sourceDir = path_1.default.join(__dirname, "..", "gameplay");
    const destinationDir = path_1.default.join(process.cwd(), folderName);
    copyFolderSync(sourceDir, destinationDir);
    console.log("Initialized project with gameplay folder.");
}
else if (args[0] === "help") {
    console.log("Usage: node index.js [command]");
    console.log("Commands:");
    console.log("  init [folderName]  Initialize project with gameplay folder");
    console.log("  help               Show help information");
}
else {
    console.log("Hello from the example npm package! v1.0.1");
}
