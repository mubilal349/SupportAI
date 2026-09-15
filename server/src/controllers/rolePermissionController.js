import RolePermission from "../models/RolePermission.js";

import {
  ROLE_PERMISSIONS,
  PERMISSION_DEFINITIONS,
} from "../config/permissions.js";

// ==========================================
// VALID ROLES
// ==========================================

const VALID_ROLES = ["admin", "agent", "customer"];

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

          // Use customized MongoDB permissions
          // if they exist, otherwise use defaults.
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

    // Validate role
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
    // Validate permissions array
    // ----------------------------------------

    if (!Array.isArray(permissions)) {
      return res.status(400).json({
        success: false,
        message: "Permissions must be an array.",
      });
    }

    // ----------------------------------------
    // Get all valid permission keys
    // ----------------------------------------

    const validPermissionKeys = PERMISSION_DEFINITIONS.map(
      (permission) => permission.key,
    );

    // ----------------------------------------
    // Remove invalid permissions
    // ----------------------------------------

    const invalidPermissions = permissions.filter(
      (permission) => !validPermissionKeys.includes(permission),
    );

    if (invalidPermissions.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid permissions supplied.",
        invalidPermissions,
      });
    }

    // ----------------------------------------
    // Remove duplicate permissions
    // ----------------------------------------

    const uniquePermissions = [...new Set(permissions)];

    // ----------------------------------------
    // Admin safety check
    // ----------------------------------------
    // Admin must always have dashboard access.
    // This prevents accidentally locking every
    // admin out of the administration area.
    // ----------------------------------------

    if (role === "admin" && !uniquePermissions.includes("dashboard.view")) {
      return res.status(400).json({
        success: false,
        message: "Admin must retain dashboard access.",
      });
    }

    // ----------------------------------------
    // Save / Update permissions
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

export const getMyPermissions = async (req, res) => {
  try {
    const role = req.user?.role;
    if (!role) {
      return res
        .status(401)
        .json({ success: false, message: "Authentication required." });
    }
    const savedPermissions = await RolePermission.findOne({ role }).lean();
    return res
      .status(200)
      .json({
        success: true,
        role,
        permissions:
          savedPermissions?.permissions || ROLE_PERMISSIONS[role] || [],
      });
  } catch (error) {
    console.error("GET MY PERMISSIONS ERROR:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch your permissions." });
  }
};
