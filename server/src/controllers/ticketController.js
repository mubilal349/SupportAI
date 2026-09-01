import mongoose from "mongoose";
import Ticket from "../models/Ticket.js";
import { generateAIResponse } from "../services/aiService.js";

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
 * GENERATE BASIC SUPPORT AI RESPONSE
 *
 * Temporary response system.
 *
 * Later this function can be replaced with Ollama.
 * =========================================================
 */

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
     * Create the initial customer message.
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

      conversation: [initialConversationMessage],

      replies: 1,

      lastReplyAt: now,
    });

    /*
     * Generate initial AI response.
     */
    try {
      const aiResponse = await generateAIResponse({
        message: description.trim(),
        ticket,
      });

      ticket.conversation.push({
        sender: null,
        senderRole: "ai",
        message: aiResponse,
        isRead: false,
        createdAt: new Date(),
      });

      ticket.replies = ticket.conversation.length;

      ticket.lastReplyAt = new Date();

      await ticket.save();
    } catch (aiError) {
      console.error("INITIAL AI RESPONSE ERROR:", aiError);
    }

    const populatedTicket = await Ticket.findById(ticket._id)
      .populate("customer", "name username email avatar role")
      .populate("assignedAgent", "name username email avatar role")
      .populate("conversation.sender", "name username email avatar role")
      .lean();

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
 * ADD CUSTOMER REPLY
 *
 * CUSTOMER
 *     ↓
 * Save customer message
 *     ↓
 * Generate AI response
 *     ↓
 * Save AI response
 *     ↓
 * Return complete conversation
 * =========================================================
 */

/*
 * =========================================================
 * ADD CUSTOMER REPLY + OLLAMA AI RESPONSE
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

    // ==========================================
    // VALIDATE TICKET ID
    // ==========================================

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ticket ID.",
      });
    }

    // ==========================================
    // VALIDATE MESSAGE
    // ==========================================

    if (!message?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message is required.",
      });
    }

    // ==========================================
    // FIND CUSTOMER TICKET
    // ==========================================

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

    // ==========================================
    // CLOSED TICKET
    // ==========================================

    if (ticket.status === "closed") {
      return res.status(400).json({
        success: false,
        message: "This ticket is closed. Please create a new ticket.",
      });
    }

    // ==========================================
    // ENSURE CONVERSATION EXISTS
    // ==========================================

    if (!Array.isArray(ticket.conversation)) {
      ticket.conversation = [];
    }

    const now = new Date();

    // ==========================================
    // SAVE CUSTOMER MESSAGE
    // ==========================================

    ticket.conversation.push({
      sender: req.user.id,

      senderRole: "customer",

      message: message.trim(),

      isRead: true,

      createdAt: now,
    });

    // ==========================================
    // REOPEN RESOLVED TICKET
    // ==========================================

    if (ticket.status === "resolved") {
      ticket.status = "open";

      ticket.reopenedAt = now;

      ticket.resolvedAt = null;
    }

    // ==========================================
    // CUSTOMER RESPONDED WHILE WAITING
    // ==========================================

    if (ticket.status === "waiting") {
      ticket.status = "open";
    }

    // ==========================================
    // UPDATE TICKET METADATA
    // ==========================================

    ticket.replies = ticket.conversation.length;

    ticket.lastReplyAt = now;

    // ==========================================
    // SAVE CUSTOMER MESSAGE FIRST
    // ==========================================

    await ticket.save();

    console.log("CUSTOMER MESSAGE SAVED:", message.trim());

    // ==========================================
    // BUILD OLLAMA CONVERSATION
    // ==========================================

    const ollamaMessages = ticket.conversation
      .filter((item) => item.message && item.message.trim())
      .map((item) => {
        /*
         * Customer messages become user messages.
         */
        if (item.senderRole === "customer") {
          return {
            role: "user",
            content: item.message,
          };
        }

        /*
         * AI messages become assistant messages.
         */
        if (item.senderRole === "ai") {
          return {
            role: "assistant",
            content: item.message,
          };
        }

        /*
         * Agent/admin messages are also treated
         * as assistant context for the AI.
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

    // ==========================================
    // ADD TICKET CONTEXT
    // ==========================================

    const ticketContext = `
Ticket information:
Ticket Number: ${ticket.ticketNumber || "Unknown"}
Subject: ${ticket.subject || "Unknown"}
Category: ${ticket.category || "General"}
Priority: ${ticket.priority || "medium"}
Status: ${ticket.status || "open"}
`;

    /*
     * Add ticket context before the conversation.
     *
     * This gives Ollama useful information about
     * the ticket without exposing internal data.
     */
    const aiMessages = [
      {
        role: "user",
        content: ticketContext,
      },

      ...ollamaMessages,
    ];

    // ==========================================
    // CALL OLLAMA
    // ==========================================

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
       * We DO NOT fail the customer's message.
       *
       * The customer message has already been saved.
       */
      aiResult = null;
    }

    // ==========================================
    // SAVE AI RESPONSE
    // ==========================================

    if (aiResult?.text) {
      ticket.conversation.push({
        sender: null,

        senderRole: "ai",

        message: aiResult.text,

        isRead: false,

        createdAt: new Date(),
      });

      ticket.replies = ticket.conversation.length;

      ticket.lastReplyAt = new Date();

      await ticket.save();

      console.log("AI MESSAGE SAVED:", aiResult.text);
    } else {
      console.log("NO AI RESPONSE WAS GENERATED.");
    }

    // ==========================================
    // GET UPDATED TICKET
    // ==========================================

    const updatedTicket = await Ticket.findById(ticket._id)
      .populate("customer", "name username email avatar role")
      .populate("assignedAgent", "name username email avatar role")
      .populate("conversation.sender", "name username email avatar role")
      .lean();

    // ==========================================
    // RESPONSE
    // ==========================================

    return res.status(200).json({
      success: true,

      message: aiResult?.text
        ? "Reply sent and AI response generated successfully."
        : "Reply sent successfully, but AI response could not be generated.",

      ticket: updatedTicket,

      conversation: updatedTicket?.conversation || [],

      aiResponse: aiResult?.text || null,

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
 * UPLOAD TICKET ATTACHMENTS
 * =========================================================
 */

export const uploadTicketAttachments = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ticket ID.",
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No files were uploaded.",
      });
    }

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

    if (ticket.status === "closed") {
      return res.status(400).json({
        success: false,
        message: "Attachments cannot be added to a closed ticket.",
      });
    }

    const attachments = req.files.map((file) => ({
      filename: file.filename,

      originalName: file.originalname,

      mimetype: file.mimetype,

      size: file.size,

      path: `/uploads/tickets/${file.filename}`,

      uploadedBy: req.user.id,

      uploadedAt: new Date(),
    }));

    ticket.attachments.push(...attachments);

    await ticket.save();

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
