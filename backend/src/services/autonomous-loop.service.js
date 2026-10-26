
import { chooseNextAction } from "./groq.service.js";
import {
  listTools,
  executeTool,
} from "../tools/tool.registry.js";
import { recordExecutionLog } from "./execution-log.service.js";
import { shouldRetry } from "./retry.service.js";
import { createExecutionBudget } from "./execution-budget.service.js";

import "../tools/basic.tools.js";
import "../tools/invoice.tools.js";
import "../tools/calculation.tools.js";

const MAX_STEPS = 5;

export async function runAutonomousLoop(
  goal,
  inputData = {},
  taskId = null,
  resumeState = null
) {
  const availableTools = listTools();
  const history = resumeState?.history ?? [];
  const results = resumeState?.results ?? [];
  const budget = createExecutionBudget(60_000);

  let startStep = resumeState?.nextStep ?? 1;

  // Execute the explicitly approved action before asking Groq
  // to choose another action.
  if (resumeState?.approvedAction) {
    const { tool, input, reason, step } =
      resumeState.approvedAction;

    const selectedTool = availableTools.find(
      (item) => item.name === tool
    );

    if (!selectedTool) {
      throw new Error(`Unknown approved tool: ${tool}`);
    }

    let attempt = 1;
    let output;

    while (true) {
      const startedAt = new Date();
      const startTime = Date.now();

      try {
        budget.assertWithinBudget();
        output = await executeTool(tool, input);
        budget.assertWithinBudget();

        if (taskId !== null) {
          recordExecutionLog({
            task_id: taskId,
            step_number: step,
            tool_name: tool,
            input: { ...input, attempt },
            output,
            status: "completed",
            started_at: startedAt.toISOString(),
            completed_at: new Date().toISOString(),
            duration_ms: Date.now() - startTime,
          });
        }

        break;
      } catch (error) {
        if (taskId !== null) {
          recordExecutionLog({
            task_id: taskId,
            step_number: step,
            tool_name: tool,
            input: { ...input, attempt },
            output: null,
            status: "failed",
            error: error.message,
            started_at: startedAt.toISOString(),
            completed_at: new Date().toISOString(),
            duration_ms: Date.now() - startTime,
          });
        }

        if (!shouldRetry(error, attempt)) {
          throw error;
        }

        attempt++;
      }
    }

    const result = { step, tool, input, output, reason };
    results.push(result);
    history.push(result);
    startStep = step + 1;

    const missingFields = output?.missing_fields ?? [];
    const validationErrors = output?.validation_errors ?? [];

    if (
      output?.needs_review ||
      missingFields.length > 0 ||
      validationErrors.length > 0
    ) {
      const reasons = [];

      if (missingFields.length) {
        reasons.push(`Missing fields: ${missingFields.join(", ")}`);
      }

      if (validationErrors.length) {
        reasons.push(`Validation errors: ${validationErrors.join(", ")}`);
      }

      if (output?.needs_review) {
        reasons.push("The extracted data needs review.");
      }

      return {
        status: "needs_input",
        results,
        history,
        nextStep: startStep,
        reason: reasons.join(" "),
      };
    }
  }

  for (let step = startStep; step <= MAX_STEPS; step++) {
    budget.assertWithinBudget();

    const action = await chooseNextAction({
      goal: `${goal}\nAdditional input: ${JSON.stringify(inputData)}`,
      tools: availableTools,
      history,
    });

    if (action.decision === "call_tool") {
      const selectedTool = availableTools.find(
        (tool) => tool.name === action.tool
      );

      if (!selectedTool) {
        throw new Error(`Unknown tool: ${action.tool}`);
      }

      if (selectedTool.requiresApproval) {
        return {
          status: "waiting_for_action_approval",
          results,
          history,
          nextStep: step,
          reason: `Approval required to execute ${action.tool}.`,
          pendingAction: {
            tool: action.tool,
            input: action.input,
            reason: action.reason,
            step,
          },
        };
      }
    }

    if (action.decision === "complete") {
      if (results.length === 0) {
        throw new Error(
          "Agent attempted to complete the task without executing any tools."
        );
      }

      return {
        status: "completed",
        results,
        history,
        reason: action.reason,
      };
    }

    if (action.decision === "request_input") {
      return {
        status: "needs_input",
        results,
        history,
        nextStep: step,
        reason: action.reason,
      };
    }

    if (action.decision !== "call_tool") {
      throw new Error(
        `Unsupported agent decision: ${action.decision}`
      );
    }

    let attempt = 1;
    let output;

    while (true) {
      const startedAt = new Date();
      const startTime = Date.now();

      try {
        budget.assertWithinBudget();
        output = await executeTool(action.tool, action.input);
        budget.assertWithinBudget();

        if (taskId !== null) {
          recordExecutionLog({
            task_id: taskId,
            step_number: step,
            tool_name: action.tool,
            input: { ...action.input, attempt },
            output,
            status: "completed",
            started_at: startedAt.toISOString(),
            completed_at: new Date().toISOString(),
            duration_ms: Date.now() - startTime,
          });
        }

        break;
      } catch (error) {
        if (taskId !== null) {
          recordExecutionLog({
            task_id: taskId,
            step_number: step,
            tool_name: action.tool,
            input: { ...action.input, attempt },
            output: null,
            status: "failed",
            error: error.message,
            started_at: startedAt.toISOString(),
            completed_at: new Date().toISOString(),
            duration_ms: Date.now() - startTime,
          });
        }

        if (!shouldRetry(error, attempt)) {
          throw error;
        }

        attempt++;
      }
    }

    const result = {
      step,
      tool: action.tool,
      input: action.input,
      output,
      reason: action.reason,
    };

    results.push(result);
    history.push(result);

    const missingFields = output?.missing_fields ?? [];
    const validationErrors = output?.validation_errors ?? [];

    if (
      output?.needs_review ||
      missingFields.length > 0 ||
      validationErrors.length > 0
    ) {
      const reasons = [];

      if (missingFields.length) {
        reasons.push(`Missing fields: ${missingFields.join(", ")}`);
      }

      if (validationErrors.length) {
        reasons.push(`Validation errors: ${validationErrors.join(", ")}`);
      }

      if (output?.needs_review) {
        reasons.push("The extracted data needs review.");
      }

      return {
        status: "needs_input",
        results,
        history,
        nextStep: step + 1,
        reason: reasons.join(" "),
      };
    }
  }

  return {
    status: "max_steps_reached",
    results,
    history,
    reason: `Maximum autonomous step limit (${MAX_STEPS}) reached.`,
  };
}
