import Ticket from "../models/Ticket.js";
import { getSocketIO, getTicketRoom } from "../socket/socket.js";

/*
 * =========================================================
 * HELPERS
 * =========================================================
 */

const getUserId = (req) => {
  return req.user?._id || req.user?.id;
};

const getUserRole = (req) => {
  return req.user?.role || "agent";
};

const normalizeId = (value) => {
  if (!value) return null;

  if (typeof value === "string") {
    return value;
  }

  return value.toString();
};

/*
 * Add an entry to ticket status history
 */
const addStatusHistory = ({
  ticket,
  status,
  changedBy,
  changedByRole = "agent",
  note = "",
}) => {
  if (!ticket) return;

  ticket.statusHistory.push({
    status,
    changedBy: changedBy || null,
    changedByRole,
    note,
    createdAt: new Date(),
  });
};

/*
 * Update lifecycle timestamps according to status
 */
const updateLifecycleTimestamps = (ticket, previousStatus, newStatus) => {
  const now = new Date();

  /*
   * RESOLVED
   */
  if (newStatus === "resolved") {
    ticket.resolvedAt = now;
    ticket.closedAt = null;
  }

  /*
   * CLOSED
   */
  if (newStatus === "closed") {
    ticket.closedAt = now;

    if (!ticket.resolvedAt) {
      ticket.resolvedAt = now;
    }
  }

  /*
   * REOPENED
   */
  if (
    ["resolved", "closed"].includes(previousStatus) &&
    !["resolved", "closed"].includes(newStatus)
  ) {
    ticket.reopenedAt = now;
    ticket.resolvedAt = null;
    ticket.closedAt = null;
  }

  /*
   * Moving away from resolved
   */
  if (
    previousStatus === "resolved" &&
    newStatus !== "resolved" &&
    newStatus !== "closed"
  ) {
    ticket.resolvedAt = null;
  }

  /*
   * Moving away from closed
   */
  if (previousStatus === "closed" && newStatus !== "closed") {
    ticket.closedAt = null;
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
     * Open tickets assigned to this agent
     */
    const openTickets = await Ticket.countDocuments({
      assignedAgent: agentId,
      status: "open",
    });

    /*
     * In-progress tickets assigned to this agent
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

    /*
     * Tickets waiting in the global queue
     */
    const queueCount = await Ticket.countDocuments({
      assignedAgent: null,
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

    return res.status(200).json({
      success: true,

      stats: {
        assignedTickets,
        openTickets,
        inProgressTickets,
        waitingTickets,
        resolvedToday,
        queueCount,
      },

      /*
       * These aliases make the frontend easier to support
       * even if it expects slightly different names.
       */
      assignedCount: assignedTickets,
      openCount: openTickets,
      inProgressCount: inProgressTickets,
      waitingCount: waitingTickets,
      resolvedTodayCount: resolvedToday,
      queueCount,

      recentTickets,
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
 * Returns unassigned tickets available for agents.
 *
 * Supported query parameters:
 *
 * ?search=
 * ?status=
 * ?priority=
 * ?page=
 * ?limit=
 * ?sortBy=
 * ?sortOrder=
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

    /*
     * Only tickets without an assigned agent
     */
    const query = {
      assignedAgent: null,
    };

    /*
     * Status filter
     */
    if (
      status &&
      ["open", "in-progress", "waiting", "resolved", "closed"].includes(status)
    ) {
      query.status = status;
    } else {
      /*
       * By default only actionable tickets
       */
      query.status = {
        $in: ["open", "waiting"],
      };
    }

    /*
     * Priority filter
     */
    if (priority && ["low", "medium", "high"].includes(priority)) {
      query.priority = priority;
    }

    /*
     * Search
     */
    if (search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");

      query.$or = [
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

    /*
     * Safe sorting
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

    const sort = {
      [safeSortBy]: safeSortOrder,
    };

    /*
     * Priority ordering
     *
     * MongoDB's normal alphabetical order isn't ideal:
     *
     * high
     * low
     * medium
     *
     * So we fetch and then sort priority in memory
     * when priority sorting is requested.
     */

    const total = await Ticket.countDocuments(query);

    let tickets = await Ticket.find(query)
      .populate("customer", "name email avatar profileImage")
      .populate("assignedAgent", "name email avatar profileImage")
      .sort(sort)
      .skip((currentPage - 1) * pageLimit)
      .limit(pageLimit)
      .lean();

    /*
     * Priority sorting
     */
    if (safeSortBy === "priority") {
      const priorityOrder = {
        high: 1,
        medium: 2,
        low: 3,
      };

      tickets.sort(
        (a, b) =>
          (priorityOrder[a.priority] || 99) - (priorityOrder[b.priority] || 99),
      );

      if (safeSortOrder === -1) {
        tickets.reverse();
      }
    }

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
    console.error("GET TICKET QUEUE ERROR:", error);

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
    const agentId = getUserId(req);

    if (!agentId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const {
      search = "",
      status,
      priority,
      page = 1,
      limit = 20,
      sortBy = "updatedAt",
      sortOrder = "desc",
    } = req.query;

    const currentPage = Math.max(Number(page) || 1, 1);

    const pageLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);

    const query = {
      assignedAgent: agentId,
    };

    /*
     * Status
     */
    if (
      status &&
      ["open", "in-progress", "waiting", "resolved", "closed"].includes(status)
    ) {
      query.status = status;
    }

    /*
     * Priority
     */
    if (priority && ["low", "medium", "high"].includes(priority)) {
      query.priority = priority;
    }

    /*
     * Search
     */
    if (search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");

      query.$or = [
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

    const allowedSortFields = [
      "createdAt",
      "updatedAt",
      "priority",
      "status",
      "ticketNumber",
    ];

    const safeSortBy = allowedSortFields.includes(sortBy)
      ? sortBy
      : "updatedAt";

    const safeSortOrder = String(sortOrder).toLowerCase() === "asc" ? 1 : -1;

    const total = await Ticket.countDocuments(query);

    const tickets = await Ticket.find(query)
      .populate("customer", "name email avatar profileImage")
      .populate("assignedAgent", "name email avatar profileImage")
      .sort({
        [safeSortBy]: safeSortOrder,
      })
      .skip((currentPage - 1) * pageLimit)
      .limit(pageLimit)
      .lean();

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
    console.error("GET ASSIGNED TICKETS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load assigned tickets",
      error: error.message,
    });
  }
};

/*
 * =========================================================
 * GET SINGLE AGENT TICKET
 * =========================================================
 */

export const getAgentTicketById = async (req, res) => {
  try {
    const agentId = getUserId(req);
    const role = getUserRole(req);

    const { ticketId } = req.params;

    const ticket = await Ticket.findById(ticketId)
      .populate("customer", "name email avatar profileImage phone")
      .populate("assignedAgent", "name email avatar profileImage")
      .populate("conversation.sender", "name email avatar profileImage role");

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    /*
     * Admin can access any ticket.
     *
     * Agent can access:
     * 1. Their assigned tickets
     * 2. Unassigned tickets
     */
    const assignedAgentId = normalizeId(
      ticket.assignedAgent?._id || ticket.assignedAgent,
    );

    const currentAgentId = normalizeId(agentId);

    const isAdmin = role === "admin";

    const isAssignedToCurrentAgent = assignedAgentId === currentAgentId;

    const isUnassigned = !ticket.assignedAgent;

    if (!isAdmin && !isAssignedToCurrentAgent && !isUnassigned) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this ticket",
      });
    }

    return res.status(200).json({
      success: true,
      ticket,
    });
  } catch (error) {
    console.error("GET AGENT TICKET ERROR:", error);

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

    const ticket = await Ticket.findById(ticketId);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    /*
     * Already assigned to another agent
     */
    if (
      ticket.assignedAgent &&
      normalizeId(ticket.assignedAgent) !== normalizeId(agentId)
    ) {
      /*
       * Admin can reassign.
       * Normal agents cannot steal an assigned ticket.
       */
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
     * When claiming an open/waiting ticket,
     * move it into the agent's working state.
     */
    if (["open", "waiting"].includes(ticket.status)) {
      ticket.status = "in-progress";
    }

    /*
     * Record assignment
     */
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

    /*
     * Update timestamps when status changes
     */
    if (previousStatus !== ticket.status) {
      updateLifecycleTimestamps(ticket, previousStatus, ticket.status);
    }

    await ticket.save();

    await ticket.populate("customer", "name email avatar profileImage");

    await ticket.populate("assignedAgent", "name email avatar profileImage");

    return res.status(200).json({
      success: true,
      message: "Ticket assigned successfully",
      ticket,
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

    const ticket = await Ticket.findById(ticketId);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    /*
     * Agents can only modify:
     * - their own assigned tickets
     * - unassigned tickets
     *
     * Admin can modify any ticket.
     */
    const assignedAgentId = normalizeId(ticket.assignedAgent);

    const currentAgentId = normalizeId(agentId);

    const hasAccess =
      role === "admin" ||
      !ticket.assignedAgent ||
      assignedAgentId === currentAgentId;

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: "You cannot update another agent's ticket",
      });
    }

    /*
     * Automatically assign when agent updates
     * an unassigned ticket.
     */
    if (!ticket.assignedAgent) {
      ticket.assignedAgent = agentId;
    }

    const previousStatus = ticket.status;

    /*
     * Nothing changed
     */
    if (previousStatus === status) {
      await ticket.populate("customer", "name email avatar profileImage");

      await ticket.populate("assignedAgent", "name email avatar profileImage");

      return res.status(200).json({
        success: true,
        message: "Ticket status unchanged",
        ticket,
      });
    }

    ticket.status = status;

    /*
     * Lifecycle timestamps
     */
    updateLifecycleTimestamps(ticket, previousStatus, status);

    /*
     * Status history
     */
    addStatusHistory({
      ticket,
      status,
      changedBy: agentId,
      changedByRole: role,
      note: `Status changed from ${previousStatus} to ${status}`,
    });

    await ticket.save();

    await ticket.populate("customer", "name email avatar profileImage");

    await ticket.populate("assignedAgent", "name email avatar profileImage");

    return res.status(200).json({
      success: true,
      message: "Ticket status updated successfully",
      ticket,
    });
  } catch (error) {
    console.error("UPDATE TICKET STATUS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update ticket status",
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

    const allowedPriorities = ["low", "medium", "high"];

    if (!allowedPriorities.includes(priority)) {
      return res.status(400).json({
        success: false,
        message: `Invalid priority. Allowed priorities: ${allowedPriorities.join(
          ", ",
        )}`,
      });
    }

    const ticket = await Ticket.findById(ticketId);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    /*
     * Access control
     */
    const assignedAgentId = normalizeId(ticket.assignedAgent);

    const currentAgentId = normalizeId(agentId);

    const hasAccess =
      role === "admin" ||
      !ticket.assignedAgent ||
      assignedAgentId === currentAgentId;

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: "You cannot update another agent's ticket",
      });
    }

    /*
     * Automatically assign unassigned ticket
     */
    if (!ticket.assignedAgent) {
      ticket.assignedAgent = agentId;
    }

    const previousPriority = ticket.priority;

    ticket.priority = priority;

    /*
     * Record priority change in status history.
     *
     * The schema's statusHistory requires a valid status,
     * so we keep the current status while documenting
     * the priority change in the note.
     */
    if (previousPriority !== priority) {
      addStatusHistory({
        ticket,
        status: ticket.status,
        changedBy: agentId,
        changedByRole: role,
        note: `Priority changed from ${previousPriority} to ${priority}`,
      });
    }

    await ticket.save();

    await ticket.populate("customer", "name email avatar profileImage");

    await ticket.populate("assignedAgent", "name email avatar profileImage");

    return res.status(200).json({
      success: true,
      message: "Ticket priority updated successfully",
      ticket,
    });
  } catch (error) {
    console.error("UPDATE TICKET PRIORITY ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update ticket priority",
      error: error.message,
    });
  }
};

/*
 * =========================================================
 * SEND AGENT REPLY
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

    if (!cleanMessage && files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Reply message or attachment is required.",
      });
    }

    const ticket = await Ticket.findById(ticketId);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found.",
      });
    }

    /*
     * =======================================================
     * ACCESS CONTROL
     * =======================================================
     */

    const agentId = normalizeId(ticket.assignedAgent);
    const currentUserId = normalizeId(userId);

    const isAdmin = userRole === "admin";
    const isAssignedAgent = agentId && currentUserId === agentId;

    const isUnassigned = !ticket.assignedAgent;

    if (!isAdmin && !isAssignedAgent && !isUnassigned) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to reply to this ticket.",
      });
    }

    /*
     * =======================================================
     * AUTO ASSIGN
     * =======================================================
     */

    if (!ticket.assignedAgent && userId) {
      ticket.assignedAgent = userId;

      await addStatusHistory(
        ticket,
        "in-progress",
        userId,
        userRole === "admin" ? "admin" : "agent",
        "Ticket automatically assigned when agent replied.",
      );
    }

    /*
     * =======================================================
     * BUILD ATTACHMENTS
     * =======================================================
     */

    const attachments = files.map((file) => ({
      filename: file.filename || file.originalname || "",
      originalName: file.originalname || file.filename || "",
      mimetype: file.mimetype || "",
      size: file.size || 0,
      path: file.path || file.filename || "",
      uploadedAt: new Date(),
    }));

    /*
     * =======================================================
     * ADD CONVERSATION MESSAGE
     * =======================================================
     */

    ticket.conversation.push({
      sender: userId,
      senderRole: userRole === "admin" ? "admin" : "agent",
      message: cleanMessage || "Attachment",
      attachments,
      isRead: false,
      createdAt: new Date(),
    });

    /*
     * =======================================================
     * UPDATE REPLY COUNTER
     * =======================================================
     */

    ticket.replies = Number(ticket.replies || 0) + 1;

    ticket.lastReplyAt = new Date();

    /*
     * =======================================================
     * STATUS
     * =======================================================
     */

    if (
      ticket.status === "open" ||
      ticket.status === "waiting" ||
      ticket.status === "resolved" ||
      ticket.status === "closed"
    ) {
      const previousStatus = ticket.status;

      ticket.status = "in-progress";

      updateLifecycleTimestamps(ticket, previousStatus, "in-progress");

      await addStatusHistory(
        ticket,
        "in-progress",
        userId,
        userRole === "admin" ? "admin" : "agent",
        "Ticket moved to In Progress after agent reply.",
      );
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
        select: "name email avatar phone company",
      },
      {
        path: "assignedAgent",
        select: "name email avatar phone",
      },
      {
        path: "conversation.sender",
        select: "name email avatar role",
      },
    ]);

    /*
     * =======================================================
     * SOCKET.IO
     * =======================================================
     */

    const io = getSocketIO();

    if (io) {
      const room = getTicketRoom(ticket._id);

      io.to(room).emit("ticket:message", {
        ticketId: ticket._id.toString(),
        message: ticket.conversation[ticket.conversation.length - 1],
      });

      io.to(room).emit("ticket:update", {
        ticket,
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
