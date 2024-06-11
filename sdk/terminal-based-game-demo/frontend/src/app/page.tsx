import Xterm from "./xterm";

export default function Home() {
    return (
        <div
            style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
            }}
        >
            <Xterm />
        </div>
    );
}
