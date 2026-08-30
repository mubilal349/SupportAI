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
      required: true,
      minlength: 6,
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
    // ACCOUNT STATUS
    // ==========================================

    status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "active",
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
