
import { registerTool } from "./tool.registry.js";

registerTool(
  "get_current_time",
  "Returns the current server time in ISO format.",
  async () => {
    return {
      current_time: new Date().toISOString(),
    };
  }
);
