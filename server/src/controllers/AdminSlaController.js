import {
  getSlaPolicyService,
  updateSlaPolicyService,
  getSlaStatisticsService,
} from "../services/slaService.js";

import { createAuditLog } from "../services/auditLogService.js";

// ==========================================
// GET ADMIN ID
// ==========================================

const getAdminId = (req) => {
  return req.user?.id || req.user?._id || req.user?.userId || null;
};

// ==========================================
// SEND ERROR RESPONSE
// ==========================================

const sendError = (res, error, fallbackMessage) => {
  console.error(error);

  return res.status(error?.statusCode || 500).json({
    success: false,
    message: error?.message || fallbackMessage || "Something went wrong.",
  });
};

// ==========================================
// GET SLA POLICY
// GET /api/admin/sla
// ==========================================

export const getSlaPolicy = async (req, res) => {
  try {
    const policy = await getSlaPolicyService();

    return res.status(200).json({
      success: true,
      policy,
    });
  } catch (error) {
    return sendError(res, error, "Failed to fetch SLA policy.");
  }
};

// ==========================================
// UPDATE SLA POLICY
// PUT /api/admin/sla
// ==========================================

export const updateSlaPolicy = async (req, res) => {
  try {
    const adminId = getAdminId(req);

    // Get previous policy before updating
    const previousPolicy = await getSlaPolicyService();

    const policy = await updateSlaPolicyService(req.body, adminId);

    // ==========================================
    // AUDIT LOG
    // ==========================================

    await createAuditLog({
      req,
      action: "SLA_SETTINGS_UPDATED",
      resource: {
        type: "sla_policy",
        id: policy?._id || null,
      },
      description: "Updated SLA policy settings.",
      metadata: {
        previousPolicy,
        updatedPolicy: policy,
      },
    });

    return res.status(200).json({
      success: true,
      message: "SLA policy updated successfully.",
      policy,
    });
  } catch (error) {
    return sendError(res, error, "Failed to update SLA policy.");
  }
};

// ==========================================
// GET SLA STATISTICS
// GET /api/admin/sla/statistics
// ==========================================

export const getSlaStatistics = async (req, res) => {
  try {
    const statistics = await getSlaStatisticsService();

    return res.status(200).json({
      success: true,
      statistics,
    });
  } catch (error) {
    return sendError(res, error, "Failed to fetch SLA statistics.");
  }
};
