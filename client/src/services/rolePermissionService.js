const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000/api";

// ==========================================
// GET AUTH TOKEN
// ==========================================

const getToken = () => {
  return (
    localStorage.getItem("supportai_token") || localStorage.getItem("token")
  );
};

// ==========================================
// GENERIC API REQUEST
// ==========================================

const request = async (url, options = {}) => {
  const token = getToken();

  if (!token) {
    throw new Error("Authentication token not found.");
  }

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,

    headers: {
      "Content-Type": "application/json",

      Authorization: `Bearer ${token}`,

      ...(options.headers || {}),
    },
  });

  let data;

  try {
    data = await response.json();
  } catch {
    throw new Error("Server returned an invalid response.");
  }

  if (!response.ok) {
    throw new Error(
      data?.message || "Something went wrong while processing the request.",
    );
  }

  return data;
};

// ==========================================
// GET CURRENT USER PERMISSIONS
// ==========================================
//
// Used by ProtectedRoute.
//
// Returns effective permissions:
// - Individual permissions if customized
// - Otherwise role permissions
// ==========================================

export const getMyPermissions = async () => {
  return request("/role-permissions/me");
};

// ==========================================
// GET ALL ROLE PERMISSIONS
// ==========================================
//
// Admin only.
//
// Returns role defaults and permission definitions.
// ==========================================

export const getRolePermissions = async () => {
  return request("/role-permissions");
};

// ==========================================
// GET SINGLE ROLE PERMISSIONS
// ==========================================

export const getSingleRolePermissions = async (role) => {
  if (!role) {
    throw new Error("Role is required.");
  }

  return request(`/role-permissions/${role}`);
};

// ==========================================
// UPDATE ROLE PERMISSIONS
// ==========================================
//
// Updates the default permissions for an entire
// role.
//
// It does NOT overwrite individual user
// custom permissions.
// ==========================================

export const updateRolePermissions = async (role, permissions) => {
  if (!role) {
    throw new Error("Role is required.");
  }

  if (!Array.isArray(permissions)) {
    throw new Error("Permissions must be an array.");
  }

  return request(`/role-permissions/${role}`, {
    method: "PATCH",

    body: JSON.stringify({
      permissions,
    }),
  });
};

// ==========================================
// GET USERS FOR INDIVIDUAL PERMISSIONS
// ==========================================
//
// role:
// - "customer"
// - "agent"
//
// Example:
//
// getUsersForPermissions("customer")
// ==========================================

export const getUsersForPermissions = async (role) => {
  if (!role) {
    throw new Error("Role is required.");
  }

  if (!["agent", "customer"].includes(role)) {
    throw new Error(
      "Individual permissions are only available for agents and customers.",
    );
  }

  return request(`/role-permissions/users?role=${encodeURIComponent(role)}`);
};

// ==========================================
// GET ONE USER'S PERMISSIONS
// ==========================================
//
// Example:
//
// getUserPermissions(userId)
// ==========================================

export const getUserPermissions = async (userId) => {
  if (!userId) {
    throw new Error("User ID is required.");
  }

  return request(`/role-permissions/users/${userId}`);
};

// ==========================================
// UPDATE ONE USER'S PERMISSIONS
// ==========================================
//
// Example:
//
// updateUserPermissions(userId, [
//   "dashboard.view",
//   "tickets.view"
// ])
// ==========================================

export const updateUserPermissions = async (userId, permissions) => {
  if (!userId) {
    throw new Error("User ID is required.");
  }

  if (!Array.isArray(permissions)) {
    throw new Error("Permissions must be an array.");
  }

  return request(`/role-permissions/users/${userId}`, {
    method: "PATCH",

    body: JSON.stringify({
      permissions,
    }),
  });
};

// ==========================================
// RESET ONE USER'S PERMISSIONS
// ==========================================
//
// Reset means:
//
// permissions = null
//
// The user will inherit permissions from
// their role again.
// ==========================================

export const resetUserPermissions = async (userId) => {
  if (!userId) {
    throw new Error("User ID is required.");
  }

  return request(`/role-permissions/users/${userId}`, {
    method: "DELETE",
  });
};
