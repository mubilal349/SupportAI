import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import User from "../models/User.js";
import Conversation from "../models/Conversation.js";
import Ticket from "../models/Ticket.js";

// ==========================================
// HELPER: VALIDATE USER ID
// ==========================================

const isValidUserId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

// ==========================================
// GET CUSTOMER DASHBOARD
// ==========================================

export const getCustomerDashboard = async (req, res) => {
  try {
    const customerId = req.user?.id;

    if (!customerId || !isValidUserId(customerId)) {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication",
      });
    }

    const [
      totalConversations,
      activeConversations,
      totalTickets,
      openTickets,
      resolvedTickets,
      recentConversations,
      recentTickets,
    ] = await Promise.all([
      // Total conversations
      Conversation.countDocuments({
        customer: customerId,
      }),

      // Active conversations
      Conversation.countDocuments({
        customer: customerId,
        status: "active",
      }),

      // Total tickets
      Ticket.countDocuments({
        customer: customerId,
      }),

      // Open + in-progress tickets
      Ticket.countDocuments({
        customer: customerId,
        status: {
          $in: ["open", "in-progress"],
        },
      }),

      // Resolved + closed tickets
      Ticket.countDocuments({
        customer: customerId,
        status: {
          $in: ["resolved", "closed"],
        },
      }),

      // Recent conversations
      Conversation.find({
        customer: customerId,
        status: {
          $ne: "archived",
        },
      })
        .sort({ updatedAt: -1 })
        .limit(5)
        .lean(),

      // Recent tickets
      Ticket.find({
        customer: customerId,
      })
        .sort({ updatedAt: -1 })
        .limit(5)
        .lean(),
    ]);

    return res.status(200).json({
      success: true,

      stats: {
        totalConversations,
        activeConversations,
        totalTickets,
        openTickets,
        resolvedTickets,
      },

      recentConversations,
      recentTickets,
    });
  } catch (error) {
    console.error("Customer dashboard error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load customer dashboard",
    });
  }
};

// ==========================================
// GET CUSTOMER PROFILE
// ==========================================

export const getCustomerProfile = async (req, res) => {
  try {
    const customerId = req.user?.id;

    if (!customerId || !isValidUserId(customerId)) {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication",
      });
    }

    const user = await User.findById(customerId).select("-password").lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Get customer profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load profile",
    });
  }
};

// ==========================================
// UPDATE CUSTOMER PROFILE
// ==========================================

export const updateCustomerProfile = async (req, res) => {
  try {
    const customerId = req.user?.id;

    if (!customerId || !isValidUserId(customerId)) {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication",
      });
    }

    const { name, email, phone, company, timezone, language } = req.body || {};

    const user = await User.findById(customerId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // ==========================================
    // NAME
    // ==========================================

    if (name !== undefined) {
      const trimmedName = String(name).trim();

      if (!trimmedName) {
        return res.status(400).json({
          success: false,
          message: "Name cannot be empty",
        });
      }

      user.name = trimmedName;
    }

    // ==========================================
    // EMAIL
    // ==========================================

    if (email !== undefined) {
      const trimmedEmail = String(email).trim().toLowerCase();

      if (!trimmedEmail) {
        return res.status(400).json({
          success: false,
          message: "Email cannot be empty",
        });
      }

      // Check whether another user already has this email
      const existingUser = await User.findOne({
        email: trimmedEmail,
        _id: { $ne: customerId },
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: "This email address is already in use.",
        });
      }

      user.email = trimmedEmail;
    }

    // ==========================================
    // PHONE
    // ==========================================

    if (phone !== undefined) {
      user.phone = String(phone).trim();
    }

    // ==========================================
    // COMPANY
    // ==========================================

    if (company !== undefined) {
      user.company = String(company).trim();
    }

    // ==========================================
    // TIMEZONE
    // ==========================================

    if (timezone !== undefined) {
      user.timezone = String(timezone).trim();
    }

    // ==========================================
    // LANGUAGE
    // ==========================================

    if (language !== undefined) {
      user.language = String(language).trim();
    }

    // ==========================================
    // AVATAR
    // ==========================================

    if (req.file) {
      user.avatar = `/uploads/avatars/${req.file.filename}`;
    }

    // ==========================================
    // SAVE
    // ==========================================

    await user.save();

    // ==========================================
    // SAFE RESPONSE
    // ==========================================

    const safeUser = user.toObject();

    delete safeUser.password;

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: safeUser,
    });
  } catch (error) {
    console.error("Update customer profile error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update profile",
    });
  }
};

// ==========================================
// CHANGE CUSTOMER PASSWORD
// ==========================================

export const changeCustomerPassword = async (req, res) => {
  try {
    const customerId = req.user?.id;

    if (!customerId || !isValidUserId(customerId)) {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication",
      });
    }

    const { currentPassword, newPassword } = req.body;

    // ------------------------------
    // REQUIRED FIELDS
    // ------------------------------

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current and new password are required",
      });
    }

    // ------------------------------
    // PASSWORD LENGTH
    // ------------------------------

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "New password must contain at least 8 characters",
      });
    }

    // ------------------------------
    // PREVENT SAME PASSWORD
    // ------------------------------

    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message: "New password must be different from your current password",
      });
    }

    // ------------------------------
    // FIND USER
    // ------------------------------

    const user = await User.findById(customerId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // ------------------------------
    // VERIFY CURRENT PASSWORD
    // ------------------------------

    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // ------------------------------
    // HASH NEW PASSWORD
    // ------------------------------

    user.password = await bcrypt.hash(newPassword, 12);

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change customer password error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to change password",
    });
  }
};
