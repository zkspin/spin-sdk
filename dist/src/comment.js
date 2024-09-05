"use strict";
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
exports.uncommentLinesInFile = exports.commentLinesInFile = exports.unCommentAllFiles = exports.commentAllFiles = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
function commentAllFiles(folderPath_1, searchString_1) {
    return __awaiter(this, arguments, void 0, function* (folderPath, searchString, comment = "//SPIN_INTERMEDITE_COMMENT@") {
        const files = yield getFiles(folderPath);
        for (const file of files) {
            if (path_1.default.extname(file) === ".rs") {
                yield commentLinesInFile(file, searchString, comment);
            }
        }
    });
}
exports.commentAllFiles = commentAllFiles;
function unCommentAllFiles(folderPath_1, searchString_1) {
    return __awaiter(this, arguments, void 0, function* (folderPath, searchString, comment = "//SPIN_INTERMEDITE_COMMENT@") {
        const files = yield getFiles(folderPath);
        for (const file of files) {
            if (path_1.default.extname(file) === ".rs") {
                yield uncommentLinesInFile(file, searchString, comment);
            }
        }
    });
}
exports.unCommentAllFiles = unCommentAllFiles;
function getFiles(dir_1) {
    return __awaiter(this, arguments, void 0, function* (dir, allFiles = []) {
        const files = yield fs_1.default.promises.readdir(dir);
        for (const file of files) {
            const filePath = path_1.default.join(dir, file);
            const stat = yield fs_1.default.promises.stat(filePath);
            if (stat.isDirectory()) {
                yield getFiles(filePath, allFiles);
            }
            else {
                allFiles.push(filePath);
            }
        }
        return allFiles;
    });
}
function commentLinesInFile(filePath, searchString, comment) {
    return __awaiter(this, void 0, void 0, function* () {
        const data = yield fs_1.default.promises.readFile(filePath, "utf8");
        const lines = data.split("\n");
        const commentedLines = lines.map((line) => {
            if (line.trim().startsWith(searchString)) {
                return `${comment}${line}`;
            }
            return line;
        });
        yield fs_1.default.promises.writeFile(filePath, commentedLines.join("\n"), "utf8");
    });
}
exports.commentLinesInFile = commentLinesInFile;
function uncommentLinesInFile(filePath, searchString, comment) {
    return __awaiter(this, void 0, void 0, function* () {
        const data = yield fs_1.default.promises.readFile(filePath, "utf8");
        const lines = data.split("\n");
        const uncommentedLines = lines.map((line) => {
            if (line.trim().startsWith(comment)) {
                const uncommentedLine = line.replace(comment, "");
                return uncommentedLine;
            }
            return line;
        });
        yield fs_1.default.promises.writeFile(filePath, uncommentedLines.join("\n"), "utf8");
        return;
    });
}
exports.uncommentLinesInFile = uncommentLinesInFile;
