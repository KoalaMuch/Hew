import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    root: "./",
    globals: true,
    environment: "node",
    include: ["src/**/*.spec.ts"],
    testTimeout: 10_000,
  },
});
