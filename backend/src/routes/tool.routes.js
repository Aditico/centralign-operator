
import { Router } from "express";
import { listTools } from "../tools/tool.registry.js";

const router = Router();

router.get("/", (req, res) => {
  res.json({
    tools: listTools(),
  });
});

export default router;
