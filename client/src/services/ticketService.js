import api from "./api";

/*
 * =========================================================
 * GET ALL CUSTOMER TICKETS
 * =========================================================
 */

export const getTickets = async () => {
  const response = await api.get("/tickets");

  return response.data;
};

/*
 * =========================================================
 * GET SINGLE TICKET
 * =========================================================
 */

export const getTicketById = async (id) => {
  const response = await api.get(`/tickets/${id}`);

  return response.data;
};

/*
 * =========================================================
 * CREATE TICKET
 * =========================================================
 */

export const createTicket = async (ticketData) => {
  const response = await api.post("/tickets", ticketData);

  return response.data;
};

/*
 * =========================================================
 * SEND CUSTOMER REPLY
 * =========================================================
 */

export const replyToTicket = async (ticketId, message) => {
  const response = await api.post(`/tickets/${ticketId}/replies`, {
    message,
  });

  return response.data;
};

/*
 * =========================================================
 * AI TICKET SUMMARY
 * =========================================================
 */

export const generateTicketSummary = async (id) => {
  const response = await api.post(`/ai-tickets/${id}/summary`);

  return response.data;
};

/*
 * =========================================================
 * UPLOAD TICKET ATTACHMENTS
 * =========================================================
 */

export const uploadTicketAttachments = async (ticketId, files) => {
  const formData = new FormData();

  files.forEach((file) => {
    formData.append("attachments", file);
  });

  const response = await api.post(
    `/tickets/${ticketId}/attachments`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );

  return response.data;
};

/*
 * =========================================================
 * TICKET STATUS HISTORY
 * =========================================================
 */

export const getTicketStatusHistory = async (ticketId) => {
  const response = await api.get(`/tickets/${ticketId}/status-history`);

  return response.data;
};

/*
 * =========================================================
 * GET TICKET RATING
 * =========================================================
 *
 * Retrieves the customer's existing rating and feedback.
 *
 * GET /api/tickets/:ticketId/rating
 * =========================================================
 */

export const getTicketRating = async (ticketId) => {
  const response = await api.get(`/tickets/${ticketId}/rating`);

  return response.data;
};

/*
 * =========================================================
 * SUBMIT TICKET RATING & FEEDBACK
 * =========================================================
 *
 * rating:
 *    1 - Very Poor
 *    2 - Poor
 *    3 - Average
 *    4 - Good
 *    5 - Excellent
 *
 * feedback is optional.
 *
 * POST /api/tickets/:ticketId/rating
 * =========================================================
 */

export const submitTicketRating = async (ticketId, rating, feedback = "") => {
  const response = await api.post(`/tickets/${ticketId}/rating`, {
    rating,
    feedback,
  });

  return response.data;
};

/*
 * =========================================================
 * RESOLVE CUSTOMER TICKET
 * =========================================================
 */

export const resolveCustomerTicket = async (ticketId) => {
  const response = await api.patch(`/tickets/${ticketId}/resolve`);

  return response.data;
};
