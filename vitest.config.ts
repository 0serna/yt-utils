import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@features": resolve(__dirname, "src/features"),
      "@shared": resolve(__dirname, "src/shared"),
    },
  },
  test: {
    environment: "jsdom",
    coverage: {
      provider: "istanbul",
      reporter: ["text", "json", "html"],
      thresholds: {},
    },
  },
});
