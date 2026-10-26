
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    env: {
      DB_PATH: path.resolve("data/centralign-test.db"),
    },
    include: ["tests/**/*.test.js"],
    fileParallelism: false,
    maxWorkers: 1,
  },
});
