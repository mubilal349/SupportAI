import RolePermission from "../models/RolePermission.js";
import User from "../models/User.js";

import {
  ROLE_PERMISSIONS,
  PERMISSION_DEFINITIONS,
} from "../config/permissions.js";

// ==========================================
// VALID ROLES
// ==========================================

const VALID_ROLES = ["admin", "agent", "customer"];

const INDIVIDUAL_PERMISSION_ROLES = ["agent", "customer"];

// ==========================================
// VALIDATE PERMISSIONS
// ==========================================

const validatePermissions = (permissions) => {
  if (!Array.isArray(permissions)) {
    return {
      valid: false,
      message: "Permissions must be an array.",
    };
  }

  const validPermissionKeys = PERMISSION_DEFINITIONS.map(
    (permission) => permission.key,
  );

  const invalidPermissions = permissions.filter(
    (permission) => !validPermissionKeys.includes(permission),
  );

  if (invalidPermissions.length > 0) {
    return {
      valid: false,
      message: "Invalid permissions supplied.",
      invalidPermissions,
    };
  }

  return {
    valid: true,
    permissions: [...new Set(permissions)],
  };
};

// ==========================================
// GET ALL ROLE PERMISSIONS
// ==========================================
// GET /api/role-permissions
// ==========================================

export const getRolePermissions = async (req, res) => {
  try {
    const roles = await Promise.all(
      VALID_ROLES.map(async (role) => {
        const savedPermissions = await RolePermission.findOne({
          role,
        }).lean();

        return {
          role,

          permissions:
            savedPermissions?.permissions || ROLE_PERMISSIONS[role] || [],
        };
      }),
    );

    return res.status(200).json({
      success: true,
      permissions: roles,
      definitions: PERMISSION_DEFINITIONS,
    });
  } catch (error) {
    console.error("GET ROLE PERMISSIONS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch role permissions.",
    });
  }
};

// ==========================================
// GET SINGLE ROLE PERMISSIONS
// ==========================================
// GET /api/role-permissions/:role
// ==========================================

export const getSingleRolePermissions = async (req, res) => {
  try {
    const { role } = req.params;

    if (!VALID_ROLES.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role.",
      });
    }

    const savedPermissions = await RolePermission.findOne({
      role,
    }).lean();

    return res.status(200).json({
      success: true,
      role,

      permissions:
        savedPermissions?.permissions || ROLE_PERMISSIONS[role] || [],
    });
  } catch (error) {
    console.error("GET SINGLE ROLE PERMISSIONS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch role permissions.",
    });
  }
};

// ==========================================
// UPDATE ROLE PERMISSIONS
// ==========================================
// PATCH /api/role-permissions/:role
// ==========================================

export const updateRolePermissions = async (req, res) => {
  try {
    const { role } = req.params;
    const { permissions } = req.body;

    // ----------------------------------------
    // Validate role
    // ----------------------------------------

    if (!VALID_ROLES.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role.",
      });
    }

    // ----------------------------------------
    // Validate permissions
    // ----------------------------------------

    const validation = validatePermissions(permissions);

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.message,
        invalidPermissions: validation.invalidPermissions || [],
      });
    }

    const uniquePermissions = validation.permissions;

    // ----------------------------------------
    // Admin safety check
    // ----------------------------------------

    if (role === "admin" && !uniquePermissions.includes("dashboard.view")) {
      return res.status(400).json({
        success: false,
        message: "Admin must retain dashboard access.",
      });
    }

    // ----------------------------------------
    // Save / Update role permissions
    // ----------------------------------------

    const rolePermission = await RolePermission.findOneAndUpdate(
      { role },
      {
        role,
        permissions: uniquePermissions,
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      },
    );

    // ----------------------------------------
    // Response
    // ----------------------------------------

    return res.status(200).json({
      success: true,
      message: `${role} permissions updated successfully.`,

      role: rolePermission.role,

      permissions: rolePermission.permissions,
    });
  } catch (error) {
    console.error("UPDATE ROLE PERMISSIONS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update role permissions.",
    });
  }
};

// ==========================================
// GET MY EFFECTIVE PERMISSIONS
// ==========================================
// GET /api/role-permissions/me
// ==========================================
//
// Returns individual permissions when the user
// has a custom permission set.
//
// Otherwise returns role permissions.
// ==========================================

export const getMyPermissions = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id || req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const user = await User.findById(userId)
      .select("name email role permissions")
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    let permissions;

    // ----------------------------------------
    // Individual permissions
    // ----------------------------------------

    if (Array.isArray(user.permissions)) {
      permissions = user.permissions;
    } else {
      // --------------------------------------
      // Role permissions
      // --------------------------------------

      const savedRolePermissions = await RolePermission.findOne({
        role: user.role,
      }).lean();

      permissions =
        savedRolePermissions?.permissions || ROLE_PERMISSIONS[user.role] || [];
    }

    return res.status(200).json({
      success: true,

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },

      role: user.role,

      permissions,

      isCustomized: Array.isArray(user.permissions),
    });
  } catch (error) {
    console.error("GET MY PERMISSIONS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch your permissions.",
    });
  }
};

// ==========================================
// GET USERS FOR INDIVIDUAL PERMISSIONS
// ==========================================
// GET /api/role-permissions/users?role=customer
// GET /api/role-permissions/users?role=agent
// ==========================================
//
// Admin can use this endpoint to load all
// customers or agents.
// ==========================================

export const getUsersForPermissions = async (req, res) => {
  try {
    const { role } = req.query;

    // ----------------------------------------
    // Validate role
    // ----------------------------------------

    if (!INDIVIDUAL_PERMISSION_ROLES.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Role must be either agent or customer.",
      });
    }

    // ----------------------------------------
    // Get users
    // ----------------------------------------

    const users = await User.find({ role })
      .select("name email avatar status availability permissions createdAt")
      .sort({ name: 1 })
      .lean();

    // ----------------------------------------
    // Add effective permission information
    // ----------------------------------------

    const rolePermissions = await RolePermission.findOne({
      role,
    }).lean();

    const defaultPermissions =
      rolePermissions?.permissions || ROLE_PERMISSIONS[role] || [];

    const usersWithPermissionInfo = users.map((user) => {
      const isCustomized = Array.isArray(user.permissions);

      const effectivePermissions = isCustomized
        ? user.permissions
        : defaultPermissions;

      return {
        ...user,

        isCustomized,

        effectivePermissions,

        permissionCount: effectivePermissions.length,

        rolePermissionCount: defaultPermissions.length,
      };
    });

    return res.status(200).json({
      success: true,

      role,

      users: usersWithPermissionInfo,

      rolePermissions: defaultPermissions,

      total: usersWithPermissionInfo.length,
    });
  } catch (error) {
    console.error("GET USERS FOR PERMISSIONS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch users for permissions.",
    });
  }
};

// ==========================================
// GET INDIVIDUAL USER PERMISSIONS
// ==========================================
// GET /api/role-permissions/users/:userId
// ==========================================

export const getUserPermissions = async (req, res) => {
  try {
    const { userId } = req.params;

    // ----------------------------------------
    // Find user
    // ----------------------------------------

    const user = await User.findById(userId)
      .select("name email avatar role status availability permissions")
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // ----------------------------------------
    // Only agent/customer individual
    // permissions are managed here.
    // ----------------------------------------

    if (!INDIVIDUAL_PERMISSION_ROLES.includes(user.role)) {
      return res.status(400).json({
        success: false,
        message:
          "Individual permissions are only available for agents and customers.",
      });
    }

    // ----------------------------------------
    // Get role defaults
    // ----------------------------------------

    const savedRolePermissions = await RolePermission.findOne({
      role: user.role,
    }).lean();

    const rolePermissions =
      savedRolePermissions?.permissions || ROLE_PERMISSIONS[user.role] || [];

    // ----------------------------------------
    // Determine effective permissions
    // ----------------------------------------

    const isCustomized = Array.isArray(user.permissions);

    const effectivePermissions = isCustomized
      ? user.permissions
      : rolePermissions;

    return res.status(200).json({
      success: true,

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        status: user.status,
        availability: user.availability,
      },

      permissions: effectivePermissions,

      effectivePermissions,

      rolePermissions,

      isCustomized,
    });
  } catch (error) {
    console.error("GET USER PERMISSIONS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch user permissions.",
    });
  }
};

// ==========================================
// UPDATE INDIVIDUAL USER PERMISSIONS
// ==========================================
// PATCH /api/role-permissions/users/:userId
// ==========================================
//
// Body:
//
// {
//   "permissions": [
//     "dashboard.view",
//     "tickets.view"
//   ]
// }
//
// ==========================================

export const updateUserPermissions = async (req, res) => {
  try {
    const { userId } = req.params;
    const { permissions } = req.body;

    // ----------------------------------------
    // Find user
    // ----------------------------------------

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // ----------------------------------------
    // Only agent/customer
    // ----------------------------------------

    if (!INDIVIDUAL_PERMISSION_ROLES.includes(user.role)) {
      return res.status(400).json({
        success: false,
        message:
          "Individual permissions can only be changed for agents and customers.",
      });
    }

    // ----------------------------------------
    // Validate permissions
    // ----------------------------------------

    const validation = validatePermissions(permissions);

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.message,
        invalidPermissions: validation.invalidPermissions || [],
      });
    }

    const uniquePermissions = validation.permissions;

    // ----------------------------------------
    // Save individual permissions
    // ----------------------------------------

    user.permissions = uniquePermissions;

    await user.save();

    return res.status(200).json({
      success: true,

      message: `${user.role} individual permissions updated successfully.`,

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },

      permissions: user.permissions,

      isCustomized: true,
    });
  } catch (error) {
    console.error("UPDATE USER PERMISSIONS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update user permissions.",
    });
  }
};

// ==========================================
// RESET INDIVIDUAL USER PERMISSIONS
// ==========================================
// DELETE /api/role-permissions/users/:userId
// ==========================================
//
// Reset means:
//
// permissions = null
//
// The user will then inherit the permissions
// from their role again.
// ==========================================

export const resetUserPermissions = async (req, res) => {
  try {
    const { userId } = req.params;

    // ----------------------------------------
    // Find user
    // ----------------------------------------

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // ----------------------------------------
    // Only agent/customer
    // ----------------------------------------

    if (!INDIVIDUAL_PERMISSION_ROLES.includes(user.role)) {
      return res.status(400).json({
        success: false,
        message:
          "Individual permissions can only be reset for agents and customers.",
      });
    }

    // ----------------------------------------
    // Reset to role defaults
    // ----------------------------------------

    user.permissions = null;

    await user.save();

    // ----------------------------------------
    // Get current role permissions
    // ----------------------------------------

    const savedRolePermissions = await RolePermission.findOne({
      role: user.role,
    }).lean();

    const rolePermissions =
      savedRolePermissions?.permissions || ROLE_PERMISSIONS[user.role] || [];

    return res.status(200).json({
      success: true,

      message: `${user.role} permissions reset to role defaults.`,

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },

      permissions: rolePermissions,

      isCustomized: false,
    });
  } catch (error) {
    console.error("RESET USER PERMISSIONS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to reset user permissions.",
    });
  }
};
