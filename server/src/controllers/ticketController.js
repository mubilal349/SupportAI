import Ticket from "../models/Ticket.js";

// ==========================================
// GENERATE TICKET NUMBER
// ==========================================

const generateTicketNumber = async () => {
  let ticketNumber;
  let exists = true;

  while (exists) {
    const randomNumber = Math.floor(100000 + Math.random() * 900000);

    ticketNumber = `TKT-${randomNumber}`;

    exists = await Ticket.exists({ ticketNumber });
  }

  return ticketNumber;
};

// ==========================================
// CREATE TICKET
// ==========================================

export const createTicket = async (req, res) => {
  try {
    const { subject, description, category, priority } = req.body;

    if (!subject?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Ticket subject is required",
      });
    }

    if (!description?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Ticket description is required",
      });
    }

    const ticketNumber = await generateTicketNumber();

    const ticket = await Ticket.create({
      ticketNumber,
      customer: req.user.id,
      subject: subject.trim(),
      description: description.trim(),
      category: category || "General",
      priority: priority || "medium",
      status: "open",
    });

    const populatedTicket = await Ticket.findById(ticket._id)
      .populate("customer", "name email avatar")
      .populate("assignedAgent", "name email avatar")
      .lean();

    return res.status(201).json({
      success: true,
      message: "Ticket created successfully",
      ticket: populatedTicket,
    });
  } catch (error) {
    console.error("CREATE TICKET ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create ticket",
    });
  }
};

// ==========================================
// GET CUSTOMER TICKETS
// ==========================================

export const getCustomerTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find({
      customer: req.user.id,
    })
      .populate("assignedAgent", "name email avatar")
      .sort({ updatedAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      tickets: Array.isArray(tickets) ? tickets : [],
    });
  } catch (error) {
    console.error("GET CUSTOMER TICKETS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load tickets",
      tickets: [],
    });
  }
};

// ==========================================
// GET SINGLE CUSTOMER TICKET
// ==========================================

export const getCustomerTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findOne({
      _id: req.params.id,
      customer: req.user.id,
    })
      .populate("customer", "name email avatar")
      .populate("assignedAgent", "name email avatar")
      .populate("conversation.sender", "name email avatar role")
      .lean();

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    return res.status(200).json({
      success: true,
      ticket,
    });
  } catch (error) {
    console.error("GET TICKET ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load ticket",
    });
  }
};

// ==========================================
// REPLY TO TICKET
// ==========================================

export const replyToTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    if (!message?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Reply message is required",
      });
    }

    const ticket = await Ticket.findOne({
      _id: id,
      customer: req.user.id,
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    if (ticket.status === "closed") {
      return res.status(400).json({
        success: false,
        message:
          "Closed tickets cannot receive replies. Reopen the ticket first.",
      });
    }

    const reply = {
      sender: req.user.id,
      senderRole: "customer",
      message: message.trim(),
      createdAt: new Date(),
    };

    ticket.conversation.push(reply);

    ticket.replies = ticket.conversation.length;
    ticket.lastReplyAt = new Date();

    // Customer response means the ticket is active again.
    if (ticket.status === "waiting" || ticket.status === "resolved") {
      ticket.status = "open";
      ticket.resolvedAt = null;
    }

    await ticket.save();

    const updatedTicket = await Ticket.findById(ticket._id)
      .populate("customer", "name email avatar")
      .populate("assignedAgent", "name email avatar")
      .populate("conversation.sender", "name email avatar role")
      .lean();

    return res.status(201).json({
      success: true,
      message: "Reply sent successfully",
      ticket: updatedTicket,
      reply: updatedTicket.conversation[updatedTicket.conversation.length - 1],
    });
  } catch (error) {
    console.error("REPLY TO TICKET ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to send reply",
    });
  }
};

// ==========================================
// REOPEN TICKET
// ==========================================

export const reopenTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findOne({
      _id: req.params.id,
      customer: req.user.id,
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    if (ticket.status !== "resolved" && ticket.status !== "closed") {
      return res.status(400).json({
        success: false,
        message: "Only resolved or closed tickets can be reopened",
      });
    }

    ticket.status = "open";
    ticket.reopenedAt = new Date();
    ticket.resolvedAt = null;
    ticket.closedAt = null;

    await ticket.save();

    return res.status(200).json({
      success: true,
      message: "Ticket reopened successfully",
      ticket,
    });
  } catch (error) {
    console.error("REOPEN TICKET ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to reopen ticket",
    });
  }
};

// ==========================================
// CLOSE TICKET
// ==========================================

export const closeTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findOne({
      _id: req.params.id,
      customer: req.user.id,
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    if (ticket.status === "closed") {
      return res.status(400).json({
        success: false,
        message: "Ticket is already closed",
      });
    }

    ticket.status = "closed";
    ticket.closedAt = new Date();

    if (!ticket.resolvedAt) {
      ticket.resolvedAt = new Date();
    }

    await ticket.save();

    return res.status(200).json({
      success: true,
      message: "Ticket closed successfully",
      ticket,
    });
  } catch (error) {
    console.error("CLOSE TICKET ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to close ticket",
    });
  }
};

// ==========================================
// ESCALATE TICKET
// ==========================================

export const escalateTicket = async (req, res) => {
  try {
    const { reason } = req.body;

    const ticket = await Ticket.findOne({
      _id: req.params.id,
      customer: req.user.id,
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    if (ticket.status === "closed") {
      return res.status(400).json({
        success: false,
        message: "Closed tickets cannot be escalated",
      });
    }

    if (ticket.isEscalated) {
      return res.status(400).json({
        success: false,
        message: "Ticket is already escalated",
      });
    }

    ticket.isEscalated = true;
    ticket.escalatedAt = new Date();
    ticket.escalationReason = reason?.trim() || "Customer requested escalation";

    ticket.status = "in-progress";

    await ticket.save();

    return res.status(200).json({
      success: true,
      message: "Ticket escalated successfully",
      ticket,
    });
  } catch (error) {
    console.error("ESCALATE TICKET ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to escalate ticket",
    });
  }
};

// ==========================================
// CUSTOMER RATING
// ==========================================

export const submitTicketRating = async (req, res) => {
  try {
    const { rating, feedback } = req.body;

    const numericRating = Number(rating);

    if (
      !Number.isInteger(numericRating) ||
      numericRating < 1 ||
      numericRating > 5
    ) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5",
      });
    }

    const ticket = await Ticket.findOne({
      _id: req.params.id,
      customer: req.user.id,
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    if (ticket.status !== "resolved" && ticket.status !== "closed") {
      return res.status(400).json({
        success: false,
        message: "You can rate a ticket only after it is resolved",
      });
    }

    if (ticket.customerRating) {
      return res.status(400).json({
        success: false,
        message: "You have already rated this ticket",
      });
    }

    ticket.customerRating = numericRating;
    ticket.customerFeedback = feedback?.trim() || "";
    ticket.ratedAt = new Date();

    await ticket.save();

    return res.status(200).json({
      success: true,
      message: "Thank you for your feedback",
      ticket,
    });
  } catch (error) {
    console.error("SUBMIT TICKET RATING ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to submit rating",
    });
  }
};

// ==========================================
// UPLOAD TICKET ATTACHMENTS
// ==========================================

export const uploadTicketAttachments = async (req, res) => {
  try {
    const { id } = req.params;

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

    const MAX_ATTACHMENTS = 5;

    if (ticket.attachments.length + req.files.length > MAX_ATTACHMENTS) {
      return res.status(400).json({
        success: false,
        message: `A ticket can have a maximum of ${MAX_ATTACHMENTS} attachments.`,
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
      attachments,
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
