"use client";
import React from "react";
import { getGameLeaderboard, getGame } from "./Web3API";
import { get } from "http";

interface LeaderboardProps {
    onClickCloseLeaderboard: () => void;
    gameId: string;
}

export default function Leaderboard({
    onClickCloseLeaderboard,
    gameId,
}: LeaderboardProps) {
    const [leaderboard, setLeaderboard] = React.useState<
        {
            player: string;
            score: number;
        }[]
    >([]);

    const [gameName, setGameName] = React.useState<string>("");
    const [gameAuthor, setGameAuthor] = React.useState<string>("");
    const [gameDescription, setGameDescription] = React.useState<string>("");

    React.useEffect(() => {
        getGameLeaderboard(gameId).then((data) => {
            setLeaderboard(data);
        });

        getGame(gameId).then((data: any) => {
            console.log("Game Data: ", data);
            setGameName(data.name);
            setGameAuthor(data.author);
            setGameDescription(data.description);
        });
    }, []);

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#f5f5f5",
                padding: "50px",
                borderRadius: "10px",
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
            }}
        >
            <button
                onClick={onClickCloseLeaderboard}
                style={{
                    position: "absolute",
                    top: "10px",
                    right: "10px",
                    padding: "10px",
                    borderRadius: "50%",
                    backgroundColor: "#f5f5f5",
                    border: "none",
                    cursor: "pointer",
                    transform: "scale(1.5)",
                }}
            >
                X
            </button>
            <h1 style={{ marginBottom: "10px" }}>{gameName}</h1>
            <h2 style={{ marginBottom: "20px" }}>by {gameAuthor}</h2>
            <p>{gameDescription}</p>

            <h3 style={{ marginBottom: "10px" }}>Leaderboard</h3>

            <table style={{ marginBottom: "20px" }}>
                <thead>
                    <tr>
                        <th>Player</th>
                        <th style={{ textAlign: "right" }}>Score</th>
                    </tr>
                </thead>
                <tbody>
                    {leaderboard.map((data, index) => (
                        <tr key={index}>
                            <td
                                style={{
                                    fontFamily: "monospace",
                                }}
                            >
                                {data.player}
                            </td>
                            <td style={{ textAlign: "right" }}>
                                {Number(data.score)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <h4>Spin Playground</h4>
        </div>
    );
}
