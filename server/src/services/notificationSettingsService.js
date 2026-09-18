import NotificationSettings from "../models/NotificationSettings.js";

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

export const getNotificationSettings = async () => {
  try {
    let settings = await NotificationSettings.findOne().lean();

    if (!settings) {
      settings = await NotificationSettings.create(DEFAULT_SETTINGS);
      return settings.toObject();
    }

    return settings;
  } catch (error) {
    console.error("GET NOTIFICATION SETTINGS ERROR:", error);

    // Fail-safe behavior:
    // If settings cannot be loaded, notifications remain enabled.
    return DEFAULT_SETTINGS;
  }
};

export const isNotificationEnabled = async (settingName) => {
  const settings = await getNotificationSettings();

  return settings?.[settingName] !== false;
};
