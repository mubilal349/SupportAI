import api from "./api";

/*
 * =========================================================
 * AGENT DASHBOARD
 * =========================================================
 */

export const getAgentDashboard = async () => {
  const response = await api.get("/agent/dashboard");
  return response.data;
};

/*
 * =========================================================
 * TICKET QUEUE
 * =========================================================
 */

export const getTicketQueue = async (params = {}) => {
  const response = await api.get("/agent/tickets/queue", {
    params,
  });

  return response.data;
};

/*
 * =========================================================
 * AGENT ASSIGNED TICKETS
 * =========================================================
 */

export const getAssignedTickets = async (params = {}) => {
  const response = await api.get("/agent/tickets", {
    params,
  });

  return response.data;
};

/*
 * =========================================================
 * SINGLE TICKET
 * =========================================================
 */

export const getAgentTicketById = async (ticketId) => {
  const response = await api.get(`/agent/tickets/${ticketId}`);
  return response.data;
};

/*
 * =========================================================
 * ASSIGN TICKET TO CURRENT AGENT
 * =========================================================
 */

export const assignTicketToMe = async (ticketId) => {
  const response = await api.patch(`/agent/tickets/${ticketId}/assign`);

  return response.data;
};

/*
 * =========================================================
 * UPDATE TICKET STATUS
 * =========================================================
 */

export const updateAgentTicketStatus = async (ticketId, status) => {
  const response = await api.patch(`/agent/tickets/${ticketId}/status`, {
    status,
  });

  return response.data;
};

/*
 * =========================================================
 * UPDATE TICKET PRIORITY
 * =========================================================
 */

export const updateAgentTicketPriority = async (ticketId, priority) => {
  const response = await api.patch(`/agent/tickets/${ticketId}/priority`, {
    priority,
  });

  return response.data;
};

/*
 * =========================================================
 * AGENT REPLY
 * =========================================================
 */

export const sendAgentReply = async (ticketId, message, files = []) => {
  const formData = new FormData();

  formData.append("message", message || "");

  files.forEach((file) => {
    formData.append("attachments", file);
  });

  const response = await api.post(`/agent/tickets/${ticketId}/reply`, formData);

  return response.data;
};

export const getAllAssignedTickets = (params = {}) =>
  api.get("/agent/assigned-tickets", {
    params,
  });

export const getMyTickets = (params = {}) =>
  api.get("/agent/my-tickets", { params });

export const addInternalNote = async (ticketId, message) => {
  const response = await api.post(`/agent/tickets/${ticketId}/internal-note`, {
    message,
  });

  return response.data;
};

// get customer profile service

export const getAgentCustomerProfile = async (customerId) => {
  const response = await api.get(`/agent/customers/${customerId}`);

  return response.data;
};

// escalate service

export const escalateAgentTicket = async (ticketId, escalationData) => {
  const response = await api.post(
    `/agent/tickets/${ticketId}/escalate`,
    escalationData,
  );

  return response.data;
};

// =======================================================
// GET ESCALATED TICKETS
// =======================================================

export const getEscalatedTickets = async () => {
  const response = await api.get("/agent/escalated");

  return response.data;
};

// =======================================================
// AGENT AVAILABILITY
// =======================================================

export const getAgentAvailability = async () => {
  const response = await api.get("/agent/availability");

  return response.data;
};

export const updateAgentAvailability = async (availability) => {
  const response = await api.put("/agent/availability", {
    availability,
  });

  return response.data;
};
