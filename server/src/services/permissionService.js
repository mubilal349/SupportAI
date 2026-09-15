import RolePermission from "../models/RolePermission.js";
import { ROLE_PERMISSIONS } from "../config/permissions.js";

// ==========================================
// GET PERMISSIONS FOR A ROLE
// ==========================================

export const getRolePermissions = async (role) => {
  try {
    if (!role) {
      return [];
    }

    const savedRolePermissions = await RolePermission.findOne({
      role,
    }).lean();

    // If custom permissions exist in MongoDB,
    // use them.
    if (savedRolePermissions) {
      return savedRolePermissions.permissions || [];
    }

    // Otherwise use the default permissions
    // from config/permissions.js
    return ROLE_PERMISSIONS[role] || [];
  } catch (error) {
    console.error("GET ROLE PERMISSIONS ERROR:", error);

    // Fallback to default permissions if
    // MongoDB lookup fails.
    return ROLE_PERMISSIONS[role] || [];
  }
};

// ==========================================
// CHECK ONE PERMISSION
// ==========================================

export const hasPermission = async (role, permission) => {
  try {
    if (!role || !permission) {
      return false;
    }

    const permissions = await getRolePermissions(role);

    return permissions.includes(permission);
  } catch (error) {
    console.error("HAS PERMISSION ERROR:", error);

    return false;
  }
};

// ==========================================
// CHECK ANY PERMISSION
// ==========================================

export const hasAnyPermission = async (role, permissionsToCheck = []) => {
  try {
    if (!role || !Array.isArray(permissionsToCheck)) {
      return false;
    }

    const permissions = await getRolePermissions(role);

    return permissionsToCheck.some((permission) =>
      permissions.includes(permission),
    );
  } catch (error) {
    console.error("HAS ANY PERMISSION ERROR:", error);

    return false;
  }
};

// ==========================================
// CHECK ALL PERMISSIONS
// ==========================================

export const hasAllPermissions = async (role, permissionsToCheck = []) => {
  try {
    if (!role || !Array.isArray(permissionsToCheck)) {
      return false;
    }

    const permissions = await getRolePermissions(role);

    return permissionsToCheck.every((permission) =>
      permissions.includes(permission),
    );
  } catch (error) {
    console.error("HAS ALL PERMISSIONS ERROR:", error);

    return false;
  }
};
