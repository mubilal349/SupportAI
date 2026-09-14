import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

// ============================================================
// AUTH CONFIG
// ============================================================

const getAuthConfig = () => {
  const token = localStorage.getItem("supportai_token");

  if (!token) {
    throw new Error("Authentication token not found.");
  }

  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

// ============================================================
// GET ADMIN DASHBOARD
// ============================================================

export const getAdminDashboard = async () => {
  const response = await axios.get(
    `${API_URL}/admin/dashboard`,
    getAuthConfig(),
  );

  return response.data;
};
