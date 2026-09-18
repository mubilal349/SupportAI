import Ticket from "../models/Ticket.js";
import User from "../models/User.js";

import { createAuditLog } from "../services/auditLogService.js";

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

    const previousStatus = ticket.status;

    // Do not create an audit entry for an unchanged status.
    if (previousStatus === status) {
      return res.status(400).json({
        success: false,
        message: `Escalation is already ${status}.`,
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

    // ==========================================
    // AUDIT LOG
    // ==========================================

    await createAuditLog({
      req,
      action: "ESCALATION_UPDATED",
      resource: {
        type: "escalation",
        id: ticket._id,
      },
      description: `Changed escalation for ticket "${ticket.ticketNumber}" status from "${previousStatus}" to "${status}"`,
      metadata: {
        ticketId: ticket._id,
        ticketNumber: ticket.ticketNumber,
        previousStatus,
        newStatus: status,
        updateType: "status",
      },
    });

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

    // ==========================================
    // STORE PREVIOUS ASSIGNMENT
    // ==========================================

    const previousAgentId = ticket.assignedAgent || null;
    const previousAgentName = ticket.assignedAgent
      ? await User.findById(ticket.assignedAgent).select("name")
      : null;

    ticket.assignedAgent = agent._id;

    // Move an open escalation into progress when
    // an agent is assigned.
    if (!["resolved", "closed"].includes(String(ticket.status).toLowerCase())) {
      ticket.status = "in-progress";
    }

    await ticket.save();

    // ==========================================
    // AUDIT LOG
    // ==========================================

    await createAuditLog({
      req,
      action: "ESCALATION_ASSIGNED",
      resource: {
        type: "escalation",
        id: ticket._id,
      },
      description: previousAgentId
        ? `Reassigned escalation for ticket "${ticket.ticketNumber}" to "${agent.name}"`
        : `Assigned escalation for ticket "${ticket.ticketNumber}" to "${agent.name}"`,
      metadata: {
        ticketId: ticket._id,
        ticketNumber: ticket.ticketNumber,
        previousAgentId,
        previousAgentName: previousAgentName?.name || null,
        newAgentId: agent._id,
        newAgentName: agent.name,
        newAgentEmail: agent.email,
        newStatus: ticket.status,
      },
    });

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

    const previousPriority = ticket.priority;

    if (previousPriority === priority) {
      return res.status(400).json({
        success: false,
        message: `Escalation priority is already ${priority}.`,
      });
    }

    ticket.priority = priority;

    await ticket.save();

    // ==========================================
    // AUDIT LOG
    // ==========================================

    await createAuditLog({
      req,
      action: "ESCALATION_UPDATED",
      resource: {
        type: "escalation",
        id: ticket._id,
      },
      description: `Changed escalation for ticket "${ticket.ticketNumber}" priority from "${previousPriority}" to "${priority}"`,
      metadata: {
        ticketId: ticket._id,
        ticketNumber: ticket.ticketNumber,
        previousPriority,
        newPriority: priority,
        updateType: "priority",
      },
    });

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

    // ==========================================
    // AUDIT LOG
    // ==========================================

    await createAuditLog({
      req,
      action: "ESCALATION_UPDATED",
      resource: {
        type: "escalation",
        id: ticket._id,
      },
      description: `Added an internal note to escalated ticket "${ticket.ticketNumber}"`,
      metadata: {
        ticketId: ticket._id,
        ticketNumber: ticket.ticketNumber,
        updateType: "internal_note",
        noteLength: note.trim().length,
      },
    });

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

    const previousStatus = ticket.status;
    const resolvedAt = new Date();

    ticket.status = "resolved";

    // Mark the escalation as handled while keeping
    // its historical escalation information.
    if (ticket.escalation) {
      ticket.escalation.resolvedAt = resolvedAt;
      ticket.escalation.resolvedBy = req.user?.id || req.user?._id;
    }

    if (ticket.sla) {
      ticket.sla.resolvedAt = resolvedAt;
    }

    await ticket.save();

    // ==========================================
    // AUDIT LOG
    // ==========================================

    await createAuditLog({
      req,
      action: "ESCALATION_RESOLVED",
      resource: {
        type: "escalation",
        id: ticket._id,
      },
      description: `Resolved escalation for ticket "${ticket.ticketNumber}"`,
      metadata: {
        ticketId: ticket._id,
        ticketNumber: ticket.ticketNumber,
        previousStatus,
        newStatus: "resolved",
        resolvedAt,
      },
    });

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

// ==========================================================
// REASSIGN ESCALATED TICKET TO HUMAN SUPPORT
// ==========================================================

export const reassignToHumanSupport = async (req, res) => {
  try {
    const { ticketId } = req.params;

    const ticket = await Ticket.findById(ticketId);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    // Only escalated tickets can be reassigned
    if (!ticket.escalation?.isEscalated) {
      return res.status(400).json({
        success: false,
        message: "This ticket is not escalated",
      });
    }

    // Do not move resolved/closed tickets back into support
    if (["resolved", "closed"].includes(ticket.status)) {
      return res.status(400).json({
        success: false,
        message: "Resolved or closed tickets cannot be reassigned",
      });
    }

    const previousAgentId = ticket.assignedAgent || null;
    const previousStatus = ticket.status;

    /*
     * IMPORTANT:
     * Keep the ticket UNASSIGNED.
     *
     * This puts it into the existing Agent Queue where
     * an agent can explicitly click "Assign to Me".
     */
    ticket.assignedAgent = null;

    // Make the ticket actionable for human support.
    ticket.status = "open";

    // Preserve escalation information.
    ticket.escalation.isEscalated = true;

    // Add/update escalation state only if these fields exist
    if ("handledByHumanSupport" in ticket.escalation) {
      ticket.escalation.handledByHumanSupport = true;
    }

    if ("reassignedAt" in ticket.escalation) {
      ticket.escalation.reassignedAt = new Date();
    }

    if ("reassignedBy" in ticket.escalation) {
      ticket.escalation.reassignedBy = req.user.id;
    }

    await ticket.save();

    // ==========================================
    // AUDIT LOG
    // ==========================================

    await createAuditLog({
      req,
      action: "ESCALATION_ASSIGNED",
      resource: {
        type: "escalation",
        id: ticket._id,
      },
      description: `Reassigned escalated ticket "${ticket.ticketNumber}" to human support queue`,
      metadata: {
        ticketId: ticket._id,
        ticketNumber: ticket.ticketNumber,
        previousAgentId,
        previousStatus,
        newStatus: "open",
        assignedToHumanSupportQueue: true,
      },
    });

    /*
     * ------------------------------------------------------
     * NOTIFY AVAILABLE HUMAN SUPPORT
     * ------------------------------------------------------
     *
     * We intentionally do not assign a specific agent here.
     * The existing Agent Queue will receive the ticket.
     *
     * If your project already has a notification helper,
     * keep using it here rather than creating a second
     * notification system.
     */

    const io = req.app.get("io");

    if (io) {
      io.emit("ticket:human-support", {
        ticketId: ticket._id,
        ticketNumber: ticket.ticketNumber,
        status: ticket.status,
        isEscalated: true,
        message: "An escalated ticket is waiting for human support",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Ticket reassigned to human support",
      ticket,
    });
  } catch (error) {
    console.error("REASSIGN TO HUMAN SUPPORT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to reassign ticket to human support",
      error: error.message,
    });
  }
};
