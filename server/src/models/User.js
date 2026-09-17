import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    // ==========================================
    // BASIC INFORMATION
    // ==========================================

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      minlength: 6,
      default: null,
    },

    // ==========================================
    // AUTHENTICATION
    // ==========================================

    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },

    googleId: {
      type: String,
      unique: true,
      sparse: true,
      default: null,
    },

    // ==========================================
    // ROLE
    // ==========================================

    role: {
      type: String,
      enum: ["admin", "agent", "customer"],
      default: "customer",
    },

    // ==========================================
    // PROFILE
    // ==========================================

    avatar: {
      type: String,
      default: "",
    },

    phone: {
      type: String,
      default: "",
      trim: true,
      maxlength: 30,
    },

    company: {
      type: String,
      default: "",
      trim: true,
      maxlength: 150,
    },

    // ==========================================
    // CUSTOMER PREFERENCES
    // ==========================================

    timezone: {
      type: String,
      default: "Asia/Karachi",
      trim: true,
    },

    language: {
      type: String,
      default: "English",
      trim: true,
    },

    theme: {
      type: String,
      enum: ["light", "dark", "system"],
      default: "dark",
    },

    preferredChannel: {
      type: String,
      enum: ["chat", "email", "both"],
      default: "chat",
    },

    // ==========================================
    // NOTIFICATION PREFERENCES
    // ==========================================

    notificationPreferences: {
      email: {
        type: Boolean,
        default: true,
      },

      ticketUpdates: {
        type: Boolean,
        default: true,
      },

      newMessages: {
        type: Boolean,
        default: true,
      },

      ticketResolved: {
        type: Boolean,
        default: true,
      },
    },

    // ==========================================
    // AI SUPPORT PREFERENCES
    // ==========================================

    aiSupport: {
      enabled: {
        type: Boolean,
        default: true,
      },

      allowAutoResponse: {
        type: Boolean,
        default: true,
      },
    },

    // ==========================================
    // ACCOUNT STATUS
    // ==========================================

    status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "active",
    },

    availability: {
      type: String,
      enum: ["online", "away", "busy", "offline"],
      default: "offline",
    },

    permissions: {
      type: [String],
      default: null,
    },

    // ==========================================
    // ACTIVITY
    // ==========================================

    lastSeen: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

const User = mongoose.model("User", userSchema);

export default User;
