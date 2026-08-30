export const adminOnly = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Admin access required.",
    });
  }

  next();
};

export const agentOrAdmin = (req, res, next) => {
  if (!["agent", "admin"].includes(req.user?.role)) {
    return res.status(403).json({
      success: false,
      message: "Agent or admin access required.",
    });
  }

  next();
};

export const customerOnly = (req, res, next) => {
  if (req.user?.role !== "customer") {
    return res.status(403).json({
      success: false,
      message: "Customer access required.",
    });
  }

  next();
};
