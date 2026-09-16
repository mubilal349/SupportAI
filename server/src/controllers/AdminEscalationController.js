import Ticket from "../models/Ticket.js";
import User from "../models/User.js";

// ==========================================
// GET ALL ESCALATED TICKETS
// ==========================================

export const getEscalations = async (req, res) => {
  try {
    const { search = "", status, priority, page = 1, limit = 20 } = req.query;

    const query = {
      "escalation.isEscalated": true,
    };

    // ------------------------------------------
    // STATUS FILTER
    // ------------------------------------------

    if (status && status !== "all") {
      query.status = status;
    }

    // ------------------------------------------
    // PRIORITY FILTER
    // ------------------------------------------

    if (priority && priority !== "all") {
      query.priority = priority;
    }

    // ------------------------------------------
    // SEARCH
    // ------------------------------------------

    if (search.trim()) {
      const regex = new RegExp(search.trim(), "i");

      query.$or = [
        { ticketNumber: regex },
        { subject: regex },
        { description: regex },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [tickets, total] = await Promise.all([
      Ticket.find(query)
        .populate("customer", "name fullName email avatar status")
        .populate("assignedAgent", "name fullName email avatar status")
        .populate("escalation.escalatedBy", "name fullName email role")
        .sort({
          "escalation.escalatedAt": -1,
          createdAt: -1,
        })
        .skip(skip)
        .limit(Number(limit))
        .lean(),

      Ticket.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      escalations: tickets,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error("Get escalations error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch escalated tickets.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// ==========================================
// GET SINGLE ESCALATED TICKET
// ==========================================

export const getEscalation = async (req, res) => {
  try {
    const { ticketId } = req.params;

    const ticket = await Ticket.findOne({
      _id: ticketId,
      "escalation.isEscalated": true,
    })
      .populate("customer", "name fullName email avatar status lastSeen")
      .populate("assignedAgent", "name fullName email avatar status")
      .populate("escalation.escalatedBy", "name fullName email role");

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Escalated ticket not found.",
      });
    }

    return res.status(200).json({
      success: true,
      escalation: ticket,
    });
  } catch (error) {
    console.error("Get escalation error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch escalation.",
    });
  }
};

// ==========================================
// UPDATE ESCALATION STATUS
// ==========================================

export const updateEscalationStatus = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { status } = req.body;

    const allowedStatuses = [
      "open",
      "pending",
      "in-progress",
      "waiting",
      "resolved",
      "closed",
    ];

    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ticket status.",
      });
    }

    const ticket = await Ticket.findOne({
      _id: ticketId,
      "escalation.isEscalated": true,
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Escalated ticket not found.",
      });
    }

    ticket.status = status;

    // Keep SLA resolution timestamp consistent.
    if (status === "resolved" || status === "closed") {
      if (!ticket.sla?.resolvedAt) {
        if (ticket.sla) {
          ticket.sla.resolvedAt = new Date();
        }
      }
    }

    await ticket.save();

    await ticket.populate("assignedAgent", "name fullName email avatar status");

    return res.status(200).json({
      success: true,
      message: "Escalation status updated successfully.",
      escalation: ticket,
    });
  } catch (error) {
    console.error("Update escalation status error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update escalation status.",
    });
  }
};

// ==========================================
// ASSIGN ESCALATION
// ==========================================

export const assignEscalation = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { agentId } = req.body;

    const ticket = await Ticket.findOne({
      _id: ticketId,
      "escalation.isEscalated": true,
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Escalated ticket not found.",
      });
    }

    let targetAgentId = agentId;

    // If no agentId is provided, assign to the
    // currently authenticated admin.
    if (!targetAgentId) {
      targetAgentId = req.user?.id || req.user?._id;
    }

    if (!targetAgentId) {
      return res.status(400).json({
        success: false,
        message: "Agent ID is required.",
      });
    }

    const agent = await User.findOne({
      _id: targetAgentId,
      role: {
        $in: ["agent", "admin"],
      },
    });

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: "Agent not found.",
      });
    }

    ticket.assignedAgent = agent._id;

    // Move an open escalation into progress when
    // an agent is assigned.
    if (!["resolved", "closed"].includes(String(ticket.status).toLowerCase())) {
      ticket.status = "in-progress";
    }

    await ticket.save();

    await ticket.populate("assignedAgent", "name fullName email avatar status");

    return res.status(200).json({
      success: true,
      message: "Escalation assigned successfully.",
      escalation: ticket,
    });
  } catch (error) {
    console.error("Assign escalation error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to assign escalation.",
    });
  }
};

// ==========================================
// UPDATE ESCALATION PRIORITY
// ==========================================

export const updateEscalationPriority = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { priority } = req.body;

    const allowedPriorities = ["low", "medium", "high", "urgent"];

    if (!priority || !allowedPriorities.includes(priority)) {
      return res.status(400).json({
        success: false,
        message: "Invalid priority.",
      });
    }

    const ticket = await Ticket.findOne({
      _id: ticketId,
      "escalation.isEscalated": true,
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Escalated ticket not found.",
      });
    }

    ticket.priority = priority;

    await ticket.save();

    return res.status(200).json({
      success: true,
      message: "Escalation priority updated successfully.",
      escalation: ticket,
    });
  } catch (error) {
    console.error("Update escalation priority error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update escalation priority.",
    });
  }
};

// ==========================================
// ADD INTERNAL NOTE
// ==========================================

export const addEscalationNote = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { note } = req.body;

    if (!note || !note.trim()) {
      return res.status(400).json({
        success: false,
        message: "Internal note is required.",
      });
    }

    if (note.trim().length > 5000) {
      return res.status(400).json({
        success: false,
        message: "Internal note cannot exceed 5000 characters.",
      });
    }

    const ticket = await Ticket.findOne({
      _id: ticketId,
      "escalation.isEscalated": true,
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Escalated ticket not found.",
      });
    }

    // This supports the common conversation/message
    // structure. If your Ticket model uses a different
    // field for internal notes, adjust this section.
    if (!Array.isArray(ticket.conversation)) {
      ticket.conversation = [];
    }

    ticket.conversation.push({
      sender: req.user?.id || req.user?._id,
      senderRole: "admin",
      message: note.trim(),
      type: "internal_note",
      isInternal: true,
      createdAt: new Date(),
    });

    await ticket.save();

    return res.status(200).json({
      success: true,
      message: "Internal note added successfully.",
    });
  } catch (error) {
    console.error("Add escalation note error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to add internal note.",
    });
  }
};

// ==========================================
// RESOLVE ESCALATION
// ==========================================

export const resolveEscalation = async (req, res) => {
  try {
    const { ticketId } = req.params;

    const ticket = await Ticket.findOne({
      _id: ticketId,
      "escalation.isEscalated": true,
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Escalated ticket not found.",
      });
    }

    ticket.status = "resolved";

    // Mark the escalation as handled while keeping
    // its historical escalation information.
    if (ticket.escalation) {
      ticket.escalation.resolvedAt = new Date();
      ticket.escalation.resolvedBy = req.user?.id || req.user?._id;
    }

    if (ticket.sla) {
      ticket.sla.resolvedAt = new Date();
    }

    await ticket.save();

    return res.status(200).json({
      success: true,
      message: "Escalation resolved successfully.",
      escalation: ticket,
    });
  } catch (error) {
    console.error("Resolve escalation error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to resolve escalation.",
    });
  }
};
