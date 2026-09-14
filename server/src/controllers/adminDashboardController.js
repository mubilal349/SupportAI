import getAdminDashboardStats from "../services/adminDashboardService.js";

// ============================================================
// GET ADMIN DASHBOARD
// ============================================================

export const getAdminDashboard = async (req, res) => {
  try {
    const dashboard = await getAdminDashboardStats();

    return res.status(200).json({
      success: true,
      ...dashboard,
    });
  } catch (error) {
    console.error("ADMIN DASHBOARD ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load admin dashboard",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
