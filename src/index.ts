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
import simpleGit from "simple-git";
import { repoConfig } from "../config/repo";

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

const SDK_SOURCE_FOLDER_PATH = path.join(__dirname, "..", "..", "sdk");
const MISC_SCRIPT_FOLDER_PATH = path.join(__dirname, "..", "..", "misc");
const git = simpleGit();

async function init(
    folderName: string,
    provingType: "ZK" | "OPZK",
    envType: "node" | "browser"
) {
    const destinationPath = path.join(process.cwd(), folderName);

    if (envType === "node") {
        throw new Error("Node.js client not implemented");
    }
    if (fs.existsSync(destinationPath)) {
        throw new Error(
            `Folder with name "${folderName}" already exists at the path: ${destinationPath}`
        );
    }

    const repoUrl = repoConfig[provingType];

    const git = simpleGit();
    await git.clone(repoUrl, destinationPath);

    logger.info(`Successfully initialized under folder: ${destinationPath}`);
}

async function buildImage(projectPath: string) {
    const makeFilePath = path.join(MISC_SCRIPT_FOLDER_PATH, "Makefile");

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
            `MISC_PATH=${MISC_SCRIPT_FOLDER_PATH}`,
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
                `MISC_PATH=${MISC_SCRIPT_FOLDER_PATH}`,
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

async function publishImage(
    projectPath: string,
    privateKey: string,
    jsonRPCURL: string,
    registryAddress: string,
    gameName: string,
    gameDescription: string,
    gameAuthorName: string
) {
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

    const onchainData = await publishGameOnchain(
        privateKey,
        jsonRPCURL,
        registryAddress,
        [imageCommitment[0], imageCommitment[1], imageCommitment[2]],
        gameAuthorName,
        gameName,
        gameDescription
    );

    logger.info("Successfully published game onchain.");
    logger.info("--------------------");
    logger.info(`Game ID: ${onchainData.gameId}`);
    logger.info(
        `Game State Storage Contract : ${onchainData.gameStorageAddress}`
    );
    logger.info(`Tx Hash: ${onchainData.txnHash}`);
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
            .default("browser")
    )
    .action((folderName, options) => {
        init(folderName, options.type, options.env);
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
    .option(
        "-p, --private <private jkey>",
        "Deployer private key",
        "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80" // hardhat default
    )
    .option(
        "-u, --url <RPC url>",
        "URL for Json-RPC endpoint",
        "http://127.0.0.1:8545" // local hardhat default
    )
    .option(
        "-r, --registry <registry address>",
        "Game Registry Contract Address",
        "0x61c36a8d610163660E21a8b7359e1Cac0C9133e1"
    )
    .option("-n, --name <game name>", "Game name", "My Game Name")
    .option("-d, --description <description>", "Game description", "My Game")
    .option("-a, --author <author name>", "Game author", "My Name")
    .action((projectPath, options) => {
        publishImage(
            projectPath,
            options.private,
            options.url,
            options.registry,
            options.name,
            options.description,
            options.author
        );
    });

program
    .command("dry-run-raw")
    .description("Dry run an image with raw inputs, outputs for debugging")
    .argument("<path>", "Path to the provable_game_logic folder")
    .argument("<wasm-path>", "Path to the zkwasm cli")
    .option("-p, --public <input>", "Public input", collectRepeatable, [])
    .option("-s, --private <input>", "Private input", collectRepeatable, [])
    .action((projectPath, wasmPath, options) => {
        logger.info("wasmPath:", wasmPath);
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
