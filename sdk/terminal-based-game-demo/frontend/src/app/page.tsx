"use client";
import React, { useEffect } from "react";
import Terminal from "./xterm";
import Leaderboard from "./Leaderboard";
import CreateGame from "./CreateGame";
import Settings from "./Settings";
import { Spin } from "spin";
import { submitGame } from "./Web3API";
import { LoadingScreen } from "./Loading";
let spin: Spin;

const ZK_CLOUD_USER_ADDRESS = "0xd8f157Cc95Bc40B4F0B58eb48046FebedbF26Bde";
const ZK_CLOUD_USER_PRIVATE_KEY =
    "2763537251e2f27dc6a30179e7bf1747239180f45b92db059456b7da8194995a";
const ZK_CLOUD_URL = "https://rpc.zkwasmhub.com:8090";

export default function Home() {
    const [leaderboardOpen, setLeaderboardOpen] = React.useState(false);
    const [settingsOpen, setSettingsOpen] = React.useState(false);
    const [createGameOpen, setCreateGameOpen] = React.useState(false);
    const [loadingScreen, setLoadingScreen] = React.useState(false);
    const [loadingMessage, setLoadingMessage] = React.useState<string>("");
    const [gameSeed, setGameSeed] = React.useState<number>(0);
    const [gameString, setGameString] = React.useState<string>("");
    const [gameScore, setGameScore] = React.useState<number>(0);

    useEffect(() => {
        spin = new Spin({
            onReady: () => {
                console.log("Spin is ready");
                const randomSeed = process.env.NEXT_PUBLIC_GAME_SEED
                    ? Number(process.env.NEXT_PUBLIC_GAME_SEED)
                    : Math.floor(Math.random() * 1000000);
                spin.init_game(randomSeed);
                setGameSeed(randomSeed);
            },
            cloudCredentials: {
                USER_ADDRESS: ZK_CLOUD_USER_ADDRESS,
                USER_PRIVATE_KEY: ZK_CLOUD_USER_PRIVATE_KEY,
                IMAGE_HASH: process.env.NEXT_PUBLIC_IMAGE_HASH!,
                CLOUD_RPC_URL: ZK_CLOUD_URL,
            },
        });
    }, []);

    const handleKeyDown = (event: KeyboardEvent) => {
        if (overlayOpen()) {
            return;
        }

        spin.step(Number(event.keyCode));

        const displayString = spin.getGameState();

        setGameScore(spin.getGameScore());
        console.log("Game state: ", displayString);

        setGameString(displayString.padEnd(30 * 80, " "));
    };

    // Listen to KeyDown event
    useEffect(() => {
        setGameString("Welcome to the game!".padEnd(30 * 80, " "));

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [createGameOpen]);

    function overlayOpen() {
        return (
            leaderboardOpen || settingsOpen || createGameOpen || loadingScreen
        );
    }

    function onClickOpenLeaderboard() {
        if (overlayOpen()) {
            return;
        }
        setLeaderboardOpen(true);
    }

    function onClickOpenSettings() {
        if (overlayOpen()) {
            return;
        }
        setSettingsOpen(true);
    }

    function onClickOpenCreateGame() {
        if (overlayOpen()) {
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

    async function onClickSubmitProof() {
        try {
            setLoadingScreen(true);
            const proof = await spin.generateProof();

            console.log("Proof: ", proof);

            if (proof) {
                await submitGame(proof);

                alert("Game submitted!");
                spin.reset(() => {
                    console.log("Spin is reset ready");
                    const randomSeed = Math.floor(Math.random() * 1000000);
                    spin.init_game(randomSeed);
                });
            }
        } catch (error) {
            alert(`Failed to Submit Proof: ${error}`);
        } finally {
            setLoadingScreen(false);
        }
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
                    <div style={{ display: "flex", flexDirection: "column" }}>
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginBottom: "20px",
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "flex-end",
                                    marginRight: "10px",
                                }}
                            >
                                <span
                                    style={{
                                        marginRight: "10px",
                                        padding: "10px",
                                    }}
                                >
                                    Image Hash:{" "}
                                    {process.env.NEXT_PUBLIC_IMAGE_HASH}
                                </span>
                                <span
                                    style={{
                                        marginRight: "10px",
                                        padding: "10px",
                                    }}
                                >
                                    Game ID: {process.env.NEXT_PUBLIC_GAME_ID}
                                </span>
                            </div>
                            <div style={{ justifyContent: "flex-start" }}>
                                Seed(edit`frontend/.env` to force seed):{" "}
                                {gameSeed} Score: {gameScore}
                            </div>
                        </div>
                    </div>
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
                            onClick={onClickSubmitProof}
                        >
                            Finish & Prove Game
                        </button>
                        <button
                            style={{
                                padding: "10px 20px",
                                marginRight: "10px",
                                backgroundColor: "lightblue",
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
                    <Terminal gameString={gameString} />
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
                    {loadingScreen && (
                        <LoadingScreen loadingMessage={loadingMessage} />
                    )}
                    {leaderboardOpen && (
                        <Leaderboard
                            onClickCloseLeaderboard={closeLeaderboard}
                            gameId={process.env.NEXT_PUBLIC_GAME_ID!}
                        />
                    )}
                    {settingsOpen && (
                        <Settings
                            onClickCloseSettings={closeSettings}
                            gameID={process.env.NEXT_PUBLIC_GAME_ID!}
                        />
                    )}
                    {createGameOpen && (
                        <CreateGame
                            onClose={closeCreateGame}
                            setLoadingScreen={setLoadingScreen}
                        />
                    )}
                </div>
            </div>
        </>
    );
}
