import pino from 'pino';
import pretty from 'pino-pretty';

const logLevels: {
    '--trace': string;
    '--debug': string;
    '--info': string;
    '--warn': string;
    '--error': string;
    '--fatal': string;
} = {
    '--trace': 'trace',
    '--debug': 'debug',
    '--info': 'info',
    '--warn': 'warn',
    '--error': 'error',
    '--fatal': 'fatal'
};

function getLogLevel(args: string[]): string {
    let logLevel = 'info'; // Default log level

    for (const arg of args) {
        if (logLevels.hasOwnProperty(arg)) {
            logLevel = logLevels[arg as keyof typeof logLevels];
            break;
        }
    }

    return logLevel;
}

const args = process.argv.slice(2);
const logLevel = getLogLevel(args);

const logger = pino(
    {
        level: logLevel,
        transport: {
            target: 'pino-pretty',
            options: {
                colorize: true,
                translateTime: 'SYS:standard',
                ignore: 'pid,hostname',
            }
        }
    }
);

export default logger;