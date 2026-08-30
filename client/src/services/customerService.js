import api from "./api";

export const getCustomerDashboard = async () => {
  const response = await api.get("/customer/dashboard");

  return response.data;
};
