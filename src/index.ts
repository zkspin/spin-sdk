import fs from "fs";
import path from "path";
import { addImage } from "./zkwasm";
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
const ZK_CLOUD_USER_PRIVATE_KEY =
    "2763537251e2f27dc6a30179e7bf1747239180f45b92db059456b7da8194995a";
const ZK_CLOUD_URL = "https://rpc.zkwasmhub.com:8090";

/**
 * Copy the contents of one folder to another.
 * Ignore file in the .gitignore file.
 * @param src The source folder path.
 * @param dest The destination folder path.
 */
function copyFolderSync(src: string, dest: string): void {
    if (!fs.existsSync(src)) {
        console.error(`Source folder does not exist: ${src}`);
        return;
    }

    // Create destination folder if it doesn't exist
    if (fs.existsSync(dest)) {
        console.error(`Destination folder already exists: ${dest}`);
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
        console.error("Please provide a folder name.");
        console.error(" Usage: npx spin init [folderName] --[optionalArgs]");
        process.exit(1);
    }
    const optionalArgs = args.filter((arg) => arg.startsWith("--"));
    const folderName = args[1];

    if (optionalArgs.includes(folderName)) {
        console.error(
            "Please provide a valid folder name. Provided: ",
            folderName
        );
        console.error(" Usage: npx spin init [folderName] --[optionalArgs]");
    }

    const sourcePath = path.join(__dirname, "..", "sdk");
    const destinationPath = path.join(process.cwd(), folderName);

    if (optionalArgs.includes("--hackathon")) {
        // Copy Rust Gameplay Contract Example
        const sourceDirGameplay = path.join(
            sourcePath,
            "terminal-based-game-demo",
            "gameplay"
        );
        const destinationDirGameplay = path.join(destinationPath, "gameplay");
        copyFolderSync(sourceDirGameplay, destinationDirGameplay);

        // Copy Frontend Example
        const sourceDirFrontend = path.join(
            sourcePath,
            "terminal-based-game-demo",
            "frontend"
        );
        const destinationDirFrontend = path.join(destinationPath, "frontend");
        copyFolderSync(sourceDirFrontend, destinationDirFrontend);

        // No need for a onchain contract for the hackathon
        // Everyone shares the same contract, deployed by the organizers
        console.log(
            `Successfully initialized under folder for hackathon: ${destinationPath}`
        );
        return;
    }

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

    console.log(`Successfully initialized under folder: ${destinationPath}`);
}

function help() {
    console.log("Usage: npx spin [command]");
    console.log("Commands:");
    console.log("  init [folderName]  Initialize project with gameplay folder");
    console.log("  help               Show help information");
}

function build() {
    console.log("Building project...");

    const optionalArgs = args.filter((arg) => arg.startsWith("--"));

    if (!optionalArgs.includes("--path")) {
        console.error(
            "--path flag is required, a path to provable_game_logic folder."
        );
        console.error("Usage: npx spin build-image --path [path]");
        process.exit(1);
    }

    const path = args[args.indexOf("--path") + 1];
    console.log("Building project at path:", path);
    const { spawnSync } = require("child_process");

    const runMakefile = spawnSync("make", ["build"]);
    console.log(
        `stdout: ${runMakefile.stdout.toString()} ${runMakefile.stderr.toString()}`
    );
}

async function publish() {
    console.log("Publishing project...");

    const optionalArgs = args.filter((arg) => arg.startsWith("--"));

    if (!optionalArgs.includes("--path")) {
        console.error(
            "--path flag is required, a path to provable_game_logic folder."
        );
        console.error("Usage: npx spin publish-image --path [path]");
        process.exit(1);
    }

    const folderPath = args[args.indexOf("--path") + 1];

    const filePath = path.join(folderPath, "pkg", "gameplay_bg.wasm");

    if (!fs.existsSync(filePath)) {
        console.error("Path does not exist: ", filePath);
        process.exit(1);
    }

    if (!filePath.endsWith(".wasm")) {
        console.error("Path must contain a .wasm file.");
        process.exit(1);
    }

    console.log("Publishing wasm image at path:", filePath);

    const imageCommitment = await addImage(
        {
            USER_ADDRESS: ZK_CLOUD_USER_ADDRESS,
            USER_PRIVATE_KEY: ZK_CLOUD_USER_PRIVATE_KEY,
            IMAGE_HASH: "",
            CLOUD_RPC_URL: ZK_CLOUD_URL,
        },
        filePath
    );

    console.log("Image Commitment: ", imageCommitment);
    return imageCommitment;
}

function hackathon() {
    console.log("Initializing project for hackathon...");
    if (args[1] === "build") {
        const optionalArgs = args.filter((arg) => arg.startsWith("--"));

        if (
            !optionalArgs.includes("--name") ||
            !optionalArgs.includes("--desc") ||
            !optionalArgs.includes("--path")
        ) {
            console.error("--name flag is required, a name for the game.");
            console.error(
                "--desc flag is required, a description for the game."
            );
            console.error(
                "--path flag is required, a path to provable_game_logic folder."
            );
            console.error(
                "Usage: npx spin hackathon build --name [name] --desc [desc] --path [path]"
            );
            process.exit(1);
        }

        const name = args[args.indexOf("--name") + 1];
        const desc = args[args.indexOf("--desc") + 1];

        // this builds image, publish image, and deploy contract
        console.log("Building project...");
        build();
        console.log("Publishing project...");
        const imageCommitment = publish();

        // create game by calling createGame
    }
}

function version() {
    return;
}

const VERSION = "0.0.1";
const INTERNAL_VERSION = "0.2";
async function entry() {
    console.log("Running Spin version", VERSION, INTERNAL_VERSION);
    if (args[0] === "init") {
        init();
    } else if (args[0] === "build-image") {
        build();
    } else if (args[0] === "publish-image") {
        await publish();
    } else if (args[0] == "hackathon") {
        console.log("Initializing project for hackathon...");
        hackathon();
    } else if (args[0] === "version") {
        version();
    } else if (args[0] === "help") {
        help();
    } else {
        console.error("Invalid command.");
        help();
    }
}

entry();
