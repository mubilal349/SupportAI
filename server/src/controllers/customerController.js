import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Conversation from "../models/Conversation.js";
import Ticket from "../models/Ticket.js";

// ==========================================
// GET CUSTOMER DASHBOARD
// ==========================================

export const getCustomerDashboard = async (req, res) => {
  try {
    const customerId = req.user._id;

    const [
      totalConversations,
      activeConversations,
      totalTickets,
      openTickets,
      resolvedTickets,
      recentConversations,
      recentTickets,
    ] = await Promise.all([
      Conversation.countDocuments({
        customer: customerId,
      }),

      Conversation.countDocuments({
        customer: customerId,
        status: "active",
      }),

      Ticket.countDocuments({
        customer: customerId,
      }),

      Ticket.countDocuments({
        customer: customerId,
        status: {
          $in: ["open", "in-progress"],
        },
      }),

      Ticket.countDocuments({
        customer: customerId,
        status: {
          $in: ["resolved", "closed"],
        },
      }),

      Conversation.find({
        customer: customerId,
        status: {
          $ne: "archived",
        },
      })
        .sort({ updatedAt: -1 })
        .limit(5),

      Ticket.find({
        customer: customerId,
      })
        .sort({ updatedAt: -1 })
        .limit(5),
    ]);

    res.json({
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

    res.status(500).json({
      success: false,
      message: "Failed to load customer dashboard",
    });
  }
};

// ==========================================
// GET PROFILE
// ==========================================

export const getCustomerProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Get profile error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load profile",
    });
  }
};

// ==========================================
// UPDATE PROFILE
// ==========================================

export const updateCustomerProfile = async (req, res) => {
  try {
    const { name, phone, company, avatar } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (name !== undefined) {
      user.name = name.trim();
    }

    if (phone !== undefined) {
      user.phone = phone.trim();
    }

    if (company !== undefined) {
      user.company = company.trim();
    }

    if (avatar !== undefined) {
      user.avatar = avatar;
    }

    await user.save();

    const safeUser = await User.findById(user._id).select("-password");

    res.json({
      success: true,
      message: "Profile updated successfully",
      user: safeUser,
    });
  } catch (error) {
    console.error("Update profile error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update profile",
    });
  }
};

// ==========================================
// CHANGE PASSWORD
// ==========================================

export const changeCustomerPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current and new password are required",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "New password must contain at least 8 characters",
      });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    user.password = await bcrypt.hash(newPassword, 12);

    await user.save();

    res.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change password error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to change password",
    });
  }
};
