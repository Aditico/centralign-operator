
import {
  getTaskById,
  updateTask,
  TASK_STATUS,
} from "../models/task.model.js";

import "../tools/basic.tools.js";
import "../tools/invoice.tools.js";
import "../tools/calculation.tools.js";

import { runAutonomousLoop } from "./autonomous-loop.service.js";

export async function executeTask(taskId, approvedAction = null) {
  const task = getTaskById(taskId);

  if (!task) {
    throw new Error("Task not found.");
  }

  const isResuming = approvedAction !== null;

  if (isResuming) {
    if (task.status !== TASK_STATUS.WAITING_FOR_ACTION_APPROVAL) {
      throw new Error("Task is not waiting for action approval.");
    }
  } else if (task.status !== TASK_STATUS.WAITING_FOR_APPROVAL) {
    throw new Error("Task must be approved before execution.");
  }

  let savedResult = {};

  if (isResuming) {
    try {
      savedResult = JSON.parse(task.result || "{}");
    } catch {
      throw new Error("Could not restore the saved task state.");
    }

    const pending = savedResult.pendingAction;

    if (
      !pending ||
      pending.tool !== approvedAction.tool ||
      pending.step !== approvedAction.step ||
      JSON.stringify(pending.input) !== JSON.stringify(approvedAction.input)
    ) {
      throw new Error("Approved action does not match the pending action.");
    }
  }

  updateTask(taskId, {
    status: TASK_STATUS.RUNNING,
    error: null,
  });

  try {
    const inputData = task.input_data
      ? typeof task.input_data === "string"
        ? JSON.parse(task.input_data)
        : task.input_data
      : {};

    const resumeState = isResuming
      ? {
          results: savedResult.results ?? [],
          history: savedResult.history ?? savedResult.results ?? [],
          nextStep: savedResult.nextStep ?? approvedAction.step,
          approvedAction,
        }
      : null;

    const autonomousResult = await runAutonomousLoop(
      task.goal,
      inputData,
      taskId,
      resumeState
    );

    if (
      autonomousResult.status === "needs_input" ||
      autonomousResult.status === "waiting_for_action_approval"
    ) {
      updateTask(taskId, {
        status:
          autonomousResult.status === "needs_input"
            ? TASK_STATUS.NEEDS_INPUT
            : TASK_STATUS.WAITING_FOR_ACTION_APPROVAL,
        error: autonomousResult.reason,
        result: JSON.stringify(autonomousResult),
      });

      return getTaskById(taskId);
    }

    if (autonomousResult.status !== "completed") {
      throw new Error(autonomousResult.reason);
    }

    const plan = {
      goal: task.goal,
      mode: "autonomous",
      steps: autonomousResult.results.map((item) => ({
        step: item.step,
        tool: item.tool,
        input: item.input,
      })),
    };

    const result = {
      goal: task.goal,
      plan,
      stepResults: autonomousResult.results,
    };

    updateTask(taskId, {
      plan: JSON.stringify(plan),
      status: TASK_STATUS.COMPLETED,
      result: JSON.stringify(result),
      error: null,
    });

    return getTaskById(taskId);
  } catch (error) {
    console.error("Autonomous execution failed:", error);

    updateTask(taskId, {
      status: TASK_STATUS.FAILED,
      error: error.message || "Unknown execution error",
    });

    throw error;
  }
}
