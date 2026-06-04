/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
const __dirname = dirname(fileURLToPath(import.meta.url));
export default defineConfig({
    base: "./",
    plugins: [react()],
    resolve: {
        alias: {
            "@": resolve(__dirname, "src"),
            "@csv": resolve(__dirname, "csv"),
        },
    },
    test: {
        globals: true,
        environment: "jsdom",
        setupFiles: ["src/test/setup.ts"],
    },
    server: {
        port: 5173,
        strictPort: false,
    },
    build: {
        outDir: "dist",
        target: "es2020",
        sourcemap: true,
    },
});
