import axios from "axios";

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
// AXIOS INSTANCE
// ==========================================

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// ==========================================
// AUTH INTERCEPTOR
// ==========================================

api.interceptors.request.use(
  (config) => {
    const token = getToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// ==========================================
// GET SLA POLICY
// ==========================================

export const getSlaPolicy = async () => {
  return api.get("/admin/sla");
};

// ==========================================
// UPDATE SLA POLICY
// ==========================================

export const updateSlaPolicy = async (policyData) => {
  if (!policyData) {
    throw new Error("SLA policy data is required");
  }

  return api.put("/admin/sla", policyData);
};

// ==========================================
// GET SLA STATISTICS
// ==========================================

export const getSlaStatistics = async () => {
  return api.get("/admin/sla/statistics");
};

// ==========================================
// DEFAULT EXPORT
// ==========================================

export default {
  getSlaPolicy,
  updateSlaPolicy,
  getSlaStatistics,
};
