import { defineConfig } from "vite";
// https://vitejs.dev/config/
export default defineConfig({
    plugins: [],
    server: {
        fs: {
            allow: [
                ".",
                // your custom rules
                "../../gameplay/provable_game_logic/pkg",
                "../spin/*",
            ],
        },
    },
});
