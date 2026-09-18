import SystemSettings from "../models/SystemSettings.js";
import { createAuditLog } from "../services/auditLogService.js";

const DEFAULT_SETTINGS = {
  systemName: "SupportAI",
  timezone: "Asia/Karachi",
  emailNotifications: true,
  ticketNotifications: true,
  aiEnabled: true,
  maintenanceMode: false,
};

// ============================================================
// GET SYSTEM SETTINGS
// ============================================================

export const getSystemSettings = async (req, res) => {
  try {
    let settings = await SystemSettings.findOne();

    if (!settings) {
      settings = await SystemSettings.create(DEFAULT_SETTINGS);
    }

    return res.status(200).json({
      settings,
    });
  } catch (error) {
    console.error("Get system settings error:", error);

    return res.status(500).json({
      message: "Failed to fetch system settings",
      error: error.message,
    });
  }
};

// ============================================================
// UPDATE SYSTEM SETTINGS
// ============================================================

export const updateSystemSettings = async (req, res) => {
  try {
    const {
      systemName,
      timezone,
      emailNotifications,
      ticketNotifications,
      aiEnabled,
      maintenanceMode,
    } = req.body;

    let settings = await SystemSettings.findOne();

    if (!settings) {
      settings = await SystemSettings.create(DEFAULT_SETTINGS);
    }

    // ========================================================
    // KEEP PREVIOUS VALUES FOR AUDIT LOG
    // ========================================================

    const previousValues = {
      systemName: settings.systemName,
      timezone: settings.timezone,
      emailNotifications: settings.emailNotifications,
      ticketNotifications: settings.ticketNotifications,
      aiEnabled: settings.aiEnabled,
      maintenanceMode: settings.maintenanceMode,
    };

    // ========================================================
    // VALIDATION
    // ========================================================

    if (typeof systemName === "string" && systemName.trim()) {
      settings.systemName = systemName.trim();
    }

    if (typeof timezone === "string") {
      settings.timezone = timezone.trim();
    }

    if (typeof emailNotifications === "boolean") {
      settings.emailNotifications = emailNotifications;
    }

    if (typeof ticketNotifications === "boolean") {
      settings.ticketNotifications = ticketNotifications;
    }

    if (typeof aiEnabled === "boolean") {
      settings.aiEnabled = aiEnabled;
    }

    if (typeof maintenanceMode === "boolean") {
      settings.maintenanceMode = maintenanceMode;
    }

    await settings.save();

    // ========================================================
    // NEW VALUES
    // ========================================================

    const newValues = {
      systemName: settings.systemName,
      timezone: settings.timezone,
      emailNotifications: settings.emailNotifications,
      ticketNotifications: settings.ticketNotifications,
      aiEnabled: settings.aiEnabled,
      maintenanceMode: settings.maintenanceMode,
    };

    const changedFields = Object.keys(newValues).filter(
      (field) => previousValues[field] !== newValues[field],
    );

    // ========================================================
    // AUDIT LOG
    // ========================================================

    if (changedFields.length > 0) {
      await createAuditLog({
        req,
        actor: req.user,
        action: "SYSTEM_SETTINGS_UPDATED",
        resource: {
          type: "system_settings",
          id: settings._id,
        },
        description: `System settings were updated by ${req.user?.name || "Administrator"}.`,
        metadata: {
          changedFields,
          previousValues,
          newValues,
        },
      });
    }

    return res.status(200).json({
      message:
        changedFields.length > 0
          ? "System settings updated successfully."
          : "No changes were made.",
      settings,
      changedFields,
    });
  } catch (error) {
    console.error("Update system settings error:", error);

    return res.status(500).json({
      message: "Failed to update system settings",
      error: error.message,
    });
  }
};
