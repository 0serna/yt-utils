import { defineConfig } from "vite";
import { crx } from "@crxjs/vite-plugin";
import manifest from "./manifest.json";
import { resolve } from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@features": resolve(__dirname, "src/features"),
      "@shared": resolve(__dirname, "src/shared"),
    },
  },
  build: {
    outDir: "extension",
    emptyOutDir: true,
  },
  plugins: [crx({ manifest })],
});