import { pino } from "pino";

const transport = pino.transport({
    targets: [
        {
            target: "pino/file",
            options: { destination: `${__dirname}/app.log` },
        },
        {
            target: "pino-pretty",
        },
    ],
});

export const logger = pino({}, transport);
