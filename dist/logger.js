"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const pino_1 = require("pino");
const transport = pino_1.pino.transport({
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
exports.logger = (0, pino_1.pino)({}, transport);
