import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
    build: {
        lib: {
            entry: "src/indesadasx.ts", // Path to your library's entry point
            name: "MyLibrary", // The name of the global variable when using UMD build
            formats: ["es", "umd"], // Output formats: 'es' for ES module, 'umd' for UMD
            fileName: (format) => `my-library.${format}.js`,
        },
    },
    plugins: [],
    server: {
        fs: {
            allow: [
                ".",
                // your custom rules
                "../../gameplay/provable_game_logic/pkg",
            ],
        },
    },
});
