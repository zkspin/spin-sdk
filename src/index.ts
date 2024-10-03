// Save the original console.log function
const originalConsoleLog = console.log;

// Override console.log
console.log = (message?: any, ...optionalParams: any[]) => {
    // temporary injection to reduce zkwasmutil logs
};

import fs from "fs";
import path, { basename } from "path";
import { logger } from "./logger";
import { addImage, proveImage } from "./zkwasm";
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
    ZK_CLOUD_USER_PRIVATE_KEY,
} from "./config";
import { Command, Option } from "commander";
import { convertPlayerActionToPublicPrivateInputs } from "@zkspin/lib";
import { convertToBigInts } from "@zkspin/lib";
import { version } from "../package.json";
import { publishGameOnchain } from "./blockchain";

const MISC_SCRIPT_FOLDER_PATH = path.join(__dirname, "..", "..", "misc");

enum ZkSpinLanguage {
    RUST = "rust",
    ASSEMBLY_SCRIPT = "assemblyscript",
}

function checkProjectLanguageFromConfigFile(projectPath: string) {
    const zkspinConfig = path.join(projectPath, "..", "zkspin.config.json");

    if (!fs.existsSync(zkspinConfig)) {
        throw new Error(
            `zkspin.config.json not found at the path: ${zkspinConfig}`
        );
    }

    const config = JSON.parse(fs.readFileSync(zkspinConfig, "utf8"));

    if (!config.language) {
        throw new Error(
            `"language" not found in zkspin.config.json at the path: ${zkspinConfig}`
        );
    }

    const languages = Object.values(ZkSpinLanguage);

    if (!languages.includes(config.language)) {
        throw new Error(
            `Invalid language: ${config.language} in zkspin.config.json at the path: ${zkspinConfig}`
        );
    }

    return config.language as ZkSpinLanguage;
}

async function init(
    folderName: string,
    provingType: "ZK" | "OPZK",
    envType: "node" | "browser",
    clientWallet: "web3modal" | "dynamic"
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

    const repoUrl = repoConfig[provingType][clientWallet];

    if (!repoUrl) {
        throw new Error(
            `Not implemented for proving type: ${provingType} and client wallet: ${clientWallet}`
        );
    }

    const git = simpleGit();
    await git.clone(repoUrl, destinationPath);

    logger.info(`Successfully initialized under folder: ${destinationPath}`);
}

async function buildImage(projectPath: string) {
    const currentDir = process.cwd();

    // Check if the current directory is inside the gameplay folder or its parent
    const insideGameplayDir = currentDir.endsWith("gameplay");

    // If the user is inside the gameplay directory, the path should be './provable_game_logic'
    if (
        insideGameplayDir &&
        projectPath === path.join(".", "gameplay", "provable_game_logic")
    ) {
        throw new Error(
            `Invalid project path: '${projectPath}'. Since you're inside the 'gameplay' directory, the correct path should be './provable_game_logic'.`
        );
    }

    // If the user is outside the gameplay directory, the path should be './gameplay/provable_game_logic'
    if (
        !insideGameplayDir &&
        projectPath === path.join(".", "provable_game_logic")
    ) {
        throw new Error(
            `Invalid project path: '${projectPath}'. Since you're outside the 'gameplay' directory, the correct path should be './gameplay/provable_game_logic'.`
        );
    }

    // Check if the provided path actually exists
    if (!fs.existsSync(projectPath)) {
        throw new Error(
            `The provided project path does not exist: ${projectPath}`
        );
    }

    const language = checkProjectLanguageFromConfigFile(projectPath);

    const makeFilePath = path.join(
        MISC_SCRIPT_FOLDER_PATH,
        `Makefile_${language}`
    );

    logger.info(`provable_game_logic directory found at ${projectPath}`);

    const exportPath = path.join(projectPath, "..", "export");
    logger.info(`export path. , ${exportPath}`);

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
            "build-wasm-js",
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

    try {
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
    } catch (err) {
        logger.error(`Failed to publish game onchain. \n${err}`);
        logger.error(
            "Make sure chain is running, contract is deployed, and you have enough funds."
        );
        process.exit(1);
    }
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
        logger.error(`Path does not exist: ${filePath}`);
        process.exit(1);
    }

    if (!fs.existsSync(wasmPath) || basename(wasmPath) !== "zkwasm-cli") {
        logger.error(`Zkwasm Path does not exist: ${wasmPath}`);
        process.exit(1);
    }

    logger.info("Running dry-run for wasm at path:", filePath);

    const { spawnSync } = require("child_process");

    logger.info(
        `Running setup with args --wasm ${filePath}/wasm/gameplay_bg.wasm`
    );

    const runSetupCommand = [
        "--params",
        `${filePath}/params`,
        "wasm_output",
        "setup",
        "--wasm",
        `${filePath}/wasm/gameplay_bg.wasm`,
    ];
    const runSetup = spawnSync(`${wasmPath}`, runSetupCommand, {
        stdio: "pipe",
    });

    logger.info(`Running: cd ${wasmPath} && ${runSetupCommand.join(" ")}`);
    logger.info(`Setup output: ${runSetup.stdout.toString()}`);

    if (runSetup.status !== 0) {
        logger.error(`Setup error: ${runSetup.stderr.toString()}`);
        process.exit(1);
    }

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

    if (runDryRun.status !== 0) {
        logger.error(`Dry-run error: ${runDryRun.stderr.toString()}`);
        process.exit(1);
    }
}

async function generateProve(
    md5: string,
    publicInputs: bigint[],
    privateInputs: bigint[]
) {
    logger.info(`Generating proof for md5: ${md5}`);

    const proof = await proveImage(
        {
            USER_ADDRESS: ZK_CLOUD_USER_ADDRESS,
            USER_PRIVATE_KEY: ZK_CLOUD_USER_PRIVATE_KEY,
            IMAGE_HASH: md5,
            CLOUD_RPC_URL: ZK_CLOUD_URL,
        },
        privateInputs,
        publicInputs
    );

    logger.info(`Successfully generated proof for md5: ${md5}`);

    logger.info("--------------------");
    logger.info("Record The Following Information:");
    logger.info("--------------------");
    logger.info(`MD5: ${md5}`);
    logger.info(`Proof: ${proof?.proof}`);
    logger.info(`Instance: ${proof?.instances}`);
    logger.info(`VerifingInstance: ${proof?.verify_instance}`);
    logger.info("--------------------");
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
    .addOption(
        new Option("-w, --wallet <web3modal|dynamic>", "Client wallet")
            .choices(["web3modal", "dynamic"])
            .default("web3modal")
    )
    .action((folderName, options) => {
        init(folderName, options.type, options.env, options.wallet);
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
    .command("prove-raw")
    .description("Run an image with raw inputs, outputs for debugging")
    .argument("<image md5>", "Image MD5")
    .option("-p, --public <input>", "Public input", collectRepeatable, [])
    .option("-s, --private <input>", "Private input", collectRepeatable, [])
    .action((md5, options) => {
        generateProve(md5, options.public, options.private);
    });

program
    .command("prove")
    .description("Run an image")
    .argument("<image md5>", "Image MD5")
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
    .action((md5, options) => {
        if (!options.initial || !options.action) {
            throw new Error("Missing initial or action");
        }
        // check if options.initial and options.action can be converted to bigint
        const _initialStates = convertToBigInts(options.initial);
        const _action = convertToBigInts(options.action);

        const { publicInputs, privateInputs } =
            convertPlayerActionToPublicPrivateInputs(_initialStates, _action, {
                game_id: BigInt(options.game_id),
            });

        generateProve(md5, publicInputs, privateInputs);
    });

program
    .command("version")
    .description("Print version")
    .action(() => {
        logger.info(`Version: ${version}`);
    });

program.parse();
