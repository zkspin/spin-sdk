export const abi = [
    {
        inputs: [
            {
                internalType: "address",
                name: "_verifier_address",
                type: "address",
            },
        ],
        stateMutability: "nonpayable",
        type: "constructor",
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: false,
                internalType: "uint256",
                name: "gameId",
                type: "uint256",
            },
            {
                indexed: false,
                internalType: "string",
                name: "name",
                type: "string",
            },
            {
                indexed: false,
                internalType: "address",
                name: "author",
                type: "address",
            },
        ],
        name: "GameCreated",
        type: "event",
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: false,
                internalType: "uint256",
                name: "gameId",
                type: "uint256",
            },
            {
                indexed: false,
                internalType: "address",
                name: "player",
                type: "address",
            },
            {
                indexed: false,
                internalType: "uint256",
                name: "score",
                type: "uint256",
            },
        ],
        name: "GameStateUpdated",
        type: "event",
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: "address",
                name: "sender",
                type: "address",
            },
        ],
        name: "VerificationSucceeded",
        type: "event",
    },
    {
        inputs: [
            {
                internalType: "string",
                name: "name",
                type: "string",
            },
            {
                internalType: "string",
                name: "description",
                type: "string",
            },
            {
                internalType: "uint256[3]",
                name: "commitments",
                type: "uint256[3]",
            },
        ],
        name: "createGame",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "uint256",
                name: "",
                type: "uint256",
            },
        ],
        name: "gameAuthors",
        outputs: [
            {
                internalType: "address",
                name: "",
                type: "address",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "uint256",
                name: "",
                type: "uint256",
            },
            {
                internalType: "uint256",
                name: "",
                type: "uint256",
            },
        ],
        name: "gameLeaderboard",
        outputs: [
            {
                internalType: "uint256",
                name: "score",
                type: "uint256",
            },
            {
                internalType: "uint256",
                name: "gameEndTime",
                type: "uint256",
            },
            {
                internalType: "uint256",
                name: "gameStartedTime",
                type: "uint256",
            },
            {
                internalType: "uint256",
                name: "seed",
                type: "uint256",
            },
            {
                internalType: "address",
                name: "player",
                type: "address",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "uint256",
                name: "",
                type: "uint256",
            },
            {
                internalType: "address",
                name: "",
                type: "address",
            },
            {
                internalType: "uint256",
                name: "",
                type: "uint256",
            },
        ],
        name: "gameRecords",
        outputs: [
            {
                internalType: "uint256",
                name: "score",
                type: "uint256",
            },
            {
                internalType: "uint256",
                name: "gameEndTime",
                type: "uint256",
            },
            {
                internalType: "uint256",
                name: "gameStartedTime",
                type: "uint256",
            },
            {
                internalType: "uint256",
                name: "seed",
                type: "uint256",
            },
            {
                internalType: "address",
                name: "player",
                type: "address",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "uint256",
                name: "",
                type: "uint256",
            },
        ],
        name: "games",
        outputs: [
            {
                internalType: "string",
                name: "name",
                type: "string",
            },
            {
                internalType: "address",
                name: "author",
                type: "address",
            },
            {
                internalType: "string",
                name: "description",
                type: "string",
            },
            {
                internalType: "uint256",
                name: "createdTime",
                type: "uint256",
            },
            {
                internalType: "uint256",
                name: "totalPlayers",
                type: "uint256",
            },
            {
                internalType: "uint256",
                name: "totalGamesPlayed",
                type: "uint256",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "generatePseudoRandomNumber",
        outputs: [
            {
                internalType: "uint256",
                name: "",
                type: "uint256",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "uint256",
                name: "gameId",
                type: "uint256",
            },
        ],
        name: "getGame",
        outputs: [
            {
                components: [
                    {
                        internalType: "string",
                        name: "name",
                        type: "string",
                    },
                    {
                        internalType: "address",
                        name: "author",
                        type: "address",
                    },
                    {
                        internalType: "string",
                        name: "description",
                        type: "string",
                    },
                    {
                        internalType: "uint256",
                        name: "createdTime",
                        type: "uint256",
                    },
                    {
                        internalType: "uint256",
                        name: "totalPlayers",
                        type: "uint256",
                    },
                    {
                        internalType: "uint256",
                        name: "totalGamesPlayed",
                        type: "uint256",
                    },
                ],
                internalType: "struct SpinGamePlayground.Game",
                name: "",
                type: "tuple",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "uint256",
                name: "gameId",
                type: "uint256",
            },
        ],
        name: "getGameLeaderboard",
        outputs: [
            {
                components: [
                    {
                        internalType: "uint256",
                        name: "score",
                        type: "uint256",
                    },
                    {
                        internalType: "uint256",
                        name: "gameEndTime",
                        type: "uint256",
                    },
                    {
                        internalType: "uint256",
                        name: "gameStartedTime",
                        type: "uint256",
                    },
                    {
                        internalType: "uint256",
                        name: "seed",
                        type: "uint256",
                    },
                    {
                        internalType: "address",
                        name: "player",
                        type: "address",
                    },
                ],
                internalType: "struct SpinGamePlayground.GameRecord[10]",
                name: "",
                type: "tuple[10]",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "uint256",
                name: "gameId",
                type: "uint256",
            },
            {
                internalType: "address",
                name: "player",
                type: "address",
            },
        ],
        name: "getPlayerGameRecords",
        outputs: [
            {
                components: [
                    {
                        internalType: "uint256",
                        name: "score",
                        type: "uint256",
                    },
                    {
                        internalType: "uint256",
                        name: "gameEndTime",
                        type: "uint256",
                    },
                    {
                        internalType: "uint256",
                        name: "gameStartedTime",
                        type: "uint256",
                    },
                    {
                        internalType: "uint256",
                        name: "seed",
                        type: "uint256",
                    },
                    {
                        internalType: "address",
                        name: "player",
                        type: "address",
                    },
                ],
                internalType: "struct SpinGamePlayground.GameRecord[]",
                name: "",
                type: "tuple[]",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "owner",
        outputs: [
            {
                internalType: "address",
                name: "",
                type: "address",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "new_owner",
                type: "address",
            },
        ],
        name: "setOwner",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "verifier_address",
                type: "address",
            },
        ],
        name: "setVerifier",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "uint256",
                name: "gameId",
                type: "uint256",
            },
            {
                internalType: "uint256[3]",
                name: "commitments",
                type: "uint256[3]",
            },
        ],
        name: "setVerifierImageCommitments",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "uint256[]",
                name: "proof",
                type: "uint256[]",
            },
            {
                internalType: "uint256[]",
                name: "verify_instance",
                type: "uint256[]",
            },
            {
                internalType: "uint256[]",
                name: "aux",
                type: "uint256[]",
            },
            {
                internalType: "uint256[][]",
                name: "instances",
                type: "uint256[][]",
            },
        ],
        name: "settleProof",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "uint256",
                name: "gameId",
                type: "uint256",
            },
            {
                internalType: "uint256[]",
                name: "proof",
                type: "uint256[]",
            },
            {
                internalType: "uint256[]",
                name: "verify_instance",
                type: "uint256[]",
            },
            {
                internalType: "uint256[]",
                name: "aux",
                type: "uint256[]",
            },
            {
                internalType: "uint256[][]",
                name: "instances",
                type: "uint256[][]",
            },
        ],
        name: "submitGame",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [],
        name: "totalGames",
        outputs: [
            {
                internalType: "uint256",
                name: "",
                type: "uint256",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "uint256",
                name: "gameId",
                type: "uint256",
            },
            {
                internalType: "string",
                name: "newName",
                type: "string",
            },
            {
                internalType: "string",
                name: "newDescription",
                type: "string",
            },
        ],
        name: "updateGame",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [],
        name: "verifier",
        outputs: [
            {
                internalType: "address",
                name: "",
                type: "address",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "uint256",
                name: "",
                type: "uint256",
            },
            {
                internalType: "uint256",
                name: "",
                type: "uint256",
            },
        ],
        name: "zk_image_commitments",
        outputs: [
            {
                internalType: "uint256",
                name: "",
                type: "uint256",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
];
