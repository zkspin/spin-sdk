"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pino_1 = __importDefault(require("pino"));
const logLevels = {
    '--trace': 'trace',
    '--debug': 'debug',
    '--info': 'info',
    '--warn': 'warn',
    '--error': 'error',
    '--fatal': 'fatal'
};
function getLogLevel(args) {
    let logLevel = 'info'; // Default log level
    for (const arg of args) {
        if (logLevels.hasOwnProperty(arg)) {
            logLevel = logLevels[arg];
            break;
        }
    }
    return logLevel;
}
const args = process.argv.slice(2);
const logLevel = getLogLevel(args);
const logger = (0, pino_1.default)({
    level: logLevel,
    transport: {
        target: 'pino-pretty',
        options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
        }
    }
});
exports.default = logger;
