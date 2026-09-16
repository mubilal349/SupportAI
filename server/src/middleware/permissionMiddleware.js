import { getAuthenticatedUserPermissions } from "../services/permissionService.js";

// ==========================================
// GET CURRENT USER PERMISSIONS
// ==========================================
//
// Permission priority:
//
// 1. Individual user permissions
// 2. Role permissions
// 3. Default ROLE_PERMISSIONS
//
// This makes individual customer/agent
// permission overrides actually effective.
// ==========================================

const getCurrentUserPermissions = async (req) => {
  return await getAuthenticatedUserPermissions(req);
};

// ==========================================
// REQUIRE ONE PERMISSION
// ==========================================

export const requirePermission = (permission) => {
  return async (req, res, next) => {
    try {
      // --------------------------------------
      // Validate permission configuration
      // --------------------------------------

      if (!permission) {
        return res.status(500).json({
          success: false,
          message: "No permission was configured for this route.",
        });
      }

      // --------------------------------------
      // User must be authenticated
      // --------------------------------------

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Authentication required.",
        });
      }

      // --------------------------------------
      // Get effective permissions
      // --------------------------------------

      const userPermissions = await getCurrentUserPermissions(req);

      // --------------------------------------
      // Check permission
      // --------------------------------------

      if (!userPermissions.includes(permission)) {
        return res.status(403).json({
          success: false,
          message: "You do not have permission to perform this action.",
          permission,
        });
      }

      next();
    } catch (error) {
      console.error("PERMISSION MIDDLEWARE ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to verify permissions.",
      });
    }
  };
};

// ==========================================
// REQUIRE ANY PERMISSION
// ==========================================

export const requireAnyPermission = (permissions = []) => {
  return async (req, res, next) => {
    try {
      // --------------------------------------
      // Validate permission configuration
      // --------------------------------------

      if (!Array.isArray(permissions) || permissions.length === 0) {
        return res.status(500).json({
          success: false,
          message: "No permissions were configured for this route.",
        });
      }

      // --------------------------------------
      // User must be authenticated
      // --------------------------------------

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Authentication required.",
        });
      }

      // --------------------------------------
      // Get effective permissions
      // --------------------------------------

      const userPermissions = await getCurrentUserPermissions(req);

      // --------------------------------------
      // Check whether at least one permission
      // exists.
      // --------------------------------------

      const hasAccess = permissions.some((permission) =>
        userPermissions.includes(permission),
      );

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: "You do not have permission to access this resource.",
          permissions,
        });
      }

      next();
    } catch (error) {
      console.error("REQUIRE ANY PERMISSION ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to verify permissions.",
      });
    }
  };
};

// ==========================================
// REQUIRE ALL PERMISSIONS
// ==========================================

export const requireAllPermissions = (permissions = []) => {
  return async (req, res, next) => {
    try {
      // --------------------------------------
      // Validate permission configuration
      // --------------------------------------

      if (!Array.isArray(permissions) || permissions.length === 0) {
        return res.status(500).json({
          success: false,
          message: "No permissions were configured for this route.",
        });
      }

      // --------------------------------------
      // User must be authenticated
      // --------------------------------------

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Authentication required.",
        });
      }

      // --------------------------------------
      // Get effective permissions
      // --------------------------------------

      const userPermissions = await getCurrentUserPermissions(req);

      // --------------------------------------
      // Check whether ALL permissions exist.
      // --------------------------------------

      const hasAccess = permissions.every((permission) =>
        userPermissions.includes(permission),
      );

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: "You do not have permission to access this resource.",
          permissions,
        });
      }

      next();
    } catch (error) {
      console.error("REQUIRE ALL PERMISSIONS ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to verify permissions.",
      });
    }
  };
};
