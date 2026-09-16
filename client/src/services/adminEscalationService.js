import axios from "axios";

// ==========================================
// API BASE URL
// ==========================================

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
// GET ALL ESCALATIONS
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
  if (!ticketId) {
    throw new Error("Ticket ID is required");
  }

  return api.get(`/admin/escalations/${ticketId}`);
};

// ==========================================
// UPDATE ESCALATION STATUS
// ==========================================

export const updateEscalationStatus = async (ticketId, status) => {
  if (!ticketId) {
    throw new Error("Ticket ID is required");
  }

  if (!status) {
    throw new Error("Status is required");
  }

  return api.patch(`/admin/escalations/${ticketId}/status`, {
    status,
  });
};

// ==========================================
// ASSIGN ESCALATION
// ==========================================

export const assignEscalation = async (ticketId, agentId = null) => {
  if (!ticketId) {
    throw new Error("Ticket ID is required");
  }

  return api.patch(`/admin/escalations/${ticketId}/assign`, {
    agentId,
  });
};

// ==========================================
// REASSIGN TO HUMAN SUPPORT
// ==========================================

export const reassignToHumanSupport = async (ticketId) => {
  if (!ticketId) {
    throw new Error("Ticket ID is required");
  }

  const response = await api.patch(
    `/admin/escalations/${ticketId}/reassign-human`,
  );

  return response.data;
};

// ==========================================
// UPDATE PRIORITY
// ==========================================

export const updateEscalationPriority = async (ticketId, priority) => {
  if (!ticketId) {
    throw new Error("Ticket ID is required");
  }

  if (!priority) {
    throw new Error("Priority is required");
  }

  return api.patch(`/admin/escalations/${ticketId}/priority`, {
    priority,
  });
};

// ==========================================
// ADD INTERNAL NOTE
// ==========================================

export const addEscalationNote = async (ticketId, note) => {
  if (!ticketId) {
    throw new Error("Ticket ID is required");
  }

  if (!note?.trim()) {
    throw new Error("Note is required");
  }

  return api.post(`/admin/escalations/${ticketId}/note`, {
    note: note.trim(),
  });
};

// ==========================================
// RESOLVE ESCALATION
// ==========================================

export const resolveEscalation = async (ticketId) => {
  if (!ticketId) {
    throw new Error("Ticket ID is required");
  }

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
  reassignToHumanSupport,
  updateEscalationPriority,
  addEscalationNote,
  resolveEscalation,
};
