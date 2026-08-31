import api from "./api";

export const getTickets = async () => {
  const response = await api.get("/tickets");

  return response.data;
};

export const getTicketById = async (id) => {
  const response = await api.get(`/tickets/${id}`);

  return response.data;
};

export const createTicket = async (ticketData) => {
  const response = await api.post("/tickets", ticketData);

  return response.data;
};

export const generateTicketSummary = async (id) => {
  const response = await api.post(`/ai-tickets/${id}/summary`);

  return response.data;
};

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
