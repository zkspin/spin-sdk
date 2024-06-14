"use client";
import React from "react";
import { getPlayerGameRecords } from "./Web3API";

interface SettingsProps {
    gameID: string;
    onClickCloseSettings: () => void;
}

export default function Settings({
    onClickCloseSettings,
    gameID,
}: SettingsProps) {
    const [pastGames, setPastGames] = React.useState<
        {
            seed: number;
            score: string;
            gameStartedTime: number;
        }[]
    >([]);

    React.useEffect(() => {
        // Fetch leaderboard data

        getPlayerGameRecords(gameID).then((data: any) => {
            console.log("Proving Status: ", data);
            const newPastGames = data.map((record: any) => {
                return {
                    seed: Number(record.seed),
                    score: Number(record.score),
                    gameStartedTime: Number(record.gameStartedTime),
                };
            });
            setPastGames(newPastGames);
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
                padding: "20px",
                borderRadius: "8px",
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
            }}
        >
            <button
                onClick={onClickCloseSettings}
                style={{
                    position: "absolute",
                    top: "10px",
                    right: "10px",
                    padding: "5px",
                    borderRadius: "50%",
                    backgroundColor: "#f5f5f5",
                    border: "none",
                    cursor: "pointer",
                }}
            >
                X
            </button>
            <h1 style={{ marginBottom: "10px" }}>Past Games</h1>
            {pastGames.length === 0 && <p>No past games</p>}
            <table style={{ marginBottom: "20px" }}>
                <thead>
                    <tr>
                        <th style={{ textAlign: "right", padding: "20px" }}>
                            Seed
                        </th>
                        <th style={{ textAlign: "right", padding: "20px" }}>
                            Score
                        </th>
                        <th style={{ textAlign: "right", padding: "20px" }}>
                            Game Started Time
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {pastGames.map((round, i) => (
                        <tr key={i}>
                            <td style={{ paddingRight: "30px" }}>
                                {round.seed}
                            </td>
                            <td
                                style={{
                                    textAlign: "right",
                                    paddingRight: "30px",
                                }}
                            >
                                {round.score}
                            </td>
                            <td
                                style={{
                                    textAlign: "right",
                                    paddingRight: "30px",
                                }}
                            >
                                {round.gameStartedTime}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <h4>Spin Playground</h4>
        </div>
    );
}
