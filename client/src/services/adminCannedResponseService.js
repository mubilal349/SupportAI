const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000/api";

const CANNED_RESPONSES_URL = `${API_BASE_URL}/canned-responses`;

// ==========================================
// GET AUTH TOKEN
// ==========================================

const getToken = () => {
  return (
    localStorage.getItem("supportai_token") ||
    localStorage.getItem("token") ||
    ""
  );
};

// ==========================================
// GENERIC API REQUEST
// ==========================================

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
    throw new Error(data?.message || "Something went wrong. Please try again.");
  }

  return data;
};

// ==========================================
// GET ALL CANNED RESPONSES
// ==========================================

export const getAllCannedResponses = async () => {
  return request(CANNED_RESPONSES_URL);
};

// ==========================================
// GET SINGLE CANNED RESPONSE
// ==========================================

export const getCannedResponse = async (id) => {
  if (!id) {
    throw new Error("Canned response ID is required.");
  }

  return request(`${CANNED_RESPONSES_URL}/${id}`);
};

// ==========================================
// CREATE CANNED RESPONSE
// ==========================================

export const createCannedResponse = async (responseData) => {
  return request(CANNED_RESPONSES_URL, {
    method: "POST",
    body: JSON.stringify(responseData),
  });
};

// ==========================================
// UPDATE CANNED RESPONSE
// ==========================================

export const updateCannedResponse = async (id, responseData) => {
  if (!id) {
    throw new Error("Canned response ID is required.");
  }

  return request(`${CANNED_RESPONSES_URL}/${id}`, {
    method: "PUT",
    body: JSON.stringify(responseData),
  });
};

// ==========================================
// DELETE CANNED RESPONSE
// ==========================================

export const deleteCannedResponse = async (id) => {
  if (!id) {
    throw new Error("Canned response ID is required.");
  }

  return request(`${CANNED_RESPONSES_URL}/${id}`, {
    method: "DELETE",
  });
};

// ==========================================
// TOGGLE STATUS
// ==========================================

export const toggleCannedResponseStatus = async (id) => {
  if (!id) {
    throw new Error("Canned response ID is required.");
  }

  return request(`${CANNED_RESPONSES_URL}/${id}/toggle-status`, {
    method: "PATCH",
  });
};
