import mongoose from "mongoose";
import Ticket from "../models/Ticket.js";
import User from "../models/User.js";

// ============================================================
// GET ALL TICKETS - ADMIN
// ============================================================

export const getAllAdminTickets = async (req, res) => {
  try {
    const {
      search = "",
      status,
      priority,
      category,
      assigned,
      page = 1,
      limit = 20,
    } = req.query;

    const filter = {};

    // ========================================================
    // STATUS FILTER
    // ========================================================

    if (status && status !== "all") {
      filter.status = status;
    }

    // ========================================================
    // PRIORITY FILTER
    // ========================================================

    if (priority && priority !== "all") {
      filter.priority = priority;
    }

    // ========================================================
    // CATEGORY FILTER
    // ========================================================

    if (category && category !== "all") {
      filter.category = category;
    }

    // ========================================================
    // ASSIGNMENT FILTER
    // ========================================================

    if (assigned === "assigned") {
      filter.assignedAgent = {
        $exists: true,
        $ne: null,
      };
    }

    if (assigned === "unassigned") {
      filter.$or = [
        { assignedAgent: null },
        { assignedAgent: { $exists: false } },
      ];
    }

    // ========================================================
    // SEARCH
    // ========================================================

    if (search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");

      filter.$and = [
        {
          $or: [{ ticketNumber: searchRegex }, { subject: searchRegex }],
        },
      ];
    }

    // ========================================================
    // PAGINATION
    // ========================================================

    const currentPage = Math.max(Number(page) || 1, 1);
    const perPage = Math.min(Math.max(Number(limit) || 20, 1), 100);

    const skip = (currentPage - 1) * perPage;

    // ========================================================
    // FETCH TICKETS
    // ========================================================

    const [tickets, total] = await Promise.all([
      Ticket.find(filter)
        .populate("customer", "name email avatar status lastSeen")
        .populate("assignedAgent", "name email avatar status availability")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(perPage)
        .lean(),

      Ticket.countDocuments(filter),
    ]);

    // ========================================================
    // RESPONSE
    // ========================================================

    return res.status(200).json({
      success: true,
      message: "Tickets fetched successfully",
      tickets,
      pagination: {
        currentPage,
        perPage,
        totalTickets: total,
        totalPages: Math.ceil(total / perPage),
        hasNextPage: currentPage < Math.ceil(total / perPage),
        hasPreviousPage: currentPage > 1,
      },
    });
  } catch (error) {
    console.error("Get admin tickets error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch tickets",
      error: error.message,
    });
  }
};

// ============================================================
// GET SINGLE TICKET - ADMIN
// ============================================================

export const getAdminTicketById = async (req, res) => {
  try {
    const { ticketId } = req.params;

    // ========================================================
    // VALIDATE TICKET ID
    // ========================================================

    if (!ticketId) {
      return res.status(400).json({
        success: false,
        message: "Ticket ID is required",
      });
    }

    // ========================================================
    // FIND TICKET
    // ========================================================

    const ticket = await Ticket.findById(ticketId)
      .populate("customer", "name email phone avatar status lastSeen createdAt")
      .populate(
        "assignedAgent",
        "name email phone avatar status availability lastSeen",
      )
      .lean();

    // ========================================================
    // TICKET NOT FOUND
    // ========================================================

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    // ========================================================
    // RESPONSE
    // ========================================================

    return res.status(200).json({
      success: true,
      message: "Ticket fetched successfully",
      ticket,
    });
  } catch (error) {
    console.error("Get admin ticket by ID error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch ticket",
      error: error.message,
    });
  }
};

// ============================================================
// UPDATE TICKET STATUS - ADMIN
// ============================================================

export const updateAdminTicketStatus = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { status } = req.body;

    // ========================================================
    // VALIDATE TICKET ID
    // ========================================================

    if (!mongoose.Types.ObjectId.isValid(ticketId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ticket ID",
      });
    }

    // ========================================================
    // VALIDATE STATUS
    // ========================================================

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
        message: "Invalid ticket status",
        allowedStatuses,
      });
    }

    // ========================================================
    // FIND TICKET
    // ========================================================

    const ticket = await Ticket.findById(ticketId);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    // ========================================================
    // CHECK SAME STATUS
    // ========================================================

    if (ticket.status === status) {
      return res.status(400).json({
        success: false,
        message: `Ticket is already ${status}`,
      });
    }

    const oldStatus = ticket.status;
    const now = new Date();

    // ========================================================
    // UPDATE STATUS
    // ========================================================

    ticket.status = status;

    // ========================================================
    // STATUS HISTORY
    // ========================================================

    if (!Array.isArray(ticket.statusHistory)) {
      ticket.statusHistory = [];
    }

    ticket.statusHistory.push({
      status,
      changedBy: req.user._id || req.user.id,
      changedAt: now,
      note: `Status changed from ${oldStatus} to ${status} by admin`,
    });

    // ========================================================
    // RESOLUTION / REOPEN LOGIC
    // ========================================================

    if (status === "resolved") {
      ticket.resolvedAt = now;

      if (ticket.sla) {
        ticket.sla.resolvedAt = now;
      }
    }

    // If an admin reopens a resolved/closed ticket
    if (
      (oldStatus === "resolved" || oldStatus === "closed") &&
      status === "open"
    ) {
      ticket.reopenedAt = now;

      ticket.resolvedAt = null;

      if (ticket.sla) {
        ticket.sla.resolvedAt = null;
      }
    }

    await ticket.save();

    // ========================================================
    // RESPONSE
    // ========================================================

    return res.status(200).json({
      success: true,
      message: "Ticket status updated successfully",
      ticket,
    });
  } catch (error) {
    console.error("Admin update ticket status error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update ticket status",
      error: error.message,
    });
  }
};

// ============================================================
// UPDATE TICKET PRIORITY - ADMIN
// ============================================================

export const updateAdminTicketPriority = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { priority } = req.body;

    // ========================================================
    // VALIDATE TICKET ID
    // ========================================================

    if (!mongoose.Types.ObjectId.isValid(ticketId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ticket ID",
      });
    }

    // ========================================================
    // VALIDATE PRIORITY
    // ========================================================

    const allowedPriorities = ["low", "medium", "high", "urgent"];

    if (!priority || !allowedPriorities.includes(priority)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ticket priority",
        allowedPriorities,
      });
    }

    // ========================================================
    // FIND TICKET
    // ========================================================

    const ticket = await Ticket.findById(ticketId);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    // ========================================================
    // CHECK SAME PRIORITY
    // ========================================================

    if (ticket.priority === priority) {
      return res.status(400).json({
        success: false,
        message: `Ticket priority is already ${priority}`,
      });
    }

    const oldPriority = ticket.priority;

    // ========================================================
    // UPDATE PRIORITY
    // ========================================================

    ticket.priority = priority;

    // ========================================================
    // SAVE
    // ========================================================

    await ticket.save();

    // ========================================================
    // RESPONSE
    // ========================================================

    return res.status(200).json({
      success: true,
      message: "Ticket priority updated successfully",
      oldPriority,
      newPriority: priority,
      ticket,
    });
  } catch (error) {
    console.error("Admin update ticket priority error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update ticket priority",
      error: error.message,
    });
  }
};

// ============================================================
// ASSIGN / REASSIGN TICKET TO AGENT - ADMIN
// ============================================================

export const assignAdminTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { agentId } = req.body;

    // ==========================================
    // VALIDATE TICKET ID
    // ==========================================

    if (!mongoose.Types.ObjectId.isValid(ticketId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ticket ID",
      });
    }

    // ==========================================
    // VALIDATE AGENT ID
    // ==========================================

    if (!agentId) {
      return res.status(400).json({
        success: false,
        message: "Agent ID is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(agentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid agent ID",
      });
    }

    // ==========================================
    // AUTHENTICATED ADMIN
    // ==========================================

    const adminId = req.user?._id || req.user?.id;

    if (!adminId) {
      return res.status(401).json({
        success: false,
        message: "Authenticated admin ID not found",
      });
    }

    // ==========================================
    // FIND TICKET
    // ==========================================

    const ticket = await Ticket.findById(ticketId);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    // ==========================================
    // FIND AGENT
    // ==========================================

    const agent = await User.findOne({
      _id: agentId,
      role: "agent",
    }).select("_id name email phone avatar status availability lastSeen");

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: "Agent not found",
      });
    }

    // ==========================================
    // CHECK CURRENT ASSIGNMENT
    // ==========================================

    if (
      ticket.assignedAgent &&
      ticket.assignedAgent.toString() === agentId.toString()
    ) {
      return res.status(400).json({
        success: false,
        message: "Ticket is already assigned to this agent",
      });
    }

    // ==========================================
    // STORE PREVIOUS AGENT
    // ==========================================

    const previousAgentId = ticket.assignedAgent || null;

    // ==========================================
    // ASSIGN AGENT
    // ==========================================

    ticket.assignedAgent = agent._id;

    // ==========================================
    // STATUS HISTORY
    // ==========================================

    if (!Array.isArray(ticket.statusHistory)) {
      ticket.statusHistory = [];
    }

    const now = new Date();

    ticket.statusHistory.push({
      status: ticket.status,
      changedBy: adminId,
      changedAt: now,
      note: previousAgentId
        ? `Ticket reassigned to ${agent.name} by admin`
        : `Ticket assigned to ${agent.name} by admin`,
    });

    // ==========================================
    // SAVE TICKET
    // ==========================================

    await ticket.save();

    // ==========================================
    // NOTIFY ASSIGNED AGENT
    // ==========================================

    try {
      await notifyAgentTicketAssigned({
        req,
        ticket,
      });
    } catch (notificationError) {
      console.error("Agent assignment notification failed:", notificationError);

      // Do NOT fail the assignment itself.
    }

    // ==========================================
    // POPULATE RELATIONS
    // ==========================================

    await ticket.populate(
      "assignedAgent",
      "name email phone avatar status availability lastSeen",
    );

    await ticket.populate(
      "customer",
      "name email phone avatar status lastSeen",
    );

    // ==========================================
    // SUCCESS RESPONSE
    // ==========================================

    return res.status(200).json({
      success: true,
      message: previousAgentId
        ? "Ticket reassigned successfully"
        : "Ticket assigned successfully",

      previousAgent: previousAgentId,

      assignedAgent: agent,

      ticket,
    });
  } catch (error) {
    console.error("Admin assign/reassign ticket error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to assign ticket",
      error: error.message,
    });
  }
};

// ============================================================
// GET ALL AGENTS - ADMIN
// ============================================================

export const getAdminAgentsForAssignment = async (req, res) => {
  try {
    const agents = await User.find({
      role: "agent",
    })
      .select("_id name email avatar status availability lastSeen")
      .sort({ name: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      message: "Agents fetched successfully",
      agents,
    });
  } catch (error) {
    console.error("Get admin agents for assignment error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch agents",
      error: error.message,
    });
  }
};
