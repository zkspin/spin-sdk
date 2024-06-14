"use client";

import React, { useEffect } from "react";
import { Spin } from "spin";

const TERMINAL_WIDTH = 80;
const TERMINAL_HEIGHT = 30;

const CELL_PIXEL_SIZE = 20;

interface TerminalProps {
    createGameOpen: boolean;
}

const ZK_CLOUD_USER_ADDRESS = "0xd8f157Cc95Bc40B4F0B58eb48046FebedbF26Bde";
const ZK_CLOUD_USER_PRIVATE_KEY =
    "2763537251e2f27dc6a30179e7bf1747239180f45b92db059456b7da8194995a";
const ZK_CLOUD_URL = "https://rpc.zkwasmhub.com:8090";

let spin: Spin;

export default function Terminal({ createGameOpen }: TerminalProps) {
    const [gameString, setGameString] = React.useState<string>("");
    useEffect(() => {
        spin = new Spin({
            onReady: () => {
                console.log("Spin is ready");
                const randomSeed = Math.floor(Math.random() * 1000000);
                spin.init_game(randomSeed);
            },
            cloudCredentials: {
                USER_ADDRESS: ZK_CLOUD_USER_ADDRESS,
                USER_PRIVATE_KEY: ZK_CLOUD_USER_PRIVATE_KEY,
                IMAGE_HASH: "",
                CLOUD_RPC_URL: ZK_CLOUD_URL,
            },
        });
    }, []);
    let processing = false;

    const handleKeyDown = (event: KeyboardEvent) => {
        if (createGameOpen) {
            return;
        }

        if (processing) {
            console.log("Processing...");
            return;
        }

        processing = true;

        spin.step(Number(event.keyCode));

        const gameState = spin.getGameState();
        const displayString: string =
            typeof gameState === "string"
                ? gameState
                : JSON.stringify(gameState);
        console.log("Game state: ", displayString);

        setGameString(displayString.padEnd(30 * 80, " "));

        processing = false;
    };

    // Listen to KeyDown event
    useEffect(() => {
        setGameString("Welcome to the game!".padEnd(30 * 80, " "));

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [createGameOpen]);

    // display the matrix of ASCII values
    // each value in a square cell of 10x10 pixels

    return (
        <div
            style={{
                display: "grid",
                gridTemplateColumns: `repeat(${TERMINAL_WIDTH}, ${CELL_PIXEL_SIZE}px)`,
                gridTemplateRows: `repeat(${TERMINAL_HEIGHT}, ${CELL_PIXEL_SIZE}px)`,
            }}
        >
            {gameString.split("").map((asciiValue, i) => (
                <div
                    key={i}
                    style={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        width: CELL_PIXEL_SIZE + 1,
                        height: CELL_PIXEL_SIZE + 1,
                        backgroundColor: "black",
                        color: Math.random() < 0.5 ? "green" : "darkgreen",
                        font: "bold 16px monospace",
                    }}
                >
                    {asciiValue}
                </div>
            ))}
        </div>
    );
}

function getRandomAsciiValue() {
    // Generate a random ASCII value between 32 and 126
    return Math.floor(Math.random() * (126 - 32 + 1) + 32);
}
