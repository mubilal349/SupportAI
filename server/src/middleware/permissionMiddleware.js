import { getRolePermissions } from "../services/permissionService.js";

// ==========================================
// REQUIRE ONE PERMISSION
// ==========================================

export const requirePermission = (permission) => {
  return async (req, res, next) => {
    try {
      const role = req.user?.role;

      // User must be authenticated
      if (!role) {
        return res.status(401).json({
          success: false,
          message: "Authentication required.",
        });
      }

      const permissions = await getRolePermissions(role);

      // Check whether the user's role has
      // the requested permission.
      if (!permissions.includes(permission)) {
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
      const role = req.user?.role;

      if (!role) {
        return res.status(401).json({
          success: false,
          message: "Authentication required.",
        });
      }

      if (!Array.isArray(permissions) || permissions.length === 0) {
        return res.status(500).json({
          success: false,
          message: "No permissions were configured for this route.",
        });
      }

      const userPermissions = await getRolePermissions(role);

      const hasAccess = permissions.some((permission) =>
        userPermissions.includes(permission),
      );

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: "You do not have permission to access this resource.",
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
      const role = req.user?.role;

      if (!role) {
        return res.status(401).json({
          success: false,
          message: "Authentication required.",
        });
      }

      if (!Array.isArray(permissions) || permissions.length === 0) {
        return res.status(500).json({
          success: false,
          message: "No permissions were configured for this route.",
        });
      }

      const userPermissions = await getRolePermissions(role);

      const hasAccess = permissions.every((permission) =>
        userPermissions.includes(permission),
      );

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: "You do not have permission to access this resource.",
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
