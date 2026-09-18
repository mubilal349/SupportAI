import fs from "fs";
import path from "path";
import mongoose from "mongoose";

import Ticket from "../models/Ticket.js";
import User from "../models/User.js";

import { createAuditLog } from "../services/auditLogService.js";

import { createSlaDates } from "../utils/sla.js";

import { calculateSlaDeadlinesService } from "../services/slaService.js";

import { generateAIResponse } from "../services/aiService.js";

import {
  notifyAIReply,
  notifyTicketCreated,
  notifyAgentsNewTicket,
  notifyAgentNewReply,
} from "../services/notificationService.js";

import {
  sendTicketCreatedEmail,
  sendTicketResolvedEmail,
} from "../services/emailService.js";

// ============================================================
// SLA HELPERS
// ============================================================

const ensureTicketSla = (ticket) => {
  if (!ticket) return;

  if (!ticket.sla) {
    ticket.sla = createSlaDates(
      ticket.createdAt || new Date(),
      ticket.priority || "medium",
    );
    return;
  }

  const createdAt = ticket.createdAt || new Date();
  const priority = ticket.priority || "medium";

  if (!ticket.sla.responseDueAt || !ticket.sla.resolutionDueAt) {
    const slaDates = createSlaDates(createdAt, priority);

    if (!ticket.sla.responseDueAt) {
      ticket.sla.responseDueAt = slaDates.responseDueAt;
    }

    if (!ticket.sla.resolutionDueAt) {
      ticket.sla.resolutionDueAt = slaDates.resolutionDueAt;
    }
  }

  if (ticket.sla.firstRespondedAt === undefined) {
    ticket.sla.firstRespondedAt = null;
  }

  if (ticket.sla.resolvedAt === undefined) {
    ticket.sla.resolvedAt = null;
  }
};

const markFirstHumanResponse = ({ ticket, respondedAt = new Date() }) => {
  ensureTicketSla(ticket);

  if (!ticket?.sla) return;

  if (!ticket.sla.firstRespondedAt) {
    ticket.sla.firstRespondedAt = respondedAt;
  }
};

const markTicketResolvedForSla = ({ ticket, resolvedAt = new Date() }) => {
  ensureTicketSla(ticket);

  if (!ticket?.sla) return;

  ticket.sla.resolvedAt = resolvedAt;
};

const reopenTicketSla = (ticket) => {
  ensureTicketSla(ticket);

  if (!ticket?.sla) return;

  // Keep firstRespondedAt.
  // Only clear resolvedAt because the ticket has been reopened.
  ticket.sla.resolvedAt = null;
};

const getTicketSlaStatus = (ticket, now = new Date()) => {
  ensureTicketSla(ticket);

  if (!ticket?.sla) {
    return {
      responseDueAt: null,
      resolutionDueAt: null,
      firstRespondedAt: null,
      resolvedAt: null,
      responseBreached: false,
      resolutionBreached: false,
      responseStatus: "pending",
      resolutionStatus: "pending",
    };
  }

  const responseDueAt = ticket.sla.responseDueAt
    ? new Date(ticket.sla.responseDueAt)
    : null;

  const resolutionDueAt = ticket.sla.resolutionDueAt
    ? new Date(ticket.sla.resolutionDueAt)
    : null;

  const firstRespondedAt = ticket.sla.firstRespondedAt
    ? new Date(ticket.sla.firstRespondedAt)
    : null;

  const resolvedAt = ticket.sla.resolvedAt
    ? new Date(ticket.sla.resolvedAt)
    : null;

  const responseBreached =
    !firstRespondedAt && responseDueAt && now > responseDueAt;

  const resolutionBreached =
    !resolvedAt && resolutionDueAt && now > resolutionDueAt;

  let responseStatus = "pending";

  if (firstRespondedAt) {
    responseStatus = "completed";
  } else if (responseBreached) {
    responseStatus = "breached";
  }

  let resolutionStatus = "pending";

  if (resolvedAt) {
    resolutionStatus = "completed";
  } else if (resolutionBreached) {
    resolutionStatus = "breached";
  }

  return {
    responseDueAt,
    resolutionDueAt,
    firstRespondedAt,
    resolvedAt,
    responseBreached: Boolean(responseBreached),
    resolutionBreached: Boolean(resolutionBreached),
    responseStatus,
    resolutionStatus,
  };
};

// ============================================================
// CUSTOMER DATA SANITIZATION
// ============================================================

const sanitizeCustomerTicket = (ticket) => {
  if (!ticket) return ticket;

  const ticketObject =
    typeof ticket.toObject === "function" ? ticket.toObject() : ticket;

  if (Array.isArray(ticketObject.conversation)) {
    ticketObject.conversation = ticketObject.conversation.filter(
      (message) => !message?.isInternal,
    );
  }

  return ticketObject;
};

// ============================================================
// TICKET NUMBER
// ============================================================

const generateTicketNumber = async () => {
  let ticketNumber;
  let exists = true;

  while (exists) {
    ticketNumber = `TKT-${Math.floor(100000 + Math.random() * 900000)}`;

    exists = await Ticket.exists({ ticketNumber });
  }

  return ticketNumber;
};

// ============================================================
// SOCKET HELPERS
// ============================================================

const getSocketIO = (req) => {
  return req.app?.get("io");
};

const getTicketRoom = (ticketId) => {
  return `ticket:${ticketId}`;
};

const broadcastNewMessage = (req, ticketId, conversationMessage) => {
  const io = getSocketIO(req);

  if (!io) return;

  io.to(getTicketRoom(ticketId)).emit(
    "ticket:new-message",
    conversationMessage,
  );
};

const broadcastTicketUpdate = (req, ticket) => {
  const io = getSocketIO(req);

  if (!io || !ticket) return;

  const slaStatus = getTicketSlaStatus(ticket);

  io.to(getTicketRoom(ticket._id.toString())).emit("ticket:updated", {
    ticketId: ticket._id,
    status: ticket.status,
    replies: ticket.replies,
    lastReplyAt: ticket.lastReplyAt,
    reopenedAt: ticket.reopenedAt,
    resolvedAt: ticket.resolvedAt,
    closedAt: ticket.closedAt,
    sla: slaStatus,
  });
};

// ============================================================
// STATUS HISTORY
// ============================================================

const addStatusHistory = ({
  ticket,
  status,
  changedBy,
  changedByRole,
  note = "",
}) => {
  if (!Array.isArray(ticket.statusHistory)) {
    ticket.statusHistory = [];
  }

  ticket.statusHistory.push({
    status,
    changedBy,
    changedByRole,
    note,
    createdAt: new Date(),
  });
};

const recordStatusChange = ({
  ticket,
  previousStatus,
  newStatus,
  changedBy,
  changedByRole,
  note = "",
}) => {
  if (previousStatus === newStatus) return;

  addStatusHistory({
    ticket,
    status: newStatus,
    changedBy,
    changedByRole,
    note,
  });
};

// ============================================================
// CREATE TICKET
// ============================================================

export const createTicket = async (req, res) => {
  try {
    const {
      subject,
      description,
      category = "General",
      priority = "medium",
    } = req.body;

    if (!subject?.trim()) {
      return res.status(400).json({
        message: "Subject is required",
      });
    }

    if (!description?.trim()) {
      return res.status(400).json({
        message: "Description is required",
      });
    }

    const ticketNumber = await generateTicketNumber();

    const now = new Date();

    const ticketPriority = priority || "medium";

    const sla = calculateSlaDeadlinesService(ticketPriority, now);

    const initialMessage = {
      sender: req.user.id,
      senderRole: "customer",
      message: description.trim(),
      isInternal: false,
      isRead: false,
      createdAt: now,
    };

    const ticket = await Ticket.create({
      ticketNumber,
      customer: req.user.id,

      subject: subject.trim(),
      description: description.trim(),

      category,
      priority: ticketPriority,

      status: "open",

      sla,

      statusHistory: [
        {
          status: "open",
          changedBy: req.user.id,
          changedByRole: "customer",
          note: "Ticket created",
          createdAt: now,
        },
      ],

      conversation: [initialMessage],

      replies: 1,
      lastReplyAt: now,
    });

    // ========================================================
    // NOTIFICATIONS
    // ========================================================

    await notifyTicketCreated({
      req,
      ticket,
    });

    await notifyAgentsNewTicket({
      req,
      ticket,
    });

    // ========================================================
    // EMAIL
    // ========================================================

    try {
      const customer = await User.findById(req.user.id).select(
        "name email role",
      );

      if (!customer) {
        throw new Error("Customer not found for ticket email.");
      }

      await sendTicketCreatedEmail({
        customer,
        ticket,
      });

      console.log(
        `Ticket creation email sent to ${customer.email} for ${ticket.ticketNumber}`,
      );
    } catch (emailError) {
      console.error(
        `Ticket created email error for ${ticket.ticketNumber}:`,
        emailError,
      );
    }

    // ========================================================
    // INITIAL AI RESPONSE
    // ========================================================

    let aiText = "";

    try {
      const aiResult = await generateAIResponse({
        messages: [
          {
            role: "user",
            content: description.trim(),
          },
        ],
      });

      aiText =
        typeof aiResult === "string"
          ? aiResult
          : aiResult?.text || aiResult?.response || "";

      if (aiText?.trim()) {
        const aiMessage = {
          sender: null,
          senderRole: "ai",
          message: aiText.trim(),
          isInternal: false,
          isRead: false,
          createdAt: new Date(),
        };

        ticket.conversation.push(aiMessage);

        ticket.replies = (ticket.replies || 0) + 1;

        ticket.lastReplyAt = new Date();

        await ticket.save();

        await notifyAIReply({
          req,
          ticket,
        });

        // ======================================================
        // AUDIT LOG - AI REPLY
        // ======================================================

        await createAuditLog({
          req,
          actor: {
            userId: null,
            name: "SupportAI",
            email: "",
            role: "system",
          },
          action: "TICKET_AI_REPLY_ADDED",
          resource: {
            type: "ticket",
            id: ticket._id,
          },
          description: `AI replied to ticket ${ticket.ticketNumber}.`,
          metadata: {
            ticketId: ticket._id,
            ticketNumber: ticket.ticketNumber,
            model:
              aiResult?.model || process.env.OLLAMA_MODEL || "gemma4:31b-cloud",
            messageLength: aiText.trim().length,
          },
        });
      }
    } catch (aiError) {
      console.error("Initial AI response error:", aiError);
    }

    // ========================================================
    // AUDIT LOG - TICKET CREATED
    // ========================================================

    await createAuditLog({
      req,
      actor: req.user,
      action: "TICKET_CREATED",
      resource: {
        type: "ticket",
        id: ticket._id,
      },
      description: `Ticket ${ticket.ticketNumber} was created.`,
      metadata: {
        ticketId: ticket._id,
        ticketNumber: ticket.ticketNumber,
        subject: ticket.subject,
        category: ticket.category,
        priority: ticket.priority,
        status: ticket.status,
        customerId: ticket.customer,
      },
    });

    // ========================================================
    // POPULATE RESPONSE
    // ========================================================

    await ticket.populate([
      {
        path: "customer",
        select: "name email avatar role",
      },
      {
        path: "assignedAgent",
        select: "name email avatar role",
      },
      {
        path: "conversation.sender",
        select: "name email avatar role",
      },
    ]);

    const sanitizedTicket = sanitizeCustomerTicket(ticket);

    return res.status(201).json({
      message: "Ticket created successfully",
      ticket: sanitizedTicket,
      slaStatus: getTicketSlaStatus(ticket),
    });
  } catch (error) {
    console.error("Create ticket error:", error);

    return res.status(500).json({
      message: "Failed to create ticket",
      error: error.message,
    });
  }
};

// ============================================================
// GET CUSTOMER TICKETS
// ============================================================

export const getCustomerTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find({
      customer: req.user.id,
    })
      .populate("assignedAgent", "name email avatar role")
      .sort({ createdAt: -1 });

    const sanitizedTickets = tickets.map(sanitizeCustomerTicket);

    return res.status(200).json({
      tickets: sanitizedTickets,
    });
  } catch (error) {
    console.error("Get customer tickets error:", error);

    return res.status(500).json({
      message: "Failed to fetch tickets",
      error: error.message,
    });
  }
};

// ============================================================
// GET CUSTOMER TICKET
// ============================================================

export const getCustomerTicket = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid ticket ID",
      });
    }

    const ticket = await Ticket.findOne({
      _id: id,
      customer: req.user.id,
    })
      .populate("customer", "name email avatar role")
      .populate("assignedAgent", "name email avatar role")
      .populate("conversation.sender", "name email avatar role");

    if (!ticket) {
      return res.status(404).json({
        message: "Ticket not found",
      });
    }

    return res.status(200).json({
      ticket: sanitizeCustomerTicket(ticket),
      slaStatus: getTicketSlaStatus(ticket),
    });
  } catch (error) {
    console.error("Get customer ticket error:", error);

    return res.status(500).json({
      message: "Failed to fetch ticket",
      error: error.message,
    });
  }
};

// ============================================================
// ADD CUSTOMER REPLY
// ============================================================

export const addTicketReply = async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid ticket ID",
      });
    }

    if (!message?.trim()) {
      return res.status(400).json({
        message: "Message is required",
      });
    }

    const ticket = await Ticket.findOne({
      _id: id,
      customer: req.user.id,
    });

    if (!ticket) {
      return res.status(404).json({
        message: "Ticket not found",
      });
    }

    if (ticket.status === "closed") {
      return res.status(400).json({
        message: "This ticket is closed and cannot receive replies.",
      });
    }

    ensureTicketSla(ticket);

    const previousStatus = ticket.status;

    const now = new Date();

    const customerMessage = {
      sender: req.user.id,
      senderRole: "customer",
      message: message.trim(),
      isInternal: false,
      isRead: false,
      createdAt: now,
    };

    ticket.conversation.push(customerMessage);

    // ========================================================
    // REOPEN RESOLVED TICKET
    // ========================================================

    if (ticket.status === "resolved") {
      ticket.status = "open";
      ticket.reopenedAt = now;

      reopenTicketSla(ticket);

      addStatusHistory({
        ticket,
        status: "open",
        changedBy: req.user.id,
        changedByRole: "customer",
        note: "Ticket reopened because customer replied.",
      });
    }

    // ========================================================
    // WAITING -> OPEN
    // ========================================================

    if (ticket.status === "waiting") {
      ticket.status = "open";

      addStatusHistory({
        ticket,
        status: "open",
        changedBy: req.user.id,
        changedByRole: "customer",
        note: "Ticket moved to open because customer replied.",
      });
    }

    ticket.replies = (ticket.replies || 0) + 1;

    ticket.lastReplyAt = now;

    await ticket.save();

    // ========================================================
    // AUDIT LOG - CUSTOMER REPLY / REOPEN
    // ========================================================

    await createAuditLog({
      req,
      actor: req.user,
      action:
        previousStatus !== ticket.status
          ? "TICKET_REOPENED"
          : "TICKET_REPLY_ADDED",
      resource: {
        type: "ticket",
        id: ticket._id,
      },
      description:
        previousStatus !== ticket.status
          ? `Ticket ${ticket.ticketNumber} was reopened by the customer.`
          : `Customer replied to ticket ${ticket.ticketNumber}.`,
      metadata: {
        ticketId: ticket._id,
        ticketNumber: ticket.ticketNumber,
        previousStatus,
        newStatus: ticket.status,
        senderRole: "customer",
        messageLength: message.trim().length,
      },
    });

    // ========================================================
    // NOTIFY ASSIGNED AGENT
    // ========================================================

    if (ticket.assignedAgent) {
      await notifyAgentNewReply({
        req,
        ticket,
      });
    }

    // ========================================================
    // SOCKET MESSAGE
    // ========================================================

    broadcastNewMessage(req, ticket._id.toString(), customerMessage);

    broadcastTicketUpdate(req, ticket);

    // ========================================================
    // STATUS SOCKET EVENT
    // ========================================================

    if (previousStatus !== ticket.status) {
      const io = getSocketIO(req);

      if (io) {
        io.to(getTicketRoom(ticket._id.toString())).emit(
          "ticket:status-changed",
          {
            ticketId: ticket._id,
            previousStatus,
            status: ticket.status,
            statusHistory: ticket.statusHistory,
            sla: getTicketSlaStatus(ticket),
          },
        );
      }
    }

    // ========================================================
    // BUILD AI CONVERSATION
    // ========================================================

    const aiMessages = ticket.conversation
      .filter((item) => !item?.isInternal && item?.message?.trim())
      .map((item) => ({
        role: item.senderRole === "ai" ? "assistant" : "user",
        content: item.message,
      }));

    // ========================================================
    // AI TICKET CONTEXT
    // ========================================================

    const ticketContext = {
      ticketNumber: ticket.ticketNumber,
      subject: ticket.subject,
      description: ticket.description,
      category: ticket.category,
      priority: ticket.priority,
      status: ticket.status,
    };

    const aiRequestMessages = [
      {
        role: "system",
        content: `
You are SupportAI, an AI customer support assistant.

Use the following ticket information to understand the customer's issue.

Ticket Number: ${ticketContext.ticketNumber}
Subject: ${ticketContext.subject}
Category: ${ticketContext.category}
Priority: ${ticketContext.priority}
Status: ${ticketContext.status}

Respond helpfully and professionally.
Do not claim that you are a human agent.
If the issue requires human assistance, clearly recommend that the customer talk to a human support agent.
        `.trim(),
      },
      ...aiMessages,
    ];

    // ========================================================
    // AI RESPONSE
    // ========================================================

    try {
      const aiResult = await generateAIResponse({
        messages: aiRequestMessages,
      });

      const aiText =
        typeof aiResult === "string"
          ? aiResult
          : aiResult?.text || aiResult?.response || "";

      if (aiText?.trim()) {
        const aiMessage = {
          sender: null,
          senderRole: "ai",
          message: aiText.trim(),
          isInternal: false,
          isRead: false,
          createdAt: new Date(),
        };

        ticket.conversation.push(aiMessage);

        ticket.replies = (ticket.replies || 0) + 1;

        ticket.lastReplyAt = new Date();

        await ticket.save();

        // ======================================================
        // AUDIT LOG - AI REPLY
        // ======================================================

        await createAuditLog({
          req,
          actor: {
            userId: null,
            name: "SupportAI",
            email: "",
            role: "system",
          },
          action: "TICKET_AI_REPLY_ADDED",
          resource: {
            type: "ticket",
            id: ticket._id,
          },
          description: `AI replied to ticket ${ticket.ticketNumber}.`,
          metadata: {
            ticketId: ticket._id,
            ticketNumber: ticket.ticketNumber,
            model:
              aiResult?.model || process.env.OLLAMA_MODEL || "gemma4:31b-cloud",
            messageLength: aiText.trim().length,
          },
        });

        // ======================================================
        // SOCKET AI MESSAGE
        // ======================================================

        broadcastNewMessage(req, ticket._id.toString(), aiMessage);

        broadcastTicketUpdate(req, ticket);

        // ======================================================
        // AI NOTIFICATION
        // ======================================================

        await notifyAIReply({
          req,
          ticket,
        });

        // ======================================================
        // RESPONSE
        // ======================================================

        await ticket.populate([
          {
            path: "customer",
            select: "name email avatar role",
          },
          {
            path: "assignedAgent",
            select: "name email avatar role",
          },
          {
            path: "conversation.sender",
            select: "name email avatar role",
          },
        ]);

        return res.status(200).json({
          message: "Reply added successfully",
          ticket: sanitizeCustomerTicket(ticket),
          conversation: sanitizeCustomerTicket(ticket).conversation,
          aiResponse: aiText.trim(),
          aiModel:
            aiResult?.model || process.env.OLLAMA_MODEL || "gemma4:31b-cloud",
          slaStatus: getTicketSlaStatus(ticket),
        });
      }
    } catch (aiError) {
      console.error("AI ticket reply error:", aiError);
    }

    // ========================================================
    // RESPONSE WITHOUT AI
    // ========================================================

    await ticket.populate([
      {
        path: "customer",
        select: "name email avatar role",
      },
      {
        path: "assignedAgent",
        select: "name email avatar role",
      },
      {
        path: "conversation.sender",
        select: "name email avatar role",
      },
    ]);

    return res.status(200).json({
      message: "Reply added successfully",
      ticket: sanitizeCustomerTicket(ticket),
      conversation: sanitizeCustomerTicket(ticket).conversation,
      aiResponse: null,
      aiModel: null,
      slaStatus: getTicketSlaStatus(ticket),
    });
  } catch (error) {
    console.error("Add ticket reply error:", error);

    return res.status(500).json({
      message: "Failed to add reply",
      error: error.message,
    });
  }
};

// ============================================================
// RESOLVE CUSTOMER TICKET
// ============================================================

export const resolveCustomerTicket = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid ticket ID",
      });
    }

    const ticket = await Ticket.findOne({
      _id: id,
      customer: req.user.id,
    });

    if (!ticket) {
      return res.status(404).json({
        message: "Ticket not found",
      });
    }

    if (ticket.status === "closed") {
      return res.status(400).json({
        message: "Closed tickets cannot be resolved.",
      });
    }

    if (ticket.status === "resolved") {
      return res.status(400).json({
        message: "Ticket is already resolved.",
      });
    }

    ensureTicketSla(ticket);

    const previousStatus = ticket.status;

    const now = new Date();

    ticket.status = "resolved";
    ticket.resolvedAt = now;

    markTicketResolvedForSla({
      ticket,
      resolvedAt: now,
    });

    addStatusHistory({
      ticket,
      status: "resolved",
      changedBy: req.user.id,
      changedByRole: "customer",
      note: "Ticket resolved by customer.",
    });

    await ticket.save();

    // ========================================================
    // AUDIT LOG
    // ========================================================

    await createAuditLog({
      req,
      actor: req.user,
      action: "TICKET_RESOLVED",
      resource: {
        type: "ticket",
        id: ticket._id,
      },
      description: `Ticket ${ticket.ticketNumber} was resolved by the customer.`,
      metadata: {
        ticketId: ticket._id,
        ticketNumber: ticket.ticketNumber,
        previousStatus,
        newStatus: ticket.status,
        resolvedAt: now,
        resolvedBy: req.user.id,
        resolvedByRole: "customer",
      },
    });

    // ========================================================
    // EMAIL
    // ========================================================

    try {
      const customer = await User.findById(ticket.customer).select(
        "name email role",
      );

      if (!customer) {
        throw new Error("Customer not found for resolved ticket email.");
      }

      await sendTicketResolvedEmail({
        customer,
        ticket,
      });

      console.log(
        `Ticket resolved email sent to ${customer.email} for ${ticket.ticketNumber}`,
      );
    } catch (emailError) {
      console.error(
        `Ticket resolved email error for ${ticket.ticketNumber}:`,
        emailError,
      );
    }
    // ========================================================
    // SOCKET
    // ========================================================

    const io = getSocketIO(req);

    if (io) {
      io.to(getTicketRoom(ticket._id.toString())).emit(
        "ticket:status-changed",
        {
          ticketId: ticket._id,
          previousStatus,
          status: ticket.status,
          statusHistory: ticket.statusHistory,
          sla: getTicketSlaStatus(ticket),
        },
      );
    }

    broadcastTicketUpdate(req, ticket);

    // ========================================================
    // RESPONSE
    // ========================================================

    await ticket.populate([
      {
        path: "customer",
        select: "name email avatar role",
      },
      {
        path: "assignedAgent",
        select: "name email avatar role",
      },
      {
        path: "conversation.sender",
        select: "name email avatar role",
      },
    ]);

    return res.status(200).json({
      message: "Ticket resolved successfully",
      ticket: sanitizeCustomerTicket(ticket),
      slaStatus: getTicketSlaStatus(ticket),
    });
  } catch (error) {
    console.error("Resolve customer ticket error:", error);

    return res.status(500).json({
      message: "Failed to resolve ticket",
      error: error.message,
    });
  }
};

// ============================================================
// UPLOAD TICKET ATTACHMENTS
// ============================================================

export const uploadTicketAttachments = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid ticket ID",
      });
    }

    const files = req.files || [];

    if (!files.length) {
      return res.status(400).json({
        message: "No files uploaded",
      });
    }

    const ticket = await Ticket.findOne({
      _id: id,
      customer: req.user.id,
    });

    if (!ticket) {
      return res.status(404).json({
        message: "Ticket not found",
      });
    }

    if (ticket.status === "closed") {
      return res.status(400).json({
        message: "Attachments cannot be added to a closed ticket.",
      });
    }

    const attachments = files.map((file) => ({
      filename: file.filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      path: `/uploads/tickets/${file.filename}`,
      uploadedBy: req.user.id,
      uploadedAt: new Date(),
    }));

    ticket.attachments = [...(ticket.attachments || []), ...attachments];

    await ticket.save();

    // ========================================================
    // AUDIT LOG
    // ========================================================

    await createAuditLog({
      req,
      actor: req.user,
      action: "TICKET_ATTACHMENT_ADDED",
      resource: {
        type: "ticket",
        id: ticket._id,
      },
      description: `${attachments.length} attachment${
        attachments.length === 1 ? "" : "s"
      } added to ticket ${ticket.ticketNumber}.`,
      metadata: {
        ticketId: ticket._id,
        ticketNumber: ticket.ticketNumber,
        attachmentCount: attachments.length,
        attachments: attachments.map((attachment) => ({
          filename: attachment.filename,
          originalName: attachment.originalName,
          mimetype: attachment.mimetype,
          size: attachment.size,
        })),
      },
    });

    // ========================================================
    // SOCKET
    // ========================================================

    broadcastTicketUpdate(req, ticket);

    return res.status(200).json({
      message: "Attachments uploaded successfully",
      attachments,
      ticket: sanitizeCustomerTicket(ticket),
    });
  } catch (error) {
    console.error("Upload ticket attachments error:", error);

    return res.status(500).json({
      message: "Failed to upload attachments",
      error: error.message,
    });
  }
};

// ============================================================
// DELETE TICKET ATTACHMENT
// ============================================================

export const deleteTicketAttachment = async (req, res) => {
  try {
    const { id, attachmentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid ticket ID",
      });
    }

    const ticket = await Ticket.findOne({
      _id: id,
      customer: req.user.id,
    });

    if (!ticket) {
      return res.status(404).json({
        message: "Ticket not found",
      });
    }

    const attachment = ticket.attachments?.find(
      (item) => item._id?.toString() === attachmentId,
    );

    if (!attachment) {
      return res.status(404).json({
        message: "Attachment not found",
      });
    }

    // ========================================================
    // DELETE PHYSICAL FILE
    // ========================================================

    try {
      const uploadsRoot = path.resolve(process.cwd(), "uploads", "tickets");

      const filePath = path.join(uploadsRoot, attachment.filename);

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (fileError) {
      console.error("Delete attachment file error:", fileError);
    }

    // ========================================================
    // REMOVE FROM DATABASE
    // ========================================================

    ticket.attachments.pull(attachmentId);

    await ticket.save();

    // ========================================================
    // AUDIT LOG
    // ========================================================

    await createAuditLog({
      req,
      actor: req.user,
      action: "TICKET_ATTACHMENT_DELETED",
      resource: {
        type: "ticket",
        id: ticket._id,
      },
      description: `Attachment "${
        attachment.originalName || attachment.filename
      }" was deleted from ticket ${ticket.ticketNumber}.`,
      metadata: {
        ticketId: ticket._id,
        ticketNumber: ticket.ticketNumber,
        attachmentId,
        filename: attachment.filename,
        originalName: attachment.originalName,
        mimetype: attachment.mimetype,
        size: attachment.size,
      },
    });

    // ========================================================
    // SOCKET
    // ========================================================

    broadcastTicketUpdate(req, ticket);

    return res.status(200).json({
      message: "Attachment deleted successfully",
      attachmentId,
      attachments: ticket.attachments,
      ticket: sanitizeCustomerTicket(ticket),
    });
  } catch (error) {
    console.error("Delete ticket attachment error:", error);

    return res.status(500).json({
      message: "Failed to delete attachment",
      error: error.message,
    });
  }
};

// ============================================================
// GET TICKET STATUS HISTORY
// ============================================================

export const getTicketStatusHistory = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid ticket ID",
      });
    }

    const ticket = await Ticket.findOne({
      _id: id,
      customer: req.user.id,
    }).populate("statusHistory.changedBy", "name email avatar role");

    if (!ticket) {
      return res.status(404).json({
        message: "Ticket not found",
      });
    }

    return res.status(200).json({
      statusHistory: ticket.statusHistory || [],
    });
  } catch (error) {
    console.error("Get ticket status history error:", error);

    return res.status(500).json({
      message: "Failed to fetch status history",
      error: error.message,
    });
  }
};

// ============================================================
// SUBMIT TICKET RATING
// ============================================================

export const submitTicketRating = async (req, res) => {
  try {
    const { id } = req.params;

    const { rating, feedback = "" } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid ticket ID",
      });
    }

    const numericRating = Number(rating);

    if (
      !Number.isInteger(numericRating) ||
      numericRating < 1 ||
      numericRating > 5
    ) {
      return res.status(400).json({
        message: "Rating must be an integer between 1 and 5.",
      });
    }

    const cleanFeedback = typeof feedback === "string" ? feedback.trim() : "";

    if (cleanFeedback.length > 1000) {
      return res.status(400).json({
        message: "Feedback cannot exceed 1000 characters.",
      });
    }

    const ticket = await Ticket.findOne({
      _id: id,
      customer: req.user.id,
    });

    if (!ticket) {
      return res.status(404).json({
        message: "Ticket not found",
      });
    }

    if (!["resolved", "closed"].includes(ticket.status)) {
      return res.status(400).json({
        message: "Only resolved or closed tickets can be rated.",
      });
    }

    const alreadyRated =
      ticket.satisfaction?.rating || ticket.customerRating?.rating;

    if (alreadyRated) {
      return res.status(400).json({
        message: "This ticket has already been rated.",
      });
    }

    const ratedAt = new Date();

    ticket.satisfaction = {
      rating: numericRating,
      feedback: cleanFeedback,
      ratedAt,
    };

    // Preserve legacy rating fields if they exist
    ticket.customerRating = {
      rating: numericRating,
      feedback: cleanFeedback,
      ratedAt,
    };

    await ticket.save();

    // ========================================================
    // AUDIT LOG
    // ========================================================

    await createAuditLog({
      req,
      actor: req.user,
      action: "TICKET_RATING_ADDED",
      resource: {
        type: "ticket",
        id: ticket._id,
      },
      description: `Customer rated ticket ${ticket.ticketNumber} with ${numericRating}/5.`,
      metadata: {
        ticketId: ticket._id,
        ticketNumber: ticket.ticketNumber,
        rating: numericRating,
        feedbackProvided: Boolean(cleanFeedback),
        feedbackLength: cleanFeedback.length,
        ratedAt,
      },
    });

    // ========================================================
    // SOCKET
    // ========================================================

    const io = getSocketIO(req);

    if (io) {
      io.to(getTicketRoom(ticket._id.toString())).emit(
        "ticket:rating-submitted",
        {
          ticketId: ticket._id,
          rating: numericRating,
          ratedAt,
        },
      );
    }

    return res.status(200).json({
      message: "Ticket rating submitted successfully",
      rating: numericRating,
      feedback: cleanFeedback,
      ratedAt,
      satisfaction: ticket.satisfaction,
      ticket,
    });
  } catch (error) {
    console.error("Submit ticket rating error:", error);

    return res.status(500).json({
      message: "Failed to submit ticket rating",
      error: error.message,
    });
  }
};

// ============================================================
// GET TICKET RATING
// ============================================================

export const getTicketRating = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid ticket ID",
      });
    }

    const ticket = await Ticket.findOne({
      _id: id,
      customer: req.user.id,
    }).select("ticketNumber satisfaction customerRating");

    if (!ticket) {
      return res.status(404).json({
        message: "Ticket not found",
      });
    }

    const satisfaction = ticket.satisfaction || ticket.customerRating || null;

    return res.status(200).json({
      rating: satisfaction?.rating || null,
      feedback: satisfaction?.feedback || "",
      ratedAt: satisfaction?.ratedAt || null,
      satisfaction,
    });
  } catch (error) {
    console.error("Get ticket rating error:", error);

    return res.status(500).json({
      message: "Failed to fetch ticket rating",
      error: error.message,
    });
  }
};

// ============================================================
// CUSTOMER ANALYTICS
// ============================================================

export const getCustomerAnalytics = async (req, res) => {
  try {
    const customerId = req.user.id;

    const tickets = await Ticket.find({
      customer: customerId,
    }).select(
      "status priority createdAt resolvedAt customerRating satisfaction",
    );

    const totalTickets = tickets.length;

    const openTickets = tickets.filter(
      (ticket) => ticket.status === "open",
    ).length;

    const pendingTickets = tickets.filter(
      (ticket) => ticket.status === "pending",
    ).length;

    const inProgressTickets = tickets.filter(
      (ticket) => ticket.status === "in-progress",
    ).length;

    const resolvedTickets = tickets.filter(
      (ticket) => ticket.status === "resolved",
    ).length;

    const closedTickets = tickets.filter(
      (ticket) => ticket.status === "closed",
    ).length;

    const ratings = tickets
      .map(
        (ticket) =>
          ticket.satisfaction?.rating || ticket.customerRating?.rating,
      )
      .filter((rating) => typeof rating === "number");

    const averageRating =
      ratings.length > 0
        ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
        : 0;

    const priorityBreakdown = {
      low: tickets.filter((ticket) => ticket.priority === "low").length,

      medium: tickets.filter((ticket) => ticket.priority === "medium").length,

      high: tickets.filter((ticket) => ticket.priority === "high").length,

      urgent: tickets.filter((ticket) => ticket.priority === "urgent").length,
    };

    return res.status(200).json({
      analytics: {
        totalTickets,
        openTickets,
        pendingTickets,
        inProgressTickets,
        resolvedTickets,
        closedTickets,
        averageRating: Number(averageRating.toFixed(2)),
        totalRatings: ratings.length,
        priorityBreakdown,
      },
    });
  } catch (error) {
    console.error("Get customer analytics error:", error);

    return res.status(500).json({
      message: "Failed to fetch customer analytics",
      error: error.message,
    });
  }
};
