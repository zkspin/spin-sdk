"use client";

import React, { useEffect } from "react";

const TERMINAL_WIDTH = 80;
const TERMINAL_HEIGHT = 30;

const CELL_PIXEL_SIZE = 20;

interface TerminalProps {
    gameString: string;
}

export default function Terminal({ gameString }: TerminalProps) {
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
