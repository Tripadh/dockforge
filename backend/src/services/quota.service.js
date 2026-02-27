import pool from "../config/db.js";

// Maximum jobs per user per hour
const MAX_JOBS_PER_HOUR = 100;

/**
 * Check if user has exceeded their hourly job quota
 * @param {string} userId - UUID of the user
 * @returns {Promise<{allowed: boolean, used: number, limit: number}>}
 */
export const checkUserQuota = async (userId) => {
  const [rows] = await pool.execute(
    `SELECT COUNT(*) as job_count
     FROM executions
     WHERE user_id = UUID_TO_BIN(?)
       AND created_at > NOW() - INTERVAL 1 HOUR`,
    [userId]
  );

  const used = rows[0]?.job_count || 0;
  const allowed = used < MAX_JOBS_PER_HOUR;

  return {
    allowed,
    used,
    limit: MAX_JOBS_PER_HOUR,
    remaining: Math.max(0, MAX_JOBS_PER_HOUR - used)
  };
};

/**
 * Middleware to enforce user quota
 */
export const enforceQuota = async (req, res, next) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "User ID not found in token"
      });
    }

    const quota = await checkUserQuota(userId);

    // Add quota info to response headers
    res.set({
      "X-RateLimit-Limit": quota.limit,
      "X-RateLimit-Remaining": quota.remaining,
      "X-RateLimit-Used": quota.used
    });

    if (!quota.allowed) {
      return res.status(429).json({
        error: "Quota exceeded",
        message: `You have exceeded the maximum of ${quota.limit} jobs per hour`,
        used: quota.used,
        limit: quota.limit
      });
    }

    next();
  } catch (err) {
    console.error("Quota check error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export { MAX_JOBS_PER_HOUR };
