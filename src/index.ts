import fs from "fs";
import path from "path";

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

const VERSION = "0.0.1";
const INTERNAL_VERSION = "0.1";
function entry() {
    console.log("Running Spin version", VERSION, INTERNAL_VERSION);
    if (args[0] === "init") {
        init();
    } else {
        console.log("Usage: npx spin [command]");
        console.log("Commands:");
        console.log(
            "  init [folderName]  Initialize project with gameplay folder"
        );
        console.log("  help               Show help information");
    }
}

entry();
