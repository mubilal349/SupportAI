import AuditLog from "../models/AuditLog.js";

// ==========================================
// CREATE AUDIT LOG
// ==========================================

export const createAuditLog = async ({
  req = null,
  actor = null,
  action,
  resource = {},
  description,
  metadata = {},
}) => {
  try {
    if (!action) {
      console.warn("Audit log skipped: action is missing");
      return null;
    }

    if (!description) {
      console.warn("Audit log skipped: description is missing");
      return null;
    }

    // ==========================================
    // ACTOR
    // ==========================================

    let actorData = {
      userId: null,
      name: "System",
      email: "",
      role: "system",
    };

    if (actor) {
      actorData = {
        userId: actor.userId || actor._id || null,
        name: actor.name || "System",
        email: actor.email || "",
        role: actor.role || "system",
      };
    } else if (req?.user) {
      actorData = {
        userId: req.user._id || req.user.id || req.user.userId || null,
        name: req.user.name || "System",
        email: req.user.email || "",
        role: req.user.role || "system",
      };
    }

    // ==========================================
    // RESOURCE
    // ==========================================

    const resourceData = {
      type: resource?.type || "",
      id: resource?.id || null,
    };

    // ==========================================
    // REQUEST INFORMATION
    // ==========================================

    const ipAddress =
      req?.headers?.["x-forwarded-for"]?.split(",")[0]?.trim() ||
      req?.ip ||
      req?.socket?.remoteAddress ||
      "";

    const userAgent = req?.headers?.["user-agent"] || "";

    // ==========================================
    // CREATE LOG
    // ==========================================

    const auditLog = await AuditLog.create({
      actor: actorData,

      action: action.toUpperCase(),

      resource: resourceData,

      description,

      metadata,

      ipAddress,

      userAgent,
    });

    return auditLog;
  } catch (error) {
    // ==========================================
    // AUDIT FAILURE SHOULD NOT BREAK MAIN ACTION
    // ==========================================

    console.error("Create audit log error:", error);

    return null;
  }
};
