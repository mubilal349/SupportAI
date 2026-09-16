import { getSystemAnalyticsService } from "../services/analyticsService.js";

// ==========================================
// GET SYSTEM ANALYTICS
// ==========================================

export const getSystemAnalytics = async (req, res) => {
  try {
    const period = req.query.period || "30d";

    const allowedPeriods = ["7d", "30d", "90d", "1y", "all"];

    if (!allowedPeriods.includes(period)) {
      return res.status(400).json({
        success: false,
        message: "Invalid analytics period. Use 7d, 30d, 90d, 1y, or all.",
      });
    }

    const analytics = await getSystemAnalyticsService(period);

    return res.status(200).json({
      success: true,
      analytics,
    });
  } catch (error) {
    console.error("Get system analytics error:", error);

    return res.status(error?.statusCode || 500).json({
      success: false,
      message: error?.message || "Failed to fetch system analytics.",
    });
  }
};
