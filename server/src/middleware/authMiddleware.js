import jwt from "jsonwebtoken";

export const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication token missing.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    console.log("Authenticated JWT:", decoded);

    // Support both old and new token formats
    req.user = {
      id: decoded.id || decoded.userId || decoded._id,
      role: decoded.role,
      email: decoded.email,
    };

    if (!req.user.id) {
      return res.status(401).json({
        success: false,
        message: "User ID missing from authentication token.",
      });
    }

    next();
  } catch (error) {
    console.error("Authentication error:", error.message);

    return res.status(401).json({
      success: false,
      message: "Invalid or expired token.",
    });
  }
};
