
import { listTools } from "../tools/tool.registry.js";

export function createPlan(goal, inputData = null) {
  if (typeof goal !== "string" || !goal.trim()) {
    throw new Error("A task goal is required.");
  }

  const normalizedGoal = goal.toLowerCase();

  let selectedTool;
  let description;
  let input = {};

  if (
    normalizedGoal.includes("time") ||
    normalizedGoal.includes("clock")
  ) {
    selectedTool = "get_current_time";
    description = "Retrieve the current server time.";
  } else if (
    normalizedGoal.includes("invoice") &&
    (
      normalizedGoal.includes("extract") ||
      normalizedGoal.includes("parse")
    )
  ) {
    selectedTool = "extract_invoice_data";
    description = "Extract structured fields from invoice text.";

    input = {
      text: inputData?.text,
      clarification: inputData?.clarification ?? {
        vendor: inputData?.vendor,
        invoice_number: inputData?.invoice_number,
        amount: inputData?.amount,
        currency: inputData?.currency,
        due_date: inputData?.due_date,
      },
    };
  } else {
    throw new Error("I cannot create a plan for this goal yet.");
  }

  const availableTools = listTools();

  if (!availableTools.some((tool) => tool.name === selectedTool)) {
    throw new Error(`Required tool is unavailable: ${selectedTool}`);
  }

  return {
    goal: goal.trim(),
    steps: [
      {
        step: 1,
        tool: selectedTool,
        description,
        input,
      },
    ],
  };
}
