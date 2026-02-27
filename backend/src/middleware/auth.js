import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dockforge-secret-key-change-in-production";

// Generate JWT token (for testing/admin use)
export const generateToken = (payload, expiresIn = "24h") => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
};

// Verify JWT token middleware
export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Authorization header is required"
    });
  }

  // Expect "Bearer <token>"
  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Invalid authorization format. Use: Bearer <token>"
    });
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Require user_id in payload
    if (!decoded.userId) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Token must contain userId"
      });
    }

    // Attach user info to request
    req.user = {
      userId: decoded.userId,
      ...decoded
    };

    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Token has expired"
      });
    }

    return res.status(401).json({
      error: "Unauthorized",
      message: "Invalid token"
    });
  }
};

export { JWT_SECRET };
