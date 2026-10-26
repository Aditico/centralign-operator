
import { randomUUID } from "node:crypto";
import db from "../db/database.js";

export const TASK_STATUS = Object.freeze({
  PENDING: "pending",
  RUNNING: "running",
  WAITING_FOR_APPROVAL: "waiting_for_approval",
  COMPLETED: "completed",
  FAILED: "failed",
  CANCELLED: "cancelled",
  NEEDS_INPUT: "needs_input",
  WAITING_FOR_ACTION_APPROVAL: "waiting_for_action_approval",
});

export const ALLOWED_TASK_STATUSES = Object.values(TASK_STATUS);


const ALLOWED_TRANSITIONS = Object.freeze({
  [TASK_STATUS.PENDING]: [
    TASK_STATUS.WAITING_FOR_APPROVAL,
    TASK_STATUS.CANCELLED,
  ],
  [TASK_STATUS.WAITING_FOR_APPROVAL]: [
    TASK_STATUS.RUNNING,
    TASK_STATUS.CANCELLED,
  ],
  [TASK_STATUS.RUNNING]: [
    TASK_STATUS.NEEDS_INPUT,
    TASK_STATUS.WAITING_FOR_ACTION_APPROVAL,
    TASK_STATUS.COMPLETED,
    TASK_STATUS.FAILED,
  ],
  [TASK_STATUS.WAITING_FOR_ACTION_APPROVAL]: [
    TASK_STATUS.RUNNING,
    TASK_STATUS.CANCELLED,
  ],
  [TASK_STATUS.COMPLETED]: [],
  [TASK_STATUS.FAILED]: [],
  [TASK_STATUS.CANCELLED]: [],
  [TASK_STATUS.NEEDS_INPUT]: [
    TASK_STATUS.WAITING_FOR_APPROVAL,
    TASK_STATUS.CANCELLED,
  ],
});


// const insertTask = db.prepare(`
//   INSERT INTO tasks (
//     id, goal, status, plan, result, error, created_at, updated_at
//   )
//   VALUES (
//     @id, @goal, @status, @plan, @result, @error, @created_at, @updated_at
//   )
// `);
const insertTask = db.prepare(`
  INSERT INTO tasks (
    id, goal, input_data, status, plan, result, error, created_at, updated_at
  )
  VALUES (
    @id, @goal, @input_data, @status, @plan, @result, @error, @created_at, @updated_at
  )
`);

const findTaskById = db.prepare(`
  SELECT * FROM tasks WHERE id = ?
`);

const findAllTasks = db.prepare(`
  SELECT * FROM tasks ORDER BY created_at DESC
`);

// const updateTaskStatement = db.prepare(`
//   UPDATE tasks
//   SET status = @status,
//       plan = @plan,
//       result = @result,
//       error = @error,
//       updated_at = @updated_at
//   WHERE id = @id
// `);
const updateTaskStatement = db.prepare(`
  UPDATE tasks
  SET
    status = COALESCE(@status, status),
    plan = COALESCE(@plan, plan),
    result = COALESCE(@result, result),
    error = @error,
    input_data = COALESCE(@input_data, input_data),
    updated_at = @updated_at
  WHERE id = @id
`);
 export function createTask(goal, inputData = null) {
  if (typeof goal !== "string" || !goal.trim()) {
    throw new Error("Task goal is required.");
  }

  const now = new Date().toISOString();

  const task = {
    input_data: inputData ? JSON.stringify(inputData) : null,
    id: randomUUID(),
    goal: goal.trim(),
    status: TASK_STATUS.PENDING,
    plan: null,
    result: null,
    error: null,
    created_at: now,
    updated_at: now,
  };

  insertTask.run(task);
  return task;
}

export function getTaskById(id) {
  return findTaskById.get(id) ?? null;
}

export function getAllTasks() {
  return findAllTasks.all();
}

// export function updateTask(id, updates) {
//   const existingTask = getTaskById(id);

//   if (!existingTask) {
//     return null;
//   }

//   const status = updates.status ?? existingTask.status;

//   if (!ALLOWED_TASK_STATUSES.includes(status)) {
//     throw new Error("Invalid task status.");
//   }

//   const task = {
//     id,
//     status,
//     plan: updates.plan === undefined ? existingTask.plan : updates.plan,
//     result: updates.result === undefined ? existingTask.result : updates.result,
//     error: updates.error === undefined ? existingTask.error : updates.error,
//     updated_at: new Date().toISOString(),
//   };

//   updateTaskStatement.run(task);
 
//   return getTaskById(id);
// }


export function updateTask(id, updates) {
  const updateTaskTransaction = db.transaction(() => {
    const existingTask = getTaskById(id);

    if (!existingTask) {
      return null;
    }

    const status = updates.status ?? existingTask.status;

    if (!ALLOWED_TASK_STATUSES.includes(status)) {
      throw new Error("Invalid task status.");
    }

    if (
      status !== existingTask.status &&
      !ALLOWED_TRANSITIONS[existingTask.status]?.includes(status)
    ) {
      throw new Error(
        `Invalid task status transition: ${existingTask.status} -> ${status}.`
      );
    }

    // const task = {
    //   id,
    //   status,
    //   plan: updates.plan === undefined ? existingTask.plan : updates.plan,
    //   result: updates.result === undefined ? existingTask.result : updates.result,
    //   error: updates.error === undefined ? existingTask.error : updates.error,
    //   updated_at: new Date().toISOString(),
    // };
    
const task = {
  id,
  status,
  plan: updates.plan === undefined ? existingTask.plan : updates.plan,
  result: updates.result === undefined ? existingTask.result : updates.result,
  error: updates.error === undefined ? existingTask.error : updates.error,
  input_data:
    updates.input_data === undefined
      ? existingTask.input_data
      : updates.input_data === null
        ? null
        : typeof updates.input_data === "string"
          ? updates.input_data
          : JSON.stringify(updates.input_data),
  updated_at: new Date().toISOString(),
};


    updateTaskStatement.run(task);

    const updatedTask = getTaskById(id);

    if (updatedTask.status !== existingTask.status) {
      recordTaskHistory(id, updatedTask.status);
    }

    return updatedTask;
  });

  return updateTaskTransaction();
}

export function recordTaskHistory(taskId, status) {
  const changedAt = new Date().toISOString();

  const result = db.prepare(`
    INSERT INTO task_history (task_id, status, changed_at)
    VALUES (?, ?, ?)
  `).run(taskId, status, changedAt);

  return {
    id: Number(result.lastInsertRowid),
    task_id: taskId,
    status,
    changed_at: changedAt,
  };
}


export function getTaskHistory(taskId) {
  return db.prepare(`
    SELECT id, task_id, status, changed_at
    FROM task_history
    WHERE task_id = ?
    ORDER BY id ASC
  `).all(taskId);
}
