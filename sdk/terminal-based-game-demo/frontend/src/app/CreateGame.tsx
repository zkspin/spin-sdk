import React, { useState } from "react";
import { createGame } from "./Web3API";
interface CreateGameProps {
    onClose: () => void;
    setLoadingScreen: (loading: boolean) => void;
}

export default function CreateGame({
    onClose,
    setLoadingScreen,
}: CreateGameProps) {
    const [gameName, setGameName] = useState("");
    const [gameDescription, setGameDescription] = useState("");
    const [commitment, setCommitment] = useState<string[]>(["", "", ""]);

    async function onClickCreateGame() {
        try {
            // Create the game
            console.log("Create game");
            console.log("Game Name:", gameName);
            console.log("Game Description:", gameDescription);
            console.log("Commitment:", commitment);
            setLoadingScreen(true);

            const commitmentBigInts = commitment.map((c) => {
                const trimmedC = c.trim();
                const endWithN = trimmedC.endsWith("n");
                return endWithN
                    ? BigInt(trimmedC.substring(0, trimmedC.length - 1))
                    : BigInt(trimmedC);
            });

            const result = await createGame(
                gameName,
                gameDescription,
                commitmentBigInts
            );
            console.log(result);
        } catch (error) {
            alert(`Failed to create game: ${error}`);
        } finally {
            onClose();
            setLoadingScreen(false);
        }
    }

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
                onClick={onClose}
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
            <h1 style={{ marginBottom: "20px" }}>Create Game</h1>
            <div
                style={{
                    marginBottom: "10px",
                    display: "flex",
                    justifyContent: "flex-end",
                }}
            >
                <label style={{ marginRight: "10px" }}>Game Name</label>
                <input
                    type="text"
                    value={gameName}
                    onChange={(e) => setGameName(e.target.value)}
                />
            </div>
            <div
                style={{
                    marginBottom: "10px",
                    display: "flex",
                    justifyContent: "flex-end",
                }}
            >
                <label style={{ marginRight: "10px" }}>Description</label>
                <input
                    type="text"
                    value={gameDescription}
                    onChange={(e) => setGameDescription(e.target.value)}
                />
            </div>
            <div
                style={{
                    marginBottom: "10px",
                    display: "flex",
                    justifyContent: "flex-end",
                }}
            >
                <label style={{ marginRight: "10px" }}>Commitment 0</label>
                <input
                    type="text"
                    value={commitment[0]}
                    onChange={(e) =>
                        setCommitment([
                            e.target.value,
                            commitment[1],
                            commitment[2],
                        ])
                    }
                />
            </div>
            <div
                style={{
                    marginBottom: "10px",
                    display: "flex",
                    justifyContent: "flex-end",
                }}
            >
                <label style={{ marginRight: "10px" }}>Commitment 1</label>
                <input
                    type="text"
                    value={commitment[1]}
                    onChange={(e) =>
                        setCommitment([
                            commitment[0],
                            e.target.value,
                            commitment[2],
                        ])
                    }
                />
            </div>
            <div
                style={{
                    marginBottom: "10px",
                    display: "flex",
                    justifyContent: "flex-end",
                }}
            >
                <label style={{ marginRight: "10px" }}>Commitment 2</label>
                <input
                    type="text"
                    value={commitment[2]}
                    onChange={(e) =>
                        setCommitment([
                            commitment[0],
                            commitment[1],
                            e.target.value,
                        ])
                    }
                />
            </div>
            <button
                onClick={onClickCreateGame}
                style={{
                    padding: "10px 20px",
                    borderRadius: "4px",
                    backgroundColor: "#007bff",
                    color: "#fff",
                    border: "none",
                    cursor: "pointer",
                }}
            >
                Create Game
            </button>
        </div>
    );
}
