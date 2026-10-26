
import { describe, it, expect } from "vitest";
import {
  createTask,
  getTaskById,
  TASK_STATUS,
  updateTask,
  getTaskHistory
} from "../src/models/task.model.js";


describe("Task model", () => {
  it("creates a task with pending status", () => {
    const task = createTask("Get the current time");

    expect(task.id).toBeTruthy();
    expect(task.goal).toBe("Get the current time");
    expect(task.status).toBe(TASK_STATUS.PENDING);

    const savedTask = getTaskById(task.id);
    expect(savedTask).not.toBeNull();
    expect(savedTask.status).toBe(TASK_STATUS.PENDING);

  });

  it("rejects an empty or invalid task goal", () => {
    expect(() => createTask("")).toThrow("Task goal is required.");
    expect(() => createTask("   ")).toThrow("Task goal is required.");
    expect(() => createTask(null)).toThrow("Task goal is required.");
  });
  it("rejects invalid task status transitions", () => {
  const task = createTask("Get the current time");

  // A pending task cannot jump directly to completed.
  expect(() =>
    updateTask(task.id, { status: TASK_STATUS.COMPLETED })
  ).toThrow("Invalid task status transition: pending -> completed.");

  // The rejected update must not change the stored status.
  expect(getTaskById(task.id).status).toBe(TASK_STATUS.PENDING);
});
  
it("records valid status transitions in task history", () => {
  const task = createTask("Get the current time");

  updateTask(task.id, {
    status: TASK_STATUS.WAITING_FOR_APPROVAL,
  });

  updateTask(task.id, {
    status: TASK_STATUS.RUNNING,
  });

  updateTask(task.id, {
    status: TASK_STATUS.COMPLETED,
  });

  const history = getTaskHistory(task.id);

  expect(history.map((entry) => entry.status)).toEqual([
    TASK_STATUS.WAITING_FOR_APPROVAL,
    TASK_STATUS.RUNNING,
    TASK_STATUS.COMPLETED,
  ]);
});

});
