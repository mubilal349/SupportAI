import RolePermission from "../models/RolePermission.js";
import User from "../models/User.js";
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

    // If custom role permissions exist in MongoDB,
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
// GET PERMISSIONS FOR A USER
// ==========================================
//
// Priority:
//
// 1. Individual user permissions
// 2. Role permissions
// 3. Default ROLE_PERMISSIONS
//
// permissions: null
//     -> use role permissions
//
// permissions: []
//     -> user has custom permissions but none enabled
//
// permissions: ["dashboard.view", ...]
//     -> use exactly these permissions
// ==========================================

export const getUserPermissions = async (user) => {
  try {
    if (!user) {
      return [];
    }

    // ------------------------------------------
    // Individual permissions exist
    // ------------------------------------------
    //
    // Array.isArray([]) is also true.
    // This is intentional because [] means
    // the admin explicitly customized this user
    // and disabled all permissions.
    //

    if (Array.isArray(user.permissions)) {
      return user.permissions;
    }

    // ------------------------------------------
    // No individual customization
    // ------------------------------------------
    //
    // permissions === null
    //
    // Therefore use the role permissions.
    //

    return await getRolePermissions(user.role);
  } catch (error) {
    console.error("GET USER PERMISSIONS ERROR:", error);

    return ROLE_PERMISSIONS[user?.role] || [];
  }
};

// ==========================================
// GET AUTHENTICATED USER PERMISSIONS
// ==========================================
//
// req.user normally comes from the JWT.
//
// Example:
//
// req.user = {
//   id: "...",
//   role: "customer"
// }
//
// We load the actual User document so that
// individual permissions are respected.
// ==========================================

export const getAuthenticatedUserPermissions = async (req) => {
  try {
    const userId = req.user?.id || req.user?._id || req.user?.userId;

    if (!userId) {
      return [];
    }

    const user = await User.findById(userId).select("role permissions").lean();

    if (!user) {
      return [];
    }

    return await getUserPermissions(user);
  } catch (error) {
    console.error("GET AUTHENTICATED USER PERMISSIONS ERROR:", error);

    return [];
  }
};

// ==========================================
// CHECK USER PERMISSION
// ==========================================
//
// Use this when checking an actual user,
// not just a role.
//
// Example:
//
// hasUserPermission(user, "analytics.own")
// ==========================================

export const hasUserPermission = async (user, permission) => {
  try {
    if (!user || !permission) {
      return false;
    }

    const permissions = await getUserPermissions(user);

    return permissions.includes(permission);
  } catch (error) {
    console.error("HAS USER PERMISSION ERROR:", error);

    return false;
  }
};

// ==========================================
// CHECK AUTHENTICATED USER PERMISSION
// ==========================================
//
// Useful for controllers/services where req.user
// is available.
//
// Example:
//
// const allowed = await hasAuthenticatedUserPermission(
//   req,
//   "analytics.own"
// );
// ==========================================

export const hasAuthenticatedUserPermission = async (req, permission) => {
  try {
    if (!permission) {
      return false;
    }

    const permissions = await getAuthenticatedUserPermissions(req);

    return permissions.includes(permission);
  } catch (error) {
    console.error("HAS AUTHENTICATED USER PERMISSION ERROR:", error);

    return false;
  }
};

// ==========================================
// CHECK ROLE PERMISSION
// ==========================================
//
// Backward compatible with your existing code.
//
// Example:
//
// hasPermission(
//   "admin",
//   "tickets.assign"
// );
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
// CHECK ANY USER PERMISSION
// ==========================================

export const hasAnyUserPermission = async (user, permissionsToCheck = []) => {
  try {
    if (
      !user ||
      !Array.isArray(permissionsToCheck) ||
      permissionsToCheck.length === 0
    ) {
      return false;
    }

    const permissions = await getUserPermissions(user);

    return permissionsToCheck.some((permission) =>
      permissions.includes(permission),
    );
  } catch (error) {
    console.error("HAS ANY USER PERMISSION ERROR:", error);

    return false;
  }
};

// ==========================================
// CHECK ALL USER PERMISSIONS
// ==========================================

export const hasAllUserPermissions = async (user, permissionsToCheck = []) => {
  try {
    if (
      !user ||
      !Array.isArray(permissionsToCheck) ||
      permissionsToCheck.length === 0
    ) {
      return false;
    }

    const permissions = await getUserPermissions(user);

    return permissionsToCheck.every((permission) =>
      permissions.includes(permission),
    );
  } catch (error) {
    console.error("HAS ALL USER PERMISSIONS ERROR:", error);

    return false;
  }
};

// ==========================================
// CHECK ANY ROLE PERMISSION
// ==========================================
//
// Backward compatible.
// ==========================================

export const hasAnyPermission = async (role, permissionsToCheck = []) => {
  try {
    if (
      !role ||
      !Array.isArray(permissionsToCheck) ||
      permissionsToCheck.length === 0
    ) {
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
// CHECK ALL ROLE PERMISSIONS
// ==========================================
//
// Backward compatible.
// ==========================================

export const hasAllPermissions = async (role, permissionsToCheck = []) => {
  try {
    if (
      !role ||
      !Array.isArray(permissionsToCheck) ||
      permissionsToCheck.length === 0
    ) {
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
