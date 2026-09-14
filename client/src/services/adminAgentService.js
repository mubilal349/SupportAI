import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

const getAuthConfig = () => {
  const token = localStorage.getItem("supportai_token");

  if (!token) {
    throw new Error("Authentication token not found. Please login again.");
  }

  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

// ============================================================
// GET ALL AGENTS
// ============================================================

export const getAdminAgents = async (params = {}) => {
  const response = await axios.get(`${API_URL}/admin/agents`, {
    ...getAuthConfig(),
    params,
  });

  return response.data;
};

// ============================================================
// GET SINGLE AGENT
// ============================================================

export const getAdminAgent = async (agentId) => {
  if (!agentId) {
    throw new Error("Agent ID is required.");
  }

  const response = await axios.get(
    `${API_URL}/admin/agents/${agentId}`,
    getAuthConfig(),
  );

  return response.data;
};

// ============================================================
// CREATE AGENT
// ============================================================

export const createAdminAgent = async (agentData) => {
  const response = await axios.post(
    `${API_URL}/admin/agents`,
    agentData,
    getAuthConfig(),
  );

  return response.data;
};

// ============================================================
// UPDATE AGENT
// ============================================================

export const updateAdminAgent = async (agentId, agentData) => {
  if (!agentId) {
    throw new Error("Agent ID is required.");
  }

  const response = await axios.put(
    `${API_URL}/admin/agents/${agentId}`,
    agentData,
    getAuthConfig(),
  );

  return response.data;
};

// ============================================================
// UPDATE AGENT STATUS
// ============================================================

export const updateAdminAgentStatus = async (agentId, status) => {
  if (!agentId) {
    throw new Error("Agent ID is required.");
  }

  const response = await axios.patch(
    `${API_URL}/admin/agents/${agentId}/status`,
    { status },
    getAuthConfig(),
  );

  return response.data;
};

// ============================================================
// UPDATE AGENT AVAILABILITY
// ============================================================

export const updateAdminAgentAvailability = async (agentId, availability) => {
  if (!agentId) {
    throw new Error("Agent ID is required.");
  }

  const response = await axios.patch(
    `${API_URL}/admin/agents/${agentId}/availability`,
    { availability },
    getAuthConfig(),
  );

  return response.data;
};
