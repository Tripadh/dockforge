import rateLimit from "express-rate-limit";

// Rate limiter for execution submissions
// 20 requests per minute per IP
export const executionRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use X-Forwarded-For if behind proxy, otherwise use IP
    return req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.ip;
  },
  handler: (req, res) => {
    res.status(429).json({
      error: "Too many requests",
      message: "Rate limit exceeded. Maximum 20 execution submissions per minute.",
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  }
});
