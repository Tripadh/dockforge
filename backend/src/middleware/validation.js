// Supported languages
const SUPPORTED_LANGUAGES = ["python", "javascript", "node"];

// Maximum code size in bytes (50 KB)
const MAX_CODE_SIZE = 50 * 1024;

export const validateExecution = (req, res, next) => {
  const { code, language } = req.body;

  // Check for empty code
  if (!code || typeof code !== "string" || code.trim().length === 0) {
    return res.status(400).json({
      error: "Validation failed",
      field: "code",
      message: "Code is required and cannot be empty"
    });
  }

  // Check code size
  const codeSize = Buffer.byteLength(code, "utf8");
  if (codeSize > MAX_CODE_SIZE) {
    return res.status(400).json({
      error: "Validation failed",
      field: "code",
      message: `Code size exceeds maximum allowed (${MAX_CODE_SIZE / 1024} KB)`,
      received: `${(codeSize / 1024).toFixed(2)} KB`
    });
  }

  // Check for missing language
  if (!language || typeof language !== "string") {
    return res.status(400).json({
      error: "Validation failed",
      field: "language",
      message: "Language is required"
    });
  }

  // Check for supported language
  const normalizedLang = language.toLowerCase().trim();
  if (!SUPPORTED_LANGUAGES.includes(normalizedLang)) {
    return res.status(400).json({
      error: "Validation failed",
      field: "language",
      message: `Unsupported language: ${language}`,
      supported: SUPPORTED_LANGUAGES
    });
  }

  // Normalize language in body
  req.body.language = normalizedLang;

  next();
};

export { SUPPORTED_LANGUAGES, MAX_CODE_SIZE };
