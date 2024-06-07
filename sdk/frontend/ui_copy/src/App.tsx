import React, { useEffect } from "react";
import { Spin } from "spin";

const ZK_USER_ADDRESS = import.meta.env.VITE_ZK_USER_ADDRESS;
const ZK_USER_PRIVATE_KEY = import.meta.env.VITE_ZK_USER_PRIVATE_KEY;
const ZK_IMAGE_ID = import.meta.env.VITE_ZK_CLOUD_IMAGE_ID;
const ZK_CLOUD_RPC_URL = "https://rpc.zkwasmhub.com:8090";

let spin: Spin;

function App() {
    useEffect(() => {
        spin = new Spin({
            onReady: () => {},
            cloudCredentials: {
                CLOUD_RPC_URL: ZK_CLOUD_RPC_URL,
                USER_ADDRESS: ZK_USER_ADDRESS,
                USER_PRIVATE_KEY: ZK_USER_PRIVATE_KEY,
                IMAGE_HASH: ZK_IMAGE_ID,
            },
        });
        console.log("spin = ", spin);
    }, []);

    return <div className="App"></div>;
}

export default App;
