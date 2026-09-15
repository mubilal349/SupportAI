import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000/api";

const getToken = () => {
  return (
    localStorage.getItem("supportai_token") || localStorage.getItem("token")
  );
};

const ProtectedRoute = ({
  children,
  allowedRoles = [],
  requiredPermission = null,
}) => {
  const { user, loading } = useAuth();

  const [permissionLoading, setPermissionLoading] = useState(
    Boolean(requiredPermission),
  );

  const [hasPermission, setHasPermission] = useState(!requiredPermission);

  useEffect(() => {
    let mounted = true;

    const checkPermission = async () => {
      // ------------------------------------------
      // No permission required
      // ------------------------------------------
      if (!requiredPermission) {
        if (mounted) {
          setHasPermission(true);
          setPermissionLoading(false);
        }

        return;
      }

      // ------------------------------------------
      // Wait until authentication finishes
      // ------------------------------------------
      if (loading) {
        return;
      }

      // ------------------------------------------
      // User is not authenticated
      // ------------------------------------------
      if (!user) {
        if (mounted) {
          setHasPermission(false);
          setPermissionLoading(false);
        }

        return;
      }

      // ------------------------------------------
      // Get authentication token
      // ------------------------------------------
      const token = getToken();

      if (!token) {
        if (mounted) {
          setHasPermission(false);
          setPermissionLoading(false);
        }

        return;
      }

      try {
        if (mounted) {
          setPermissionLoading(true);
          setHasPermission(false);
        }

        // ------------------------------------------
        // Get current user's permissions
        // This endpoint works for all authenticated
        // users: admin, agent and customer.
        // ------------------------------------------
        const response = await fetch(`${API_BASE_URL}/role-permissions/me`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        let data = null;

        try {
          data = await response.json();
        } catch {
          throw new Error("Server returned an invalid response.");
        }

        if (!response.ok) {
          throw new Error(data?.message || "Failed to load user permissions.");
        }

        // ------------------------------------------
        // Extract permissions
        // ------------------------------------------
        const permissions = Array.isArray(data?.permissions)
          ? data.permissions
          : [];

        // ------------------------------------------
        // Check required permission
        // ------------------------------------------
        const allowed = permissions.includes(requiredPermission);

        if (mounted) {
          setHasPermission(allowed);
        }
      } catch (error) {
        console.error("PROTECTED ROUTE PERMISSION ERROR:", error);

        if (mounted) {
          setHasPermission(false);
        }
      } finally {
        if (mounted) {
          setPermissionLoading(false);
        }
      }
    };

    checkPermission();

    return () => {
      mounted = false;
    };
  }, [user, loading, requiredPermission]);

  // ==========================================
  // AUTHENTICATION LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-slate-600 border-t-white" />

          <p className="text-sm text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  // ==========================================
  // NOT AUTHENTICATED
  // ==========================================

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // ==========================================
  // ROLE CHECK
  // ==========================================

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // ==========================================
  // PERMISSION CHECK LOADING
  // ==========================================

  if (permissionLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-slate-600 border-t-white" />

          <p className="text-sm text-slate-400">Checking permissions...</p>
        </div>
      </div>
    );
  }

  // ==========================================
  // PERMISSION DENIED
  // ==========================================

  if (requiredPermission && !hasPermission) {
    return <Navigate to="/unauthorized" replace />;
  }

  // ==========================================
  // AUTHORIZED
  // ==========================================

  return children || <Outlet />;
};

export default ProtectedRoute;
