interface LoadingScreenProps {
    loadingMessage: string;
}

export function LoadingScreen({ loadingMessage }: LoadingScreenProps) {
    return (
        <div
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                backgroundColor: "rgba(0, 0, 0, 0.7)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                zIndex: 9999,
            }}
        >
            <div className="loading">
                <div
                    style={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        height: "100vh",
                        fontSize: "40px",
                        fontStyle: "bold",
                        color: "white",
                    }}
                >
                    Loading...
                    {loadingMessage}
                </div>
            </div>
        </div>
    );
}
