import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { crx } from "@crxjs/vite-plugin";
import { defineConfig } from "vite";
import manifest from "./manifest.json";

function resolveOutDir() {
  if (process.env.EXTENSION_OUT_DIR) {
    return resolve(process.env.EXTENSION_OUT_DIR);
  }

  try {
    const commonDir = execFileSync(
      "git",
      ["rev-parse", "--path-format=absolute", "--git-common-dir"],
      { cwd: __dirname, encoding: "utf8" },
    ).trim();
    return resolve(commonDir, "..", "extension");
  } catch {
    return resolve(__dirname, "extension");
  }
}

export default defineConfig({
  resolve: {
    alias: {
      "@features": resolve(__dirname, "src/features"),
      "@shared": resolve(__dirname, "src/shared"),
    },
  },
  build: {
    outDir: resolveOutDir(),
    emptyOutDir: true,
  },
  plugins: [crx({ manifest })],
});
