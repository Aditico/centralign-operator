
import Database from "better-sqlite3";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve the backend/data directory
const dataDirectory = path.resolve(__dirname, "../../data");

// Create the directory if it doesn't exist
fs.mkdirSync(dataDirectory, { recursive: true });

// Open (or create) the SQLite database file

 // Allow tests to use a separate database file.
const dbPath = process.env.DB_PATH
  ? path.resolve(process.env.DB_PATH)
  : path.join(dataDirectory, "centralign.db");

const db = new Database(dbPath);


// Enable foreign key constraints
db.pragma("foreign_keys = ON");

// Create the tasks table if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
  input_data TEXT,
    id TEXT PRIMARY KEY,
    goal TEXT NOT NULL,
    status TEXT NOT NULL,
    plan TEXT,
    result TEXT,
    error TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`);
const taskColumns = db.prepare("PRAGMA table_info(tasks)").all();

if (!taskColumns.some((column) => column.name === "input_data")) {
  db.exec("ALTER TABLE tasks ADD COLUMN input_data TEXT");
}
db.exec(`
  CREATE TABLE IF NOT EXISTS task_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id TEXT NOT NULL,
    status TEXT NOT NULL,
    changed_at TEXT NOT NULL,
    FOREIGN KEY (task_id) REFERENCES tasks(id)
  );
`);


db.exec(`
  CREATE TABLE IF NOT EXISTS execution_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id TEXT NOT NULL,
    step_number INTEGER NOT NULL,
    tool_name TEXT NOT NULL,
    input TEXT,
    output TEXT,
    status TEXT NOT NULL,
    error TEXT,
    started_at TEXT NOT NULL,
    completed_at TEXT,
    duration_ms INTEGER,
    FOREIGN KEY (task_id) REFERENCES tasks(id)
  );
`);

export default db;
