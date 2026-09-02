import Notification from "../models/Notification.js";

/*
 * =========================================================
 * GET USER NOTIFICATION ROOM
 * =========================================================
 */

const getNotificationRoom = (userId) => {
  return `user:${String(userId)}`;
};

/*
 * =========================================================
 * CREATE NOTIFICATION
 * =========================================================
 */

export const createNotification = async ({
  req,
  recipient,
  type,
  title,
  message,
  ticket = null,
  ticketNumber = "",
  metadata = {},
}) => {
  try {
    if (!recipient) {
      console.warn("CREATE NOTIFICATION: recipient is missing");

      return null;
    }

    const notification = await Notification.create({
      recipient,
      type,
      title,
      message,
      ticket,
      ticketNumber,
      metadata,
    });

    /*
     * =====================================================
     * SEND REAL-TIME NOTIFICATION
     * =====================================================
     */

    const io = req?.app?.get("io");

    if (io) {
      const room = getNotificationRoom(recipient);

      io.to(room).emit("notification:new", {
        notification: {
          _id: notification._id,
          recipient: notification.recipient,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          ticket: notification.ticket,
          ticketNumber: notification.ticketNumber,
          isRead: notification.isRead,
          readAt: notification.readAt,
          metadata: notification.metadata,
          createdAt: notification.createdAt,
          updatedAt: notification.updatedAt,
        },
      });

      console.log(`Notification sent to ${room}: ${title}`);
    }

    return notification;
  } catch (error) {
    console.error("CREATE NOTIFICATION ERROR:", error);

    return null;
  }
};

/*
 * =========================================================
 * TICKET CREATED
 * =========================================================
 */

export const notifyTicketCreated = async ({ req, ticket }) => {
  return createNotification({
    req,
    recipient: ticket.customer,
    type: "ticket_created",
    title: "Ticket Created",
    message: `Your support ticket ${ticket.ticketNumber} has been created successfully.`,
    ticket: ticket._id,
    ticketNumber: ticket.ticketNumber,
  });
};

/*
 * =========================================================
 * AI REPLY
 * =========================================================
 */

export const notifyAIReply = async ({ req, ticket }) => {
  return createNotification({
    req,
    recipient: ticket.customer,
    type: "ai_reply",
    title: "AI Response Received",
    message: `SupportAI has responded to your ticket ${ticket.ticketNumber}.`,
    ticket: ticket._id,
    ticketNumber: ticket.ticketNumber,
  });
};

/*
 * =========================================================
 * AGENT REPLY
 * =========================================================
 */

export const notifyAgentReply = async ({ req, ticket }) => {
  return createNotification({
    req,
    recipient: ticket.customer,
    type: "new_reply",
    title: "New Support Reply",
    message: `A support agent replied to your ticket ${ticket.ticketNumber}.`,
    ticket: ticket._id,
    ticketNumber: ticket.ticketNumber,
  });
};

/*
 * =========================================================
 * STATUS CHANGED
 * =========================================================
 */

export const notifyTicketStatusChanged = async ({
  req,
  ticket,
  previousStatus,
}) => {
  if (!ticket || previousStatus === ticket.status) {
    return null;
  }

  const statusLabel = ticket.status
    .replace("-", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

  return createNotification({
    req,
    recipient: ticket.customer,
    type: "status_changed",
    title: "Ticket Status Updated",
    message: `Your ticket ${ticket.ticketNumber} is now ${statusLabel}.`,
    ticket: ticket._id,
    ticketNumber: ticket.ticketNumber,
    metadata: {
      previousStatus,
      currentStatus: ticket.status,
    },
  });
};

/*
 * =========================================================
 * TICKET RESOLVED
 * =========================================================
 */

export const notifyTicketResolved = async ({ req, ticket }) => {
  return createNotification({
    req,
    recipient: ticket.customer,
    type: "ticket_resolved",
    title: "Ticket Resolved",
    message: `Your ticket ${ticket.ticketNumber} has been resolved.`,
    ticket: ticket._id,
    ticketNumber: ticket.ticketNumber,
  });
};

/*
 * =========================================================
 * TICKET REOPENED
 * =========================================================
 */

export const notifyTicketReopened = async ({ req, ticket }) => {
  return createNotification({
    req,
    recipient: ticket.customer,
    type: "ticket_reopened",
    title: "Ticket Reopened",
    message: `Your ticket ${ticket.ticketNumber} has been reopened.`,
    ticket: ticket._id,
    ticketNumber: ticket.ticketNumber,
  });
};

/*
 * =========================================================
 * TICKET ESCALATED
 * =========================================================
 */

export const notifyTicketEscalated = async ({ req, ticket }) => {
  return createNotification({
    req,
    recipient: ticket.customer,
    type: "ticket_escalated",
    title: "Ticket Escalated",
    message: `Your ticket ${ticket.ticketNumber} has been escalated to our support team.`,
    ticket: ticket._id,
    ticketNumber: ticket.ticketNumber,
  });
};

/*
 * =========================================================
 * AGENT ASSIGNED
 * =========================================================
 */

export const notifyAgentAssigned = async ({ req, ticket, agentName }) => {
  return createNotification({
    req,
    recipient: ticket.customer,
    type: "agent_assigned",
    title: "Support Agent Assigned",
    message: `${agentName || "A support agent"} has been assigned to your ticket ${ticket.ticketNumber}.`,
    ticket: ticket._id,
    ticketNumber: ticket.ticketNumber,
  });
};

/*
 * =========================================================
 * ATTACHMENT ADDED
 * =========================================================
 */

export const notifyAttachmentAdded = async ({ req, ticket }) => {
  return createNotification({
    req,
    recipient: ticket.customer,
    type: "attachment_added",
    title: "Ticket Attachment Added",
    message: `A new attachment was added to your ticket ${ticket.ticketNumber}.`,
    ticket: ticket._id,
    ticketNumber: ticket.ticketNumber,
  });
};
