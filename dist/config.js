"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PUBLISH_IMAGE_RETRY_DELAY_IN_SECONDS = exports.PUBLISH_IMAGE_RETRY_COUNT = exports.ZK_CLOUD_USER_PRIVATE_KEY = exports.ZK_CLOUD_USER_ADDRESS = exports.ZK_CLOUD_URL = exports.FILE_IGNORE_LIST = exports.FOLDER_IGNORE_LIST = void 0;
exports.FOLDER_IGNORE_LIST = [
    "node_modules",
    ".git",
    "target",
    "dist",
    "params",
    "artifacts",
    "cache",
    "typechain-types",
    "pkg",
];
exports.FILE_IGNORE_LIST = [".env"];
exports.ZK_CLOUD_URL = "https://rpc.zkwasmhub.com:8090";
exports.ZK_CLOUD_USER_ADDRESS = "0xF7B267C190841C5cFf482AeAb0ED538bc410fEfF";
exports.ZK_CLOUD_USER_PRIVATE_KEY = "a29c4d75df9870c8d318960584daaeed306b8b4687f2fa58f2b2a02626596702";
exports.PUBLISH_IMAGE_RETRY_COUNT = 3;
exports.PUBLISH_IMAGE_RETRY_DELAY_IN_SECONDS = 3;
