import api from "./api";

/*
 * =========================================================
 * REGISTER
 * =========================================================
 */
export const registerUser = async (userData) => {
  const response = await api.post("/auth/register", userData);

  return response.data;
};

/*
 * =========================================================
 * NORMAL LOGIN
 * =========================================================
 */
export const loginUser = async (credentials) => {
  const response = await api.post("/auth/login", credentials);

  return response.data;
};

/*
 * =========================================================
 * GOOGLE LOGIN
 * =========================================================
 */
export const loginWithGoogle = async (googleData) => {
  const response = await api.post("/auth/google", googleData);

  return response.data;
};

/*
 * =========================================================
 * GET PROFILE
 * =========================================================
 */
export const getProfile = async () => {
  const response = await api.get("/auth/profile");

  return response.data;
};
