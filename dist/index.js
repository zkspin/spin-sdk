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
const logger_1 = require("./logger");
const zkwasm_1 = require("./zkwasm");
const comment_1 = require("./comment");
const config_1 = require("./config");
const args = process.argv.slice(2);
/**
 * Copy the contents of one folder to another.
 * Ignore file in the .gitignore file.
 * @param src The source folder path.
 * @param dest The destination folder path.
 */
function copyFolderSync(src, dest) {
    if (!fs_1.default.existsSync(src)) {
        logger_1.logger.error(`Source folder does not exist: ${src}`);
        return;
    }
    // Create destination folder if it doesn't exist
    if (fs_1.default.existsSync(dest)) {
        logger_1.logger.error(`Destination folder already exists: ${dest}`);
    }
    fs_1.default.mkdirSync(dest, { recursive: true });
    // Read the contents of the source folder
    const entries = fs_1.default.readdirSync(src, { withFileTypes: true });
    // Iterate through each entry in the source folder
    for (const entry of entries) {
        const srcPath = path_1.default.join(src, entry.name);
        const destPath = path_1.default.join(dest, entry.name);
        if (entry.isDirectory() && !config_1.FOLDER_IGNORE_LIST.includes(entry.name)) {
            // Recursively copy directories
            copyFolderSync(srcPath, destPath);
        }
        else if (entry.isFile() && !config_1.FILE_IGNORE_LIST.includes(entry.name)) {
            // Copy files
            fs_1.default.copyFileSync(srcPath, destPath);
        }
    }
}
function init() {
    // Argument Parsing and Validation
    if (args.length < 2) {
        logger_1.logger.error("Please provide a folder name.");
        logger_1.logger.error(" Usage: npx spin init [folderName] --[optionalArgs]");
        process.exit(1);
    }
    const optionalArgs = args.filter((arg) => arg.startsWith("--"));
    const folderName = args[1];
    if (optionalArgs.includes(folderName)) {
        logger_1.logger.error("Please provide a valid folder name. Provided: ", folderName);
        logger_1.logger.error(" Usage: npx spin init [folderName] --[optionalArgs]");
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
    logger_1.logger.info(`Successfully initialized under folder: ${destinationPath}`);
}
function help() {
    logger_1.logger.info("Usage: npx spin [command] \n");
    logger_1.logger.info("Commands:");
    logger_1.logger.info("  init [folderName]  Initialize project with gameplay folder");
    logger_1.logger.info("  help               Show help information");
    logger_1.logger.info("  build-image        Build the project wasm image");
    logger_1.logger.info("  publish-image      Publish the project wasm image");
    logger_1.logger.info("  dry-run            Run a dry-run of the wasm image");
    logger_1.logger.info("  version            Show the version of spin");
    logger_1.logger.info("Options:");
    logger_1.logger.info("  --path             Path to the provable_game_logic folder");
    logger_1.logger.info("  --zkwasm           Path to the zkwasm-cli folder");
    logger_1.logger.info("  --public           Public inputs for the dry-run");
    logger_1.logger.info("  --private          Private inputs for the dry-run");
}
function build() {
    return __awaiter(this, void 0, void 0, function* () {
        logger_1.logger.info("Building project...");
        const optionalArgs = args.filter((arg) => arg.startsWith("--"));
        if (!optionalArgs.includes("--path")) {
            logger_1.logger.error("--path flag is required, path of the provable_game_logic folder.");
            logger_1.logger.error("Usage: npx spin build-image --path [path]");
            process.exit(1);
        }
        const projectPath = parsePath(args[args.indexOf("--path") + 1]);
        const miscPath = path_1.default.join(__dirname, "..", "misc");
        const makeFilePath = path_1.default.join(miscPath, "Makefile");
        const exportPath = path_1.default.join(projectPath, "..", "export");
        const outDir = projectPath;
        logger_1.logger.info(`Building project at path: ${projectPath}...`);
        const { spawnSync } = require("child_process");
        logger_1.logger.info(`Successfully built project at path: ${projectPath}`);
        logger_1.logger.info("Building javascript packages...");
        spawnSync("make", [
            "--makefile",
            makeFilePath,
            "build-js",
            `OUTPUT_PATH=${outDir}`,
            `MISC_PATH=${miscPath}`,
        ], {
            cwd: exportPath,
            stdio: "inherit",
        });
        logger_1.logger.info("Successfully built javascript packages.");
        logger_1.logger.info("Building wasm packages for proving...");
        // !!! Caveat for build WASM for proving:
        // zkWASM doesn't support #[wasm_bindgen] for Struct types.
        // As a workaround, we need to comment out the #[wasm_bindgen]
        // and then commonet it back after building the wasm.
        const bindGenComment = "#[wasm_bindgen";
        yield (0, comment_1.commentAllFiles)(projectPath, bindGenComment);
        yield (0, comment_1.commentLinesInFile)(path_1.default.join(exportPath, "src", "export.rs"), bindGenComment, "//SPIN_INTERMEDITE_COMMENT@");
        try {
            spawnSync("make", [
                "--makefile",
                makeFilePath,
                "build-wasm-zk",
                `OUTPUT_PATH=${outDir}`,
                `MISC_PATH=${miscPath}`,
            ], {
                cwd: exportPath,
                stdio: "inherit",
            });
        }
        catch (err) {
            logger_1.logger.error(`Failed to build wasm for proving. \n${err}`);
        }
        finally {
            yield (0, comment_1.unCommentAllFiles)(projectPath, bindGenComment);
            yield (0, comment_1.uncommentLinesInFile)(path_1.default.join(exportPath, "src", "export.rs"), bindGenComment, "//SPIN_INTERMEDITE_COMMENT@");
        }
    });
}
function publish() {
    return __awaiter(this, void 0, void 0, function* () {
        logger_1.logger.info("Publishing project...");
        const optionalArgs = args.filter((arg) => arg.startsWith("--"));
        if (!optionalArgs.includes("--path")) {
            logger_1.logger.error("--path flag is required, a path to provable_game_logic folder.");
            logger_1.logger.error("Usage: npx spin publish-image --path [path]");
            process.exit(1);
        }
        const folderPath = parsePath(args[args.indexOf("--path") + 1]);
        const filePath = path_1.default.join(folderPath, "..", "export", "wasm", "gameplay_bg.wasm");
        if (!fs_1.default.existsSync(filePath)) {
            logger_1.logger.error(`Path does not exist: ${filePath}`);
            process.exit(1);
        }
        if (!filePath.endsWith(".wasm")) {
            logger_1.logger.error("Path must contain a .wasm file.");
            process.exit(1);
        }
        logger_1.logger.info(`Publishing wasm image at path: ${filePath}`);
        const { imageCommitment, md5 } = yield (0, zkwasm_1.addImage)({
            USER_ADDRESS: config_1.ZK_CLOUD_USER_ADDRESS,
            USER_PRIVATE_KEY: config_1.ZK_CLOUD_USER_PRIVATE_KEY,
            IMAGE_HASH: "",
            CLOUD_RPC_URL: config_1.ZK_CLOUD_URL,
        }, filePath);
        logger_1.logger.info("Successfully published wasm image.");
        logger_1.logger.info("--------------------");
        logger_1.logger.info("Record The Following Information:");
        logger_1.logger.info("--------------------");
        logger_1.logger.info(`MD5: ${md5}`);
        logger_1.logger.info(`Image Commitment: ${imageCommitment}`);
        logger_1.logger.info("--------------------");
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
        logger_1.logger.error("--path flag is required, a path to provable_game_logic folder.");
        logger_1.logger.error("--zkwasm flag is required, a path to folder containing zkwasm-cli");
        logger_1.logger.error("Usage: npx spin dry-run --path [path] --zkwasm [zkwasm path] --public [public inputs] ... --private [private inputs] --private [private inputs] ...", "Hackathon Usage: npx spin dry-run --path [path] --zkwasm [zkwasm path] --seed [seed] --keyCode [keyCode] --keyCode [keyCode] ...");
        process.exit(1);
    }
    const gameLogicPath = parsePath(args[args.indexOf("--path") + 1]);
    const filePath = path_1.default.join(gameLogicPath, "..", "export");
    const wasmPath = parsePath(args[args.indexOf("--zkwasm") + 1]);
    if (!fs_1.default.existsSync(filePath)) {
        logger_1.logger.error("Path does not exist: ", filePath);
        process.exit(1);
    }
    if (!fs_1.default.existsSync(wasmPath)) {
        logger_1.logger.error("Zkwasm Path does not exist: ", wasmPath);
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
    logger_1.logger.info("Running dry-run for wasm at path:", filePath);
    const { spawnSync } = require("child_process");
    const runSetup = spawnSync(`${wasmPath}/zkwasm-cli`, [
        "--params",
        `${filePath}/params`,
        "wasm_output",
        "setup",
        "--wasm",
        `${filePath}/wasm/gameplay_bg.wasm`,
    ], { stdio: "inherit" });
    const wasmArgs = [
        "--params",
        `${filePath}/params`,
        "wasm_output",
        "dry-run",
        "--wasm",
        `${filePath}/wasm/gameplay_bg.wasm`,
        "--output",
        `${filePath}/output`,
        ...publicInputs.flatMap((i) => ["--public", `${i}:i64`]),
        "--private",
        `${privateInputs.length}:i64`,
        ...privateInputs.flatMap((i) => ["--private", `${i}:i64`]),
    ];
    logger_1.logger.info("Running dry-run with args:", wasmArgs.join(" "));
    const runDryRun = spawnSync(`${wasmPath}/zkwasm-cli`, wasmArgs, {
        stdio: "inherit",
    });
}
const VERSION = "0.5.0";
function entry() {
    return __awaiter(this, void 0, void 0, function* () {
        logger_1.logger.info("Running Spin version", VERSION);
        if (args[0] === "init") {
            init();
        }
        else if (args[0] === "build-image") {
            yield build();
        }
        else if (args[0] === "publish-image") {
            yield publish();
        }
        else if (args[0] === "dry-run") {
            yield dryRun();
        }
        else if (args[0] === "version") {
            version();
        }
        else if (args[0] === "help") {
            help();
        }
        else {
            logger_1.logger.error("Invalid command.");
            help();
        }
    });
}
entry();
