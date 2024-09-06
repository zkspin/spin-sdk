#!/usr/bin/env node
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Save the original console.log function
const originalConsoleLog = console.log;
// Override console.log
console.log = (message, ...optionalParams) => {
    // temporary injection to reduce zkwasmutil logs
};
const fs_1 = __importDefault(require("fs"));
const path_1 = __importStar(require("path"));
const logger_1 = require("./logger");
const zkwasm_1 = require("./zkwasm");
const comment_1 = require("./comment");
const config_1 = require("./config");
const commander_1 = require("commander");
const spin_game_prover_1 = require("../sdk/lib/spin_game_prover");
const util_1 = require("../sdk/lib/util");
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
function init(folderName, provingType) {
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
function buildImage(projectPath) {
    return __awaiter(this, void 0, void 0, function* () {
        const miscPath = path_1.default.join(__dirname, "..", "..", "misc");
        const makeFilePath = path_1.default.join(miscPath, "Makefile");
        const exportPath = path_1.default.join(projectPath, "..", "export");
        const outDir = ".";
        logger_1.logger.info(`Building project at path: ${projectPath}...`);
        const { spawnSync } = require("child_process");
        logger_1.logger.info(`Successfully built project at path: ${projectPath}`);
        logger_1.logger.info("Start building WASM for browser & node packages...");
        const build_spin_output = spawnSync("make", [
            "--makefile",
            makeFilePath,
            "build-spin",
            `OUTPUT_PATH=${outDir}`,
            `MISC_PATH=${miscPath}`,
        ], {
            cwd: exportPath,
            stdio: "pipe",
        });
        if (!build_spin_output.stdout.toString().includes("BUILD_SPIN_SUCCESS")) {
            logger_1.logger.error(build_spin_output.stdout.toString());
            logger_1.logger.error(build_spin_output.stderr.toString());
            logger_1.logger.error("Failed to build web & node packages.");
            process.exit(1);
        }
        logger_1.logger.info("Start building wasm packages for proving...");
        // !!! Caveat for build WASM for proving:
        // zkWASM doesn't support #[wasm_bindgen] for Struct types.
        // As a workaround, we need to comment out the #[wasm_bindgen]
        // and then commonet it back after building the wasm.
        const bindGenComment = "#[wasm_bindgen";
        yield (0, comment_1.commentAllFiles)(projectPath, bindGenComment);
        yield (0, comment_1.commentLinesInFile)(path_1.default.join(exportPath, "src", "export.rs"), bindGenComment, "//SPIN_INTERMEDITE_COMMENT@");
        const importBindGenComment = "use wasm_bindgen::prelude::*;";
        yield (0, comment_1.commentAllFiles)(projectPath, importBindGenComment);
        yield (0, comment_1.commentLinesInFile)(path_1.default.join(exportPath, "src", "export.rs"), importBindGenComment, "//SPIN_INTERMEDITE_COMMENT@");
        try {
            const build_zk_wasm_out = spawnSync("make", [
                "--makefile",
                makeFilePath,
                "build-wasm-zk",
                `OUTPUT_PATH=${outDir}`,
                `MISC_PATH=${miscPath}`,
            ], {
                cwd: exportPath,
                stdio: "pipe",
            });
            logger_1.logger.debug(build_zk_wasm_out.stdout.toString());
            if (build_zk_wasm_out.stdout
                .toString()
                .includes("BUILD_WASM_ZK_SUCCESS")) {
                logger_1.logger.info(`Successfully built wasm packages for proving.`);
            }
            else {
                logger_1.logger.error(build_zk_wasm_out.stdout.toString());
                logger_1.logger.error(build_zk_wasm_out.stderr.toString());
                throw new Error("Failed to build wasm packages for proving.");
            }
        }
        catch (err) {
            logger_1.logger.error(`Failed to build wasm for proving. \n${err}`);
        }
        finally {
            yield (0, comment_1.unCommentAllFiles)(projectPath, bindGenComment);
            yield (0, comment_1.uncommentLinesInFile)(path_1.default.join(exportPath, "src", "export.rs"), bindGenComment, "//SPIN_INTERMEDITE_COMMENT@");
            yield (0, comment_1.unCommentAllFiles)(projectPath, importBindGenComment);
            yield (0, comment_1.uncommentLinesInFile)(path_1.default.join(exportPath, "src", "export.rs"), importBindGenComment, "//SPIN_INTERMEDITE_COMMENT@");
        }
    });
}
function publishImage(projectPath) {
    return __awaiter(this, void 0, void 0, function* () {
        logger_1.logger.info("Publishing project...");
        const filePath = path_1.default.join(projectPath, "..", "export", "wasm", "gameplay_bg.wasm");
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
        logger_1.logger.info(`Image Commitments: [${imageCommitment[0]}n,${imageCommitment[1]}n,${imageCommitment[2]}n]`);
        logger_1.logger.info("--------------------");
        return imageCommitment;
    });
}
function version() {
    logger_1.logger.info(`Version: ${VERSION}`);
    return;
}
function dryRun(projectPath, zkwasmCLIPath, publicInputs, privateInputs) {
    const gameLogicPath = projectPath;
    const filePath = path_1.default.join(gameLogicPath, "..", "export");
    const wasmPath = zkwasmCLIPath;
    if (!fs_1.default.existsSync(filePath)) {
        logger_1.logger.error("Path does not exist: ", filePath);
        process.exit(1);
    }
    if (!fs_1.default.existsSync(wasmPath) || (0, path_1.basename)(wasmPath) !== "zkwasm-cli") {
        logger_1.logger.error("Zkwasm Path does not exist: ", wasmPath);
        process.exit(1);
    }
    logger_1.logger.info("Running dry-run for wasm at path:", filePath);
    const { spawnSync } = require("child_process");
    logger_1.logger.info(`Running setup with args --wasm ${filePath}/wasm/gameplay_bg.wasm`);
    const runSetup = spawnSync(`${wasmPath}`, [
        "--params",
        `${filePath}/params`,
        "wasm_output",
        "setup",
        "--wasm",
        `${filePath}/wasm/gameplay_bg.wasm`,
    ], { stdio: "pipe" });
    logger_1.logger.debug(`Setup output: ${runSetup.stdout.toString()}`);
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
        ...privateInputs.flatMap((i) => ["--private", `${i}:i64`]),
    ];
    logger_1.logger.info("Running dry-run with args:" + wasmArgs.join(" "));
    const runDryRun = spawnSync(`${wasmPath}`, wasmArgs, {
        stdio: "pipe",
    });
    logger_1.logger.info(`Dry-run output: ${runDryRun.stdout.toString()}`);
}
const VERSION = "0.5.0";
const program = new commander_1.Command();
function collectRepeatable(value, previous) {
    // console.log(arguments);
    if (previous._isDefault) {
        return [value];
    }
    previous.push(value);
    return previous;
}
function commaSeparatedList(value, dummyPrevious) {
    return value.split(",");
}
program
    .name("zkspin-cli")
    .description("CLI for developing on-chain ZK proved application.")
    .version(VERSION)
    .showHelpAfterError()
    .showSuggestionAfterError();
program
    .command("init")
    .description("Initialize a new folder")
    .argument("<folder-name>", "Name for the project folder")
    .addOption(new commander_1.Option("-t, --type <ZK|OPZK>", "Choice of ZK Only or OPZK")
    .choices(["ZK", "OPZK"])
    .makeOptionMandatory())
    .action((folderName, type) => {
    init(folderName, type);
});
program
    .command("build-image")
    .description("Build an image from an existing project")
    .argument("<path>", "Path to the provable_game_logic folder")
    .action((projectPath) => {
    buildImage(projectPath);
});
program
    .command("publish-image")
    .description("Publish an image to ZKWASM")
    .argument("<path>", "Path to the provable_game_logic folder")
    .action((projectPath) => {
    publishImage(projectPath);
});
program
    .command("dry-run-raw")
    .description("Dry run an image with raw inputs, outputs for debugging")
    .argument("<path>", "Path to the provable_game_logic folder")
    .argument("<wasm-path>", "Path to the zkwasm cli")
    .option("-p, --public <input>", "Public input", collectRepeatable, [])
    .option("-s, --private <input>", "Private input", collectRepeatable, [])
    .action((projectPath, wasmPath, options) => {
    dryRun(projectPath, wasmPath, options.public, options.private);
});
program
    .command("dry-run")
    .description("Dry run an image")
    .argument("<path>", "Path to the provable_game_logic folder")
    .argument("<wasm-path>", "Path to the zkwasm cli")
    .option("-i, --initial <list of initial states, comma separated>", "Initial game states", commaSeparatedList)
    .option("-a, --action <list of actions, comma separated>", "player actions", commaSeparatedList)
    .option("--game_id <game id>", "Meta:  Game ID", "123")
    .action((projectPath, wasmPath, options) => {
    if (!options.initial || !options.action) {
        throw new Error("Missing initial or action");
    }
    // check if options.initial and options.action are arrays
    if (Array.isArray(options.initial) === false) {
        throw new Error("Initial state is not an array");
    }
    if (Array.isArray(options.action) === false) {
        throw new Error("Action is not an array");
    }
    // check if options.initial and options.action can be converted to bigint
    const _initialStates = (0, util_1.converToBigInts)(options.initial);
    const _action = (0, util_1.converToBigInts)(options.action);
    const { publicInputs, privateInputs } = (0, spin_game_prover_1.convertPlayerActionToPublicPrivateInputs)(_initialStates, _action, {
        game_id: BigInt(options.game_id),
    });
    dryRun(projectPath, wasmPath, publicInputs, privateInputs);
});
program
    .command("version")
    .description("Print version")
    .action(() => {
    version();
});
program.parse();
