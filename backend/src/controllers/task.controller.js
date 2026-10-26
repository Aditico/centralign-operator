import { executeTask } from "../services/task.service.js";
// import {
//   createTask,
//   getTaskById,
//   getAllTasks,
//     getTaskHistory,

// } from "../models/task.model.js";
import {
  createTask,
  getTaskById,
  getAllTasks,
  getTaskHistory,
  updateTask,
  TASK_STATUS,
} from "../models/task.model.js";
import {
  getExecutionLogs,
  getExecutionSummary,
} from "../services/execution-log.service.js";
import { executeTool } from "../tools/tool.registry.js";
import { recordExecutionLog } from "../services/execution-log.service.js";
export function createTaskController(req, res) {
  try {
    // const { goal } = req.body;
    const { goal, input_data } = req.body;
    if (typeof goal !== "string" || !goal.trim()) {
      return res.status(400).json({
        error: "Please provide a non-empty goal.",
      });
    }

    // const task = createTask(goal);
    const task = createTask(goal, input_data ?? null);

    return res.status(201).json({ task });
  } catch (error) {
    console.error("Create task error:", error.message);

    return res.status(500).json({
      error: "Failed to create task.",
    });
  }
}

export function getAllTasksController(req, res) {
  try {
    return res.json({ tasks: getAllTasks() });
  } catch (error) {
    console.error("Get tasks error:", error.message);

    return res.status(500).json({
      error: "Failed to retrieve tasks.",
    });
  }
}

export function getTaskByIdController(req, res) {
  try {
    const task = getTaskById(req.params.id);

    if (!task) {
      return res.status(404).json({
        error: "Task not found.",
      });
    }

    return res.json({ task });
  } catch (error) {
    console.error("Get task error:", error.message);

    return res.status(500).json({
      error: "Failed to retrieve task.",
    });
  }
}


// export async function executeTaskController(req, res) {
//   try {
//     const task = await executeTask(req.params.id);
//     if (task.status !== TASK_STATUS.WAITING_FOR_APPROVAL) {
//   throw new Error("Task must be approved before execution.");
// }
//     return res.json({ task });
//   } catch (error) {
//     if (error.message === "Task not found.") {
//       return res.status(404).json({ error: error.message });
//     }

//     if (error.message.startsWith("Cannot execute")) {
//       return res.status(409).json({ error: error.message });
//     }

//     console.error("Execute task error:", error.message);
//     return res.status(500).json({ error: "Task execution failed." });
//   }
// }


export async function executeTaskController(req, res) {
  try {
    const existingTask = getTaskById(req.params.id);

    if (!existingTask) {
      return res.status(404).json({ error: "Task not found." });
    }

    if (existingTask.status !== TASK_STATUS.WAITING_FOR_APPROVAL) {
      return res.status(409).json({
        error: `Task must be approved before execution. Current status: ${existingTask.status}`,
      });
    }

    const task = await executeTask(req.params.id);
    return res.json({ task });
  } catch (error) {
    console.error("Execute task error:", error.message);

    if (error.message === "Task not found.") {
      return res.status(404).json({ error: error.message });
    }

    if (error.message.startsWith("Cannot execute")) {
      return res.status(409).json({ error: error.message });
    }

    return res.status(500).json({ error: "Task execution failed." });
  }
}


// import {updateTask, TASK_STATUS } from "../models/task.model.js";

export function approveTaskController(req, res) {
  const { id } = req.params;
  const task = getTaskById(id);

  if (!task) {
    return res.status(404).json({ error: "Task not found." });
  }

//   if (task.status !== TASK_STATUS.PENDING) {
//   return res.status(409).json({
//     error: `Cannot approve a task with status: ${task.status}`,
//   });
// }
if (
  task.status !== TASK_STATUS.PENDING &&
  task.status !== TASK_STATUS.NEEDS_INPUT
) {
  return res.status(409).json({
    error: "Only pending or input-required tasks can be approved.",
  });
}
  const updatedTask = updateTask(id, {
    status: TASK_STATUS.WAITING_FOR_APPROVAL,
  });

  return res.json({ task: updatedTask });
}


export function cancelTaskController(req, res) {
  const { id } = req.params;
  const task = getTaskById(id);

  if (!task) {
    return res.status(404).json({ error: "Task not found." });
  }

  if (
    task.status !== TASK_STATUS.PENDING &&
    task.status !== TASK_STATUS.WAITING_FOR_APPROVAL
  ) {
    return res.status(409).json({
      error: `Cannot cancel a task with status: ${task.status}`,
    });
  }

  const updatedTask = updateTask(id, {
    status: "cancelled",
  });

  return res.json({ task: updatedTask });
}


export function getTaskHistoryController(req, res) {
  const { id } = req.params;

  const task = getTaskById(id);

  if (!task) {
    return res.status(404).json({
      error: "Task not found.",
    });
  }

  const history = getTaskHistory(id);

  return res.json({
    task_id: id,
    history,
  });
}


export function getTaskExecutionLogsController(req, res) {
  try {
    const task = getTaskById(req.params.id);

    if (!task) {
      return res.status(404).json({ error: "Task not found." });
    }

    const logs = getExecutionLogs(req.params.id);

    return res.status(200).json({
      task_id: req.params.id,
      total_steps: logs.length,
      logs,
    });
  } catch (error) {
    console.error("Failed to retrieve execution logs:", error);

    return res.status(500).json({
      error: "Failed to retrieve execution logs.",
    });
  }
}

export function getTaskExecutionSummaryController(req, res) {
  try {
    const task = getTaskById(req.params.id);

    if (!task) {
      return res.status(404).json({ error: "Task not found." });
    }

    return res.status(200).json({
      summary: getExecutionSummary(req.params.id),
    });
  } catch (error) {
    console.error("Failed to retrieve execution summary:", error);

    return res.status(500).json({
      error: "Failed to retrieve execution summary.",
    });
  }
}
export function getTaskDetailsController(req, res) {
  try {
    const task = getTaskById(req.params.id);

    if (!task) {
      return res.status(404).json({
        error: "Task not found.",
      });
    }

    return res.status(200).json({
      task,
      execution: {
        summary: getExecutionSummary(task.id),
        logs: getExecutionLogs(task.id),
      },
      history: getTaskHistory(task.id),
    });
  } catch (error) {
    console.error("Failed to retrieve task details:", error);

    return res.status(500).json({
      error: "Failed to retrieve task details.",
    });
  }
}

export function provideTaskInputController(req, res) {
  try {
    const task = getTaskById(req.params.id);

    if (!task) {
      return res.status(404).json({
        error: "Task not found.",
      });
    }

    if (task.status !== TASK_STATUS.NEEDS_INPUT) {
      return res.status(409).json({
        error: "Task is not waiting for additional input.",
      });
    }

    const additionalInput = req.body;

    if (
      !additionalInput ||
      typeof additionalInput !== "object" ||
      Array.isArray(additionalInput) ||
      Object.keys(additionalInput).length === 0
    ) {
      return res.status(400).json({
        error: "Provide a non-empty JSON object.",
      });
    }

    const existingInput = task.input_data
      ? JSON.parse(task.input_data)
      : {};

    const mergedInput = {
      ...existingInput,
      ...additionalInput,
    };

    updateTask(task.id, {
      input_data: JSON.stringify(mergedInput),
      status: TASK_STATUS.WAITING_FOR_APPROVAL,
      error: null,
    });

    return res.status(200).json({
      message: "Additional input saved. Task is awaiting approval.",
      task: getTaskById(task.id),
    });
  } catch (error) {
    console.error("Failed to provide task input:", error);

    return res.status(500).json({
      error: "Failed to save additional input.",
    });
  }
}
// export function approveTaskActionController(req, res) {
//   return res.status(501).json({
//     error: "Action approval is not implemented yet.",
//   });
// }

export async function approveTaskActionController(req, res) {
  try {
    const { id } = req.params;
    const task = getTaskById(id);

    if (!task) {
      return res.status(404).json({ error: "Task not found." });
    }

    if (task.status !== TASK_STATUS.WAITING_FOR_ACTION_APPROVAL) {
      return res.status(409).json({
        error: `Task is not waiting for action approval. Current status: ${task.status}`,
      });
    }

    let savedResult;

    try {
      savedResult = JSON.parse(task.result || "{}");
    } catch {
      return res.status(409).json({
        error: "Saved task state is invalid. Cannot approve this action.",
      });
    }

    const pendingAction = savedResult.pendingAction;

    if (
      !pendingAction ||
      typeof pendingAction.tool !== "string" ||
      !pendingAction.input ||
      typeof pendingAction.input !== "object" ||
      Array.isArray(pendingAction.input) ||
      !Number.isInteger(pendingAction.step)
    ) {
      return res.status(409).json({
        error: "No valid pending action was found for approval.",
      });
    }

    const approvedAction = {
      tool: pendingAction.tool,
      input: pendingAction.input,
      reason: pendingAction.reason,
      step: pendingAction.step,
    };

    const updatedTask = await executeTask(id, approvedAction);

    return res.status(200).json({ task: updatedTask });
  } catch (error) {
    console.error("Approve action error:", error);

    if (error.message === "Task not found.") {
      return res.status(404).json({ error: error.message });
    }

    return res.status(500).json({
      error: "Failed to approve and resume the task.",
    });
  }
}
