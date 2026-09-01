import api from "./api";

// ==========================================
// GET CUSTOMER TICKETS
// ==========================================

export const getTickets = async () => {
  const response = await api.get("/tickets");

  return response.data;
};

// ==========================================
// GET SINGLE TICKET
// ==========================================

export const getTicketById = async (id) => {
  const response = await api.get(`/tickets/${id}`);

  return response.data;
};

// ==========================================
// CREATE TICKET
// ==========================================

export const createTicket = async (ticketData) => {
  const response = await api.post("/tickets", ticketData);

  return response.data;
};

// ==========================================
// REPLY
// ==========================================

export const replyToTicket = async (ticketId, message) => {
  const response = await api.post(`/tickets/${ticketId}/replies`, {
    message,
  });

  return response.data;
};

// ==========================================
// REOPEN
// ==========================================

export const reopenTicket = async (ticketId) => {
  const response = await api.patch(`/tickets/${ticketId}/reopen`);

  return response.data;
};

// ==========================================
// CLOSE
// ==========================================

export const closeTicket = async (ticketId) => {
  const response = await api.patch(`/tickets/${ticketId}/close`);

  return response.data;
};

// ==========================================
// ESCALATE
// ==========================================

export const escalateTicket = async (ticketId, reason = "") => {
  const response = await api.patch(`/tickets/${ticketId}/escalate`, {
    reason,
  });

  return response.data;
};

// ==========================================
// RATING
// ==========================================

export const submitTicketRating = async (ticketId, rating, feedback = "") => {
  const response = await api.post(`/tickets/${ticketId}/rating`, {
    rating,
    feedback,
  });

  return response.data;
};

// ==========================================
// ATTACHMENTS
// ==========================================

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

// ==========================================
// AI SUMMARY
// ==========================================

export const generateTicketSummary = async (id) => {
  const response = await api.post(`/ai-tickets/${id}/summary`);

  return response.data;
};
