
const tools = new Map();

export function registerTool(
  name,
  description,
  handler,
  options = {}
) {
  if (tools.has(name)) {
    throw new Error(`Tool "${name}" is already registered.`);
  }

  if (typeof handler !== "function") {
    throw new Error("Tool handler must be a function.");
  }

  tools.set(name, {
    name,
    description,
    handler,
    requiresApproval: options.requiresApproval ?? false,
  });
}

export function getTool(name) {
  return tools.get(name) ?? null;
}

export function listTools() {
  return Array.from(tools.values()).map(
    ({ name, description, requiresApproval }) => ({
      name,
      description,
      requiresApproval,
    })
  );
}

export async function executeTool(name, input = {}) {
  const tool = getTool(name);

  if (!tool) {
    throw new Error(`Unknown tool: ${name}`);
  }

  return await tool.handler(input);
}
