import { createExecutionJob, getExecutionResult, isValidUUID } from "../services/execution.service.js";

const SUPPORTED_LANGUAGES = ["python", "javascript", "node"];
const MAX_CODE_SIZE = 64 * 1024; // 64KB

export const submitExecution = async (req, res) => {
  try {
    const { code, language } = req.body;

    // Validate required fields
    if (!code || !language) {
      return res.status(400).json({
        error: "Code and language are required"
      });
    }

    // Validate language
    if (!SUPPORTED_LANGUAGES.includes(language.toLowerCase())) {
      return res.status(400).json({
        error: `Unsupported language. Supported: ${SUPPORTED_LANGUAGES.join(", ")}`
      });
    }

    // Validate code size
    if (code.length > MAX_CODE_SIZE) {
      return res.status(400).json({
        error: `Code exceeds maximum size of ${MAX_CODE_SIZE} bytes`
      });
    }

    const jobId = await createExecutionJob(code, language);

    return res.status(202).json({
      jobId,
      status: "pending"
    });

  } catch (err) {
    console.error("Submit execution error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getResult = async (req, res) => {
  try {
    const { jobId } = req.params;

    // Validate UUID format
    if (!jobId || !isValidUUID(jobId)) {
      return res.status(400).json({
        error: "Invalid job ID format"
      });
    }

    const result = await getExecutionResult(jobId);

    if (!result) {
      return res.status(404).json({
        error: "Job not found"
      });
    }

    return res.status(200).json(result);

  } catch (err) {
    console.error("Get result error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};