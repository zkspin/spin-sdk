"use client";
import React from "react";
import Terminal from "./xterm";
import Leaderboard from "./Leaderboard";
import Settings from "./Settings";

export default function Home() {
    const [leaderboardOpen, setLeaderboardOpen] = React.useState(false);
    const [settingsOpen, setSettingsOpen] = React.useState(false);

    function onClickOpenLeaderboard() {
        if (settingsOpen) {
            return;
        }
        // Open the leaderboard
        console.log("Open leaderboard");
        setLeaderboardOpen(true);
    }

    function onClickOpenSettings() {
        if (leaderboardOpen) {
            return;
        }
        // Open the settings
        console.log("Open settings");
        setSettingsOpen(true);
    }

    function closeLeaderboard() {
        setLeaderboardOpen(false);
    }

    function closeSettings() {
        setSettingsOpen(false);
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
                    </div>
                    <Terminal />
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
                        />
                    )}
                    {settingsOpen && (
                        <Settings onClickCloseSettings={closeSettings} />
                    )}
                </div>
            </div>
        </>
    );
}
