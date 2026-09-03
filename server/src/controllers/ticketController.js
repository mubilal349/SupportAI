import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import { fileURLToPath } from "url";
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

/*
 * =========================================================
 * DELETE TICKET ATTACHMENT
 * =========================================================
 */

export const deleteTicketAttachment = async (req, res) => {
  try {
    const { id, attachmentId } = req.params;

    console.log("==========================================");
    console.log("DELETE ATTACHMENT REQUEST");
    console.log("Ticket ID:", id);
    console.log("Attachment ID:", attachmentId);
    console.log("User ID:", req.user?.id);
    console.log("==========================================");

    /*
     * =====================================================
     * VALIDATE IDS
     * =====================================================
     */

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ticket ID.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(attachmentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid attachment ID.",
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
     * FIND ATTACHMENT
     * =====================================================
     */

    const attachment = ticket.attachments.find(
      (file) => String(file._id) === String(attachmentId),
    );

    if (!attachment) {
      return res.status(404).json({
        success: false,
        message: "Attachment not found.",
      });
    }

    console.log("Attachment found:");
    console.log({
      id: attachment._id,
      filename: attachment.filename,
      originalName: attachment.originalName,
      path: attachment.path,
    });

    /*
     * =====================================================
     * DELETE PHYSICAL FILE
     * =====================================================
     */

    if (attachment.filename) {
      const filePath = path.join(
        process.cwd(),
        "uploads",
        "tickets",
        attachment.filename,
      );

      console.log("Physical file path:");
      console.log(filePath);

      try {
        await fs.promises.access(filePath);

        await fs.promises.unlink(filePath);

        console.log("Physical attachment deleted successfully:", filePath);
      } catch (fileError) {
        /*
         * If the file does not exist, we still remove
         * the database record.
         */

        if (fileError.code === "ENOENT") {
          console.warn("Physical file was already missing:", filePath);
        } else {
          console.error("Failed to delete physical attachment:", fileError);

          /*
           * Do NOT return 500 here.
           *
           * We can still remove the MongoDB attachment
           * record.
           */
        }
      }
    }

    /*
     * =====================================================
     * REMOVE ATTACHMENT FROM MONGODB
     * =====================================================
     */

    ticket.attachments.pull(attachmentId);

    await ticket.save();

    console.log("Attachment removed from MongoDB:", attachmentId);

    /*
     * =====================================================
     * SOCKET UPDATE
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
      message: "Attachment deleted successfully.",
      attachmentId,
      attachments: ticket.attachments,
      ticket,
    });
  } catch (error) {
    console.error("==========================================");
    console.error("DELETE TICKET ATTACHMENT ERROR");
    console.error(error);
    console.error("MESSAGE:", error?.message);
    console.error("STACK:", error?.stack);
    console.error("==========================================");

    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to delete attachment.",
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

// =========================================================
// CUSTOMER DASHBOARD ANALYTICS
// GET /api/tickets/analytics?period=7d
// =========================================================

export const getCustomerAnalytics = async (req, res) => {
  try {
    const customerId = req.user?.id;

    if (!customerId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID.",
      });
    }

    // -----------------------------------------------------
    // PERIOD
    // -----------------------------------------------------

    const requestedPeriod = req.query.period || "7d";

    if (!["7d", "30d", "90d"].includes(requestedPeriod)) {
      return res.status(400).json({
        success: false,
        message: "Invalid analytics period. Use 7d, 30d, or 90d.",
      });
    }

    const { period, days, now, currentStart, previousStart } =
      getAnalyticsPeriod(requestedPeriod);

    // -----------------------------------------------------
    // CURRENT PERIOD TICKETS
    // -----------------------------------------------------

    const currentTickets = await Ticket.find({
      customer: customerId,
      createdAt: {
        $gte: currentStart,
        $lte: now,
      },
    })
      .select(
        [
          "ticketNumber",
          "subject",
          "category",
          "priority",
          "status",
          "conversation",
          "statusHistory",
          "replies",
          "createdAt",
          "updatedAt",
          "resolvedAt",
          "closedAt",
          "reopenedAt",
          "customerRating",
          "customerFeedback",
          "ratedAt",
          "isEscalated",
          "escalatedAt",
          "attachments",
        ].join(" "),
      )
      .lean();

    // -----------------------------------------------------
    // PREVIOUS PERIOD TICKETS
    // -----------------------------------------------------

    const previousTickets = await Ticket.find({
      customer: customerId,
      createdAt: {
        $gte: previousStart,
        $lt: currentStart,
      },
    })
      .select(
        [
          "ticketNumber",
          "subject",
          "category",
          "priority",
          "status",
          "conversation",
          "statusHistory",
          "replies",
          "createdAt",
          "updatedAt",
          "resolvedAt",
          "closedAt",
          "customerRating",
          "ratedAt",
          "isEscalated",
          "attachments",
        ].join(" "),
      )
      .lean();

    // -----------------------------------------------------
    // ALL CUSTOMER TICKETS
    //
    // Used for current status overview.
    // -----------------------------------------------------

    const allCustomerTickets = await Ticket.find({
      customer: customerId,
    })
      .select(
        [
          "status",
          "priority",
          "category",
          "conversation",
          "statusHistory",
          "replies",
          "createdAt",
          "updatedAt",
          "resolvedAt",
          "closedAt",
          "customerRating",
          "customerFeedback",
          "ratedAt",
          "isEscalated",
          "escalatedAt",
          "attachments",
        ].join(" "),
      )
      .lean();

    // =====================================================
    // BASIC COUNTS
    // =====================================================

    const totalTickets = currentTickets.length;

    // The existing UI calls these "conversations".
    // In this schema each ticket owns one conversation.
    const totalConversations = totalTickets;

    const previousConversations = previousTickets.length;

    // =====================================================
    // STATUS COUNTS - CURRENT PERIOD
    // =====================================================

    const statusCounts = {
      open: 0,
      "in-progress": 0,
      waiting: 0,
      resolved: 0,
      closed: 0,
    };

    currentTickets.forEach((ticket) => {
      if (Object.prototype.hasOwnProperty.call(statusCounts, ticket.status)) {
        statusCounts[ticket.status]++;
      }
    });

    // =====================================================
    // ALL-TIME CURRENT STATUS
    //
    // Useful for the Ticket Overview section.
    // =====================================================

    const allStatusCounts = {
      open: 0,
      "in-progress": 0,
      waiting: 0,
      resolved: 0,
      closed: 0,
    };

    allCustomerTickets.forEach((ticket) => {
      if (
        Object.prototype.hasOwnProperty.call(allStatusCounts, ticket.status)
      ) {
        allStatusCounts[ticket.status]++;
      }
    });

    // =====================================================
    // RESOLUTION
    // =====================================================

    const resolvedCurrentCount = statusCounts.resolved + statusCounts.closed;

    const resolutionRate = calculatePercentage(
      resolvedCurrentCount,
      totalTickets,
    );

    // =====================================================
    // AI VS HUMAN RESOLUTION
    // =====================================================

    let aiResolved = 0;
    let humanResolved = 0;

    currentTickets.forEach((ticket) => {
      const resolvedHistory = (ticket.statusHistory || []).filter(
        (history) =>
          history.status === "resolved" || history.status === "closed",
      );

      if (resolvedHistory.length === 0) {
        return;
      }

      const lastResolution = resolvedHistory[resolvedHistory.length - 1];

      if (lastResolution.changedByRole === "ai") {
        aiResolved++;
      } else if (
        lastResolution.changedByRole === "agent" ||
        lastResolution.changedByRole === "admin"
      ) {
        humanResolved++;
      }
    });

    // Some older tickets might not have a resolution history.
    // Don't artificially classify them as AI or human.

    const totalResolvedByMethod = aiResolved + humanResolved;

    const aiResolutionRate = calculatePercentage(
      aiResolved,
      totalResolvedByMethod,
    );

    // =====================================================
    // MESSAGE ANALYTICS
    // =====================================================

    let totalMessages = 0;
    let customerMessages = 0;
    let aiMessages = 0;
    let agentMessages = 0;
    let systemMessages = 0;

    currentTickets.forEach((ticket) => {
      const messages = ticket.conversation || [];

      totalMessages += messages.length;

      messages.forEach((message) => {
        switch (message.senderRole) {
          case "customer":
            customerMessages++;
            break;

          case "ai":
            aiMessages++;
            break;

          case "agent":
          case "admin":
            agentMessages++;
            break;

          case "system":
            systemMessages++;
            break;

          default:
            break;
        }
      });
    });

    // =====================================================
    // TICKET PRIORITY
    // =====================================================

    const priorityCounts = {
      low: 0,
      medium: 0,
      high: 0,
    };

    currentTickets.forEach((ticket) => {
      if (
        Object.prototype.hasOwnProperty.call(priorityCounts, ticket.priority)
      ) {
        priorityCounts[ticket.priority]++;
      }
    });

    // =====================================================
    // TICKET CATEGORY
    // =====================================================

    const categoryCounts = {
      Billing: 0,
      Technical: 0,
      Account: 0,
      Subscription: 0,
      General: 0,
    };

    currentTickets.forEach((ticket) => {
      if (
        Object.prototype.hasOwnProperty.call(categoryCounts, ticket.category)
      ) {
        categoryCounts[ticket.category]++;
      }
    });

    // =====================================================
    // SATISFACTION
    // =====================================================

    const currentRatings = currentTickets
      .filter(
        (ticket) =>
          typeof ticket.customerRating === "number" &&
          ticket.customerRating >= 1 &&
          ticket.customerRating <= 5,
      )
      .map((ticket) => ticket.customerRating);

    const previousRatings = previousTickets
      .filter(
        (ticket) =>
          typeof ticket.customerRating === "number" &&
          ticket.customerRating >= 1 &&
          ticket.customerRating <= 5,
      )
      .map((ticket) => ticket.customerRating);

    const averageRating =
      currentRatings.length > 0
        ? Number(
            (
              currentRatings.reduce((sum, rating) => sum + rating, 0) /
              currentRatings.length
            ).toFixed(2),
          )
        : 0;

    const previousAverageRating =
      previousRatings.length > 0
        ? Number(
            (
              previousRatings.reduce((sum, rating) => sum + rating, 0) /
              previousRatings.length
            ).toFixed(2),
          )
        : 0;

    // Convert 1-5 rating into percentage.
    const satisfactionPercentage =
      averageRating > 0 ? Math.round((averageRating / 5) * 100) : 0;

    const previousSatisfactionPercentage =
      previousAverageRating > 0
        ? Math.round((previousAverageRating / 5) * 100)
        : 0;

    const satisfactionChange =
      satisfactionPercentage - previousSatisfactionPercentage;

    // =====================================================
    // RATING DISTRIBUTION
    // =====================================================

    const ratingDistribution = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };

    currentRatings.forEach((rating) => {
      ratingDistribution[rating]++;
    });

    // =====================================================
    // RESPONSE TIME
    //
    // First AI/agent/admin response after ticket creation.
    // =====================================================

    const responseTimes = [];

    currentTickets.forEach((ticket) => {
      const createdAt = new Date(ticket.createdAt);

      const firstResponse = (ticket.conversation || [])
        .filter(
          (message) =>
            message.senderRole === "ai" ||
            message.senderRole === "agent" ||
            message.senderRole === "admin",
        )
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))[0];

      if (firstResponse?.createdAt) {
        const responseTime =
          new Date(firstResponse.createdAt).getTime() - createdAt.getTime();

        if (responseTime >= 0) {
          responseTimes.push(responseTime);
        }
      }
    });

    const averageResponseTimeMs =
      responseTimes.length > 0
        ? responseTimes.reduce((sum, value) => sum + value, 0) /
          responseTimes.length
        : 0;

    // =====================================================
    // PREVIOUS RESPONSE TIME
    // =====================================================

    const previousResponseTimes = [];

    previousTickets.forEach((ticket) => {
      const createdAt = new Date(ticket.createdAt);

      const firstResponse = (ticket.conversation || [])
        .filter(
          (message) =>
            message.senderRole === "ai" ||
            message.senderRole === "agent" ||
            message.senderRole === "admin",
        )
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))[0];

      if (firstResponse?.createdAt) {
        const responseTime =
          new Date(firstResponse.createdAt).getTime() - createdAt.getTime();

        if (responseTime >= 0) {
          previousResponseTimes.push(responseTime);
        }
      }
    });

    const previousAverageResponseTimeMs =
      previousResponseTimes.length > 0
        ? previousResponseTimes.reduce((sum, value) => sum + value, 0) /
          previousResponseTimes.length
        : 0;

    const responseTimeDifference =
      averageResponseTimeMs - previousAverageResponseTimeMs;

    // =====================================================
    // RESOLUTION TIME
    //
    // resolvedAt - createdAt
    // =====================================================

    const resolutionTimes = [];

    currentTickets.forEach((ticket) => {
      if (ticket.resolvedAt && ticket.createdAt) {
        const duration =
          new Date(ticket.resolvedAt).getTime() -
          new Date(ticket.createdAt).getTime();

        if (duration >= 0) {
          resolutionTimes.push(duration);
        }
      }
    });

    const averageResolutionTimeMs =
      resolutionTimes.length > 0
        ? resolutionTimes.reduce((sum, value) => sum + value, 0) /
          resolutionTimes.length
        : 0;

    // =====================================================
    // PREVIOUS RESOLUTION TIME
    // =====================================================

    const previousResolutionTimes = [];

    previousTickets.forEach((ticket) => {
      if (ticket.resolvedAt && ticket.createdAt) {
        const duration =
          new Date(ticket.resolvedAt).getTime() -
          new Date(ticket.createdAt).getTime();

        if (duration >= 0) {
          previousResolutionTimes.push(duration);
        }
      }
    });

    const previousAverageResolutionTimeMs =
      previousResolutionTimes.length > 0
        ? previousResolutionTimes.reduce((sum, value) => sum + value, 0) /
          previousResolutionTimes.length
        : 0;

    // =====================================================
    // ESCALATIONS
    // =====================================================

    const escalatedTickets = currentTickets.filter(
      (ticket) => ticket.isEscalated === true,
    ).length;

    const escalationRate = calculatePercentage(escalatedTickets, totalTickets);

    // =====================================================
    // ATTACHMENTS
    // =====================================================

    let ticketAttachments = 0;
    let conversationAttachments = 0;

    currentTickets.forEach((ticket) => {
      ticketAttachments += Array.isArray(ticket.attachments)
        ? ticket.attachments.length
        : 0;

      (ticket.conversation || []).forEach((message) => {
        conversationAttachments += Array.isArray(message.attachments)
          ? message.attachments.length
          : 0;
      });
    });

    const totalAttachments = ticketAttachments + conversationAttachments;

    // =====================================================
    // ACTIVITY DATA
    // =====================================================

    const activityMap = new Map();

    const addActivity = (date, field) => {
      if (!date) {
        return;
      }

      const activityDate = new Date(date);

      if (Number.isNaN(activityDate.getTime())) {
        return;
      }

      if (activityDate < currentStart || activityDate > now) {
        return;
      }

      const key = activityDate.toISOString().slice(0, 10);

      if (!activityMap.has(key)) {
        activityMap.set(key, {
          date: key,
          conversations: 0,
          tickets: 0,
          resolved: 0,
          messages: 0,
        });
      }

      activityMap.get(key)[field]++;
    };

    currentTickets.forEach((ticket) => {
      addActivity(ticket.createdAt, "tickets");

      addActivity(ticket.createdAt, "conversations");

      if (ticket.resolvedAt) {
        addActivity(ticket.resolvedAt, "resolved");
      }

      const messages = ticket.conversation || [];

      messages.forEach((message) => {
        addActivity(message.createdAt, "messages");
      });
    });

    // =====================================================
    // BUILD CHART DATA
    // =====================================================

    const activity = [];

    if (days === 7) {
      for (let i = 0; i < 7; i++) {
        const date = new Date(currentStart);

        date.setDate(currentStart.getDate() + i);

        const key = date.toISOString().slice(0, 10);

        const item = activityMap.get(key);

        activity.push({
          label: date.toLocaleDateString("en-US", {
            weekday: "short",
          }),

          date: key,

          conversations: item?.conversations || 0,

          tickets: item?.tickets || 0,

          resolved: item?.resolved || 0,

          messages: item?.messages || 0,
        });
      }
    } else if (days === 30) {
      for (let i = 0; i < 30; i++) {
        const date = new Date(currentStart);

        date.setDate(currentStart.getDate() + i);

        const key = date.toISOString().slice(0, 10);

        const item = activityMap.get(key);

        activity.push({
          label: date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),

          date: key,

          conversations: item?.conversations || 0,

          tickets: item?.tickets || 0,

          resolved: item?.resolved || 0,

          messages: item?.messages || 0,
        });
      }
    } else {
      // 90 days: group by month.
      const monthlyMap = new Map();

      for (let i = 0; i < 90; i++) {
        const date = new Date(currentStart);

        date.setDate(currentStart.getDate() + i);

        const monthKey = `${date.getFullYear()}-${String(
          date.getMonth() + 1,
        ).padStart(2, "0")}`;

        if (!monthlyMap.has(monthKey)) {
          monthlyMap.set(monthKey, {
            date: monthKey,
            conversations: 0,
            tickets: 0,
            resolved: 0,
            messages: 0,
          });
        }

        const item = activityMap.get(date.toISOString().slice(0, 10));

        if (item) {
          const month = monthlyMap.get(monthKey);

          month.conversations += item.conversations;

          month.tickets += item.tickets;

          month.resolved += item.resolved;

          month.messages += item.messages;
        }
      }

      monthlyMap.forEach((item) => {
        const [year, month] = item.date.split("-");

        const displayDate = new Date(Number(year), Number(month) - 1, 1);

        activity.push({
          ...item,

          label: displayDate.toLocaleDateString("en-US", {
            month: "short",
          }),
        });
      });
    }

    // =====================================================
    // RECENT SUPPORT ACTIVITY
    // =====================================================

    const recentActivity = [];

    currentTickets.forEach((ticket) => {
      // Ticket created
      recentActivity.push({
        id: `${ticket._id}-created`,
        type: "ticket_created",
        title: `Ticket #${ticket.ticketNumber || ticket._id} was created`,
        description: ticket.subject,
        timestamp: ticket.createdAt,
      });

      // Ticket resolved
      if (ticket.resolvedAt) {
        recentActivity.push({
          id: `${ticket._id}-resolved`,
          type: "resolved",
          title: `Ticket #${ticket.ticketNumber || ticket._id} was resolved`,
          description: ticket.subject,
          timestamp: ticket.resolvedAt,
        });
      }

      // Ticket closed
      if (ticket.closedAt) {
        recentActivity.push({
          id: `${ticket._id}-closed`,
          type: "closed",
          title: `Ticket #${ticket.ticketNumber || ticket._id} was closed`,
          description: ticket.subject,
          timestamp: ticket.closedAt,
        });
      }

      // Escalated
      if (ticket.escalatedAt) {
        recentActivity.push({
          id: `${ticket._id}-escalated`,
          type: "escalated",
          title: `Ticket #${ticket.ticketNumber || ticket._id} was escalated`,
          description: ticket.escalationReason || ticket.subject,
          timestamp: ticket.escalatedAt,
        });
      }

      // Conversation activity
      (ticket.conversation || []).forEach((message) => {
        let type = "message";
        let title = "New support message";

        if (message.senderRole === "ai") {
          type = "ai";
          title = "AI Support replied";
        } else if (
          message.senderRole === "agent" ||
          message.senderRole === "admin"
        ) {
          type = "agent";
          title = "Support agent replied";
        } else if (message.senderRole === "customer") {
          type = "customer";
          title = "You replied to a ticket";
        }

        recentActivity.push({
          id: `${ticket._id}-message-${message._id}`,
          type,
          title,
          description: message.message?.slice(0, 120) || "",
          timestamp: message.createdAt,
        });
      });
    });

    recentActivity.sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp),
    );

    const limitedRecentActivity = recentActivity.slice(0, 10);

    // =====================================================
    // OPEN TICKETS
    // =====================================================

    const openTickets =
      allStatusCounts.open +
      allStatusCounts["in-progress"] +
      allStatusCounts.waiting;

    const resolvedTickets = allStatusCounts.resolved + allStatusCounts.closed;

    const totalHistoricalTickets = allCustomerTickets.length;

    const historicalResolutionRate = calculatePercentage(
      resolvedTickets,
      totalHistoricalTickets,
    );

    // =====================================================
    // MESSAGE PERCENTAGES
    // =====================================================

    const aiMessagePercentage = calculatePercentage(aiMessages, totalMessages);

    const agentMessagePercentage = calculatePercentage(
      agentMessages,
      totalMessages,
    );

    const customerMessagePercentage = calculatePercentage(
      customerMessages,
      totalMessages,
    );

    // =====================================================
    // RESPONSE TIME CHANGE
    // =====================================================

    let responseTimeChange = 0;

    if (averageResponseTimeMs > 0 && previousAverageResponseTimeMs > 0) {
      responseTimeChange = Math.round(
        ((averageResponseTimeMs - previousAverageResponseTimeMs) /
          previousAverageResponseTimeMs) *
          100,
      );
    }

    // =====================================================
    // RESOLUTION TIME CHANGE
    // =====================================================

    let resolutionTimeChange = 0;

    if (averageResolutionTimeMs > 0 && previousAverageResolutionTimeMs > 0) {
      resolutionTimeChange = Math.round(
        ((averageResolutionTimeMs - previousAverageResolutionTimeMs) /
          previousAverageResolutionTimeMs) *
          100,
      );
    }

    // =====================================================
    // RESPONSE
    // =====================================================

    return res.status(200).json({
      success: true,

      period: {
        value: period,
        days,
        currentStart,
        currentEnd: now,
        previousStart,
        previousEnd: currentStart,
      },

      overview: {
        totalTickets,
        totalConversations,

        previousTickets: previousTickets.length,

        previousConversations,

        ticketChange: calculateChange(totalTickets, previousTickets.length),

        conversationChange: calculateChange(
          totalConversations,
          previousConversations,
        ),

        openTickets,
        resolvedTickets,

        resolutionRate,
        historicalResolutionRate,
      },

      status: {
        current: statusCounts,
        allTime: allStatusCounts,
      },

      resolution: {
        resolved: resolvedCurrentCount,

        aiResolved,
        humanResolved,

        aiResolutionRate,

        totalResolvedByMethod,
      },

      messages: {
        total: totalMessages,

        customer: customerMessages,
        ai: aiMessages,
        agents: agentMessages,
        system: systemMessages,

        customerPercentage: customerMessagePercentage,

        aiPercentage: aiMessagePercentage,

        agentPercentage: agentMessagePercentage,
      },

      responseTime: {
        average: formatDuration(averageResponseTimeMs),

        averageMilliseconds: Math.round(averageResponseTimeMs),

        previousAverage: formatDuration(previousAverageResponseTimeMs),

        previousAverageMilliseconds: Math.round(previousAverageResponseTimeMs),

        difference: formatDuration(Math.abs(responseTimeDifference)),

        improved: responseTimeDifference < 0,

        changePercentage: responseTimeChange,
      },

      resolutionTime: {
        average: formatDuration(averageResolutionTimeMs),

        averageMilliseconds: Math.round(averageResolutionTimeMs),

        previousAverage: formatDuration(previousAverageResolutionTimeMs),

        previousAverageMilliseconds: Math.round(
          previousAverageResolutionTimeMs,
        ),

        changePercentage: resolutionTimeChange,

        improved: resolutionTimeChange < 0,
      },

      satisfaction: {
        averageRating,
        previousAverageRating,

        percentage: satisfactionPercentage,

        previousPercentage: previousSatisfactionPercentage,

        change: satisfactionChange,

        totalRatings: currentRatings.length,

        previousRatings: previousRatings.length,

        distribution: ratingDistribution,
      },

      priorities: {
        counts: priorityCounts,

        data: Object.entries(priorityCounts).map(([name, count]) => ({
          name,
          count,
          percentage: calculatePercentage(count, totalTickets),
        })),
      },

      categories: {
        counts: categoryCounts,

        data: Object.entries(categoryCounts).map(([name, count]) => ({
          name,
          count,
          percentage: calculatePercentage(count, totalTickets),
        })),
      },

      escalations: {
        total: escalatedTickets,
        percentage: escalationRate,
      },

      attachments: {
        ticketAttachments,
        conversationAttachments,
        total: totalAttachments,
      },

      activity,

      recentActivity: limitedRecentActivity,
    });
  } catch (error) {
    console.error("GET CUSTOMER ANALYTICS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to load customer analytics.",
    });
  }
};
