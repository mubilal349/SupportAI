import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

const getAuthConfig = () => {
  const token = localStorage.getItem("supportai_token");

  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

export const getAdminTickets = async (params = {}) => {
  const response = await axios.get(`${API_URL}/admin/tickets`, {
    ...getAuthConfig(),
    params,
  });

  return response.data;
};
