import AuditLog from "../models/AuditLog.js";

// ==========================================
// GET AUDIT LOGS
// ==========================================

export const getAuditLogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 25,
      search = "",
      action = "",
      role = "",
      resourceType = "",
    } = req.query;

    const currentPage = Math.max(Number(page) || 1, 1);
    const perPage = Math.min(Math.max(Number(limit) || 25, 1), 100);

    const skip = (currentPage - 1) * perPage;

    const query = {};

    // ==========================================
    // SEARCH
    // ==========================================

    if (search.trim()) {
      const searchRegex = new RegExp(
        search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "i",
      );

      query.$or = [
        {
          "actor.name": searchRegex,
        },
        {
          "actor.email": searchRegex,
        },
        {
          action: searchRegex,
        },
        {
          description: searchRegex,
        },
        {
          "resource.type": searchRegex,
        },
      ];
    }

    // ==========================================
    // ACTION FILTER
    // ==========================================

    if (action.trim()) {
      query.action = action.trim().toUpperCase();
    }

    // ==========================================
    // ROLE FILTER
    // ==========================================

    if (role.trim()) {
      query["actor.role"] = role.trim().toLowerCase();
    }

    // ==========================================
    // RESOURCE FILTER
    // ==========================================

    if (resourceType.trim()) {
      query["resource.type"] = resourceType.trim();
    }

    // ==========================================
    // FETCH
    // ==========================================

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(perPage)
        .lean(),

      AuditLog.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / perPage);

    return res.status(200).json({
      success: true,

      data: logs,

      pagination: {
        page: currentPage,
        limit: perPage,
        total,
        totalPages,
        hasNextPage: currentPage < totalPages,
        hasPreviousPage: currentPage > 1,
      },
    });
  } catch (error) {
    console.error("Get audit logs error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch audit logs.",
    });
  }
};

// ==========================================
// GET SINGLE AUDIT LOG
// ==========================================

export const getAuditLog = async (req, res) => {
  try {
    const { id } = req.params;

    const log = await AuditLog.findById(id).lean();

    if (!log) {
      return res.status(404).json({
        success: false,
        message: "Audit log not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: log,
    });
  } catch (error) {
    console.error("Get audit log error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch audit log.",
    });
  }
};
