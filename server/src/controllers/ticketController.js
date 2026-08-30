import Ticket from "../models/Ticket.js";

const generateTicketNumber = async () => {
  const count = await Ticket.countDocuments();

  const randomNumber = Math.floor(100000 + Math.random() * 900000);

  return `TKT-${randomNumber}`;
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

    res.status(201).json({
      success: true,
      message: "Ticket created successfully",
      ticket: populatedTicket,
    });
  } catch (error) {
    console.error("CREATE TICKET ERROR:", error);

    res.status(500).json({
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

    res.status(200).json({
      success: true,
      tickets: Array.isArray(tickets) ? tickets : [],
    });
  } catch (error) {
    console.error("GET CUSTOMER TICKETS ERROR:", error);

    res.status(500).json({
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
      .lean();

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    res.status(200).json({
      success: true,
      ticket,
    });
  } catch (error) {
    console.error("GET TICKET ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load ticket",
    });
  }
};
