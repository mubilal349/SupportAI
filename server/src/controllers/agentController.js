import mongoose from "mongoose";
import Ticket from "../models/Ticket.js";
import User from "../models/User.js";

import { createSlaDates } from "../utils/sla.js";

import {
  getSocketIO,
  getTicketRoom,
  getAgentTicketRoom,
} from "../socket/socket.js";

import {
  notifyAgentAssigned,
  notifyAgentTicketAssigned,
  notifyTicketEscalated,
  notifyAgentsNewTicket,
  notifyEscalationTarget,
} from "../services/notificationService.js";

/*
 * =========================================================
 * HELPERS
 * =========================================================
 */

const normalizeId = (value) => {
  if (!value) return null;

  if (typeof value === "string") {
    return value;
  }

  return value.toString();
};

const isTicketAssignedToUser = (ticket, userId) => {
  if (!ticket?.assignedAgent || !userId) {
    return false;
  }

  return normalizeId(ticket.assignedAgent) === normalizeId(userId);
};

const getUserId = (req) => {
  return req.user?._id || req.user?.id;
};

const getUserRole = (req) => {
  return req.user?.role || "agent";
};

/*
 * =========================================================
 * SLA HELPERS
 * =========================================================
 *
 * SLA rules:
 *
 * 1. Ticket creation starts the SLA clock.
 * 2. AI reply does NOT count as first human response.
 * 3. Customer reply does NOT count.
 * 4. Internal note does NOT count.
 * 5. First public agent/admin reply counts.
 * 6. First human response is recorded only once.
 * 7. Resolving a ticket records SLA resolution time.
 * 8. Reopening clears only SLA resolvedAt.
 * 9. Reopening preserves firstRespondedAt.
 * 10. Legacy tickets without SLA are initialized safely.
 *
 * =========================================================
 */

/*
 * Ensure legacy tickets have SLA information.
 */
const ensureTicketSla = (ticket) => {
  if (!ticket) {
    return null;
  }

  if (!ticket.sla) {
    const createdAt = ticket.createdAt || new Date();

    const slaDates = createSlaDates({
      createdAt,
      priority: ticket.priority || "medium",
    });

    ticket.sla = {
      ...slaDates,
      firstRespondedAt: null,
      resolvedAt: null,
    };
  } else {
    /*
     * Protect against partially-created SLA objects.
     */
    if (!Object.prototype.hasOwnProperty.call(ticket.sla, "firstRespondedAt")) {
      ticket.sla.firstRespondedAt = null;
    }

    if (!Object.prototype.hasOwnProperty.call(ticket.sla, "resolvedAt")) {
      ticket.sla.resolvedAt = null;
    }

    /*
     * Legacy/partial SLA objects may not contain due dates.
     */
    if (!ticket.sla.responseDueAt || !ticket.sla.resolutionDueAt) {
      const createdAt = ticket.createdAt || new Date();

      const slaDates = createSlaDates({
        createdAt,
        priority: ticket.priority || "medium",
      });

      if (!ticket.sla.responseDueAt) {
        ticket.sla.responseDueAt = slaDates.responseDueAt;
      }

      if (!ticket.sla.resolutionDueAt) {
        ticket.sla.resolutionDueAt = slaDates.resolutionDueAt;
      }
    }
  }

  return ticket.sla;
};

/*
 * =========================================================
 * MARK FIRST HUMAN RESPONSE
 * =========================================================
 *
 * Only a real public agent/admin reply counts.
 */
const markFirstHumanResponse = ({ ticket, respondedAt = new Date() }) => {
  if (!ticket) {
    return;
  }

  const sla = ensureTicketSla(ticket);

  /*
   * Never overwrite the original first human response.
   */
  if (sla.firstRespondedAt) {
    return;
  }

  sla.firstRespondedAt = respondedAt;
};

/*
 * =========================================================
 * MARK TICKET RESOLVED FOR SLA
 * =========================================================
 */
const markTicketResolvedForSla = ({ ticket, resolvedAt = new Date() }) => {
  if (!ticket) {
    return;
  }

  const sla = ensureTicketSla(ticket);

  sla.resolvedAt = resolvedAt;
};

/*
 * =========================================================
 * REOPEN TICKET SLA
 * =========================================================
 *
 * IMPORTANT:
 *
 * firstRespondedAt is preserved.
 * Only resolvedAt is cleared.
 */
const reopenTicketSla = (ticket) => {
  if (!ticket) {
    return;
  }

  const sla = ensureTicketSla(ticket);

  sla.resolvedAt = null;
};

/*
 * =========================================================
 * GET SLA STATUS
 * =========================================================
 */
const getTicketSlaStatus = (ticket, now = new Date()) => {
  if (!ticket) {
    return null;
  }

  const sla = ensureTicketSla(ticket);

  const responseDueAt = sla?.responseDueAt ? new Date(sla.responseDueAt) : null;

  const resolutionDueAt = sla?.resolutionDueAt
    ? new Date(sla.resolutionDueAt)
    : null;

  const firstRespondedAt = sla?.firstRespondedAt
    ? new Date(sla.firstRespondedAt)
    : null;

  const resolvedAt = sla?.resolvedAt ? new Date(sla.resolvedAt) : null;

  const responseBreached =
    !!responseDueAt &&
    !firstRespondedAt &&
    now.getTime() > responseDueAt.getTime();

  const resolutionBreached =
    !!resolutionDueAt &&
    !resolvedAt &&
    now.getTime() > resolutionDueAt.getTime();

  const responseStatus = firstRespondedAt
    ? responseDueAt && firstRespondedAt.getTime() <= responseDueAt.getTime()
      ? "met"
      : "breached"
    : responseBreached
      ? "breached"
      : "pending";

  const resolutionStatus = resolvedAt
    ? resolutionDueAt && resolvedAt.getTime() <= resolutionDueAt.getTime()
      ? "met"
      : "breached"
    : resolutionBreached
      ? "breached"
      : "pending";

  return {
    responseDueAt,
    resolutionDueAt,

    firstRespondedAt,
    resolvedAt,

    responseBreached,
    resolutionBreached,

    responseStatus,
    resolutionStatus,
  };
};

/*
 * =========================================================
 * ADD STATUS HISTORY
 * =========================================================
 */

const addStatusHistory = ({
  ticket,
  status,
  changedBy,
  changedByRole = "agent",
  note = "",
}) => {
  if (!ticket) {
    return;
  }

  if (!Array.isArray(ticket.statusHistory)) {
    ticket.statusHistory = [];
  }

  ticket.statusHistory.push({
    status,
    changedBy: changedBy || null,
    changedByRole,
    note,
    createdAt: new Date(),
  });
};

/*
 * =========================================================
 * UPDATE LIFECYCLE TIMESTAMPS
 * =========================================================
 */

const updateLifecycleTimestamps = (ticket, previousStatus, newStatus) => {
  const now = new Date();

  /*
   * Make sure SLA exists before lifecycle changes.
   */
  ensureTicketSla(ticket);

  /*
   * =======================================================
   * RESOLVED
   * =======================================================
   */
  if (newStatus === "resolved") {
    ticket.resolvedAt = now;
    ticket.closedAt = null;

    markTicketResolvedForSla({
      ticket,
      resolvedAt: now,
    });
  }

  /*
   * =======================================================
   * CLOSED
   * =======================================================
   *
   * If a ticket is closed without previously being resolved,
   * treat the close time as the resolution time.
   */
  if (newStatus === "closed") {
    ticket.closedAt = now;

    if (!ticket.resolvedAt) {
      ticket.resolvedAt = now;

      markTicketResolvedForSla({
        ticket,
        resolvedAt: now,
      });
    }
  }

  /*
   * =======================================================
   * REOPENED
   * =======================================================
   *
   * Preserve firstRespondedAt.
   *
   * Clear:
   * - ticket.resolvedAt
   * - ticket.closedAt
   * - sla.resolvedAt
   */
  if (
    ["resolved", "closed"].includes(previousStatus) &&
    !["resolved", "closed"].includes(newStatus)
  ) {
    ticket.reopenedAt = now;

    ticket.resolvedAt = null;
    ticket.closedAt = null;

    reopenTicketSla(ticket);
  }

  /*
   * =======================================================
   * MOVING AWAY FROM RESOLVED
   * =======================================================
   */
  if (
    previousStatus === "resolved" &&
    newStatus !== "resolved" &&
    newStatus !== "closed"
  ) {
    ticket.resolvedAt = null;

    reopenTicketSla(ticket);
  }

  /*
   * =======================================================
   * MOVING AWAY FROM CLOSED
   * =======================================================
   */
  if (previousStatus === "closed" && newStatus !== "closed") {
    ticket.closedAt = null;

    if (newStatus !== "resolved") {
      ticket.resolvedAt = null;

      reopenTicketSla(ticket);
    }
  }
};

/*
 * =========================================================
 * GET AGENT DASHBOARD
 * =========================================================
 */

export const getAgentDashboard = async (req, res) => {
  try {
    const agentId = getUserId(req);

    if (!agentId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    /*
     * Tickets currently assigned to this agent
     */
    const assignedTickets = await Ticket.countDocuments({
      assignedAgent: agentId,
      status: {
        $nin: ["closed"],
      },
    });

    /*
     * Open tickets
     */
    const openTickets = await Ticket.countDocuments({
      assignedAgent: agentId,
      status: "open",
    });

    /*
     * In-progress tickets
     */
    const inProgressTickets = await Ticket.countDocuments({
      assignedAgent: agentId,
      status: "in-progress",
    });

    /*
     * Waiting tickets
     */
    const waitingTickets = await Ticket.countDocuments({
      assignedAgent: agentId,
      status: "waiting",
    });

    /*
     * Resolved today
     */
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const resolvedToday = await Ticket.countDocuments({
      assignedAgent: agentId,
      status: "resolved",
      resolvedAt: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    });

    const resolvedTickets = await Ticket.countDocuments({
      assignedAgent: agentId,
      status: "resolved",
    });

    const totalHandledTickets = assignedTickets + resolvedTickets;

    const resolutionRate =
      totalHandledTickets > 0
        ? Math.round((resolvedTickets / totalHandledTickets) * 100)
        : 0;

    /*
     * Tickets waiting in global queue
     */
    const queueCount = await Ticket.countDocuments({
      $or: [{ assignedAgent: null }, { assignedAgent: { $exists: false } }],
      status: {
        $in: ["open", "waiting"],
      },
    });

    /*
     * Recent assigned tickets
     */
    const recentTickets = await Ticket.find({
      assignedAgent: agentId,
    })
      .populate("customer", "name email avatar profileImage")
      .populate("assignedAgent", "name email avatar profileImage")
      .sort({
        updatedAt: -1,
      })
      .limit(10)
      .lean();

    const recentTicketsWithSla = recentTickets.map((ticket) => ({
      ...ticket,
      slaStatus: getTicketSlaStatus(ticket),
    }));

    return res.status(200).json({
      success: true,

      stats: {
        assignedTickets,
        openTickets,
        inProgressTickets,
        inProgress: inProgressTickets,
        waitingTickets,
        resolvedTickets,
        resolvedToday,
        resolutionRate,
        queueCount,
        queueTickets: queueCount,
      },

      assignedCount: assignedTickets,
      openCount: openTickets,
      inProgressCount: inProgressTickets,
      waitingCount: waitingTickets,

      resolvedTickets,
      resolvedTodayCount: resolvedToday,
      resolutionRate,

      queueCount,
      queueTickets: queueCount,

      recentTickets: recentTicketsWithSla,
    });
  } catch (error) {
    console.error("GET AGENT DASHBOARD ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load agent dashboard",
      error: error.message,
    });
  }
};

/*
 * =========================================================
 * GET TICKET QUEUE
 * =========================================================
 *
 * IMPORTANT:
 *
 * Only unassigned tickets are returned.
 *
 * Opening an unassigned ticket DOES NOT assign it.
 *
 * =========================================================
 */

export const getTicketQueue = async (req, res) => {
  try {
    const {
      search = "",
      status,
      priority,
      page = 1,
      limit = 20,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const currentPage = Math.max(Number(page) || 1, 1);

    const pageLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);

    const skip = (currentPage - 1) * pageLimit;

    /*
     * =======================================================
     * ONLY UNASSIGNED
     * =======================================================
     */

    const query = {
      $or: [{ assignedAgent: null }, { assignedAgent: { $exists: false } }],
    };

    /*
     * =======================================================
     * STATUS
     * =======================================================
     */

    const allowedStatuses = [
      "open",
      "in-progress",
      "waiting",
      "resolved",
      "closed",
    ];

    if (status && status !== "all") {
      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status. Allowed statuses: ${allowedStatuses.join(
            ", ",
          )}`,
        });
      }

      query.status = status;
    } else {
      query.status = {
        $in: ["open", "waiting"],
      };
    }

    /*
     * =======================================================
     * PRIORITY
     * =======================================================
     */

    const allowedPriorities = ["low", "medium", "high", "urgent"];

    if (priority && priority !== "all") {
      if (!allowedPriorities.includes(priority)) {
        return res.status(400).json({
          success: false,
          message: `Invalid priority. Allowed priorities: ${allowedPriorities.join(
            ", ",
          )}`,
        });
      }

      query.priority = priority;
    }

    /*
     * =======================================================
     * SEARCH
     * =======================================================
     */

    if (search?.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");

      query.$and = [
        {
          $or: [
            {
              subject: searchRegex,
            },
            {
              ticketNumber: searchRegex,
            },
            {
              description: searchRegex,
            },
          ],
        },
      ];
    }

    /*
     * =======================================================
     * SAFE SORTING
     * =======================================================
     */

    const allowedSortFields = [
      "createdAt",
      "updatedAt",
      "priority",
      "status",
      "ticketNumber",
    ];

    const safeSortBy = allowedSortFields.includes(sortBy)
      ? sortBy
      : "createdAt";

    const safeSortOrder = String(sortOrder).toLowerCase() === "asc" ? 1 : -1;

    /*
     * =======================================================
     * PRIORITY SORT
     * =======================================================
     */

    if (safeSortBy === "priority") {
      const priorityOrder = {
        urgent: 1,
        high: 2,
        medium: 3,
        low: 4,
      };

      const total = await Ticket.countDocuments(query);

      let tickets = await Ticket.find(query)
        .populate("customer", "name email avatar profileImage phone company")
        .populate(
          "assignedAgent",
          "name email avatar profileImage phone company role",
        )
        .sort({
          createdAt: -1,
        })
        .lean();

      tickets.sort((a, b) => {
        const aPriority = priorityOrder[a.priority] || 99;

        const bPriority = priorityOrder[b.priority] || 99;

        return safeSortOrder === -1
          ? bPriority - aPriority
          : aPriority - bPriority;
      });

      tickets = tickets.slice(skip, skip + pageLimit).map((ticket) => ({
        ...ticket,
        slaStatus: getTicketSlaStatus(ticket),
      }));

      return res.status(200).json({
        success: true,
        tickets,

        pagination: {
          page: currentPage,
          limit: pageLimit,
          total,
          totalPages: Math.ceil(total / pageLimit),
          hasNextPage: currentPage < Math.ceil(total / pageLimit),
          hasPreviousPage: currentPage > 1,
        },

        total,
      });
    }

    /*
     * =======================================================
     * NORMAL SORT
     * =======================================================
     */

    const sort = {
      [safeSortBy]: safeSortOrder,
    };

    const total = await Ticket.countDocuments(query);

    let tickets = await Ticket.find(query)
      .populate("customer", "name email avatar profileImage phone company")
      .populate(
        "assignedAgent",
        "name email avatar profileImage phone company role",
      )
      .sort(sort)
      .skip(skip)
      .limit(pageLimit)
      .lean();

    tickets = tickets.map((ticket) => ({
      ...ticket,
      slaStatus: getTicketSlaStatus(ticket),
    }));

    return res.status(200).json({
      success: true,
      tickets,

      pagination: {
        page: currentPage,
        limit: pageLimit,
        total,
        totalPages: Math.ceil(total / pageLimit),
        hasNextPage: currentPage < Math.ceil(total / pageLimit),
        hasPreviousPage: currentPage > 1,
      },

      total,
    });
  } catch (error) {
    console.error("========================================");
    console.error("GET TICKET QUEUE ERROR");
    console.error("NAME:", error.name);
    console.error("MESSAGE:", error.message);
    console.error("STACK:", error.stack);
    console.error("========================================");

    return res.status(500).json({
      success: false,
      message: "Failed to load ticket queue",
      error: error.message,
    });
  }
};

/*
 * =========================================================
 * GET ASSIGNED TICKETS
 * =========================================================
 */

export const getAssignedTickets = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const { page = 1, limit = 10, status, priority, search } = req.query;

    const pageNumber = Math.max(Number(page) || 1, 1);

    const limitNumber = Math.min(Math.max(Number(limit) || 10, 1), 100);

    const filter = {
      assignedAgent: userId,
    };

    if (status && status !== "all") {
      filter.status = status;
    }

    if (priority && priority !== "all") {
      filter.priority = priority;
    }

    if (search?.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");

      filter.$or = [
        { subject: searchRegex },
        { ticketNumber: searchRegex },
        { description: searchRegex },
      ];
    }

    const skip = (pageNumber - 1) * limitNumber;

    const [tickets, total] = await Promise.all([
      Ticket.find(filter)
        .populate("customer", "name email avatar phone company")
        .populate("assignedAgent", "name email avatar role")
        .sort({
          updatedAt: -1,
        })
        .skip(skip)
        .limit(limitNumber)
        .lean(),

      Ticket.countDocuments(filter),
    ]);

    const ticketsWithSla = tickets.map((ticket) => ({
      ...ticket,
      slaStatus: getTicketSlaStatus(ticket),
    }));

    return res.status(200).json({
      success: true,

      tickets: ticketsWithSla,

      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        totalPages: Math.ceil(total / limitNumber),
      },
    });
  } catch (error) {
    console.error("GET ASSIGNED TICKETS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load assigned tickets.",
      error: error.message,
    });
  }
};

/*
 * =========================================================
 * GET SINGLE AGENT TICKET
 * =========================================================
 *
 * IMPORTANT:
 *
 * Opening an unassigned ticket DOES NOT assign it.
 *
 * Agent must explicitly click "Assign to Me".
 *
 * =========================================================
 */

export const getAgentTicketById = async (req, res) => {
  try {
    const agentId = getUserId(req);
    const role = getUserRole(req);
    const { ticketId } = req.params;

    if (!agentId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!ticketId || !mongoose.Types.ObjectId.isValid(ticketId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ticket ID",
      });
    }

    const ticket = await Ticket.findById(ticketId)
      .populate("customer", "name email avatar profileImage phone company")
      .populate("assignedAgent", "name email avatar profileImage role")
      .populate("conversation.sender", "name email avatar profileImage role");

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    ensureTicketSla(ticket);

    /*
     * =======================================================
     * ADMIN ACCESS
     * =======================================================
     */

    if (role === "admin") {
      return res.status(200).json({
        success: true,
        message: "Ticket loaded successfully",
        ticket,
        slaStatus: getTicketSlaStatus(ticket),
      });
    }

    const assignedAgentId = normalizeId(
      ticket.assignedAgent?._id || ticket.assignedAgent,
    );

    const currentAgentId = normalizeId(agentId);

    /*
     * =======================================================
     * UNASSIGNED TICKET
     * =======================================================
     *
     * DO NOT ASSIGN.
     */

    if (!assignedAgentId) {
      return res.status(200).json({
        success: true,
        message: "Unassigned ticket loaded successfully",
        ticket,
        slaStatus: getTicketSlaStatus(ticket),
      });
    }

    /*
     * =======================================================
     * ANOTHER AGENT
     * =======================================================
     */

    if (assignedAgentId !== currentAgentId) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this ticket",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Ticket loaded successfully",
      ticket,
      slaStatus: getTicketSlaStatus(ticket),
    });
  } catch (error) {
    console.error("========================================");
    console.error("GET AGENT TICKET ERROR");
    console.error("MESSAGE:", error.message);
    console.error("NAME:", error.name);
    console.error("STACK:", error.stack);
    console.error("========================================");

    return res.status(500).json({
      success: false,
      message: "Failed to load ticket",
      error: error.message,
    });
  }
};

/*
 * =========================================================
 * ASSIGN TICKET TO CURRENT AGENT
 * =========================================================
 */

export const assignTicketToMe = async (req, res) => {
  try {
    const agentId = getUserId(req);
    const role = getUserRole(req);

    if (!agentId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const { ticketId } = req.params;

    if (!ticketId || !mongoose.Types.ObjectId.isValid(ticketId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ticket ID",
      });
    }

    const ticket = await Ticket.findById(ticketId);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    ensureTicketSla(ticket);

    /*
     * Already assigned to another agent.
     */
    if (
      ticket.assignedAgent &&
      normalizeId(ticket.assignedAgent) !== normalizeId(agentId)
    ) {
      if (role !== "admin") {
        return res.status(409).json({
          success: false,
          message: "This ticket is already assigned to another agent",
        });
      }
    }

    const previousStatus = ticket.status;

    ticket.assignedAgent = agentId;

    /*
     * Claiming open/waiting moves it into
     * agent working state.
     */
    if (["open", "waiting"].includes(ticket.status)) {
      ticket.status = "in-progress";
    }

    addStatusHistory({
      ticket,
      status: ticket.status,
      changedBy: agentId,
      changedByRole: role,
      note:
        previousStatus === ticket.status
          ? "Ticket assigned to agent"
          : "Ticket assigned and moved to in-progress",
    });

    if (previousStatus !== ticket.status) {
      updateLifecycleTimestamps(ticket, previousStatus, ticket.status);
    }

    await ticket.save();

    await ticket.populate("customer", "name email avatar profileImage");

    await ticket.populate("assignedAgent", "name email avatar profileImage");

    /*
     * =======================================================
     * REAL-TIME NOTIFICATIONS
     * =======================================================
     *
     * Notify:
     * 1. Customer that an agent was assigned
     * 2. Assigned agent that the ticket was assigned to them
     */

    try {
      const assignedAgentName =
        ticket.assignedAgent?.name ||
        ticket.assignedAgent?.email ||
        "A support agent";

      await notifyAgentAssigned({
        req,
        ticket,
        agentName: assignedAgentName,
      });

      await notifyAgentTicketAssigned({
        req,
        ticket,
      });
    } catch (notificationError) {
      console.error("TICKET ASSIGNMENT NOTIFICATION ERROR:", notificationError);
    }

    return res.status(200).json({
      success: true,
      message: "Ticket assigned successfully",
      ticket,
      slaStatus: getTicketSlaStatus(ticket),
    });
  } catch (error) {
    console.error("ASSIGN TICKET ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to assign ticket",
      error: error.message,
    });
  }
};

/*
 * =========================================================
 * UPDATE TICKET STATUS
 * =========================================================
 */

export const updateTicketStatus = async (req, res) => {
  try {
    const agentId = getUserId(req);
    const role = getUserRole(req);

    const { ticketId } = req.params;
    const { status } = req.body;

    if (!agentId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const allowedStatuses = [
      "open",
      "in-progress",
      "waiting",
      "resolved",
      "closed",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed statuses: ${allowedStatuses.join(
          ", ",
        )}`,
      });
    }

    if (!ticketId || !mongoose.Types.ObjectId.isValid(ticketId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ticket ID.",
      });
    }

    const ticket = await Ticket.findById(ticketId);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found.",
      });
    }

    ensureTicketSla(ticket);

    const assignedAgentId = normalizeId(ticket.assignedAgent);

    const currentAgentId = normalizeId(agentId);

    const isAdmin = role === "admin";

    const isUnassigned = !assignedAgentId;

    const isAssignedAgent = assignedAgentId === currentAgentId;

    /*
     * Admin can update any ticket.
     *
     * Assigned agent can update own ticket.
     *
     * Unassigned agent can update it.
     */
    if (!isAdmin && !isAssignedAgent && !isUnassigned) {
      return res.status(403).json({
        success: false,
        message: "You cannot update another agent's ticket.",
      });
    }

    /*
     * Explicit status update by an agent is allowed
     * to claim an unassigned ticket.
     */
    if (isUnassigned) {
      ticket.assignedAgent = agentId;
    }

    const previousStatus = ticket.status;

    /*
     * =======================================================
     * STATUS UNCHANGED
     * =======================================================
     */

    if (previousStatus === status) {
      await ticket.populate([
        {
          path: "customer",
          select: "name email avatar profileImage phone company",
        },
        {
          path: "assignedAgent",
          select: "name email avatar profileImage phone role",
        },
      ]);

      return res.status(200).json({
        success: true,
        message: "Ticket status unchanged.",
        ticket,
        slaStatus: getTicketSlaStatus(ticket),
      });
    }

    /*
     * =======================================================
     * UPDATE STATUS
     * =======================================================
     */

    ticket.status = status;

    updateLifecycleTimestamps(ticket, previousStatus, status);

    addStatusHistory({
      ticket,
      status,
      changedBy: agentId,
      changedByRole: isAdmin ? "admin" : "agent",
      note: `Status changed from ${previousStatus} to ${status}`,
    });

    await ticket.save();

    await ticket.populate([
      {
        path: "customer",
        select: "name email avatar profileImage phone company",
      },
      {
        path: "assignedAgent",
        select: "name email avatar profileImage phone role",
      },
    ]);

    const io = getSocketIO();

    if (io) {
      const room = getTicketRoom(ticket._id);

      io.to(room).emit("ticket:update", {
        ticket,
        slaStatus: getTicketSlaStatus(ticket),
      });
    }

    return res.status(200).json({
      success: true,
      message: "Ticket status updated successfully.",
      ticket,
      slaStatus: getTicketSlaStatus(ticket),
    });
  } catch (error) {
    console.error("========================================");
    console.error("UPDATE TICKET STATUS ERROR");
    console.error("MESSAGE:", error.message);
    console.error("NAME:", error.name);
    console.error("STACK:", error.stack);
    console.error("========================================");

    return res.status(500).json({
      success: false,
      message: "Failed to update ticket status.",
      error: error.message,
    });
  }
};

/*
 * =========================================================
 * UPDATE TICKET PRIORITY
 * =========================================================
 */

export const updateTicketPriority = async (req, res) => {
  try {
    const agentId = getUserId(req);
    const role = getUserRole(req);

    const { ticketId } = req.params;
    const { priority } = req.body;

    if (!agentId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const allowedPriorities = ["low", "medium", "high", "urgent"];

    if (!allowedPriorities.includes(priority)) {
      return res.status(400).json({
        success: false,
        message: `Invalid priority. Allowed priorities: ${allowedPriorities.join(
          ", ",
        )}`,
      });
    }

    if (!ticketId || !mongoose.Types.ObjectId.isValid(ticketId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ticket ID.",
      });
    }

    const ticket = await Ticket.findById(ticketId);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found.",
      });
    }

    ensureTicketSla(ticket);

    const assignedAgentId = normalizeId(ticket.assignedAgent);

    const currentAgentId = normalizeId(agentId);

    const isAdmin = role === "admin";

    const isUnassigned = !assignedAgentId;

    const isAssignedAgent = assignedAgentId === currentAgentId;

    if (!isAdmin && !isAssignedAgent && !isUnassigned) {
      return res.status(403).json({
        success: false,
        message: "You cannot update another agent's ticket.",
      });
    }

    /*
     * Explicit priority change can claim an
     * unassigned ticket.
     */
    if (isUnassigned) {
      ticket.assignedAgent = agentId;

      addStatusHistory({
        ticket,
        status: ticket.status,
        changedBy: agentId,
        changedByRole: isAdmin ? "admin" : "agent",
        note: "Ticket assigned when priority was updated.",
      });
    }

    const previousPriority = ticket.priority;

    if (previousPriority === priority) {
      await ticket.populate(
        "customer",
        "name email avatar profileImage phone company",
      );

      await ticket.populate(
        "assignedAgent",
        "name email avatar profileImage phone company role",
      );

      return res.status(200).json({
        success: true,
        message: "Ticket priority unchanged.",
        ticket,
        slaStatus: getTicketSlaStatus(ticket),
      });
    }

    ticket.priority = priority;

    /*
     * NOTE:
     *
     * We intentionally do not recalculate an existing
     * ticket's SLA when priority changes.
     *
     * The SLA clock started at ticket creation.
     */
    addStatusHistory({
      ticket,
      status: ticket.status,
      changedBy: agentId,
      changedByRole: isAdmin ? "admin" : "agent",
      note: `Priority changed from ${
        previousPriority || "none"
      } to ${priority}.`,
    });

    await ticket.save();

    await ticket.populate(
      "customer",
      "name email avatar profileImage phone company",
    );

    await ticket.populate(
      "assignedAgent",
      "name email avatar profileImage phone company role",
    );

    const io = getSocketIO();

    if (io) {
      const room = getTicketRoom(ticket._id);

      io.to(room).emit("ticket:update", {
        ticket,
        slaStatus: getTicketSlaStatus(ticket),
      });
    }

    return res.status(200).json({
      success: true,
      message: "Ticket priority updated successfully.",
      ticket,
      slaStatus: getTicketSlaStatus(ticket),
    });
  } catch (error) {
    console.error("========================================");
    console.error("UPDATE TICKET PRIORITY ERROR");
    console.error("MESSAGE:", error.message);
    console.error("NAME:", error.name);
    console.error("STACK:", error.stack);
    console.error("========================================");

    return res.status(500).json({
      success: false,
      message: "Failed to update ticket priority.",
      error: error.message,
    });
  }
};

/*
 * =========================================================
 * SEND AGENT REPLY
 * =========================================================
 *
 * IMPORTANT SLA RULE:
 *
 * This is the place where first human response is recorded.
 *
 * Agent/admin public reply:
 *      YES -> first human response
 *
 * Internal note:
 *      NO
 *
 * AI reply:
 *      NO
 *
 * Customer reply:
 *      NO
 *
 * =========================================================
 */

export const sendAgentReply = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { message = "" } = req.body;

    const userId = getUserId(req);
    const userRole = getUserRole(req);

    const cleanMessage = String(message || "").trim();

    const files = Array.isArray(req.files) ? req.files : [];

    /*
     * =======================================================
     * AUTHENTICATION
     * =======================================================
     */

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    /*
     * =======================================================
     * TICKET ID
     * =======================================================
     */

    if (!ticketId || !mongoose.Types.ObjectId.isValid(ticketId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ticket ID.",
      });
    }

    /*
     * =======================================================
     * MESSAGE / ATTACHMENTS
     * =======================================================
     */

    if (!cleanMessage && files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Reply message or attachment is required.",
      });
    }

    /*
     * =======================================================
     * FIND TICKET
     * =======================================================
     */

    const ticket = await Ticket.findById(ticketId);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found.",
      });
    }

    ensureTicketSla(ticket);

    /*
     * =======================================================
     * ACCESS CONTROL
     * =======================================================
     */

    const assignedAgentId = normalizeId(ticket.assignedAgent);

    const currentUserId = normalizeId(userId);

    const isAdmin = userRole === "admin";

    const isAssignedAgent =
      assignedAgentId && currentUserId === assignedAgentId;

    const isUnassigned = !assignedAgentId;

    if (!isAdmin && !isAssignedAgent && !isUnassigned) {
      return res.status(403).json({
        success: false,
        message: "You cannot reply to a ticket assigned to another agent.",
      });
    }

    /*
     * =======================================================
     * AUTO ASSIGN WHEN REPLYING
     * =======================================================
     *
     * This is intentional.
     *
     * Opening = NO assignment
     * Replying = assignment is required
     */

    if (isUnassigned) {
      ticket.assignedAgent = userId;

      addStatusHistory({
        ticket,
        status: "in-progress",
        changedBy: userId,
        changedByRole: isAdmin ? "admin" : "agent",
        note: "Ticket assigned when agent replied.",
      });
    }

    /*
     * =======================================================
     * BUILD ATTACHMENTS
     * =======================================================
     */

    const agentReplyAt = new Date();

    const attachments = files.map((file) => ({
      filename: file.filename || file.originalname || "",

      originalName: file.originalname || file.filename || "",

      mimetype: file.mimetype || "",

      size: Number(file.size || 0),

      path: file.path || file.filename || "",

      uploadedAt: agentReplyAt,
    }));

    /*
     * =======================================================
     * ENSURE CONVERSATION
     * =======================================================
     */

    if (!Array.isArray(ticket.conversation)) {
      ticket.conversation = [];
    }

    /*
     * =======================================================
     * SLA - FIRST HUMAN RESPONSE
     * =======================================================
     *
     * This is a public agent/admin reply.
     *
     * Only the first one is recorded.
     */

    markFirstHumanResponse({
      ticket,
      respondedAt: agentReplyAt,
    });

    /*
     * =======================================================
     * LEGACY RESPONSE FIELDS
     * =======================================================
     *
     * Keep these fields synchronized so your existing
     * analytics/frontend does not break.
     */

    if (!ticket.firstAgentResponseAt) {
      ticket.firstAgentResponseAt = agentReplyAt;
    }

    if (
      !ticket.firstAgentResponseTime &&
      ticket.createdAt &&
      ticket.firstAgentResponseAt
    ) {
      ticket.firstAgentResponseTime =
        new Date(ticket.firstAgentResponseAt).getTime() -
        new Date(ticket.createdAt).getTime();
    }

    /*
     * =======================================================
     * ADD PUBLIC AGENT REPLY
     * =======================================================
     */

    ticket.conversation.push({
      sender: userId,

      senderRole: isAdmin ? "admin" : "agent",

      message: cleanMessage || "Attachment",

      attachments,

      isInternal: false,

      isRead: false,

      createdAt: agentReplyAt,
    });

    /*
     * =======================================================
     * REPLY COUNTERS
     * =======================================================
     */

    ticket.replies = Number(ticket.replies || 0) + 1;

    ticket.lastReplyAt = agentReplyAt;

    /*
     * =======================================================
     * STATUS
     * =======================================================
     */

    if (["open", "waiting", "resolved", "closed"].includes(ticket.status)) {
      const previousStatus = ticket.status;

      ticket.status = "in-progress";

      updateLifecycleTimestamps(ticket, previousStatus, "in-progress");

      addStatusHistory({
        ticket,
        status: "in-progress",
        changedBy: userId,
        changedByRole: isAdmin ? "admin" : "agent",
        note: "Ticket moved to In Progress after agent reply.",
      });
    }

    /*
     * =======================================================
     * SAVE
     * =======================================================
     */

    await ticket.save();

    /*
     * =======================================================
     * POPULATE
     * =======================================================
     */

    await ticket.populate([
      {
        path: "customer",
        select: "name email avatar profileImage phone company",
      },
      {
        path: "assignedAgent",
        select: "name email avatar profileImage phone role",
      },
      {
        path: "conversation.sender",
        select: "name email avatar profileImage role",
      },
    ]);

    /*
     * =======================================================
     * GET SAVED MESSAGE
     * =======================================================
     */

    const latestMessage = ticket.conversation[ticket.conversation.length - 1];

    /*
     * =======================================================
     * SOCKET.IO
     * =======================================================
     */

    const io = getSocketIO();

    if (io) {
      const room = getTicketRoom(ticket._id);

      /*
       * Public agent reply
       */
      io.to(room).emit("ticket:new-message", {
        ticketId: ticket._id.toString(),
        message: latestMessage,
      });

      /*
       * Ticket metadata update
       */
      io.to(room).emit("ticket:update", {
        ticket: {
          ...ticket.toObject(),

          conversation: ticket.conversation.filter(
            (item) => item?.isInternal !== true,
          ),
        },

        slaStatus: getTicketSlaStatus(ticket),
      });
    }

    /*
     * =======================================================
     * RESPONSE
     * =======================================================
     */

    return res.status(200).json({
      success: true,
      message: "Reply sent successfully.",
      ticket,
      slaStatus: getTicketSlaStatus(ticket),
    });
  } catch (error) {
    console.error("========================================");
    console.error("SEND AGENT REPLY ERROR");
    console.error("MESSAGE:", error.message);
    console.error("NAME:", error.name);
    console.error("STACK:", error.stack);
    console.error("========================================");

    return res.status(500).json({
      success: false,
      message: "Failed to send agent reply.",
      error: error.message,
    });
  }
};

/*
 * =========================================================
 * GET ALL ASSIGNED TICKETS
 * =========================================================
 */

export const getAllAssignedTickets = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 100,
      status,
      priority,
      search,
      agentId,
    } = req.query;

    const currentPage = Math.max(Number(page) || 1, 1);

    const pageLimit = Math.min(Math.max(Number(limit) || 100, 1), 100);

    const filter = {
      assignedAgent: {
        $ne: null,
      },
    };

    /*
     * STATUS
     */

    if (
      status &&
      status !== "all" &&
      ["open", "in-progress", "waiting", "resolved", "closed"].includes(status)
    ) {
      filter.status = status;
    }

    /*
     * PRIORITY
     */

    if (
      priority &&
      priority !== "all" &&
      ["low", "medium", "high", "urgent"].includes(priority)
    ) {
      filter.priority = priority;
    }

    /*
     * AGENT
     */

    if (agentId && agentId !== "all") {
      filter.assignedAgent = agentId;
    }

    /*
     * SEARCH
     */

    if (search?.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");

      filter.$or = [
        {
          subject: searchRegex,
        },
        {
          ticketNumber: searchRegex,
        },
        {
          description: searchRegex,
        },
      ];
    }

    const skip = (currentPage - 1) * pageLimit;

    const [tickets, total] = await Promise.all([
      Ticket.find(filter)
        .populate("customer", "name email avatar profileImage phone company")
        .populate("assignedAgent", "name email avatar profileImage role")
        .sort({
          updatedAt: -1,
        })
        .skip(skip)
        .limit(pageLimit)
        .lean(),

      Ticket.countDocuments(filter),
    ]);

    const ticketsWithSla = tickets.map((ticket) => ({
      ...ticket,
      slaStatus: getTicketSlaStatus(ticket),
    }));

    return res.status(200).json({
      success: true,

      tickets: ticketsWithSla,

      totalAssignedTickets: total,

      pagination: {
        page: currentPage,
        limit: pageLimit,
        total,
        totalPages: Math.ceil(total / pageLimit),
        hasNextPage: currentPage < Math.ceil(total / pageLimit),
        hasPreviousPage: currentPage > 1,
      },
    });
  } catch (error) {
    console.error("GET ALL ASSIGNED TICKETS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load all assigned tickets.",
      error: error.message,
    });
  }
};

/*
 * =========================================================
 * MY TICKETS
 * =========================================================
 */

export const getMyTickets = async (req, res) => {
  try {
    const agentId = req.user?._id || req.user?.id;

    if (!agentId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const { page = 1, limit = 100, status, priority, search } = req.query;

    const currentPage = Math.max(Number(page) || 1, 1);

    const pageLimit = Math.min(Math.max(Number(limit) || 100, 1), 100);

    /*
     * SECURITY:
     *
     * Always use authenticated user's ID.
     */

    const filter = {
      assignedAgent: agentId,
    };

    /*
     * STATUS
     */

    if (
      status &&
      status !== "all" &&
      ["open", "in-progress", "waiting", "resolved", "closed"].includes(status)
    ) {
      filter.status = status;
    }

    /*
     * PRIORITY
     */

    if (
      priority &&
      priority !== "all" &&
      ["low", "medium", "high", "urgent"].includes(priority)
    ) {
      filter.priority = priority;
    }

    /*
     * SEARCH
     */

    if (search?.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");

      filter.$or = [
        {
          subject: searchRegex,
        },
        {
          ticketNumber: searchRegex,
        },
        {
          description: searchRegex,
        },
      ];
    }

    const skip = (currentPage - 1) * pageLimit;

    const [tickets, total] = await Promise.all([
      Ticket.find(filter)
        .populate("customer", "name email avatar profileImage phone company")
        .populate("assignedAgent", "name email avatar profileImage role")
        .sort({
          updatedAt: -1,
        })
        .skip(skip)
        .limit(pageLimit)
        .lean(),

      Ticket.countDocuments(filter),
    ]);

    const ticketsWithSla = tickets.map((ticket) => ({
      ...ticket,
      slaStatus: getTicketSlaStatus(ticket),
    }));

    return res.status(200).json({
      success: true,

      tickets: ticketsWithSla,

      pagination: {
        page: currentPage,
        limit: pageLimit,
        total,
        totalPages: Math.ceil(total / pageLimit),
        hasNextPage: currentPage < Math.ceil(total / pageLimit),
        hasPreviousPage: currentPage > 1,
      },
    });
  } catch (error) {
    console.error("GET MY TICKETS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load your tickets.",
      error: error.message,
    });
  }
};

/*
 * =========================================================
 * ADD INTERNAL NOTE
 * =========================================================
 *
 * Internal notes:
 *
 * - NOT customer-visible
 * - NOT a human first response
 * - DO NOT modify SLA firstRespondedAt
 *
 * =========================================================
 */

export const addInternalNote = async (req, res) => {
  try {
    const { ticketId } = req.params;

    const { message = "" } = req.body;

    const userId = getUserId(req);

    const userRole = getUserRole(req);

    const cleanMessage = String(message || "").trim();

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    if (!ticketId || !mongoose.Types.ObjectId.isValid(ticketId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ticket ID.",
      });
    }

    if (!cleanMessage) {
      return res.status(400).json({
        success: false,
        message: "Internal note cannot be empty.",
      });
    }

    if (cleanMessage.length > 10000) {
      return res.status(400).json({
        success: false,
        message: "Internal note cannot exceed 10000 characters.",
      });
    }

    const ticket = await Ticket.findById(ticketId);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found.",
      });
    }

    ensureTicketSla(ticket);

    const assignedAgentId = normalizeId(ticket.assignedAgent);

    const currentUserId = normalizeId(userId);

    const isAdmin = userRole === "admin";

    const isAssignedAgent =
      assignedAgentId && currentUserId === assignedAgentId;

    const isUnassigned = !assignedAgentId;

    if (!isAdmin && !isAssignedAgent && !isUnassigned) {
      return res.status(403).json({
        success: false,
        message:
          "You cannot add an internal note to a ticket assigned to another agent.",
      });
    }

    /*
     * Explicit action on unassigned ticket
     * can assign it.
     */

    if (isUnassigned) {
      ticket.assignedAgent = userId;

      addStatusHistory({
        ticket,
        status: ticket.status,
        changedBy: userId,
        changedByRole: isAdmin ? "admin" : "agent",
        note: "Ticket assigned when internal note was added.",
      });
    }

    /*
     * IMPORTANT:
     *
     * Internal notes DO NOT call
     * markFirstHumanResponse().
     */

    const internalNote = {
      sender: userId,

      senderRole: isAdmin ? "admin" : "agent",

      message: cleanMessage,

      isInternal: true,

      attachments: [],

      isRead: false,

      createdAt: new Date(),
    };

    if (!Array.isArray(ticket.conversation)) {
      ticket.conversation = [];
    }

    ticket.conversation.push(internalNote);

    await ticket.save();

    await ticket.populate([
      {
        path: "customer",
        select: "name email avatar profileImage phone company",
      },
      {
        path: "assignedAgent",
        select: "name email avatar profileImage phone role",
      },
      {
        path: "conversation.sender",
        select: "name email avatar profileImage role",
      },
    ]);

    const savedNote = ticket.conversation[ticket.conversation.length - 1];

    const io = getSocketIO();

    if (io) {
      const agentRoom = getAgentTicketRoom(ticket._id);

      io.to(agentRoom).emit("ticket:internal-note", {
        ticketId: ticket._id.toString(),
        note: savedNote,
      });
    }

    return res.status(201).json({
      success: true,
      message: "Internal note added successfully.",
      note: savedNote,
      ticket,
      slaStatus: getTicketSlaStatus(ticket),
    });
  } catch (error) {
    console.error("========================================");
    console.error("ADD INTERNAL NOTE ERROR");
    console.error("MESSAGE:", error.message);
    console.error("NAME:", error.name);
    console.error("STACK:", error.stack);
    console.error("========================================");

    return res.status(500).json({
      success: false,
      message: "Failed to add internal note.",
      error: error.message,
    });
  }
};

/*
 * =========================================================
 * ESCALATE TICKET
 * =========================================================
 */

export const escalateTicket = async (req, res) => {
  try {
    const agentId = getUserId(req);

    const role = getUserRole(req);

    const { ticketId } = req.params;

    const { escalatedTo = null, reason = "", note = "" } = req.body;

    if (!agentId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    if (!ticketId || !mongoose.Types.ObjectId.isValid(ticketId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ticket ID.",
      });
    }

    const cleanReason = String(reason || "").trim();

    const cleanNote = String(note || "").trim();

    if (!cleanReason) {
      return res.status(400).json({
        success: false,
        message: "Escalation reason is required.",
      });
    }

    if (cleanReason.length > 500) {
      return res.status(400).json({
        success: false,
        message: "Escalation reason cannot exceed 500 characters.",
      });
    }

    if (cleanNote.length > 5000) {
      return res.status(400).json({
        success: false,
        message: "Escalation note cannot exceed 5000 characters.",
      });
    }

    const ticket = await Ticket.findById(ticketId);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found.",
      });
    }

    ensureTicketSla(ticket);

    const assignedAgentId = normalizeId(ticket.assignedAgent);

    const currentAgentId = normalizeId(agentId);

    const isAdmin = role === "admin";

    const isAssignedAgent =
      assignedAgentId && assignedAgentId === currentAgentId;

    const isUnassigned = !assignedAgentId;

    if (!isAdmin && !isAssignedAgent && !isUnassigned) {
      return res.status(403).json({
        success: false,
        message: "You cannot escalate a ticket assigned to another agent.",
      });
    }

    if (ticket.escalation?.isEscalated) {
      return res.status(409).json({
        success: false,
        message: "This ticket is already escalated.",
      });
    }

    let targetUser = null;

    if (escalatedTo) {
      if (!mongoose.Types.ObjectId.isValid(escalatedTo)) {
        return res.status(400).json({
          success: false,
          message: "Invalid escalation target.",
        });
      }

      targetUser = await User.findById(escalatedTo)
        .select("name email role status")
        .lean();

      if (!targetUser) {
        return res.status(404).json({
          success: false,
          message: "Escalation target not found.",
        });
      }

      if (!["admin", "agent"].includes(targetUser.role)) {
        return res.status(400).json({
          success: false,
          message: "Ticket can only be escalated to an admin or agent.",
        });
      }

      if (normalizeId(targetUser._id) === currentAgentId) {
        return res.status(400).json({
          success: false,
          message: "You cannot escalate a ticket to yourself.",
        });
      }
    }

    if (isUnassigned) {
      ticket.assignedAgent = agentId;
    }

    ticket.escalation = {
      isEscalated: true,

      escalatedBy: agentId,

      escalatedTo: targetUser?._id || null,

      reason: cleanReason,

      note: cleanNote,

      escalatedAt: new Date(),

      resolvedAt: null,
    };

    const previousStatus = ticket.status;

    if (["open", "waiting"].includes(ticket.status)) {
      ticket.status = "in-progress";
    }

    addStatusHistory({
      ticket,
      status: ticket.status,
      changedBy: agentId,
      changedByRole: isAdmin ? "admin" : "agent",
      note: `Ticket escalated. Reason: ${cleanReason}${
        targetUser
          ? ` Escalated to ${targetUser.name || targetUser.email}.`
          : " Escalated to senior support."
      }`,
    });

    if (previousStatus !== ticket.status) {
      updateLifecycleTimestamps(ticket, previousStatus, ticket.status);
    }

    await ticket.save();

    await ticket.populate([
      {
        path: "customer",
        select: "name email avatar profileImage phone company",
      },
      {
        path: "assignedAgent",
        select: "name email avatar profileImage role",
      },
      {
        path: "escalation.escalatedBy",
        select: "name email avatar profileImage role",
      },
      {
        path: "escalation.escalatedTo",
        select: "name email avatar profileImage role",
      },
    ]);

    /*
     * =======================================================
     * REAL-TIME NOTIFICATIONS
     * =======================================================
     *
     * Notify the customer that the ticket was escalated.
     */

    try {
      await notifyTicketEscalated({
        req,
        ticket,
      });
    } catch (notificationError) {
      console.error(
        "CUSTOMER ESCALATION NOTIFICATION ERROR:",
        notificationError,
      );
    }

    /*
     * =======================================================
     * ESCALATION TARGET NOTIFICATION
     * =======================================================
     *
     * If the ticket was explicitly escalated to another
     * agent/admin, notify that user directly.
     */

    try {
      if (ticket.escalation?.escalatedTo) {
        await createNotification({
          req,
          recipient: ticket.escalation.escalatedTo._id,
          type: "ticket_escalated",
          title: "Ticket Escalated to You",
          message: `Ticket ${ticket.ticketNumber} has been escalated to you.`,
          ticket: ticket._id,
          ticketNumber: ticket.ticketNumber,
          metadata: {
            source: "escalation",
            target: "agent",
            reason: cleanReason,
            note: cleanNote,
          },
        });
      } else {
        /*
         * No explicit escalation target.
         *
         * Notify the agent/admin pool.
         */
        await notifyAgentsNewTicket({
          req,
          ticket,
        });
      }
    } catch (notificationError) {
      console.error("ESCALATION TARGET NOTIFICATION ERROR:", notificationError);
    }

    const io = getSocketIO();

    if (io) {
      const room = getTicketRoom(ticket._id);

      io.to(room).emit("ticket:escalated", {
        ticketId: ticket._id.toString(),
        ticket,
      });

      io.to(room).emit("ticket:update", {
        ticket,
        slaStatus: getTicketSlaStatus(ticket),
      });
    }

    return res.status(200).json({
      success: true,
      message: "Ticket escalated successfully.",
      ticket,
      slaStatus: getTicketSlaStatus(ticket),
    });
  } catch (error) {
    console.error("========================================");
    console.error("ESCALATE TICKET ERROR");
    console.error("MESSAGE:", error.message);
    console.error("NAME:", error.name);
    console.error("STACK:", error.stack);
    console.error("========================================");

    return res.status(500).json({
      success: false,
      message: "Failed to escalate ticket.",
      error: error.message,
    });
  }
};

/*
 * =========================================================
 * GET ESCALATED TICKETS
 * =========================================================
 */

export const getEscalatedTickets = async (req, res) => {
  try {
    const userId = getUserId(req);

    const role = getUserRole(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    if (!["agent", "admin"].includes(role)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view escalated tickets.",
      });
    }

    const query = {
      "escalation.isEscalated": true,
    };

    if (role === "agent") {
      query.$or = [
        {
          "escalation.escalatedTo": userId,
        },
        {
          "escalation.escalatedTo": null,
        },
      ];
    }

    const tickets = await Ticket.find(query)
      .populate("customer", "name email avatar profileImage")
      .populate("assignedAgent", "name email avatar profileImage role")
      .populate("escalation.escalatedBy", "name email avatar profileImage role")
      .populate("escalation.escalatedTo", "name email avatar profileImage role")
      .sort({
        "escalation.escalatedAt": -1,
      })
      .lean();

    const ticketsWithSla = tickets.map((ticket) => ({
      ...ticket,
      slaStatus: getTicketSlaStatus(ticket),
    }));

    return res.status(200).json({
      success: true,
      count: ticketsWithSla.length,
      tickets: ticketsWithSla,
    });
  } catch (error) {
    console.error("========================================");
    console.error("GET ESCALATED TICKETS ERROR");
    console.error("MESSAGE:", error.message);
    console.error("NAME:", error.name);
    console.error("STACK:", error.stack);
    console.error("========================================");

    return res.status(500).json({
      success: false,
      message: "Failed to fetch escalated tickets.",
      error: error.message,
    });
  }
};

/*
 * =========================================================
 * GET CUSTOMER PROFILE
 * =========================================================
 */

export const getAgentCustomerProfile = async (req, res) => {
  try {
    const { customerId } = req.params;

    if (!customerId) {
      return res.status(400).json({
        success: false,
        message: "Customer ID is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID",
      });
    }

    const customer = await User.findById(customerId)
      .select("name email avatar phone company status lastSeen createdAt")
      .lean();

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    const tickets = await Ticket.find({
      customer: customerId,
    })
      .select(
        "_id ticketNumber subject category priority status createdAt updatedAt resolvedAt sla",
      )
      .sort({
        updatedAt: -1,
      })
      .lean();

    const ticketsWithSla = tickets.map((ticket) => ({
      ...ticket,
      slaStatus: getTicketSlaStatus(ticket),
    }));

    const totalTickets = ticketsWithSla.length;

    const openTickets = ticketsWithSla.filter((ticket) =>
      ["open", "in-progress", "waiting"].includes(
        String(ticket.status || "").toLowerCase(),
      ),
    ).length;

    const resolvedTickets = ticketsWithSla.filter((ticket) =>
      ["resolved", "closed"].includes(
        String(ticket.status || "").toLowerCase(),
      ),
    ).length;

    return res.status(200).json({
      success: true,

      customer: {
        _id: customer._id,

        name: customer.name || "",

        email: customer.email || "",

        avatar: customer.avatar || "",

        phone: customer.phone || "",

        company: customer.company || "",

        status: customer.status || "active",

        lastSeen: customer.lastSeen || null,

        createdAt: customer.createdAt || null,
      },

      stats: {
        totalTickets,
        openTickets,
        resolvedTickets,
      },

      tickets: ticketsWithSla,
    });
  } catch (error) {
    console.error("=================================");
    console.error("getAgentCustomerProfile ERROR");
    console.error(error);
    console.error("=================================");

    return res.status(500).json({
      success: false,
      message: "Failed to load customer profile",
      error: error.message,
    });
  }
};

/*
 * =========================================================
 * GET AGENT AVAILABILITY
 * =========================================================
 */

export const getAgentAvailability = async (req, res) => {
  try {
    const userId = getUserId(req);

    const role = getUserRole(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    if (!["agent", "admin"].includes(role)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to access agent availability.",
      });
    }

    const user = await User.findById(userId)
      .select("name email role availability lastSeen")
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Agent not found.",
      });
    }

    return res.status(200).json({
      success: true,

      availability: user.availability || "offline",

      lastSeen: user.lastSeen || null,

      user: {
        _id: user._id,

        name: user.name,

        email: user.email,

        role: user.role,

        availability: user.availability || "offline",

        lastSeen: user.lastSeen || null,
      },
    });
  } catch (error) {
    console.error("========================================");
    console.error("GET AGENT AVAILABILITY ERROR");
    console.error("MESSAGE:", error.message);
    console.error("NAME:", error.name);
    console.error("STACK:", error.stack);
    console.error("========================================");

    return res.status(500).json({
      success: false,
      message: "Failed to load agent availability.",
      error: error.message,
    });
  }
};

/*
 * =========================================================
 * UPDATE AGENT AVAILABILITY
 * =========================================================
 */

export const updateAgentAvailability = async (req, res) => {
  try {
    const userId = getUserId(req);

    const role = getUserRole(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    if (!["agent", "admin"].includes(role)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update agent availability.",
      });
    }

    const allowedAvailability = ["online", "away", "busy", "offline"];

    const availability = String(req.body?.availability || "")
      .trim()
      .toLowerCase();

    if (!allowedAvailability.includes(availability)) {
      return res.status(400).json({
        success: false,
        message: `Invalid availability. Allowed values: ${allowedAvailability.join(
          ", ",
        )}`,
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      {
        availability,
        lastSeen: new Date(),
      },
      {
        new: true,
        runValidators: true,
      },
    )
      .select("name email role availability lastSeen")
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Agent not found.",
      });
    }

    return res.status(200).json({
      success: true,

      message: "Agent availability updated successfully.",

      availability: user.availability,

      lastSeen: user.lastSeen,

      user: {
        _id: user._id,

        name: user.name,

        email: user.email,

        role: user.role,

        availability: user.availability,

        lastSeen: user.lastSeen,
      },
    });
  } catch (error) {
    console.error("========================================");
    console.error("UPDATE AGENT AVAILABILITY ERROR");
    console.error("MESSAGE:", error.message);
    console.error("NAME:", error.name);
    console.error("STACK:", error.stack);
    console.error("========================================");

    return res.status(500).json({
      success: false,
      message: "Failed to update agent availability.",
      error: error.message,
    });
  }
};

/*
 * =========================================================
 * AGENT ANALYTICS
 * =========================================================
 */

export const getAgentAnalytics = async (req, res) => {
  try {
    const agentId = getUserId(req);

    const role = getUserRole(req);

    if (!agentId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!["agent", "admin"].includes(role)) {
      return res.status(403).json({
        success: false,
        message: "Agent access required",
      });
    }

    const { range = "30d" } = req.query;

    const now = new Date();

    let startDate = null;

    if (range === "7d") {
      startDate = new Date(now);

      startDate.setDate(startDate.getDate() - 7);
    }

    if (range === "30d") {
      startDate = new Date(now);

      startDate.setDate(startDate.getDate() - 30);
    }

    if (range === "90d") {
      startDate = new Date(now);

      startDate.setDate(startDate.getDate() - 90);
    }

    const ticketFilter = {
      assignedAgent: agentId,
    };

    if (startDate) {
      ticketFilter.createdAt = {
        $gte: startDate,
        $lte: now,
      };
    }

    const tickets = await Ticket.find(ticketFilter)
      .select(
        [
          "ticketNumber",
          "status",
          "priority",
          "createdAt",
          "resolvedAt",
          "closedAt",
          "firstAgentResponseAt",
          "firstAgentResponseTime",
          "sla",
          "conversation",
        ].join(" "),
      )
      .sort({
        createdAt: -1,
      })
      .lean();

    /*
     * =======================================================
     * BASIC COUNTS
     * =======================================================
     */

    const ticketsHandled = tickets.length;

    const resolvedTickets = tickets.filter(
      (ticket) =>
        ticket.status === "resolved" ||
        ticket.status === "closed" ||
        ticket.resolvedAt ||
        ticket.closedAt,
    ).length;

    const openTickets = tickets.filter(
      (ticket) => ticket.status === "open",
    ).length;

    const inProgressTickets = tickets.filter(
      (ticket) => ticket.status === "in-progress",
    ).length;

    const waitingTickets = tickets.filter(
      (ticket) => ticket.status === "waiting",
    ).length;

    const closedTickets = tickets.filter(
      (ticket) => ticket.status === "closed",
    ).length;

    /*
     * =======================================================
     * RESOLUTION RATE
     * =======================================================
     */

    const resolutionRate =
      ticketsHandled > 0
        ? Math.round((resolvedTickets / ticketsHandled) * 100)
        : 0;

    /*
     * =======================================================
     * RESPONSE TIMES
     * =======================================================
     *
     * SLA firstRespondedAt is the canonical source.
     *
     * Legacy firstAgentResponseTime is used as fallback.
     */

    const responseTimes = [];

    tickets.forEach((ticket) => {
      /*
       * ---------------------------------------------------
       * CANONICAL SLA RESPONSE TIME
       * ---------------------------------------------------
       */

      if (ticket.sla?.firstRespondedAt && ticket.createdAt) {
        const responseTime =
          new Date(ticket.sla.firstRespondedAt).getTime() -
          new Date(ticket.createdAt).getTime();

        if (responseTime >= 0) {
          responseTimes.push(responseTime);

          return;
        }
      }

      /*
       * ---------------------------------------------------
       * LEGACY FIELD
       * ---------------------------------------------------
       */

      if (
        typeof ticket.firstAgentResponseTime === "number" &&
        ticket.firstAgentResponseTime >= 0
      ) {
        responseTimes.push(ticket.firstAgentResponseTime);

        return;
      }

      /*
       * ---------------------------------------------------
       * LEGACY CONVERSATION FALLBACK
       * ---------------------------------------------------
       */

      const conversation = Array.isArray(ticket.conversation)
        ? ticket.conversation
        : [];

      const firstCustomerMessage = conversation
        .filter(
          (message) =>
            message.senderRole === "customer" && message.isInternal !== true,
        )
        .sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        )[0];

      if (!firstCustomerMessage) {
        return;
      }

      /*
       * Admin and agent both count as human
       * responses.
       */
      const firstAgentReply = conversation
        .filter(
          (message) =>
            ["agent", "admin"].includes(message.senderRole) &&
            message.sender &&
            normalizeId(message.sender) === normalizeId(agentId) &&
            message.isInternal !== true &&
            new Date(message.createdAt).getTime() >
              new Date(firstCustomerMessage.createdAt).getTime(),
        )
        .sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        )[0];

      if (!firstAgentReply) {
        return;
      }

      const responseTime =
        new Date(firstAgentReply.createdAt).getTime() -
        new Date(firstCustomerMessage.createdAt).getTime();

      if (responseTime >= 0) {
        responseTimes.push(responseTime);
      }
    });

    /*
     * =======================================================
     * RESPONSE TIME CALCULATIONS
     * =======================================================
     */

    const totalResponseTime = responseTimes.reduce(
      (total, time) => total + time,
      0,
    );

    const averageResponseTime =
      responseTimes.length > 0
        ? Math.round(totalResponseTime / responseTimes.length)
        : 0;

    const fastestResponseTime =
      responseTimes.length > 0 ? Math.min(...responseTimes) : 0;

    const slowestResponseTime =
      responseTimes.length > 0 ? Math.max(...responseTimes) : 0;

    /*
     * =======================================================
     * FORMAT DURATION
     * =======================================================
     */

    const formatDuration = (milliseconds) => {
      if (!milliseconds || milliseconds < 0) {
        return "0m";
      }

      const totalSeconds = Math.floor(milliseconds / 1000);

      const hours = Math.floor(totalSeconds / 3600);

      const minutes = Math.floor((totalSeconds % 3600) / 60);

      const seconds = totalSeconds % 60;

      if (hours > 0) {
        return `${hours}h ${minutes}m`;
      }

      if (minutes > 0) {
        return `${minutes}m ${seconds}s`;
      }

      return `${seconds}s`;
    };

    /*
     * =======================================================
     * STATUS BREAKDOWN
     * =======================================================
     */

    const statusBreakdown = {
      open: openTickets,

      "in-progress": inProgressTickets,

      waiting: waitingTickets,

      resolved: tickets.filter((ticket) => ticket.status === "resolved").length,

      closed: closedTickets,
    };

    /*
     * =======================================================
     * PRIORITY BREAKDOWN
     * =======================================================
     */

    const priorityBreakdown = {
      low: tickets.filter((ticket) => ticket.priority === "low").length,

      medium: tickets.filter((ticket) => ticket.priority === "medium").length,

      high: tickets.filter((ticket) => ticket.priority === "high").length,

      urgent: tickets.filter((ticket) => ticket.priority === "urgent").length,
    };

    /*
     * =======================================================
     * SLA ANALYTICS
     * =======================================================
     */

    let responseSlaMet = 0;

    let responseSlaBreached = 0;

    let resolutionSlaMet = 0;

    let resolutionSlaBreached = 0;

    tickets.forEach((ticket) => {
      const slaStatus = getTicketSlaStatus(ticket, now);

      if (slaStatus?.responseStatus === "met") {
        responseSlaMet += 1;
      }

      if (slaStatus?.responseStatus === "breached") {
        responseSlaBreached += 1;
      }

      if (slaStatus?.resolutionStatus === "met") {
        resolutionSlaMet += 1;
      }

      if (slaStatus?.resolutionStatus === "breached") {
        resolutionSlaBreached += 1;
      }
    });

    const responseSlaTotal = responseSlaMet + responseSlaBreached;

    const resolutionSlaTotal = resolutionSlaMet + resolutionSlaBreached;

    const responseSlaCompliance =
      responseSlaTotal > 0
        ? Math.round((responseSlaMet / responseSlaTotal) * 100)
        : 0;

    const resolutionSlaCompliance =
      resolutionSlaTotal > 0
        ? Math.round((resolutionSlaMet / resolutionSlaTotal) * 100)
        : 0;

    /*
     * =======================================================
     * PERFORMANCE TREND
     * =======================================================
     */

    const trendMap = {};

    tickets.forEach((ticket) => {
      if (!ticket.createdAt) {
        return;
      }

      const date = new Date(ticket.createdAt);

      const key = date.toISOString().split("T")[0];

      if (!trendMap[key]) {
        trendMap[key] = {
          date: key,
          handled: 0,
          resolved: 0,
        };
      }

      trendMap[key].handled += 1;

      if (
        ticket.status === "resolved" ||
        ticket.status === "closed" ||
        ticket.resolvedAt ||
        ticket.closedAt
      ) {
        trendMap[key].resolved += 1;
      }
    });

    const trend = Object.values(trendMap)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-30);

    /*
     * =======================================================
     * RESPONSE RATE
     * =======================================================
     */

    const respondedTickets = responseTimes.length;

    const responseRate =
      ticketsHandled > 0
        ? Math.round((respondedTickets / ticketsHandled) * 100)
        : 0;

    /*
     * =======================================================
     * RESPONSE
     * =======================================================
     */

    return res.status(200).json({
      success: true,

      range,

      analytics: {
        ticketsHandled,

        resolvedTickets,

        openTickets,

        inProgressTickets,

        waitingTickets,

        closedTickets,

        resolutionRate,

        respondedTickets,

        responseRate,

        averageResponseTime,

        fastestResponseTime,

        slowestResponseTime,

        averageResponseTimeFormatted: formatDuration(averageResponseTime),

        fastestResponseTimeFormatted: formatDuration(fastestResponseTime),

        slowestResponseTimeFormatted: formatDuration(slowestResponseTime),

        /*
         * SLA metrics
         */
        responseSlaMet,

        responseSlaBreached,

        responseSlaCompliance,

        resolutionSlaMet,

        resolutionSlaBreached,

        resolutionSlaCompliance,

        statusBreakdown,

        priorityBreakdown,

        trend,
      },
    });
  } catch (error) {
    console.error("Get Agent Analytics Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load agent analytics",

      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
