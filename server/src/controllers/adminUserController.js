import mongoose from "mongoose";
import User from "../models/User.js";
import Ticket from "../models/Ticket.js";
import bcrypt from "bcryptjs";

import {
  getAdminUsers,
  getAdminUserById,
  updateAdminUser,
  updateAdminUserStatus,
  deleteAdminUser,
  getAdminUserStats,
  getAdminCustomerTickets,
  getAdminCustomerActivity,
} from "../services/adminUserService.js";

import { createAuditLog } from "../services/auditLogService.js";

// ============================================================
// GET USERS
// ============================================================

export const getUsers = async (req, res) => {
  try {
    const {
      search = "",
      role = "all",
      status = "all",
      page = 1,
      limit = 10,
    } = req.query;

    const result = await getAdminUsers({
      search,
      role,
      status,
      page,
      limit,
    });

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("ADMIN GET USERS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load users.",
    });
  }
};

// ============================================================
// GET USER DETAILS
// ============================================================

export const getUser = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID.",
      });
    }

    const user = await getAdminUserById(userId);

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("ADMIN GET USER ERROR:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to load user.",
    });
  }
};

// ============================================================
// UPDATE USER
// ============================================================

export const updateUser = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID.",
      });
    }

    // ========================================================
    // GET EXISTING USER BEFORE UPDATE
    // ========================================================

    const existingUser = await User.findById(userId).select(
      "_id name email role status",
    );

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const user = await updateAdminUser({
      userId,
      data: req.body,
      currentAdminId: req.user.id,
    });

    // ========================================================
    // DETERMINE CHANGED FIELDS
    // ========================================================

    const changedFields = [];

    const fieldsToCheck = ["name", "email", "role", "status"];

    for (const field of fieldsToCheck) {
      if (
        req.body[field] !== undefined &&
        String(existingUser[field] ?? "") !== String(req.body[field] ?? "")
      ) {
        changedFields.push(field);
      }
    }

    // ========================================================
    // AUDIT LOG
    // ========================================================

    const isCustomer = existingUser.role === "customer";

    await createAuditLog({
      req,
      action: isCustomer ? "CUSTOMER_UPDATED" : "USER_UPDATED",
      resource: {
        type: isCustomer ? "customer" : "user",
        id: existingUser._id,
      },
      description: isCustomer
        ? `Updated customer "${existingUser.name}"`
        : `Updated user "${existingUser.name}"`,
      metadata: {
        userId: existingUser._id,
        previousName: existingUser.name,
        previousEmail: existingUser.email,
        previousRole: existingUser.role,
        previousStatus: existingUser.status,
        changedFields,
        changes: req.body,
      },
    });

    return res.status(200).json({
      success: true,
      message: "User updated successfully.",
      user,
    });
  } catch (error) {
    console.error("ADMIN UPDATE USER ERROR:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to update user.",
    });
  }
};

// ============================================================
// UPDATE USER STATUS
// ============================================================

export const updateUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID.",
      });
    }

    // ========================================================
    // GET EXISTING USER
    // ========================================================

    const existingUser = await User.findById(userId).select(
      "_id name email role status",
    );

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const previousStatus = existingUser.status;

    const user = await updateAdminUserStatus({
      userId,
      status,
      currentAdminId: req.user.id,
    });

    // ========================================================
    // AUDIT LOG
    // ========================================================

    const isCustomer = existingUser.role === "customer";

    await createAuditLog({
      req,
      action: isCustomer ? "CUSTOMER_STATUS_CHANGED" : "USER_STATUS_CHANGED",
      resource: {
        type: isCustomer ? "customer" : "user",
        id: existingUser._id,
      },
      description: isCustomer
        ? `Changed customer "${existingUser.name}" status from "${previousStatus}" to "${status}"`
        : `Changed user "${existingUser.name}" status from "${previousStatus}" to "${status}"`,
      metadata: {
        userId: existingUser._id,
        userName: existingUser.name,
        userEmail: existingUser.email,
        role: existingUser.role,
        previousStatus,
        newStatus: status,
      },
    });

    return res.status(200).json({
      success: true,
      message: "User status updated successfully.",
      user,
    });
  } catch (error) {
    console.error("ADMIN UPDATE USER STATUS ERROR:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to update user status.",
    });
  }
};

// ============================================================
// DELETE USER
// ============================================================

export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID.",
      });
    }

    // ========================================================
    // GET USER BEFORE DELETE
    // ========================================================

    const existingUser = await User.findById(userId).select(
      "_id name email role status",
    );

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const deletedUser = await deleteAdminUser({
      userId,
      currentAdminId: req.user.id,
    });

    // ========================================================
    // AUDIT LOG
    // ========================================================

    const isCustomer = existingUser.role === "customer";

    await createAuditLog({
      req,
      action: isCustomer ? "CUSTOMER_DELETED" : "USER_DELETED",
      resource: {
        type: isCustomer ? "customer" : "user",
        id: existingUser._id,
      },
      description: isCustomer
        ? `Deleted customer "${existingUser.name}"`
        : `Deleted user "${existingUser.name}"`,
      metadata: {
        userId: existingUser._id,
        name: existingUser.name,
        email: existingUser.email,
        role: existingUser.role,
        status: existingUser.status,
      },
    });

    return res.status(200).json({
      success: true,
      message: "User deleted successfully.",
      user: deletedUser,
    });
  } catch (error) {
    console.error("ADMIN DELETE USER ERROR:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to delete user.",
    });
  }
};

// ============================================================
// USER STATISTICS
// ============================================================

export const getUserStats = async (req, res) => {
  try {
    const stats = await getAdminUserStats();

    return res.status(200).json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error("ADMIN USER STATS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load user statistics.",
    });
  }
};

// ============================================================
// CREATE ADMIN USER
// ============================================================

export const createAdminUser = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role = "customer",
      status = "active",
    } = req.body;

    // ==========================================
    // VALIDATION
    // ==========================================

    if (!name?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Name is required.",
      });
    }

    if (!email?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Email is required.",
      });
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Password is required.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters.",
      });
    }

    // ==========================================
    // VALID ROLE
    // ==========================================

    const allowedRoles = ["admin", "agent", "customer"];

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user role.",
      });
    }

    // ==========================================
    // VALID STATUS
    // ==========================================

    const allowedStatuses = ["active", "inactive", "suspended"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user status.",
      });
    }

    // ==========================================
    // CHECK EXISTING EMAIL
    // ==========================================

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "A user with this email already exists.",
      });
    }

    // ==========================================
    // HASH PASSWORD
    // ==========================================

    const hashedPassword = await bcrypt.hash(password, 10);

    // ==========================================
    // CREATE USER
    // ==========================================

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role,
      status,
    });

    // ==========================================
    // AUDIT LOG
    // ==========================================

    const isCustomer = role === "customer";

    await createAuditLog({
      req,
      action: isCustomer ? "CUSTOMER_CREATED" : "USER_CREATED",
      resource: {
        type: isCustomer ? "customer" : "user",
        id: user._id,
      },
      description: isCustomer
        ? `Created customer "${user.name}"`
        : `Created ${role} user "${user.name}"`,
      metadata: {
        userId: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });

    // ==========================================
    // REMOVE PASSWORD FROM RESPONSE
    // ==========================================

    const userResponse = user.toObject();

    delete userResponse.password;

    return res.status(201).json({
      success: true,
      message: "User created successfully.",
      user: userResponse,
    });
  } catch (error) {
    console.error("ADMIN CREATE USER ERROR:", error);

    // MongoDB duplicate email protection
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A user with this email already exists.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create user.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// ============================================================
// USER TICKET STATISTICS
// ============================================================

export const getAdminUserTicketStats = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID.",
      });
    }

    const user = await User.findById(userId).select("_id role");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const [
      totalTickets,
      openTickets,
      inProgressTickets,
      waitingTickets,
      resolvedTickets,
      closedTickets,
      escalatedTickets,
    ] = await Promise.all([
      Ticket.countDocuments({
        $or: [{ customer: userId }, { assignedAgent: userId }],
      }),

      Ticket.countDocuments({
        customer: userId,
        status: "open",
      }),

      Ticket.countDocuments({
        customer: userId,
        status: "in-progress",
      }),

      Ticket.countDocuments({
        customer: userId,
        status: "waiting",
      }),

      Ticket.countDocuments({
        customer: userId,
        status: "resolved",
      }),

      Ticket.countDocuments({
        customer: userId,
        status: "closed",
      }),

      Ticket.countDocuments({
        $or: [{ customer: userId }, { assignedAgent: userId }],
        "escalation.isEscalated": true,
      }),
    ]);

    return res.status(200).json({
      success: true,
      stats: {
        totalTickets,
        openTickets,
        inProgressTickets,
        waitingTickets,
        resolvedTickets,
        closedTickets,
        escalatedTickets,
      },
    });
  } catch (error) {
    console.error("ADMIN USER TICKET STATS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load user ticket statistics.",
    });
  }
};

// ============================================================
// GET CUSTOMER TICKET HISTORY
// ============================================================

export const getAdminCustomerTicketsController = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID.",
      });
    }

    const { page = 1, limit = 10 } = req.query;

    const result = await getAdminCustomerTickets({
      userId,
      page,
      limit,
    });

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("ADMIN CUSTOMER TICKETS ERROR:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to load customer tickets.",
    });
  }
};

// ============================================================
// GET CUSTOMER ACTIVITY
// ============================================================

export const getAdminCustomerActivityController = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: error.message || "Failed to load customer activity.",
      });
    }

    const { limit = 30 } = req.query;

    const activities = await getAdminCustomerActivity({
      userId,
      limit,
    });

    return res.status(200).json({
      success: true,
      activities,
    });
  } catch (error) {
    console.error("ADMIN CUSTOMER ACTIVITY ERROR:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to load customer activity.",
    });
  }
};
