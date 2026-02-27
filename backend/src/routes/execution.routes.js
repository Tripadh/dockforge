import express from "express";
import { submitExecution, getResult } from "../controllers/execution.controller.js";

const router = express.Router();

// POST /api/execute - submit code for execution
router.post("/execute", submitExecution);

// GET /api/result/:jobId - get execution result
router.get("/result/:jobId", getResult);

export default router;