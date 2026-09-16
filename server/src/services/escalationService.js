import mongoose from "mongoose";
import Ticket from "../models/Ticket.js";
import User from "../models/User.js";

// ==========================================
// VALIDATION HELPERS
// ==========================================

const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

const getTicketOrThrow = async (ticketId) => {
  if (!ticketId || !isValidObjectId(ticketId)) {
    const error = new Error("Invalid ticket ID");
    error.statusCode = 400;
    throw error;
  }

  const ticket = await Ticket.findById(ticketId)
    .populate("customer", "name email avatar")
    .populate("assignedAgent", "name email avatar")
    .populate("escalation.escalatedBy", "name email")
    .populate("escalation.escalatedTo", "name email");

  if (!ticket) {
    const error = new Error("Ticket not found");
    error.statusCode = 404;
    throw error;
  }

  return ticket;
};

// ==========================================
// GET ALL ESCALATIONS
// ==========================================

export const getEscalationsService = async (filters = {}) => {
  const { status, priority, search, page = 1, limit = 20 } = filters;

  const query = {
    "escalation.isEscalated": true,
  };

  // ------------------------------------------
  // STATUS FILTER
  // ------------------------------------------

  if (
    status &&
    [
      "open",
      "pending",
      "in-progress",
      "waiting",
      "resolved",
      "closed",
    ].includes(status)
  ) {
    query.status = status;
  }

  // ------------------------------------------
  // PRIORITY FILTER
  // ------------------------------------------

  if (priority && ["low", "medium", "high", "urgent"].includes(priority)) {
    query.priority = priority;
  }

  // ------------------------------------------
  // SEARCH
  // ------------------------------------------

  if (search?.trim()) {
    const searchValue = search.trim();

    query.$or = [
      {
        ticketNumber: {
          $regex: searchValue,
          $options: "i",
        },
      },
      {
        subject: {
          $regex: searchValue,
          $options: "i",
        },
      },
      {
        description: {
          $regex: searchValue,
          $options: "i",
        },
      },
    ];
  }

  const currentPage = Math.max(Number(page) || 1, 1);
  const currentLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);

  const skip = (currentPage - 1) * currentLimit;

  const [tickets, total] = await Promise.all([
    Ticket.find(query)
      .populate("customer", "name email avatar")
      .populate("assignedAgent", "name email avatar")
      .populate("escalation.escalatedBy", "name email")
      .populate("escalation.escalatedTo", "name email")
      .sort({
        "escalation.escalatedAt": -1,
        updatedAt: -1,
      })
      .skip(skip)
      .limit(currentLimit)
      .lean(),

    Ticket.countDocuments(query),
  ]);

  return {
    tickets,
    escalations: tickets,
    total,
    page: currentPage,
    limit: currentLimit,
    totalPages: Math.ceil(total / currentLimit),
  };
};

// ==========================================
// GET SINGLE ESCALATION
// ==========================================

export const getEscalationService = async (ticketId) => {
  const ticket = await getTicketOrThrow(ticketId);

  if (!ticket.escalation?.isEscalated) {
    const error = new Error("This ticket is not escalated");

    error.statusCode = 400;

    throw error;
  }

  return ticket;
};

// ==========================================
// UPDATE ESCALATION STATUS
// ==========================================

export const updateEscalationStatusService = async (
  ticketId,
  status,
  adminId,
) => {
  const ticket = await getTicketOrThrow(ticketId);

  if (!ticket.escalation?.isEscalated) {
    const error = new Error("This ticket is not escalated");

    error.statusCode = 400;

    throw error;
  }

  const allowedStatuses = [
    "open",
    "pending",
    "in-progress",
    "waiting",
    "resolved",
    "closed",
  ];

  if (!allowedStatuses.includes(status)) {
    const error = new Error("Invalid ticket status");
    error.statusCode = 400;
    throw error;
  }

  const previousStatus = ticket.status;

  if (previousStatus === status) {
    return ticket;
  }

  ticket.status = status;

  // ------------------------------------------
  // STATUS HISTORY
  // ------------------------------------------

  // Your statusHistory schema does not allow
  // "pending", so only add statuses supported
  // by that schema.

  if (
    ["open", "in-progress", "waiting", "resolved", "closed"].includes(status)
  ) {
    ticket.statusHistory.push({
      status,
      changedBy: adminId || null,
      changedByRole: "admin",
      note: `Escalation status changed from ${previousStatus} to ${status}.`,
      createdAt: new Date(),
    });
  }

  // ------------------------------------------
  // RESOLUTION DATA
  // ------------------------------------------

  if (status === "resolved") {
    const resolvedDate = new Date();

    ticket.resolvedAt = resolvedDate;

    if (ticket.sla) {
      ticket.sla.resolvedAt = resolvedDate;
    }

    ticket.escalation.resolvedAt = resolvedDate;
  }

  // ------------------------------------------
  // CLOSED DATA
  // ------------------------------------------

  if (status === "closed") {
    ticket.closedAt = new Date();
  }

  // ------------------------------------------
  // REOPEN DATA
  // ------------------------------------------

  if (
    ["open", "in-progress", "waiting"].includes(status) &&
    ["resolved", "closed"].includes(previousStatus)
  ) {
    ticket.reopenedAt = new Date();

    ticket.escalation.resolvedAt = null;
  }

  await ticket.save();

  return ticket;
};

// ==========================================
// ASSIGN ESCALATION
// ==========================================

export const assignEscalationService = async (ticketId, agentId, adminId) => {
  const ticket = await getTicketOrThrow(ticketId);

  if (!ticket.escalation?.isEscalated) {
    const error = new Error("This ticket is not escalated");

    error.statusCode = 400;

    throw error;
  }

  // ------------------------------------------
  // UNASSIGN
  // ------------------------------------------

  if (!agentId) {
    ticket.assignedAgent = null;

    if (["resolved", "closed"].includes(ticket.status) === false) {
      ticket.status = "open";

      ticket.statusHistory.push({
        status: "open",
        changedBy: adminId || null,
        changedByRole: "admin",
        note: "Ticket returned to the human support queue.",
        createdAt: new Date(),
      });
    }

    await ticket.save();

    return ticket;
  }

  // ------------------------------------------
  // VALIDATE AGENT
  // ------------------------------------------

  if (!isValidObjectId(agentId)) {
    const error = new Error("Invalid agent ID");
    error.statusCode = 400;
    throw error;
  }

  const agent = await User.findOne({
    _id: agentId,
    role: "agent",
  });

  if (!agent) {
    const error = new Error("Agent not found or user is not an agent");

    error.statusCode = 404;

    throw error;
  }

  // ------------------------------------------
  // ASSIGN
  // ------------------------------------------

  ticket.assignedAgent = agent._id;

  if (!["resolved", "closed"].includes(ticket.status)) {
    ticket.status = "in-progress";

    ticket.statusHistory.push({
      status: "in-progress",
      changedBy: adminId || null,
      changedByRole: "admin",
      note: `Escalated ticket assigned to ${agent.name || "agent"}.`,
      createdAt: new Date(),
    });
  }

  // Keep escalation target synchronized.
  ticket.escalation.escalatedTo = agent._id;

  await ticket.save();

  return ticket;
};

// ==========================================
// UPDATE PRIORITY
// ==========================================

export const updateEscalationPriorityService = async (ticketId, priority) => {
  const ticket = await getTicketOrThrow(ticketId);

  if (!ticket.escalation?.isEscalated) {
    const error = new Error("This ticket is not escalated");

    error.statusCode = 400;

    throw error;
  }

  const allowedPriorities = ["low", "medium", "high", "urgent"];

  if (!allowedPriorities.includes(priority)) {
    const error = new Error("Invalid ticket priority");

    error.statusCode = 400;

    throw error;
  }

  ticket.priority = priority;

  await ticket.save();

  return ticket;
};

// ==========================================
// ADD INTERNAL ESCALATION NOTE
// ==========================================

export const addEscalationNoteService = async (ticketId, note, adminId) => {
  const ticket = await getTicketOrThrow(ticketId);

  if (!ticket.escalation?.isEscalated) {
    const error = new Error("This ticket is not escalated");

    error.statusCode = 400;

    throw error;
  }

  if (!note?.trim()) {
    const error = new Error("Internal note is required");

    error.statusCode = 400;

    throw error;
  }

  const cleanNote = note.trim();

  if (cleanNote.length > 5000) {
    const error = new Error("Internal note cannot exceed 5000 characters");

    error.statusCode = 400;

    throw error;
  }

  ticket.conversation.push({
    sender: adminId || null,
    senderRole: "admin",
    message: cleanNote,
    isRead: false,
    isInternal: true,
    createdAt: new Date(),
  });

  ticket.replies += 1;
  ticket.lastReplyAt = new Date();

  await ticket.save();

  return ticket;
};

// ==========================================
// RESOLVE ESCALATION
// ==========================================

export const resolveEscalationService = async (ticketId, adminId) => {
  const ticket = await getTicketOrThrow(ticketId);

  if (!ticket.escalation?.isEscalated) {
    const error = new Error("This ticket is not escalated");

    error.statusCode = 400;

    throw error;
  }

  if (["resolved", "closed"].includes(ticket.status)) {
    return ticket;
  }

  const resolvedDate = new Date();

  ticket.status = "resolved";

  ticket.resolvedAt = resolvedDate;

  ticket.escalation.resolvedAt = resolvedDate;

  if (ticket.sla) {
    ticket.sla.resolvedAt = resolvedDate;
  }

  ticket.statusHistory.push({
    status: "resolved",
    changedBy: adminId || null,
    changedByRole: "admin",
    note: "Escalated ticket resolved by admin.",
    createdAt: resolvedDate,
  });

  await ticket.save();

  return ticket;
};

// ==========================================
// REASSIGN TO HUMAN SUPPORT
// ==========================================

export const reassignToHumanSupportService = async (
  ticketId,
  adminId,
  io = null,
) => {
  const ticket = await getTicketOrThrow(ticketId);

  // ------------------------------------------
  // VERIFY ESCALATION
  // ------------------------------------------

  if (!ticket.escalation?.isEscalated) {
    const error = new Error("This ticket is not escalated");

    error.statusCode = 400;

    throw error;
  }

  // ------------------------------------------
  // RESOLVED / CLOSED CHECK
  // ------------------------------------------

  if (["resolved", "closed"].includes(ticket.status)) {
    const error = new Error(
      "Resolved or closed tickets cannot be reassigned to human support",
    );

    error.statusCode = 400;

    throw error;
  }

  const previousStatus = ticket.status;

  // ------------------------------------------
  // RETURN TO HUMAN SUPPORT QUEUE
  // ------------------------------------------

  ticket.assignedAgent = null;

  ticket.status = "open";

  // ------------------------------------------
  // CLEAR CURRENT ESCALATION TARGET
  // ------------------------------------------

  // escalatedTo represents the current target agent.
  // Once returned to the general human queue,
  // there is no specific target agent.

  ticket.escalation.escalatedTo = null;

  // ------------------------------------------
  // STATUS HISTORY
  // ------------------------------------------

  ticket.statusHistory.push({
    status: "open",
    changedBy: adminId || null,
    changedByRole: "admin",
    note:
      previousStatus === "open"
        ? "Escalated ticket returned to the human support queue."
        : `Escalated ticket moved from ${previousStatus} to the human support queue.`,
    createdAt: new Date(),
  });

  // ------------------------------------------
  // IMPORTANT:
  // ------------------------------------------
  // We intentionally DO NOT modify:
  //
  // ticket.escalation.isEscalated
  // ticket.escalation.reason
  // ticket.escalation.note
  // ticket.escalation.escalatedBy
  // ticket.escalation.escalatedAt
  // ticket.sla
  //
  // This preserves the original escalation
  // information and SLA tracking.
  // ------------------------------------------

  await ticket.save();

  // ------------------------------------------
  // REAL-TIME SOCKET EVENT
  // ------------------------------------------

  if (io) {
    io.emit("ticket:human-support", {
      ticketId: ticket._id,
      ticketNumber: ticket.ticketNumber,
      status: ticket.status,
      assignedAgent: null,
      isEscalated: ticket.escalation.isEscalated,
      message: "An escalated ticket is waiting for human support.",
    });
  }

  // ------------------------------------------
  // RETURN POPULATED TICKET
  // ------------------------------------------

  const updatedTicket = await Ticket.findById(ticket._id)
    .populate("customer", "name email avatar")
    .populate("assignedAgent", "name email avatar")
    .populate("escalation.escalatedBy", "name email")
    .populate("escalation.escalatedTo", "name email");

  return updatedTicket;
};

// ==========================================
// DEFAULT EXPORT
// ==========================================

export default {
  getEscalationsService,
  getEscalationService,
  updateEscalationStatusService,
  assignEscalationService,
  updateEscalationPriorityService,
  addEscalationNoteService,
  resolveEscalationService,
  reassignToHumanSupportService,
};
