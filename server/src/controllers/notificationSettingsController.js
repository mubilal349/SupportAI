import NotificationSettings from "../models/NotificationSettings.js";
import { createAuditLog } from "../services/auditLogService.js";

const DEFAULT_SETTINGS = {
  emailNotifications: true,
  inAppNotifications: true,
  ticketNotifications: true,
  newTicketNotifications: true,
  newReplyNotifications: true,
  assignmentNotifications: true,
  statusChangeNotifications: true,
  escalationNotifications: true,
  aiReplyNotifications: true,
};

// ==========================================
// GET NOTIFICATION SETTINGS
// ==========================================

export const getNotificationSettings = async (req, res) => {
  try {
    let settings = await NotificationSettings.findOne();

    if (!settings) {
      settings = await NotificationSettings.create(DEFAULT_SETTINGS);
    }

    return res.status(200).json({
      settings,
    });
  } catch (error) {
    console.error("Get notification settings error:", error);

    return res.status(500).json({
      message: "Failed to fetch notification settings",
      error: error.message,
    });
  }
};

// ==========================================
// UPDATE NOTIFICATION SETTINGS
// ==========================================

export const updateNotificationSettings = async (req, res) => {
  try {
    let settings = await NotificationSettings.findOne();

    if (!settings) {
      settings = await NotificationSettings.create(DEFAULT_SETTINGS);
    }

    const previousValues = {
      emailNotifications: settings.emailNotifications,
      inAppNotifications: settings.inAppNotifications,
      ticketNotifications: settings.ticketNotifications,
      newTicketNotifications: settings.newTicketNotifications,
      newReplyNotifications: settings.newReplyNotifications,
      assignmentNotifications: settings.assignmentNotifications,
      statusChangeNotifications: settings.statusChangeNotifications,
      escalationNotifications: settings.escalationNotifications,
      aiReplyNotifications: settings.aiReplyNotifications,
    };

    const fields = Object.keys(previousValues);

    fields.forEach((field) => {
      if (typeof req.body[field] === "boolean") {
        settings[field] = req.body[field];
      }
    });

    await settings.save();

    const newValues = {
      emailNotifications: settings.emailNotifications,
      inAppNotifications: settings.inAppNotifications,
      ticketNotifications: settings.ticketNotifications,
      newTicketNotifications: settings.newTicketNotifications,
      newReplyNotifications: settings.newReplyNotifications,
      assignmentNotifications: settings.assignmentNotifications,
      statusChangeNotifications: settings.statusChangeNotifications,
      escalationNotifications: settings.escalationNotifications,
      aiReplyNotifications: settings.aiReplyNotifications,
    };

    const changedFields = fields.filter(
      (field) => previousValues[field] !== newValues[field],
    );

    if (changedFields.length > 0) {
      await createAuditLog({
        req,
        actor: req.user,
        action: "NOTIFICATION_SETTINGS_UPDATED",
        resource: {
          type: "notification_settings",
          id: settings._id,
        },
        description: `Notification settings were updated by ${
          req.user?.name || "Administrator"
        }.`,
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
          ? "Notification settings updated successfully."
          : "No changes were made.",
      settings,
      changedFields,
    });
  } catch (error) {
    console.error("Update notification settings error:", error);

    return res.status(500).json({
      message: "Failed to update notification settings",
      error: error.message,
    });
  }
};
