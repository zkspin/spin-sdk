import path from "path";
import { commentAllFiles, unCommentAllFiles } from "../src/comment";

async function testComment() {
    const testDir = path.join(__dirname, "..", "sdk", "gameplay", "test");

    await commentAllFiles(testDir, "#[wasm_bindgen]");
}

async function testUnComment() {
    const testDir = path.join(__dirname, "..", "sdk", "gameplay", "test");

    await unCommentAllFiles(testDir, "#[wasm_bindgen]");
}

async function main() {
    await testComment();
    await testUnComment();
}

main();
