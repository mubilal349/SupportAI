const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000/api";

const AUDIT_LOGS_URL = `${API_BASE_URL}/audit-logs`;

const getToken = () => {
  return (
    localStorage.getItem("supportai_token") ||
    localStorage.getItem("token") ||
    ""
  );
};

const request = async (url, options = {}) => {
  const token = getToken();

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {}),
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.message || "Failed to process audit log request.");
  }

  return data;
};

// ==========================================
// GET AUDIT LOGS
// ==========================================

export const getAuditLogs = async (params = {}) => {
  const query = new URLSearchParams();

  if (params.page) {
    query.set("page", params.page);
  }

  if (params.limit) {
    query.set("limit", params.limit);
  }

  if (params.search) {
    query.set("search", params.search);
  }

  if (params.action) {
    query.set("action", params.action);
  }

  if (params.role) {
    query.set("role", params.role);
  }

  if (params.resourceType) {
    query.set("resourceType", params.resourceType);
  }

  const queryString = query.toString();

  return request(`${AUDIT_LOGS_URL}${queryString ? `?${queryString}` : ""}`);
};

// ==========================================
// GET SINGLE AUDIT LOG
// ==========================================

export const getAuditLog = async (id) => {
  if (!id) {
    throw new Error("Audit log ID is required.");
  }

  return request(`${AUDIT_LOGS_URL}/${id}`);
};
