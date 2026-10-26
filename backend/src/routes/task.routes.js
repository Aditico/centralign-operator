
import { Router } from "express";

import {
  createTaskController,
  getAllTasksController,
  getTaskByIdController,
  executeTaskController,
  approveTaskController,
    cancelTaskController,
    getTaskHistoryController,
    getTaskExecutionLogsController,
    getTaskExecutionSummaryController,
    getTaskDetailsController,
    provideTaskInputController,
    approveTaskActionController
} from "../controllers/task.controller.js";

const router = Router();

router.post("/", createTaskController);
router.get("/", getAllTasksController);

// This route must be registered
router.post("/:id/execute", executeTaskController);
router.post("/:id/approve", approveTaskController);

router.get("/:id", getTaskByIdController);
router.post("/:id/cancel", cancelTaskController);
router.get("/:id/history", getTaskHistoryController);
router.get("/:id/logs", getTaskExecutionLogsController);
router.get("/:id/summary", getTaskExecutionSummaryController);
router.get("/:id/details", getTaskDetailsController);
router.post("/:id/input", provideTaskInputController);
router.post(
  "/:id/approve-action",
  approveTaskActionController
);
export default router;
