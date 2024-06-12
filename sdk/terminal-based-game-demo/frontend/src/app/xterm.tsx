"use client";

import React, { useEffect, useRef } from "react";
import { Gameplay } from "./GamePlay";

// const game = new Gameplay();

// const randomGameState = game.get_state_in_string();

const TERMINAL_WIDTH = 80;
const TERMINAL_HEIGHT = 30;

const CELL_PIXEL_SIZE = 20;

export default function Terminal() {
    const [gameMatrix, setGameMatrix] = React.useState<number[][]>([]);

    // Listen to KeyDown event
    useEffect(() => {
        const matrix: number[][] = []; // Assuming you have a matrix of ASCII values

        // Generate the matrix of ASCII values
        for (let i = 0; i < TERMINAL_HEIGHT; i++) {
            matrix[i] = [];
            for (let j = 0; j < TERMINAL_WIDTH; j++) {
                matrix[i][j] = 43;
            }
        }
        setGameMatrix(matrix);

        const handleKeyDown = (event: KeyboardEvent) => {
            console.log("Key pressed: ", event.key);

            const _temp: number[][] = [];
            // When a key is pressed, update the matrix of ASCII values
            for (let i = 0; i < TERMINAL_HEIGHT; i++) {
                _temp[i] = [];
                for (let j = 0; j < TERMINAL_WIDTH; j++) {
                    _temp[i][j] = getRandomAsciiValue();
                }
            }
            setGameMatrix(_temp);
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, []);

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
            {gameMatrix.map((row, i) =>
                row.map((asciiValue, j) => (
                    <div
                        key={`${i}-${j}`}
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
                        {String.fromCharCode(asciiValue)}
                    </div>
                ))
            )}
        </div>
    );
}

function getRandomAsciiValue() {
    // Generate a random ASCII value between 32 and 126
    return Math.floor(Math.random() * (126 - 32 + 1) + 32);
}
