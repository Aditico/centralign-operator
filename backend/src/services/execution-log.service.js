
import db from "../db/database.js";

const insertExecutionLog = db.prepare(`
  INSERT INTO execution_logs (
    task_id,
    step_number,
    tool_name,
    input,
    output,
    status,
    error,
    started_at,
    completed_at,
    duration_ms
  )
  VALUES (
    @task_id,
    @step_number,
    @tool_name,
    @input,
    @output,
    @status,
    @error,
    @started_at,
    @completed_at,
    @duration_ms
  )
`);

const findLogsByTaskId = db.prepare(`
  SELECT *
  FROM execution_logs
  WHERE task_id = ?
  ORDER BY step_number ASC, id ASC
`);

export function recordExecutionLog(log) {
  const entry = {
    task_id: log.task_id,
    step_number: log.step_number,
    tool_name: log.tool_name,
    input: log.input == null ? null : JSON.stringify(log.input),
    output: log.output == null ? null : JSON.stringify(log.output),
    status: log.status,
    error: log.error ?? null,
    started_at: log.started_at,
    completed_at: log.completed_at ?? null,
    duration_ms: log.duration_ms ?? null,
  };

  const result = insertExecutionLog.run(entry);

  return {
    id: Number(result.lastInsertRowid),
    ...entry,
  };
}

export function getExecutionLogs(taskId) {
  return findLogsByTaskId.all(taskId).map((log) => ({
    ...log,
    input: log.input ? JSON.parse(log.input) : null,
    output: log.output ? JSON.parse(log.output) : null,
  }));
}


export function getExecutionSummary(taskId) {
  const logs = getExecutionLogs(taskId);

  const successfulSteps = logs.filter(
    (log) => log.status === "completed"
  ).length;

  const failedSteps = logs.filter(
    (log) => log.status === "failed"
  ).length;

  const durations = logs
    .map((log) => log.duration_ms)
    .filter((duration) => duration !== null);

  return {
    task_id: taskId,
    total_steps: logs.length,
    successful_steps: successfulSteps,
    failed_steps: failedSteps,
    total_duration_ms: durations.reduce(
      (total, duration) => total + duration,
      0
    ),
    status:
      failedSteps > 0
        ? "failed"
        : logs.length > 0 && successfulSteps === logs.length
          ? "completed"
          : "in_progress",
  };
}
