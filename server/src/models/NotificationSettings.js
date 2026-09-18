import mongoose from "mongoose";

const notificationSettingsSchema = new mongoose.Schema(
  {
    emailNotifications: {
      type: Boolean,
      default: true,
    },

    inAppNotifications: {
      type: Boolean,
      default: true,
    },

    ticketNotifications: {
      type: Boolean,
      default: true,
    },

    newTicketNotifications: {
      type: Boolean,
      default: true,
    },

    newReplyNotifications: {
      type: Boolean,
      default: true,
    },

    assignmentNotifications: {
      type: Boolean,
      default: true,
    },

    statusChangeNotifications: {
      type: Boolean,
      default: true,
    },

    escalationNotifications: {
      type: Boolean,
      default: true,
    },

    aiReplyNotifications: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

const NotificationSettings = mongoose.model(
  "NotificationSettings",
  notificationSettingsSchema,
);

export default NotificationSettings;
