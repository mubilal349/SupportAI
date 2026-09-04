export const requireAgent = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const allowedRoles = ["agent", "admin"];

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Agent access is required.",
      });
    }

    next();
  } catch (error) {
    console.error("Agent middleware error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to verify agent access.",
    });
  }
};
