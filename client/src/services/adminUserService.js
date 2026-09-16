import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

// ============================================================
// AUTH CONFIG
// ============================================================

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
// GET ALL USERS
// ============================================================

export const getAdminUsers = async (params = {}) => {
  const response = await axios.get(`${API_URL}/admin/users`, {
    ...getAuthConfig(),
    params,
  });

  return response.data;
};

// ============================================================
// GET USER STATS
// ============================================================

export const getAdminUserStats = async () => {
  const response = await axios.get(
    `${API_URL}/admin/users/stats`,
    getAuthConfig(),
  );

  return response.data;
};

// ============================================================
// GET SINGLE USER
// ============================================================

export const getAdminUser = async (userId) => {
  if (!userId) {
    throw new Error("User ID is required.");
  }

  const response = await axios.get(
    `${API_URL}/admin/users/${userId}`,
    getAuthConfig(),
  );

  return response.data;
};

// ============================================================
// GET USER TICKET STATISTICS
// ============================================================

export const getAdminUserTicketStats = async (userId) => {
  if (!userId) {
    throw new Error("User ID is required.");
  }

  const response = await axios.get(
    `${API_URL}/admin/users/${userId}/ticket-stats`,
    getAuthConfig(),
  );

  return response.data;
};

// ============================================================
// CREATE USER
// ============================================================

export const createAdminUser = async (userData) => {
  const response = await axios.post(
    `${API_URL}/admin/users`,
    userData,
    getAuthConfig(),
  );

  return response.data;
};

// ============================================================
// UPDATE USER
// ============================================================

export const updateAdminUser = async (userId, userData) => {
  if (!userId) {
    throw new Error("User ID is required.");
  }

  const response = await axios.put(
    `${API_URL}/admin/users/${userId}`,
    userData,
    getAuthConfig(),
  );

  return response.data;
};

// ============================================================
// UPDATE USER STATUS
// ============================================================

export const updateAdminUserStatus = async (userId, status) => {
  if (!userId) {
    throw new Error("User ID is required.");
  }

  const response = await axios.patch(
    `${API_URL}/admin/users/${userId}/status`,
    {
      status,
    },
    getAuthConfig(),
  );

  return response.data;
};

// ============================================================
// DELETE USER
// ============================================================

export const deleteAdminUser = async (userId) => {
  if (!userId) {
    throw new Error("User ID is required.");
  }

  const response = await axios.delete(
    `${API_URL}/admin/users/${userId}`,
    getAuthConfig(),
  );

  return response.data;
};

// ============================================================
// GET CUSTOMER TICKET HISTORY
// ============================================================

export const getAdminCustomerTickets = async (userId, params = {}) => {
  if (!userId) {
    throw new Error("User ID is required.");
  }

  const response = await axios.get(`${API_URL}/admin/users/${userId}/tickets`, {
    ...getAuthConfig(),
    params,
  });

  return response.data;
};

// ============================================================
// GET CUSTOMER ACTIVITY
// ============================================================

export const getAdminCustomerActivity = async (userId, params = {}) => {
  if (!userId) {
    throw new Error("User ID is required.");
  }

  const response = await axios.get(
    `${API_URL}/admin/users/${userId}/activity`,
    {
      ...getAuthConfig(),
      params,
    },
  );

  return response.data;
};
