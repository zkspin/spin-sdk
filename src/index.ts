// Save the original console.log function
const originalConsoleLog = console.log;

// Override console.log
console.log = (message?: any, ...optionalParams: any[]) => {
    // temporary injection to reduce zkwasmutil logs
};

import fs from "fs";
import path, { basename } from "path";
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
import { Command, Option } from "commander";
import { convertPlayerActionToPublicPrivateInputs } from "@zkspin/lib";
import { convertToBigInts } from "@zkspin/lib";
import { version } from "../package.json";
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

function init(
    folderName: string,
    provingType: "ZK" | "OPZK",
    envType: "node" | "browser"
) {
    const sourcePath = path.join(__dirname, "..", "sdk");
    const destinationPath = path.join(process.cwd(), folderName);

    if (envType === "node") {
        throw new Error("Not implemented");
    }

    // Copy Frontend Example
    const sourceDirFrontend = path.join(
        sourcePath,
        "client-examples",
        provingType == "ZK" ? "frontend_zk" : "frontend_opzk"
    );
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

async function buildImage(projectPath: string) {
    const miscPath = path.join(__dirname, "..", "..", "misc");
    const makeFilePath = path.join(miscPath, "Makefile");
    const exportPath = path.join(projectPath, "..", "export");

    const outDir = ".";

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
    );

    if (!build_spin_output.stdout.toString().includes("BUILD_SPIN_SUCCESS")) {
        logger.error(build_spin_output.stdout.toString());
        logger.error(build_spin_output.stderr.toString());
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
        );

        logger.debug(build_zk_wasm_out.stdout.toString());
        if (
            build_zk_wasm_out.stdout
                .toString()
                .includes("BUILD_WASM_ZK_SUCCESS")
        ) {
            logger.info(`Successfully built wasm packages for proving.`);
        } else {
            logger.error(build_zk_wasm_out.stdout.toString());
            logger.error(build_zk_wasm_out.stderr.toString());
            throw new Error("Failed to build wasm packages for proving.");
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

async function publishImage(projectPath: string) {
    logger.info("Publishing project...");

    const filePath = path.join(
        projectPath,
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

function dryRunImage(
    projectPath: string,
    zkwasmCLIPath: string,
    publicInputs: bigint[],
    privateInputs: bigint[]
) {
    const gameLogicPath = projectPath;
    const filePath = path.join(gameLogicPath, "..", "export");
    const wasmPath = zkwasmCLIPath;

    if (!fs.existsSync(filePath)) {
        logger.error("Path does not exist: ", filePath);
        process.exit(1);
    }

    if (!fs.existsSync(wasmPath) || basename(wasmPath) !== "zkwasm-cli") {
        logger.error("Zkwasm Path does not exist: ", wasmPath);
        process.exit(1);
    }

    logger.info("Running dry-run for wasm at path:", filePath);

    const { spawnSync } = require("child_process");

    logger.info(
        `Running setup with args --wasm ${filePath}/wasm/gameplay_bg.wasm`
    );

    const runSetup = spawnSync(
        `${wasmPath}`,
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
        ...privateInputs.flatMap((i) => ["--private", `${i}:i64`]),
    ];

    logger.info("Running dry-run with args:" + wasmArgs.join(" "));

    const runDryRun = spawnSync(`${wasmPath}`, wasmArgs, {
        stdio: "pipe",
    });

    logger.info(`Dry-run output: ${runDryRun.stdout.toString()}`);
}

const program = new Command();

function collectRepeatable(value: any, previous: any) {
    // console.log(arguments);
    if (previous._isDefault) {
        return [value];
    }
    previous.push(value);
    return previous;
}

function commaSeparatedList(value: string, dummyPrevious: any) {
    return value.split(",");
}

program
    .name("zkspin-cli")
    .description("CLI for developing on-chain ZK proved application.")
    .version(version)
    .showHelpAfterError()
    .showSuggestionAfterError();

program
    .command("init")
    .description("Initialize a new folder")
    .argument("<folder-name>", "Name for the project folder")
    .addOption(
        new Option("-t, --type <ZK|OPZK>", "Choice of ZK Only or OPZK")
            .choices(["ZK", "OPZK"])
            .makeOptionMandatory()
    )
    .addOption(
        new Option("-e, --env <node|browser>", "Example environment")
            .choices(["node", "browser"])
            .makeOptionMandatory()
    )
    .action((folderName, type, envType) => {
        init(folderName, type, envType);
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
        dryRunImage(projectPath, wasmPath, options.public, options.private);
    });

program
    .command("dry-run")
    .description("Dry run an image")
    .argument("<path>", "Path to the provable_game_logic folder")
    .argument("<wasm-path>", "Path to the zkwasm cli")
    .option(
        "-i, --initial <list of initial states, comma separated>",
        "Initial game states",
        commaSeparatedList
    )
    .option(
        "-a, --action <list of actions, comma separated>",
        "player actions",
        commaSeparatedList
    )
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

        const _initialStates = convertToBigInts(options.initial);
        const _action = convertToBigInts(options.action);

        const { publicInputs, privateInputs } =
            convertPlayerActionToPublicPrivateInputs(_initialStates, _action, {
                game_id: BigInt(options.game_id),
            });

        dryRunImage(projectPath, wasmPath, publicInputs, privateInputs);
    });

program
    .command("version")
    .description("Print version")
    .action(() => {
        logger.info(`Version: ${version}`);
    });

program.parse();
