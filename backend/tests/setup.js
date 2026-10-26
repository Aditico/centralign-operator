
import { beforeAll } from "vitest";
import fs from "node:fs";
import path from "node:path";

beforeAll(() => {
  const dbPath = path.resolve("data/centralign-test.db");

  if (fs.existsSync(dbPath)) {
    fs.rmSync(dbPath);
  }
});
