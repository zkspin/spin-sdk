import fs from "fs";
import path from "path";

const args = process.argv.slice(2);

console.log("arguments:", args);

/**
 * Copy the contents of one folder to another.
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

        if (entry.isDirectory()) {
            // Recursively copy directories
            copyFolderSync(srcPath, destPath);
        } else {
            // Copy files
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

if (args[0] === "init") {
    const folderName = args[1] || "gameplay";
    const sourceDir = path.join(__dirname, "..", "gameplay");
    const destinationDir = path.join(process.cwd(), folderName);

    copyFolderSync(sourceDir, destinationDir);

    console.log("Initialized project with gameplay folder.");
} else {
    console.log("Hello from the example npm package!");
}
