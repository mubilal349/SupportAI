import mongoose from "mongoose";
import Ticket from "../models/Ticket.js";
import { generateAIResponse } from "../services/aiService.js";
import {
  notifyAIReply,
  notifyTicketCreated,
} from "../services/notificationService.js";

/*
 * =========================================================
 * GENERATE TICKET NUMBER
 * =========================================================
 */

const generateTicketNumber = async () => {
  let ticketNumber;
  let exists = true;

  while (exists) {
    const randomNumber = Math.floor(100000 + Math.random() * 900000);

    ticketNumber = `TKT-${randomNumber}`;

    exists = await Ticket.exists({
      ticketNumber,
    });
  }

  return ticketNumber;
};

/*
 * =========================================================
 * GET SOCKET.IO INSTANCE
 * =========================================================
 */

const getSocketIO = (req) => {
  return req.app.get("io");
};

/*
 * =========================================================
 * GET TICKET ROOM
 * =========================================================
 */

const getTicketRoom = (ticketId) => {
  return `ticket:${ticketId}`;
};

/*
 * =========================================================
 * STATUS HISTORY HELPERS
 * =========================================================
 */

const addStatusHistory = ({
  ticket,
  status,
  changedBy = null,
  changedByRole = "system",
  note = "",
  createdAt = new Date(),
}) => {
  if (!ticket) {
    return;
  }

  if (!Array.isArray(ticket.statusHistory)) {
    ticket.statusHistory = [];
  }

  ticket.statusHistory.push({
    status,
    changedBy,
    changedByRole,
    note,
    createdAt,
  });
};

const recordStatusChange = ({
  ticket,
  previousStatus,
  newStatus,
  changedBy,
  changedByRole,
  note = "",
  createdAt = new Date(),
}) => {
  if (!ticket || previousStatus === newStatus) {
    return false;
  }

  addStatusHistory({
    ticket,
    status: newStatus,
    changedBy,
    changedByRole,
    note,
    createdAt,
  });

  return true;
};

/*
 * =========================================================
 * BROADCAST NEW MESSAGE
 * =========================================================
 */

const broadcastNewMessage = (req, ticketId, conversationMessage) => {
  const io = getSocketIO(req);

  if (!io || !conversationMessage) {
    return;
  }

  const room = getTicketRoom(ticketId);

  io.to(room).emit("ticket:new-message", {
    ticketId: String(ticketId),

    message: {
      _id: conversationMessage._id,

      sender: conversationMessage.sender || null,

      senderRole: conversationMessage.senderRole,

      message: conversationMessage.message,

      attachments: conversationMessage.attachments || [],

      isRead: conversationMessage.isRead,

      createdAt: conversationMessage.createdAt,
    },
  });
};

/*
 * =========================================================
 * BROADCAST TICKET UPDATE
 * =========================================================
 */

const broadcastTicketUpdate = (req, ticket) => {
  const io = getSocketIO(req);

  if (!io || !ticket) {
    return;
  }

  const room = getTicketRoom(ticket._id);

  io.to(room).emit("ticket:updated", {
    ticketId: String(ticket._id),

    status: ticket.status,

    replies: ticket.replies,

    lastReplyAt: ticket.lastReplyAt,

    reopenedAt: ticket.reopenedAt || null,

    resolvedAt: ticket.resolvedAt || null,

    closedAt: ticket.closedAt || null,
  });
};

/*
 * =========================================================
 * CREATE TICKET
 * =========================================================
 */

export const createTicket = async (req, res) => {
  try {
    const { subject, description, category, priority } = req.body;

    if (!subject?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Ticket subject is required.",
      });
    }

    if (!description?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Ticket description is required.",
      });
    }

    const ticketNumber = await generateTicketNumber();

    const now = new Date();

    /*
     * =====================================================
     * INITIAL CUSTOMER MESSAGE
     * =====================================================
     */

    const initialConversationMessage = {
      sender: req.user.id,

      senderRole: "customer",

      message: description.trim(),

      isRead: true,

      createdAt: now,
    };

    const ticket = await Ticket.create({
      ticketNumber,

      customer: req.user.id,

      subject: subject.trim(),

      description: description.trim(),

      category: category || "General",

      priority: priority || "medium",

      status: "open",

      statusHistory: [
        {
          status: "open",
          changedBy: req.user.id,
          changedByRole: "customer",
          note: "Ticket created by customer.",
          createdAt: now,
        },
      ],

      conversation: [initialConversationMessage],

      replies: 1,

      lastReplyAt: now,
    });

    await notifyTicketCreated({
      req,
      ticket,
    });

    /*
     * =====================================================
     * GENERATE INITIAL AI RESPONSE
     * =====================================================
     */

    try {
      const aiResponse = await generateAIResponse({
        message: description.trim(),
        ticket,
      });

      /*
       * Support both possible AI service formats:
       *
       * "plain string"
       *
       * OR
       *
       * { text, model }
       */

      const aiText =
        typeof aiResponse === "string" ? aiResponse : aiResponse?.text;

      if (aiText?.trim()) {
        ticket.conversation.push({
          sender: null,

          senderRole: "ai",

          message: aiText.trim(),

          isRead: false,

          createdAt: new Date(),
        });

        ticket.replies = ticket.conversation.length;

        ticket.lastReplyAt = new Date();

        await ticket.save();
      }
    } catch (aiError) {
      console.error("INITIAL AI RESPONSE ERROR:", aiError);
    }

    /*
     * =====================================================
     * GET POPULATED TICKET
     * =====================================================
     */

    const populatedTicket = await Ticket.findById(ticket._id)
      .populate("customer", "name username email avatar role")
      .populate("assignedAgent", "name username email avatar role")
      .populate("conversation.sender", "name username email avatar role")
      .lean();

    /*
     * =====================================================
     * RESPONSE
     * =====================================================
     */

    return res.status(201).json({
      success: true,

      message: "Ticket created successfully.",

      ticket: populatedTicket,
    });
  } catch (error) {
    console.error("CREATE TICKET ERROR:", error);

    return res.status(500).json({
      success: false,

      message: "Failed to create ticket.",
    });
  }
};

/*
 * =========================================================
 * GET CUSTOMER TICKETS
 * =========================================================
 */

export const getCustomerTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find({
      customer: req.user.id,
    })
      .populate("assignedAgent", "name username email avatar role")
      .sort({
        updatedAt: -1,
      })
      .lean();

    return res.status(200).json({
      success: true,

      tickets: Array.isArray(tickets) ? tickets : [],
    });
  } catch (error) {
    console.error("GET CUSTOMER TICKETS ERROR:", error);

    return res.status(500).json({
      success: false,

      message: "Failed to load tickets.",

      tickets: [],
    });
  }
};

/*
 * =========================================================
 * GET SINGLE CUSTOMER TICKET
 * =========================================================
 */

export const getCustomerTicket = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,

        message: "Invalid ticket ID.",
      });
    }

    const ticket = await Ticket.findOne({
      _id: id,

      customer: req.user.id,
    })
      .populate("customer", "name username email avatar role")
      .populate("assignedAgent", "name username email avatar role")
      .populate("conversation.sender", "name username email avatar role")
      .lean();

    if (!ticket) {
      return res.status(404).json({
        success: false,

        message: "Ticket not found.",
      });
    }

    return res.status(200).json({
      success: true,

      ticket,
    });
  } catch (error) {
    console.error("GET CUSTOMER TICKET ERROR:", error);

    return res.status(500).json({
      success: false,

      message: "Failed to load ticket.",
    });
  }
};

/*
 * =========================================================
 * ADD CUSTOMER REPLY + OLLAMA AI RESPONSE
 *
 * CUSTOMER
 *    ↓
 * Save customer message
 *    ↓
 * Broadcast customer message
 *    ↓
 * Generate AI response
 *    ↓
 * Save AI response
 *    ↓
 * Broadcast AI response
 *    ↓
 * Return updated ticket
 *
 * =========================================================
 */

export const addTicketReply = async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    console.log("==========================================");
    console.log("ADD REPLY REQUEST");
    console.log({
      ticketId: id,
      userId: req.user?.id,
      message,
    });
    console.log("==========================================");

    /*
     * =====================================================
     * SOCKET.IO
     * =====================================================
     */

    const io = getSocketIO(req);

    /*
     * =====================================================
     * VALIDATE TICKET ID
     * =====================================================
     */

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ticket ID.",
      });
    }

    /*
     * =====================================================
     * VALIDATE MESSAGE
     * =====================================================
     */

    if (!message?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message is required.",
      });
    }

    /*
     * =====================================================
     * FIND CUSTOMER TICKET
     * =====================================================
     */

    const ticket = await Ticket.findOne({
      _id: id,
      customer: req.user.id,
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found.",
      });
    }

    /*
     * =====================================================
     * CLOSED TICKET
     * =====================================================
     */

    if (ticket.status === "closed") {
      return res.status(400).json({
        success: false,
        message: "This ticket is closed. Please create a new ticket.",
      });
    }

    /*
     * =====================================================
     * ENSURE CONVERSATION EXISTS
     * =====================================================
     */

    if (!Array.isArray(ticket.conversation)) {
      ticket.conversation = [];
    }

    /*
     * =====================================================
     * ENSURE STATUS HISTORY EXISTS
     * =====================================================
     */

    if (!Array.isArray(ticket.statusHistory)) {
      ticket.statusHistory = [];
    }

    const now = new Date();

    /*
     * =====================================================
     * SAVE CUSTOMER MESSAGE
     * =====================================================
     */

    ticket.conversation.push({
      sender: req.user.id,

      senderRole: "customer",

      message: message.trim(),

      isRead: true,

      createdAt: now,
    });

    /*
     * Keep an exact reference to the customer message.
     */

    const customerMessage = ticket.conversation[ticket.conversation.length - 1];

    /*
     * =====================================================
     * STATUS CHANGE TRACKING
     * =====================================================
     */

    const previousStatus = ticket.status;

    /*
     * =====================================================
     * RESOLVED → OPEN
     *
     * Customer replies to a resolved ticket.
     * This automatically reopens the ticket.
     * =====================================================
     */

    if (ticket.status === "resolved") {
      ticket.status = "open";

      ticket.reopenedAt = now;

      ticket.resolvedAt = null;

      ticket.statusHistory.push({
        status: "open",

        changedBy: req.user.id,

        changedByRole: "customer",

        note: "Ticket reopened because the customer replied.",

        createdAt: now,
      });

      console.log(`TICKET STATUS CHANGED: ${previousStatus} → open`);
    } else if (ticket.status === "waiting") {
      /*
       * =====================================================
       * WAITING → OPEN
       *
       * Customer has responded with the requested information.
       * =====================================================
       */
      ticket.status = "open";

      ticket.statusHistory.push({
        status: "open",

        changedBy: req.user.id,

        changedByRole: "customer",

        note: "Ticket moved back to open because the customer replied.",

        createdAt: now,
      });

      console.log(`TICKET STATUS CHANGED: ${previousStatus} → open`);
    }

    /*
     * =====================================================
     * UPDATE TICKET METADATA
     * =====================================================
     */

    ticket.replies = ticket.conversation.length;

    ticket.lastReplyAt = now;

    /*
     * =====================================================
     * SAVE CUSTOMER MESSAGE + STATUS HISTORY
     * =====================================================
     */

    await ticket.save();

    console.log("CUSTOMER MESSAGE SAVED:", message.trim());

    /*
     * =====================================================
     * BROADCAST CUSTOMER MESSAGE
     * =====================================================
     */

    broadcastNewMessage(req, ticket._id, customerMessage);

    /*
     * =====================================================
     * BROADCAST TICKET UPDATE
     * =====================================================
     */

    broadcastTicketUpdate(req, ticket);

    /*
     * =====================================================
     * BROADCAST STATUS HISTORY UPDATE
     *
     * This allows TicketDetails.jsx to update immediately.
     * =====================================================
     */

    if (previousStatus !== ticket.status && io) {
      io.to(getTicketRoom(ticket._id)).emit("ticket:status-changed", {
        ticketId: String(ticket._id),

        previousStatus,

        status: ticket.status,

        resolvedAt: ticket.resolvedAt || null,

        reopenedAt: ticket.reopenedAt || null,

        closedAt: ticket.closedAt || null,

        statusHistory: ticket.statusHistory || [],
      });
    }

    /*
     * =====================================================
     * BUILD OLLAMA CONVERSATION
     * =====================================================
     */

    const ollamaMessages = ticket.conversation
      .filter((item) => item.message && item.message.trim())
      .map((item) => {
        /*
         * Customer messages → user
         */

        if (item.senderRole === "customer") {
          return {
            role: "user",
            content: item.message,
          };
        }

        /*
         * AI messages → assistant
         */

        if (item.senderRole === "ai") {
          return {
            role: "assistant",
            content: item.message,
          };
        }

        /*
         * Agent/admin messages → assistant context
         */

        if (item.senderRole === "agent" || item.senderRole === "admin") {
          return {
            role: "assistant",
            content: item.message,
          };
        }

        return null;
      })
      .filter(Boolean);

    /*
     * =====================================================
     * TICKET CONTEXT
     * =====================================================
     */

    const ticketContext = `
Ticket information:
Ticket Number: ${ticket.ticketNumber || "Unknown"}
Subject: ${ticket.subject || "Unknown"}
Category: ${ticket.category || "General"}
Priority: ${ticket.priority || "medium"}
Status: ${ticket.status || "open"}
`;

    /*
     * =====================================================
     * AI MESSAGES
     * =====================================================
     */

    const aiMessages = [
      {
        role: "user",
        content: ticketContext,
      },

      ...ollamaMessages,
    ];

    /*
     * =====================================================
     * CALL OLLAMA
     * =====================================================
     */

    let aiResult = null;

    try {
      console.log("==========================================");
      console.log("CALLING OLLAMA");
      console.log("MODEL:", process.env.OLLAMA_MODEL || "llama3.2");
      console.log("URL:", process.env.OLLAMA_URL || "http://localhost:11434");
      console.log("==========================================");

      aiResult = await generateAIResponse({
        messages: aiMessages,
      });

      console.log("OLLAMA RESPONSE RECEIVED:");
      console.log(aiResult);
    } catch (aiError) {
      console.error("OLLAMA RESPONSE ERROR:", aiError);

      /*
       * Customer message has already been saved.
       *
       * We intentionally don't fail the request
       * when Ollama is unavailable.
       */

      aiResult = null;
    }

    /*
     * =====================================================
     * NORMALIZE AI RESPONSE
     * =====================================================
     */

    const aiText = typeof aiResult === "string" ? aiResult : aiResult?.text;

    /*
     * =====================================================
     * SAVE AI RESPONSE
     * =====================================================
     */

    if (aiText?.trim()) {
      ticket.conversation.push({
        sender: null,

        senderRole: "ai",

        message: aiText.trim(),

        isRead: false,

        createdAt: new Date(),
      });

      /*
       * Exact reference to AI message.
       */

      const aiMessage = ticket.conversation[ticket.conversation.length - 1];

      ticket.replies = ticket.conversation.length;

      ticket.lastReplyAt = new Date();

      await ticket.save();

      console.log("AI MESSAGE SAVED:", aiText);

      /*
       * ===================================================
       * BROADCAST AI MESSAGE
       * ===================================================
       */

      broadcastNewMessage(req, ticket._id, aiMessage);

      /*
       * ===================================================
       * BROADCAST UPDATED TICKET
       * ===================================================
       */

      broadcastTicketUpdate(req, ticket);

      /*
       * ===================================================
       * NOTIFY CUSTOMER ABOUT AI REPLY
       *
       * This is intentionally AFTER the AI response
       * has actually been generated and saved.
       * ===================================================
       */

      await notifyAIReply({
        req,
        ticket,
      });
    } else {
      console.log("NO AI RESPONSE WAS GENERATED.");
    }

    /*
     * =====================================================
     * GET UPDATED TICKET
     * =====================================================
     */

    const updatedTicket = await Ticket.findById(ticket._id)
      .populate("customer", "name username email avatar role")
      .populate("assignedAgent", "name username email avatar role")
      .populate("conversation.sender", "name username email avatar role")
      .lean();

    /*
     * =====================================================
     * RESPONSE
     * =====================================================
     */

    return res.status(200).json({
      success: true,

      message: aiText?.trim()
        ? "Reply sent and AI response generated successfully."
        : "Reply sent successfully, but AI response could not be generated.",

      ticket: updatedTicket,

      conversation: updatedTicket?.conversation || [],

      aiResponse: aiText?.trim() || null,

      aiModel: aiResult?.model || null,
    });
  } catch (error) {
    console.error("ADD TICKET REPLY ERROR:", error);

    return res.status(500).json({
      success: false,

      message: error.message || "Failed to send reply.",
    });
  }
};

/*
 * =========================================================
 * CUSTOMER MARK TICKET AS RESOLVED
 * =========================================================
 *
 * Customer
 *    ↓
 * Mark ticket as resolved
 *    ↓
 * Save resolvedAt
 *    ↓
 * Add status history
 *    ↓
 * Broadcast status change
 *
 * This allows the customer to rate the ticket afterward.
 *
 * =========================================================
 */

export const resolveCustomerTicket = async (req, res) => {
  try {
    const { id } = req.params;

    /*
     * =====================================================
     * VALIDATE TICKET ID
     * =====================================================
     */

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ticket ID.",
      });
    }

    /*
     * =====================================================
     * FIND CUSTOMER TICKET
     * =====================================================
     */

    const ticket = await Ticket.findOne({
      _id: id,
      customer: req.user.id,
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found.",
      });
    }

    /*
     * =====================================================
     * CHECK CURRENT STATUS
     * =====================================================
     */

    if (ticket.status === "closed") {
      return res.status(400).json({
        success: false,
        message: "This ticket is already closed.",
      });
    }

    if (ticket.status === "resolved") {
      return res.status(400).json({
        success: false,
        message: "This ticket is already resolved.",
      });
    }

    /*
     * =====================================================
     * SAVE PREVIOUS STATUS
     * =====================================================
     */

    const previousStatus = ticket.status;

    const now = new Date();

    /*
     * =====================================================
     * CHANGE STATUS
     * =====================================================
     */

    ticket.status = "resolved";

    ticket.resolvedAt = now;

    /*
     * =====================================================
     * STATUS HISTORY
     * =====================================================
     */

    addStatusHistory({
      ticket,

      status: "resolved",

      changedBy: req.user.id,

      changedByRole: "customer",

      note: "Ticket marked as resolved by customer.",

      createdAt: now,
    });

    /*
     * =====================================================
     * SAVE TICKET
     * =====================================================
     */

    await ticket.save();

    /*
     * =====================================================
     * SOCKET.IO
     * =====================================================
     */

    const io = getSocketIO(req);

    if (io) {
      /*
       * Status changed event
       */

      io.to(getTicketRoom(ticket._id)).emit("ticket:status-changed", {
        ticketId: String(ticket._id),

        previousStatus,

        status: "resolved",

        resolvedAt: ticket.resolvedAt,

        reopenedAt: ticket.reopenedAt || null,

        closedAt: ticket.closedAt || null,

        statusHistory: ticket.statusHistory || [],
      });

      /*
       * General ticket update
       */

      io.to(getTicketRoom(ticket._id)).emit("ticket:updated", {
        ticketId: String(ticket._id),

        status: "resolved",

        replies: ticket.replies,

        lastReplyAt: ticket.lastReplyAt,

        reopenedAt: ticket.reopenedAt || null,

        resolvedAt: ticket.resolvedAt,

        closedAt: ticket.closedAt || null,
      });
    }

    /*
     * =====================================================
     * GET UPDATED / POPULATED TICKET
     * =====================================================
     */

    const updatedTicket = await Ticket.findById(ticket._id)
      .populate("customer", "name username email avatar role")
      .populate("assignedAgent", "name username email avatar role")
      .populate("conversation.sender", "name username email avatar role")
      .lean();

    /*
     * =====================================================
     * RESPONSE
     * =====================================================
     */

    return res.status(200).json({
      success: true,

      message: "Ticket marked as resolved successfully.",

      ticket: updatedTicket,
    });
  } catch (error) {
    console.error("RESOLVE CUSTOMER TICKET ERROR:", error);

    return res.status(500).json({
      success: false,

      message: "Failed to resolve ticket.",
    });
  }
};

/*
 * =========================================================
 * UPLOAD TICKET ATTACHMENTS
 * =========================================================
 */

export const uploadTicketAttachments = async (req, res) => {
  try {
    const { id } = req.params;

    /*
     * =====================================================
     * VALIDATE TICKET ID
     * =====================================================
     */

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,

        message: "Invalid ticket ID.",
      });
    }

    /*
     * =====================================================
     * VALIDATE FILES
     * =====================================================
     */

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,

        message: "No files were uploaded.",
      });
    }

    /*
     * =====================================================
     * FIND CUSTOMER TICKET
     * =====================================================
     */

    const ticket = await Ticket.findOne({
      _id: id,

      customer: req.user.id,
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,

        message: "Ticket not found.",
      });
    }

    /*
     * =====================================================
     * CLOSED TICKET
     * =====================================================
     */

    if (ticket.status === "closed") {
      return res.status(400).json({
        success: false,

        message: "Attachments cannot be added to a closed ticket.",
      });
    }

    /*
     * =====================================================
     * BUILD ATTACHMENTS
     * =====================================================
     */

    const attachments = req.files.map((file) => ({
      filename: file.filename,

      originalName: file.originalname,

      mimetype: file.mimetype,

      size: file.size,

      path: `/uploads/tickets/${file.filename}`,

      uploadedBy: req.user.id,

      uploadedAt: new Date(),
    }));

    /*
     * =====================================================
     * SAVE ATTACHMENTS
     * =====================================================
     */

    ticket.attachments.push(...attachments);

    await ticket.save();

    /*
     * =====================================================
     * BROADCAST ATTACHMENT UPDATE
     * =====================================================
     *
     * This lets the customer's other connected
     * session know the ticket has changed.
     * =====================================================
     */

    broadcastTicketUpdate(req, ticket);

    /*
     * =====================================================
     * RESPONSE
     * =====================================================
     */

    return res.status(200).json({
      success: true,

      message: "Attachments uploaded successfully.",

      attachments: ticket.attachments,

      ticket,
    });
  } catch (error) {
    console.error("UPLOAD TICKET ATTACHMENTS ERROR:", error);

    return res.status(500).json({
      success: false,

      message: error.message || "Failed to upload attachments.",
    });
  }
};

export const getTicketStatusHistory = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ticket ID.",
      });
    }

    const ticket = await Ticket.findOne({
      _id: id,
      customer: req.user.id,
    })
      .select(
        "_id ticketNumber status statusHistory createdAt resolvedAt reopenedAt closedAt",
      )
      .populate("statusHistory.changedBy", "name username email avatar role")
      .lean();

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found.",
      });
    }

    return res.status(200).json({
      success: true,
      ticketId: ticket._id,
      ticketNumber: ticket.ticketNumber,
      currentStatus: ticket.status,
      createdAt: ticket.createdAt,
      resolvedAt: ticket.resolvedAt || null,
      reopenedAt: ticket.reopenedAt || null,
      closedAt: ticket.closedAt || null,
      statusHistory: ticket.statusHistory || [],
    });
  } catch (error) {
    console.error("GET TICKET STATUS HISTORY ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load ticket status history.",
    });
  }
};

/*
 * =========================================================
 * SUBMIT TICKET RATING & FEEDBACK
 * =========================================================
 *
 * CUSTOMER
 *    ↓
 * Validate ticket ID
 *    ↓
 * Find customer's ticket
 *    ↓
 * Check ticket is resolved/closed
 *    ↓
 * Validate rating
 *    ↓
 * Prevent duplicate rating
 *    ↓
 * Save rating + feedback
 *    ↓
 * Broadcast rating event
 *    ↓
 * Return result
 *
 * =========================================================
 */

export const submitTicketRating = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, feedback } = req.body;

    /*
     * =====================================================
     * VALIDATE TICKET ID
     * =====================================================
     */

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ticket ID.",
      });
    }

    /*
     * =====================================================
     * VALIDATE RATING
     * =====================================================
     */

    const numericRating = Number(rating);

    if (
      !Number.isInteger(numericRating) ||
      numericRating < 1 ||
      numericRating > 5
    ) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5.",
      });
    }

    /*
     * =====================================================
     * VALIDATE FEEDBACK
     * =====================================================
     */

    const cleanFeedback = typeof feedback === "string" ? feedback.trim() : "";

    if (cleanFeedback.length > 2000) {
      return res.status(400).json({
        success: false,
        message: "Feedback cannot exceed 2000 characters.",
      });
    }

    /*
     * =====================================================
     * FIND CUSTOMER TICKET
     * =====================================================
     *
     * The customer can only rate their own ticket.
     *
     * =====================================================
     */

    const ticket = await Ticket.findOne({
      _id: id,
      customer: req.user.id,
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found.",
      });
    }

    /*
     * =====================================================
     * CHECK TICKET STATUS
     * =====================================================
     *
     * Customers can rate only completed tickets.
     *
     * =====================================================
     */

    if (!["resolved", "closed"].includes(ticket.status)) {
      return res.status(400).json({
        success: false,
        message: "You can only rate a resolved or closed ticket.",
      });
    }

    /*
     * =====================================================
     * PREVENT DUPLICATE RATING
     * =====================================================
     */

    if (ticket.customerRating !== null || ticket.ratedAt) {
      return res.status(400).json({
        success: false,
        message: "This ticket has already been rated.",
        rating: ticket.customerRating,
        feedback: ticket.customerFeedback || "",
        ratedAt: ticket.ratedAt || null,
      });
    }

    /*
     * =====================================================
     * SAVE RATING
     * =====================================================
     */

    const ratedAt = new Date();

    ticket.customerRating = numericRating;
    ticket.customerFeedback = cleanFeedback;
    ticket.ratedAt = ratedAt;

    await ticket.save();

    /*
     * =====================================================
     * SOCKET.IO
     * =====================================================
     *
     * Notify clients currently viewing the ticket.
     * =====================================================
     */

    const io = getSocketIO(req);

    if (io) {
      io.to(getTicketRoom(ticket._id)).emit("ticket:rating-submitted", {
        ticketId: String(ticket._id),
        ticketNumber: ticket.ticketNumber,
        rating: ticket.customerRating,
        feedback: ticket.customerFeedback || "",
        ratedAt: ticket.ratedAt,
      });
    }

    /*
     * =====================================================
     * RESPONSE
     * =====================================================
     */

    return res.status(201).json({
      success: true,
      message: "Thank you for your feedback.",
      rating: ticket.customerRating,
      feedback: ticket.customerFeedback || "",
      ratedAt: ticket.ratedAt,
    });
  } catch (error) {
    console.error("SUBMIT TICKET RATING ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to submit ticket rating.",
    });
  }
};

/*
 * =========================================================
 * GET TICKET RATING
 * =========================================================
 *
 * Returns the rating belonging to the authenticated
 * customer for the requested ticket.
 *
 * =========================================================
 */

export const getTicketRating = async (req, res) => {
  try {
    const { id } = req.params;

    /*
     * =====================================================
     * VALIDATE TICKET ID
     * =====================================================
     */

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ticket ID.",
      });
    }

    /*
     * =====================================================
     * FIND CUSTOMER TICKET
     * =====================================================
     */

    const ticket = await Ticket.findOne({
      _id: id,
      customer: req.user.id,
    })
      .select("_id ticketNumber status customerRating customerFeedback ratedAt")
      .lean();

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found.",
      });
    }

    /*
     * =====================================================
     * DETERMINE RATING STATE
     * =====================================================
     */

    const hasRating =
      ticket.customerRating !== null && ticket.customerRating !== undefined;

    /*
     * =====================================================
     * RESPONSE
     * =====================================================
     */

    return res.status(200).json({
      success: true,

      ticketId: ticket._id,

      ticketNumber: ticket.ticketNumber,

      status: ticket.status,

      hasRating,

      rating: hasRating ? ticket.customerRating : null,

      feedback: ticket.customerFeedback || "",

      ratedAt: ticket.ratedAt || null,
    });
  } catch (error) {
    console.error("GET TICKET RATING ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load ticket rating.",
    });
  }
};
