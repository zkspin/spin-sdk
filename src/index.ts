// Save the original console.log function
const originalConsoleLog = console.log;

// Override console.log
console.log = (message?: any, ...optionalParams: any[]) => {
    // temporary injection to reduce zkwasmutil logs
};

import fs from "fs";
import path from "path";
import { logger } from "./logger";
import { addImage } from "./zkwasm";
import {
    commentAllFiles,
    unCommentAllFiles,
    uncommentLinesInFile,
    commentLinesInFile,
} from "./comment";
import {
    ZK_CLOUD_URL,
    ZK_CLOUD_USER_ADDRESS,
    FOLDER_IGNORE_LIST,
    FILE_IGNORE_LIST,
    ZK_CLOUD_USER_PRIVATE_KEY,
} from "./config";
import { log } from "console";

const args = process.argv.slice(2);

/**
 * Copy the contents of one folder to another.
 * Ignore file in the .gitignore file.
 * @param src The source folder path.
 * @param dest The destination folder path.
 */
function copyFolderSync(src: string, dest: string): void {
    if (!fs.existsSync(src)) {
        logger.error(`Source folder does not exist: ${src}`);
        return;
    }

    // Create destination folder if it doesn't exist
    if (fs.existsSync(dest)) {
        logger.error(`Destination folder already exists: ${dest}`);
    }
    fs.mkdirSync(dest, { recursive: true });

    // Read the contents of the source folder
    const entries = fs.readdirSync(src, { withFileTypes: true });

    // Iterate through each entry in the source folder
    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory() && !FOLDER_IGNORE_LIST.includes(entry.name)) {
            // Recursively copy directories
            copyFolderSync(srcPath, destPath);
        } else if (entry.isFile() && !FILE_IGNORE_LIST.includes(entry.name)) {
            // Copy files
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

function init() {
    // Argument Parsing and Validation
    if (args.length < 2) {
        logger.error("Please provide a folder name.");
        logger.error(" Usage: npx spin init [folderName] --[optionalArgs]");
        process.exit(1);
    }
    const optionalArgs = args.filter((arg) => arg.startsWith("--"));
    const folderName = args[1];

    if (optionalArgs.includes(folderName)) {
        logger.error(
            "Please provide a valid folder name. Provided: ",
            folderName
        );
        logger.error(" Usage: npx spin init [folderName] --[optionalArgs]");
    }

    const sourcePath = path.join(__dirname, "..", "sdk");
    const destinationPath = path.join(process.cwd(), folderName);

    // Copy Frontend Example
    const sourceDirFrontend = path.join(sourcePath, "frontend");
    const destinationDirFrontend = path.join(destinationPath, "frontend");
    copyFolderSync(sourceDirFrontend, destinationDirFrontend);

    // Copy OnChain Contract Example
    const sourceDirOnChain = path.join(sourcePath, "onchain");
    const destinationDirOnChain = path.join(destinationPath, "onchain");
    copyFolderSync(sourceDirOnChain, destinationDirOnChain);

    // Copy Rust Gameplay Contract Example
    const sourceDirGameplay = path.join(sourcePath, "gameplay");
    const destinationDirGameplay = path.join(destinationPath, "gameplay");
    copyFolderSync(sourceDirGameplay, destinationDirGameplay);

    logger.info(`Successfully initialized under folder: ${destinationPath}`);
}

function help() {
    logger.info("Usage: npx spin [command] \n");
    logger.info("Commands:");
    logger.info("  init [folderName]  Initialize project with gameplay folder");
    logger.info("  help               Show help information");
    logger.info("  build-image        Build the project wasm image");
    logger.info("  publish-image      Publish the project wasm image");
    logger.info("  dry-run            Run a dry-run of the wasm image");
    logger.info("  version            Show the version of spin");

    logger.info("Options:");
    logger.info("  --path             Path to the provable_game_logic folder");
    logger.info("  --zkwasm           Path to the zkwasm-cli folder");
    logger.info("  --public           Public inputs for the dry-run");
    logger.info("  --private          Private inputs for the dry-run");
}

async function build() {
    const optionalArgs = args.filter((arg) => arg.startsWith("--"));

    if (!optionalArgs.includes("--path")) {
        logger.error(
            "--path flag is required, path of the provable_game_logic folder."
        );
        logger.error("Usage: npx spin build-image --path [path]");
        process.exit(1);
    }

    const projectPath = parsePath(args[args.indexOf("--path") + 1]);
    const miscPath = path.join(__dirname, "..", "..", "misc");
    const makeFilePath = path.join(miscPath, "Makefile");
    const exportPath = path.join(projectPath, "..", "export");

    const outDir = projectPath;

    logger.info(`Building project at path: ${projectPath}...`);

    const { spawnSync } = require("child_process");

    logger.info(`Successfully built project at path: ${projectPath}`);

    logger.info("Start building WASM for browser & node packages...");

    const build_spin_output = spawnSync(
        "make",
        [
            "--makefile",
            makeFilePath,
            "build-spin",
            `OUTPUT_PATH=${outDir}`,
            `MISC_PATH=${miscPath}`,
        ],
        {
            cwd: exportPath,
            stdio: "pipe",
        }
    ).stdout;

    if (!build_spin_output.toString().includes("BUILD_SPIN_SUCCESS")) {
        logger.error(build_spin_output.toString());
        logger.error("Failed to build web & node packages.");
        process.exit(1);
    }

    logger.info("Start building wasm packages for proving...");
    // !!! Caveat for build WASM for proving:
    // zkWASM doesn't support #[wasm_bindgen] for Struct types.
    // As a workaround, we need to comment out the #[wasm_bindgen]
    // and then commonet it back after building the wasm.

    const bindGenComment = "#[wasm_bindgen";
    await commentAllFiles(projectPath, bindGenComment);
    await commentLinesInFile(
        path.join(exportPath, "src", "export.rs"),
        bindGenComment,
        "//SPIN_INTERMEDITE_COMMENT@"
    );
    const importBindGenComment = "use wasm_bindgen::prelude::*;";

    await commentAllFiles(projectPath, importBindGenComment);
    await commentLinesInFile(
        path.join(exportPath, "src", "export.rs"),
        importBindGenComment,
        "//SPIN_INTERMEDITE_COMMENT@"
    );

    try {
        const build_zk_wasm_out = spawnSync(
            "make",
            [
                "--makefile",
                makeFilePath,
                "build-wasm-zk",
                `OUTPUT_PATH=${outDir}`,
                `MISC_PATH=${miscPath}`,
            ],
            {
                cwd: exportPath,
                stdio: "pipe",
            }
        ).stdout;

        if (build_zk_wasm_out.toString().includes("BUILD_WASM_ZK_SUCCESS")) {
            logger.info(`Successfully built wasm packages for proving.`);
        } else {
            throw new Error(build_zk_wasm_out.toString());
        }
    } catch (err) {
        logger.error(`Failed to build wasm for proving. \n${err}`);
    } finally {
        await unCommentAllFiles(projectPath, bindGenComment);
        await uncommentLinesInFile(
            path.join(exportPath, "src", "export.rs"),
            bindGenComment,
            "//SPIN_INTERMEDITE_COMMENT@"
        );
        await unCommentAllFiles(projectPath, importBindGenComment);
        await uncommentLinesInFile(
            path.join(exportPath, "src", "export.rs"),
            importBindGenComment,
            "//SPIN_INTERMEDITE_COMMENT@"
        );
    }
}

async function publish() {
    logger.info("Publishing project...");

    const optionalArgs = args.filter((arg) => arg.startsWith("--"));

    if (!optionalArgs.includes("--path")) {
        logger.error(
            "--path flag is required, a path to provable_game_logic folder."
        );
        logger.error("Usage: npx spin publish-image --path [path]");
        process.exit(1);
    }

    const folderPath = parsePath(args[args.indexOf("--path") + 1]);

    const filePath = path.join(
        folderPath,
        "..",
        "export",
        "wasm",
        "gameplay_bg.wasm"
    );

    if (!fs.existsSync(filePath)) {
        logger.error(`Path does not exist: ${filePath}`);
        process.exit(1);
    }

    if (!filePath.endsWith(".wasm")) {
        logger.error("Path must contain a .wasm file.");
        process.exit(1);
    }

    logger.info(`Publishing wasm image at path: ${filePath}`);

    const { imageCommitment, md5 } = await addImage(
        {
            USER_ADDRESS: ZK_CLOUD_USER_ADDRESS,
            USER_PRIVATE_KEY: ZK_CLOUD_USER_PRIVATE_KEY,
            IMAGE_HASH: "",
            CLOUD_RPC_URL: ZK_CLOUD_URL,
        },
        filePath
    );

    logger.info("Successfully published wasm image.");
    logger.info("--------------------");
    logger.info("Record The Following Information:");
    logger.info("--------------------");
    logger.info(`MD5: ${md5}`);
    logger.info(
        `Image Commitments: [${imageCommitment[0]}n,${imageCommitment[1]}n,${imageCommitment[2]}n]`
    );
    logger.info("--------------------");

    return imageCommitment;
}

function version() {
    return;
}

function parsePath(_path: string) {
    // check if wasmPath is absolute or relative
    if (!path.isAbsolute(_path)) {
        return path.join(process.cwd(), _path);
    } else {
        return _path;
    }
}

function dryRun() {
    // get the working directory

    const optionalArgs = args.filter((arg) => arg.startsWith("--"));
    if (
        !optionalArgs.includes("--path") ||
        !optionalArgs.includes("--zkwasm")
    ) {
        logger.error(
            "--path flag is required, a path to provable_game_logic folder."
        );
        logger.error(
            "--zkwasm flag is required, a path to folder containing zkwasm-cli"
        );
        logger.error(
            "Usage: npx spin dry-run --path [path] --zkwasm [zkwasm path] --public [public inputs] ... --private [private inputs] --private [private inputs] ..."
        );
        process.exit(1);
    }

    const gameLogicPath = parsePath(args[args.indexOf("--path") + 1]);
    const filePath = path.join(gameLogicPath, "..", "export");
    const wasmPath = parsePath(args[args.indexOf("--zkwasm") + 1]);

    if (!fs.existsSync(filePath)) {
        logger.error("Path does not exist: ", filePath);
        process.exit(1);
    }

    if (!fs.existsSync(wasmPath)) {
        logger.error("Zkwasm Path does not exist: ", wasmPath);
        process.exit(1);
    }

    let publicInputs = [];

    for (let i = 0; i < args.length; i++) {
        if (args[i].startsWith("--public")) {
            publicInputs.push(args[i + 1]);
        }
    }

    let privateInputs = [];

    for (let i = 0; i < args.length; i++) {
        if (args[i].startsWith("--private")) {
            privateInputs.push(args[i + 1]);
        }
    }

    logger.info("Running dry-run for wasm at path:", filePath);

    const { spawnSync } = require("child_process");

    logger.info(
        `Running setup with args --wasm ${filePath}/wasm/gameplay_bg.wasm`
    );

    const runSetup = spawnSync(
        `${wasmPath}/zkwasm-cli`,
        [
            "--params",
            `${filePath}/params`,
            "wasm_output",
            "setup",
            "--wasm",
            `${filePath}/wasm/gameplay_bg.wasm`,
        ],
        { stdio: "pipe" }
    );

    logger.debug(`Setup output: ${runSetup.stdout.toString()}`);

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

    logger.info("Running dry-run with args:" + wasmArgs.join(" "));

    const runDryRun = spawnSync(`${wasmPath}/zkwasm-cli`, wasmArgs, {
        stdio: "pipe",
    });

    logger.info(`Dry-run output: ${runDryRun.stdout.toString()}`);
}

const VERSION = "0.5.0";
async function entry() {
    logger.info(`Running Spin version ${VERSION}`);
    if (args[0] === "init") {
        init();
    } else if (args[0] === "build-image") {
        await build();
    } else if (args[0] === "publish-image") {
        await publish();
    } else if (args[0] === "dry-run") {
        await dryRun();
    } else if (args[0] === "version") {
        version();
    } else if (args[0] === "help") {
        help();
    } else {
        logger.error("Invalid command.");
        help();
    }
}

entry();
