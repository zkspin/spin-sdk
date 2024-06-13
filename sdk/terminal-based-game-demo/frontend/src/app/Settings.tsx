"use client";
import React from "react";

interface SettingsProps {
    onClickCloseSettings: () => void;
}

export default function Settings({ onClickCloseSettings }: SettingsProps) {
    const [provingStatus, setProvingStatus] = React.useState<
        {
            round: number;
            status: string;
            txn: string;
        }[]
    >([]);

    React.useEffect(() => {
        // Fetch leaderboard data
        const provingStatusData: {
            round: number;
            status: string;
            txn: string;
        }[] = [
            {
                round: 1,
                status: "Proving",
                txn: "0x9a6034c84cd431409ac1a35278c7da36ffda53e5",
            },
            {
                round: 2,
                status: "Proving",
                txn: "0x9a6034c84cd431409ac1a35278c7da36ffda53e5",
            },
            {
                round: 3,
                status: "Proving",
                txn: "0x9a6034c84cd431409ac1a35278c7da36ffda53e5",
            },
        ];
        setProvingStatus(provingStatusData);
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
            <h1 style={{ marginBottom: "10px" }}>Rounds Played</h1>

            <table style={{ marginBottom: "20px" }}>
                <thead>
                    <tr>
                        <th>Player</th>
                        <th style={{ textAlign: "right" }}>Score</th>
                    </tr>
                </thead>
                <tbody>
                    {provingStatus.map((round, i) => (
                        <tr key={i}>
                            <td>{round.round}</td>
                            <td style={{ textAlign: "right" }}>
                                {round.status}
                            </td>
                            <td style={{ textAlign: "right" }}>{round.txn}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <h4>Spin Playground</h4>
        </div>
    );
}
