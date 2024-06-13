"use client";
import React from "react";
import Terminal from "./xterm";
import Leaderboard from "./Leaderboard";
import CreateGame from "./CreateGame";
import Settings from "./Settings";

export default function Home() {
    const [leaderboardOpen, setLeaderboardOpen] = React.useState(false);
    const [settingsOpen, setSettingsOpen] = React.useState(false);
    const [createGameOpen, setCreateGameOpen] = React.useState(false);
    const gameId = 1;

    function onClickOpenLeaderboard() {
        if (settingsOpen || createGameOpen) {
            return;
        }
        // Open the leaderboard
        console.log("Open leaderboard");
        setLeaderboardOpen(true);
    }

    function onClickOpenSettings() {
        console.log("settingsOpen", settingsOpen);
        console.log("createGameOpen", createGameOpen);
        if (leaderboardOpen || createGameOpen) {
            return;
        }
        // Open the settings
        console.log("Open settings");
        setSettingsOpen(true);
    }

    function onClickOpenCreateGame() {
        if (leaderboardOpen || settingsOpen) {
            return;
        }
        setCreateGameOpen(true);
    }

    function closeLeaderboard() {
        setLeaderboardOpen(false);
    }

    function closeSettings() {
        setSettingsOpen(false);
    }

    function closeCreateGame() {
        setCreateGameOpen(false);
    }

    return (
        <>
            <div
                style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                }}
            >
                <h1>Spin Playground</h1>
            </div>
            <div
                style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                }}
            >
                <div>
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "flex-end",
                            marginTop: "20px",
                            marginBottom: "20px",
                        }}
                    >
                        <div
                            style={{
                                padding: "10px 20px",
                                marginRight: "10px",
                                color: "white",
                                border: "none",
                                borderRadius: "4px",
                                cursor: "pointer",
                                fontFamily: "monospace",
                            }}
                        >
                            <w3m-button />
                        </div>
                        <button
                            style={{
                                padding: "10px 20px",
                                marginRight: "10px",
                                backgroundColor: "#4CAF50",
                                color: "white",
                                border: "none",
                                borderRadius: "4px",
                                cursor: "pointer",
                            }}
                            onClick={onClickOpenLeaderboard}
                        >
                            Leaderboard
                        </button>
                        <button
                            style={{
                                padding: "10px 20px",
                                backgroundColor: "grey",
                                color: "white",
                                border: "none",
                                borderRadius: "4px",
                                cursor: "pointer",
                            }}
                            onClick={onClickOpenSettings}
                        >
                            Settings
                        </button>

                        <button
                            style={{
                                padding: "10px 20px",
                                marginLeft: "10px",
                                backgroundColor: "black",
                                color: "white",
                                border: "none",
                                borderRadius: "4px",
                                cursor: "pointer",
                            }}
                            onClick={onClickOpenCreateGame}
                        >
                            Create Game
                        </button>
                    </div>
                    <Terminal createGameOpen={createGameOpen} />
                </div>
                <div
                    style={{
                        position: "fixed",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        backgroundColor: "white",
                    }}
                >
                    {leaderboardOpen && (
                        <Leaderboard
                            onClickCloseLeaderboard={closeLeaderboard}
                            gameId={gameId}
                        />
                    )}
                    {settingsOpen && (
                        <Settings onClickCloseSettings={closeSettings} />
                    )}
                    {createGameOpen && <CreateGame onClose={closeCreateGame} />}
                </div>
            </div>
        </>
    );
}
