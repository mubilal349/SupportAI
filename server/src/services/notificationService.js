import Notification from "../models/Notification.js";
import User from "../models/User.js";

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

/*
 * =========================================================
 * AGENT - NEW CUSTOMER TICKET
 * =========================================================
 *
 * Notify the agent pool that a new ticket is available.
 *
 * IMPORTANT:
 * This does NOT assign the ticket to any agent.
 *
 * =========================================================
 */

export const notifyAgentsNewTicket = async ({ req, ticket }) => {
  try {
    if (!ticket) {
      return [];
    }

    const io = req?.app?.get("io");

    /*
     * Find active agents/admins.
     *
     * We create individual notifications so that:
     * - unread counts work correctly
     * - notifications persist in MongoDB
     * - each agent gets their own notification
     */

    const agents = await User.find({
      role: {
        $in: ["agent", "admin"],
      },
    }).select("_id role");

    if (!Array.isArray(agents) || agents.length === 0) {
      return [];
    }

    const notifications = [];

    for (const agent of agents) {
      const notification = await createNotification({
        req,

        recipient: agent._id,

        type: "ticket_created",

        title: "New Support Ticket",

        message: `New ticket ${ticket.ticketNumber} is waiting in the support queue.`,

        ticket: ticket._id,

        ticketNumber: ticket.ticketNumber,

        metadata: {
          source: "customer",

          target: "queue",

          priority: ticket.priority,

          category: ticket.category,
        },
      });

      if (notification) {
        notifications.push(notification);
      }
    }

    return notifications;
  } catch (error) {
    console.error("NOTIFY AGENTS NEW TICKET ERROR:", error);

    return [];
  }
};

/*
 * =========================================================
 * AGENT - CUSTOMER REPLY
 * =========================================================
 *
 * Notify the assigned agent when their customer replies.
 *
 * =========================================================
 */

export const notifyAgentNewReply = async ({ req, ticket }) => {
  try {
    if (!ticket?.assignedAgent) {
      return null;
    }

    return createNotification({
      req,

      recipient: ticket.assignedAgent,

      type: "new_reply",

      title: "New Customer Reply",

      message: `Customer replied to ticket ${ticket.ticketNumber}.`,

      ticket: ticket._id,

      ticketNumber: ticket.ticketNumber,

      metadata: {
        source: "customer",

        target: "agent",
      },
    });
  } catch (error) {
    console.error("NOTIFY AGENT NEW REPLY ERROR:", error);

    return null;
  }
};

/*
 * =========================================================
 * AGENT - TICKET ASSIGNED
 * =========================================================
 */

export const notifyAgentTicketAssigned = async ({ req, ticket }) => {
  try {
    if (!ticket?.assignedAgent) {
      return null;
    }

    return await createNotification({
      req,

      recipient: ticket.assignedAgent,

      type: "agent_assigned",

      title: "Ticket Assigned",

      message: `Ticket ${ticket.ticketNumber} has been assigned to you.`,

      ticket: ticket._id,

      ticketNumber: ticket.ticketNumber,

      metadata: {
        source: "assignment",
        target: "agent",
        ticketId: String(ticket._id),
        ticketNumber: ticket.ticketNumber,
      },
    });
  } catch (error) {
    console.error("Notify agent ticket assigned error:", error);

    return null;
  }
};

/*
 * =========================================================
 * ESCALATION TARGET
 * =========================================================
 */

export const notifyEscalationTarget = async ({
  req,
  ticket,
  targetUser,
  reason = "",
  note = "",
}) => {
  if (!ticket || !targetUser?._id) {
    return null;
  }

  return createNotification({
    req,
    recipient: targetUser._id,
    type: "ticket_escalated",
    title: "Ticket Escalated to You",
    message: `Ticket ${ticket.ticketNumber} has been escalated to you.`,
    ticket: ticket._id,
    ticketNumber: ticket.ticketNumber,
    metadata: {
      source: "escalation",
      target: "agent",
      reason,
      note,
    },
  });
};
