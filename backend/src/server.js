import "dotenv/config";
import express from "express";
import pool from "./config/db.js";
import redisClient from "./config/redis.js";
import executionRoutes from "./routes/execution.routes.js";

const app = express();

// Body parser with size limit
app.use(express.json({ limit: "100kb" }));

// Trust proxy for rate limiting behind nginx
app.set("trust proxy", 1);

app.use("/api", executionRoutes);

app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    await redisClient.ping();
    res.json({ status: "ok" });
  } catch (err) {
    res.status(500).json({ status: "error" });
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal Server Error" });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});