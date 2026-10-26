
const MAX_AUTONOMOUS_STEPS = 5;

export function decideNextAction({
  stepCount,
  output,
}) {
  if (stepCount >= MAX_AUTONOMOUS_STEPS) {
    return {
      decision: "stop",
      reason: "Maximum autonomous step limit reached.",
      nextTool: null,
    };
  }

  if (output?.needs_review === true) {
    return {
      decision: "request_input",
      reason: "The result requires human review.",
      nextTool: null,
      missing_fields: output.missing_fields ?? [],
      validation_errors: output.validation_errors ?? [],
    };
  }

  if (
    Array.isArray(output?.missing_fields) &&
    output.missing_fields.length > 0
  ) {
    return {
      decision: "request_input",
      reason: "Required information is missing.",
      nextTool: null,
      missing_fields: output.missing_fields,
    };
  }

  if (
    Array.isArray(output?.validation_errors) &&
    output.validation_errors.length > 0
  ) {
    return {
      decision: "request_input",
      reason: "The result contains validation errors.",
      nextTool: null,
      validation_errors: output.validation_errors,
    };
  }

  return {
    decision: "complete",
    reason: "The task output requires no further action.",
    nextTool: null,
  };
}
