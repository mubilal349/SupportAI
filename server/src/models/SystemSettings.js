import mongoose from "mongoose";

const systemSettingsSchema = new mongoose.Schema(
  {
    systemName: {
      type: String,
      default: "SupportAI",
      trim: true,
      maxlength: 100,
    },

    timezone: {
      type: String,
      default: "Asia/Karachi",
      trim: true,
    },

    emailNotifications: {
      type: Boolean,
      default: true,
    },

    ticketNotifications: {
      type: Boolean,
      default: true,
    },

    aiEnabled: {
      type: Boolean,
      default: true,
    },

    maintenanceMode: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

const SystemSettings = mongoose.model("SystemSettings", systemSettingsSchema);

export default SystemSettings;
