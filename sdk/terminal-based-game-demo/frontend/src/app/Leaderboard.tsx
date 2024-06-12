import React from "react";

interface LeaderboardProps {
    onClickCloseLeaderboard: () => void;
}

export default function Leaderboard({
    onClickCloseLeaderboard,
}: LeaderboardProps) {
    const [leaderboard, setLeaderboard] = React.useState<
        {
            player: string;
            score: number;
        }[]
    >([]);

    React.useEffect(() => {
        // Fetch leaderboard data
        const leaderboardData: {
            player: string;
            score: number;
        }[] = [
            {
                player: "0x9a6034c84cd431409ac1a35278c7da36ffda53e5",
                score: 100,
            },
            { player: "0x9a6034c84cd431409ac1a35278c7da36ffda53e5", score: 90 },
            { player: "0x9a6034c84cd431409ac1a35278c7da36ffda53e5", score: 80 },
        ];
        setLeaderboard(leaderboardData);
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
                onClick={onClickCloseLeaderboard}
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
            <h1 style={{ marginBottom: "10px" }}>Game Name</h1>
            <h2 style={{ marginBottom: "20px" }}>by Name (0x342...2111)</h2>

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
                            <td>
                                {data.player.substring(0, 4) +
                                    "..." +
                                    data.player.substring(39)}
                            </td>
                            <td style={{ textAlign: "right" }}>{data.score}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <h4>Spin Playground</h4>
        </div>
    );
}
