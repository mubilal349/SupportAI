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
// GET ALL ROLE PERMISSIONS
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
