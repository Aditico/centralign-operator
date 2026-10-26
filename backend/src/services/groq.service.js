
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
  timeout: 60000,
  maxRetries: 2,
});
const MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

export async function chooseNextAction({
  goal,
  tools,
  history = [],
}) {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is not configured.");
  }

  const response = await groq.chat.completions.create({
    model: MODEL,
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        
content: `You are the decision-making engine of CentrAlign, an autonomous operator.

Your job is to achieve the user's goal by selecting the next useful action.

Rules:
- Choose tools only from the supplied tool list.
- Use previous results to decide what to do next.
- Do not repeat completed actions unless necessary.
- For calculation, invoice, data-processing, or other actionable goals, call a suitable available tool before completing.
- Never choose "complete" before at least one tool has been executed, unless the goal is purely informational and requires no tool.
- If a required tool is unavailable, return decision "request_input" and explain what capability is missing.
- If essential information is missing, return decision "request_input".
- Never claim a tool was executed; you only select actions.
- Return valid JSON with these fields:
  decision ("call_tool", "complete", or "request_input"),
  tool (tool name or null),
  input (object),
  reason (string).`,

      },
      {
        role: "user",
        content: JSON.stringify({ goal, tools, history }),
      },
    ],
  });

  const content = response.choices[0]?.message?.content;

  if (!content) {
    throw new Error("Groq returned an empty decision.");
  }

  let action;

  try {
    action = JSON.parse(content);
  } catch {
    throw new Error("Groq returned invalid JSON.");
  }

  if (
    !["call_tool", "complete", "request_input"].includes(action.decision)
  ) {
    throw new Error("Groq returned an unsupported decision.");
  }

  if (action.decision === "call_tool") {
    const toolExists = tools.some((tool) => tool.name === action.tool);

    if (!toolExists) {
      throw new Error(`Groq selected an unavailable tool: ${action.tool}`);
    }

    if (
      !action.input ||
      typeof action.input !== "object" ||
      Array.isArray(action.input)
    ) {
      throw new Error("Groq returned invalid tool input.");
    }
  }

  return {
    decision: action.decision,
    tool: action.decision === "call_tool" ? action.tool : null,
    input: action.input ?? {},
    reason: String(action.reason ?? ""),
  };
}
