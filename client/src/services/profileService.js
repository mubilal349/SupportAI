import api from "./api";

/* =========================================================
   GET PROFILE
========================================================= */

export const getProfile = async () => {
  const response = await api.get("/auth/profile");

  return response.data;
};

/* =========================================================
   UPDATE PROFILE
========================================================= */

export const updateProfile = async (formData) => {
  const response = await api.put("/auth/profile", formData);

  return response.data;
};

/* =========================================================
   CHANGE PASSWORD
========================================================= */

export const changePassword = async (data) => {
  const response = await api.put("/auth/change-password", data);

  return response.data;
};
