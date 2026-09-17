import AuditLog from "../models/AuditLog.js";

/**
 * Create an audit log entry.
 *
 * This utility is intentionally non-blocking for the
 * main business operation. If logging fails, the original
 * request should not fail because of the audit system.
 */
export const createAuditLog = async ({
  req = null,
  action,
  resourceType = "",
  resourceId = null,
  description,
  metadata = {},
}) => {
  try {
    const user = req?.user || null;

    const actor = {
      userId: user?.id || user?._id || null,
      name: user?.name || user?.fullName || user?.username || "System",
      email: user?.email || "",
      role: user?.role || "system",
    };

    let ipAddress = "";

    if (req) {
      ipAddress =
        req.headers?.["x-forwarded-for"]?.split(",")[0]?.trim() ||
        req.socket?.remoteAddress ||
        req.ip ||
        "";
    }

    const userAgent = req?.headers?.["user-agent"] || "";

    const auditLog = await AuditLog.create({
      actor,
      action,
      resource: {
        type: resourceType,
        id: resourceId || null,
      },
      description,
      metadata,
      ipAddress,
      userAgent,
    });

    return auditLog;
  } catch (error) {
    console.error("Audit log creation error:", error);

    // Audit logging must never break the main operation.
    return null;
  }
};
