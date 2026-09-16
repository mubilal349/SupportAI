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
// GET ESCALATIONS
// ==========================================

export const getEscalations = async (params = {}) => {
  return api.get("/admin/escalations", {
    params,
  });
};

// ==========================================
// GET SINGLE ESCALATION
// ==========================================

export const getEscalation = async (ticketId) => {
  return api.get(`/admin/escalations/${ticketId}`);
};

// ==========================================
// UPDATE ESCALATION STATUS
// ==========================================

export const updateEscalationStatus = async (ticketId, status) => {
  return api.patch(`/admin/escalations/${ticketId}/status`, {
    status,
  });
};

// ==========================================
// ASSIGN ESCALATION
// ==========================================

export const assignEscalation = async (ticketId, agentId = null) => {
  return api.patch(`/admin/escalations/${ticketId}/assign`, {
    agentId,
  });
};

// ==========================================
// UPDATE PRIORITY
// ==========================================

export const updateEscalationPriority = async (ticketId, priority) => {
  return api.patch(`/admin/escalations/${ticketId}/priority`, {
    priority,
  });
};

// ==========================================
// ADD INTERNAL NOTE
// ==========================================

export const addEscalationNote = async (ticketId, note) => {
  return api.post(`/admin/escalations/${ticketId}/note`, {
    note,
  });
};

// ==========================================
// RESOLVE ESCALATION
// ==========================================

export const resolveEscalation = async (ticketId) => {
  return api.patch(`/admin/escalations/${ticketId}/resolve`);
};

// ==========================================
// EXPORT API
// ==========================================

export default {
  getEscalations,
  getEscalation,
  updateEscalationStatus,
  assignEscalation,
  updateEscalationPriority,
  addEscalationNote,
  resolveEscalation,
};
