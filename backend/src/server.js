
import express from "express";
import cors from "cors";
import taskRoutes from "./routes/task.routes.js";
import toolRoutes from "./routes/tool.routes.js";

const app = express();
const PORT = 8000;

// Enable CORS before all API routes
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Parse incoming JSON request bodies
app.use(express.json());

// API routes
app.use("/api/tasks", taskRoutes);
app.use("/api/tools", toolRoutes);

// Health-check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    service: "centralign-operator",
  });
});

export default app;
