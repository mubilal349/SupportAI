const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000/api";

const KNOWLEDGE_BASE_URL = `${API_BASE_URL}/knowledge-base`;

// ============================================================
// GET AUTH TOKEN
// ============================================================

const getToken = () => {
  return (
    localStorage.getItem("supportai_token") || localStorage.getItem("token")
  );
};

// ============================================================
// GENERIC REQUEST
// ============================================================

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
    throw new Error(data.message || "Something went wrong. Please try again.");
  }

  return data;
};

// ============================================================
// GET ALL ARTICLES
// ============================================================

export const getAllKnowledgeBaseArticles = async () => {
  return request(KNOWLEDGE_BASE_URL);
};

// ============================================================
// SEARCH ARTICLES
// ============================================================

export const searchKnowledgeBase = async (query = "") => {
  const searchQuery = String(query).trim();

  return request(
    `${KNOWLEDGE_BASE_URL}/search?q=${encodeURIComponent(searchQuery)}`,
  );
};

// ============================================================
// GET SINGLE ARTICLE
// ============================================================

export const getKnowledgeBaseArticle = async (id) => {
  if (!id) {
    throw new Error("Article ID is required.");
  }

  return request(`${KNOWLEDGE_BASE_URL}/${id}`);
};

// ============================================================
// CREATE ARTICLE
// ============================================================

export const createKnowledgeBaseArticle = async (articleData) => {
  return request(KNOWLEDGE_BASE_URL, {
    method: "POST",
    body: JSON.stringify(articleData),
  });
};

// ============================================================
// UPDATE ARTICLE
// ============================================================

export const updateKnowledgeBaseArticle = async (id, articleData) => {
  if (!id) {
    throw new Error("Article ID is required.");
  }

  return request(`${KNOWLEDGE_BASE_URL}/${id}`, {
    method: "PUT",
    body: JSON.stringify(articleData),
  });
};

// ============================================================
// DELETE ARTICLE
// ============================================================

export const deleteKnowledgeBaseArticle = async (id) => {
  if (!id) {
    throw new Error("Article ID is required.");
  }

  return request(`${KNOWLEDGE_BASE_URL}/${id}`, {
    method: "DELETE",
  });
};
