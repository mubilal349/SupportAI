// client/src/services/analyticsService.js

import api from "./api";

export const getCustomerAnalytics = async (period = "7d") => {
  const response = await api.get("/analytics/customer", {
    params: { period },
  });

  return response.data;
};
