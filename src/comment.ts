import fs from "fs";
import path from "path";

export async function commentAllFiles(
    folderPath: string,
    searchString: string,
    comment: string = "//SPIN_INTERMEDITE_COMMENT@"
) {
    const files = await getFiles(folderPath);

    for (const file of files) {
        if (path.extname(file) === ".rs") {
            await commentLinesInFile(file, searchString, comment);
        }
    }
}

export async function unCommentAllFiles(
    folderPath: string,
    searchString: string,
    comment: string = "//SPIN_INTERMEDITE_COMMENT@"
) {
    const files = await getFiles(folderPath);

    for (const file of files) {
        if (path.extname(file) === ".rs") {
            await uncommentLinesInFile(file, searchString, comment);
        }
    }
}

async function getFiles(
    dir: string,
    allFiles: string[] = []
): Promise<string[]> {
    const files = await fs.promises.readdir(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = await fs.promises.stat(filePath);
        if (stat.isDirectory()) {
            await getFiles(filePath, allFiles);
        } else {
            allFiles.push(filePath);
        }
    }
    return allFiles;
}

export async function commentLinesInFile(
    filePath: string,
    searchString: string,
    comment: string
): Promise<void> {
    const data = await fs.promises.readFile(filePath, "utf8");
    const lines = data.split("\n");
    const commentedLines = lines.map((line: string) => {
        if (line.trim().startsWith(searchString)) {
            return `${comment}${line}`;
        }
        return line;
    });
    await fs.promises.writeFile(filePath, commentedLines.join("\n"), "utf8");
}

export async function uncommentLinesInFile(
    filePath: string,
    searchString: string,
    comment: string
): Promise<void> {
    const data = await fs.promises.readFile(filePath, "utf8");

    const lines = data.split("\n");
    const uncommentedLines = lines.map((line: string) => {
        if (line.trim().startsWith(comment)) {
            const uncommentedLine = line.replace(comment, "");
            return uncommentedLine;
        }

        return line;
    });

    await fs.promises.writeFile(filePath, uncommentedLines.join("\n"), "utf8");

    return;
}
