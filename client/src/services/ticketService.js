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
