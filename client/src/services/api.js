import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000/api",

  headers: {
    "Content-Type": "application/json",
  },
});

/* =========================================================
   REQUEST INTERCEPTOR
========================================================= */

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("supportai_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    /*
     * When sending FormData (avatar upload), let the
     * browser/Axios automatically set the multipart boundary.
     */
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }

    return config;
  },
  (error) => Promise.reject(error),
);

/* =========================================================
   RESPONSE INTERCEPTOR
========================================================= */

api.interceptors.response.use(
  (response) => response,

  (error) => {
    /*
     * Return the original Axios error so individual pages
     * can display their own error messages.
     */
    return Promise.reject(error);
  },
);

export default api;
