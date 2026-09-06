import Ticket from "../models/Ticket.js";
import { getSocketIO, getTicketRoom } from "../socket/socket.js";

/*
 * =========================================================
 * HELPERS
 * =========================================================
 */
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
    const userId = req.user?._id || req.user?.id;

    if (!userId) {
      return res.status(401).json({
        message: "Authentication required.",
      });
    }

    const { page = 1, limit = 10, status, priority, search } = req.query;

    const pageNumber = Math.max(Number(page) || 1, 1);
    const limitNumber = Math.min(Math.max(Number(limit) || 10, 1), 100);

    /*
     * =========================================================
     * ONLY RETURN TICKETS ASSIGNED TO THE CURRENT AGENT
     * =========================================================
     */
    const filter = {
      assignedAgent: userId,
    };

    /*
     * Status filter
     */
    if (status && status !== "all") {
      filter.status = status;
    }

    /*
     * Priority filter
     */
    if (priority && priority !== "all") {
      filter.priority = priority;
    }

    /*
     * Search
     */
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
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limitNumber)
        .lean(),

      Ticket.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      tickets,
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
 * Admin:
 *   Can access any ticket.
 *
 * Agent:
 *   Can access ONLY tickets assigned to the
 *   currently authenticated agent.
 *
 * This keeps the Assigned Tickets page and
 * Ticket Details page consistent.
 * =========================================================
 */

export const getAgentTicketById = async (req, res) => {
  try {
    const agentId = getUserId(req);
    const role = getUserRole(req);
    const { ticketId } = req.params;

    // =======================================================
    // AUTHENTICATION
    // =======================================================

    if (!agentId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // =======================================================
    // VALIDATE TICKET ID
    // =======================================================

    if (!ticketId || !mongoose.Types.ObjectId.isValid(ticketId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ticket ID",
      });
    }

    // =======================================================
    // FIND TICKET
    // =======================================================

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

    // =======================================================
    // ADMIN ACCESS
    // =======================================================

    if (role === "admin") {
      return res.status(200).json({
        success: true,
        ticket,
      });
    }

    // =======================================================
    // AGENT OWNERSHIP CHECK
    // =======================================================

    const assignedAgentId = normalizeId(
      ticket.assignedAgent?._id || ticket.assignedAgent,
    );

    const currentAgentId = normalizeId(agentId);

    // -------------------------------------------------------
    // TICKET IS UNASSIGNED
    // -------------------------------------------------------

    if (!assignedAgentId) {
      return res.status(403).json({
        success: false,
        message: "This ticket is not assigned to you",
      });
    }

    // -------------------------------------------------------
    // TICKET BELONGS TO ANOTHER AGENT
    // -------------------------------------------------------

    if (assignedAgentId !== currentAgentId) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this ticket",
      });
    }

    // =======================================================
    // CURRENT AGENT OWNS THE TICKET
    // =======================================================

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

    // =======================================================
    // AUTHENTICATION
    // =======================================================

    if (!agentId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    // =======================================================
    // VALIDATE STATUS
    // =======================================================

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

    // =======================================================
    // FIND TICKET
    // =======================================================

    const ticket = await Ticket.findById(ticketId);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found.",
      });
    }

    // =======================================================
    // OWNERSHIP / ACCESS CONTROL
    // =======================================================

    const assignedAgentId = normalizeId(ticket.assignedAgent);
    const currentAgentId = normalizeId(agentId);

    const isAdmin = role === "admin";
    const isUnassigned = !assignedAgentId;
    const isAssignedAgent = assignedAgentId === currentAgentId;

    /*
     * ADMIN
     * Can update any ticket.
     *
     * CURRENT AGENT
     * Can update their own ticket.
     *
     * UNASSIGNED
     * Agent can update it and will automatically become
     * the assigned agent.
     *
     * ANOTHER AGENT
     * Cannot update the ticket.
     */
    if (!isAdmin && !isAssignedAgent && !isUnassigned) {
      return res.status(403).json({
        success: false,
        message: "You cannot update another agent's ticket.",
      });
    }

    // =======================================================
    // AUTO ASSIGN UNASSIGNED TICKET
    // =======================================================

    if (isUnassigned) {
      ticket.assignedAgent = agentId;
    }

    // =======================================================
    // PREVIOUS STATUS
    // =======================================================

    const previousStatus = ticket.status;

    // =======================================================
    // STATUS UNCHANGED
    // =======================================================

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
      });
    }

    // =======================================================
    // UPDATE STATUS
    // =======================================================

    ticket.status = status;

    // =======================================================
    // LIFECYCLE TIMESTAMPS
    // =======================================================

    updateLifecycleTimestamps(ticket, previousStatus, status);

    // =======================================================
    // STATUS HISTORY
    // =======================================================

    addStatusHistory({
      ticket,
      status,
      changedBy: agentId,
      changedByRole: isAdmin ? "admin" : "agent",
      note: `Status changed from ${previousStatus} to ${status}`,
    });

    // =======================================================
    // SAVE
    // =======================================================

    await ticket.save();

    // =======================================================
    // POPULATE
    // =======================================================

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

    // =======================================================
    // SOCKET.IO
    // =======================================================

    const io = getSocketIO();

    if (io) {
      const room = getTicketRoom(ticket._id);

      io.to(room).emit("ticket:update", {
        ticket,
      });
    }

    // =======================================================
    // RESPONSE
    // =======================================================

    return res.status(200).json({
      success: true,
      message: "Ticket status updated successfully.",
      ticket,
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

    /*
     * Authentication check
     */
    if (!agentId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    /*
     * Validate priority
     */
    const allowedPriorities = ["low", "medium", "high", "urgent"];

    if (!allowedPriorities.includes(priority)) {
      return res.status(400).json({
        success: false,
        message: `Invalid priority. Allowed priorities: ${allowedPriorities.join(
          ", ",
        )}`,
      });
    }

    /*
     * Find ticket
     */
    const ticket = await Ticket.findById(ticketId);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found.",
      });
    }

    /*
     * =========================================================
     * ACCESS CONTROL
     * =========================================================
     *
     * Admin:
     *   Can update any ticket.
     *
     * Assigned agent:
     *   Can update their own ticket.
     *
     * Unassigned:
     *   Current agent can update it and it will automatically
     *   become assigned to them.
     *
     * Another agent:
     *   Access denied.
     */

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
     * =========================================================
     * AUTOMATIC ASSIGNMENT
     * =========================================================
     *
     * If the ticket has no assigned agent, assign it to the
     * current authenticated user.
     */
    if (!ticket.assignedAgent) {
      ticket.assignedAgent = agentId;

      addStatusHistory({
        ticket,
        status: ticket.status,
        changedBy: agentId,
        changedByRole: isAdmin ? "admin" : "agent",
        note: "Ticket automatically assigned when priority was updated.",
      });
    }

    /*
     * =========================================================
     * CHECK IF PRIORITY IS ALREADY THE SAME
     * =========================================================
     */
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
      });
    }

    /*
     * =========================================================
     * UPDATE PRIORITY
     * =========================================================
     */
    ticket.priority = priority;

    /*
     * =========================================================
     * RECORD PRIORITY CHANGE
     * =========================================================
     *
     * statusHistory requires a valid status, so we keep the
     * current ticket status and describe the priority change
     * inside the note.
     */
    addStatusHistory({
      ticket,
      status: ticket.status,
      changedBy: agentId,
      changedByRole: isAdmin ? "admin" : "agent",
      note: `Priority changed from ${previousPriority || "none"} to ${priority}.`,
    });

    /*
     * Save ticket
     */
    await ticket.save();

    /*
     * Populate related users
     */
    await ticket.populate(
      "customer",
      "name email avatar profileImage phone company",
    );

    await ticket.populate(
      "assignedAgent",
      "name email avatar profileImage phone company role",
    );

    /*
     * =========================================================
     * SOCKET.IO UPDATE
     * =========================================================
     */
    const io = getSocketIO();

    if (io) {
      const room = getTicketRoom(ticket._id);

      io.to(room).emit("ticket:update", {
        ticket,
      });
    }

    /*
     * =========================================================
     * RESPONSE
     * =========================================================
     */
    return res.status(200).json({
      success: true,
      message: "Ticket priority updated successfully.",
      ticket,
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
 */

export const sendAgentReply = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { message = "" } = req.body;

    const userId = getUserId(req);
    const userRole = getUserRole(req);

    const cleanMessage = String(message || "").trim();

    const files = Array.isArray(req.files) ? req.files : [];

    // =======================================================
    // AUTHENTICATION
    // =======================================================

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    // =======================================================
    // MESSAGE / ATTACHMENT VALIDATION
    // =======================================================

    if (!cleanMessage && files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Reply message or attachment is required.",
      });
    }

    // =======================================================
    // FIND TICKET
    // =======================================================

    const ticket = await Ticket.findById(ticketId);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found.",
      });
    }

    // =======================================================
    // ACCESS CONTROL
    // =======================================================

    const assignedAgentId = normalizeId(ticket.assignedAgent);
    const currentUserId = normalizeId(userId);

    const isAdmin = userRole === "admin";

    const isAssignedAgent =
      assignedAgentId && currentUserId === assignedAgentId;

    const isUnassigned = !assignedAgentId;

    /*
     * Admin:
     * Can reply to any ticket.
     *
     * Assigned agent:
     * Can reply to their own ticket.
     *
     * Unassigned:
     * Can reply and will automatically become assigned.
     *
     * Another agent:
     * Cannot reply.
     */
    if (!isAdmin && !isAssignedAgent && !isUnassigned) {
      return res.status(403).json({
        success: false,
        message: "You cannot reply to a ticket assigned to another agent.",
      });
    }

    // =======================================================
    // AUTO ASSIGN UNASSIGNED TICKET
    // =======================================================

    if (isUnassigned) {
      ticket.assignedAgent = userId;

      addStatusHistory({
        ticket,
        status: "in-progress",
        changedBy: userId,
        changedByRole: isAdmin ? "admin" : "agent",
        note: "Ticket automatically assigned when agent replied.",
      });
    }

    // =======================================================
    // BUILD ATTACHMENTS
    // =======================================================

    const attachments = files.map((file) => ({
      filename: file.filename || file.originalname || "",
      originalName: file.originalname || file.filename || "",
      mimetype: file.mimetype || "",
      size: file.size || 0,
      path: file.path || file.filename || "",
      uploadedAt: new Date(),
    }));

    // =======================================================
    // ADD CONVERSATION MESSAGE
    // =======================================================

    ticket.conversation.push({
      sender: userId,
      senderRole: isAdmin ? "admin" : "agent",
      message: cleanMessage || "Attachment",
      attachments,
      isRead: false,
      createdAt: new Date(),
    });

    // =======================================================
    // UPDATE REPLY COUNTER
    // =======================================================

    ticket.replies = Number(ticket.replies || 0) + 1;
    ticket.lastReplyAt = new Date();

    // =======================================================
    // STATUS
    // =======================================================

    if (
      ticket.status === "open" ||
      ticket.status === "waiting" ||
      ticket.status === "resolved" ||
      ticket.status === "closed"
    ) {
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

    // =======================================================
    // SAVE
    // =======================================================

    await ticket.save();

    // =======================================================
    // POPULATE
    // =======================================================

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

    // =======================================================
    // SOCKET.IO
    // =======================================================

    const io = getSocketIO();

    if (io) {
      const room = getTicketRoom(ticket._id);

      const latestMessage = ticket.conversation[ticket.conversation.length - 1];

      io.to(room).emit("ticket:message", {
        ticketId: ticket._id.toString(),
        message: latestMessage,
      });

      io.to(room).emit("ticket:update", {
        ticket,
      });
    }

    // =======================================================
    // RESPONSE
    // =======================================================

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

    // Only tickets that already have an agent.
    const filter = {
      assignedAgent: {
        $ne: null,
      },
    };

    // STATUS FILTER
    if (
      status &&
      status !== "all" &&
      ["open", "in-progress", "waiting", "resolved", "closed"].includes(status)
    ) {
      filter.status = status;
    }

    // PRIORITY FILTER
    if (
      priority &&
      priority !== "all" &&
      ["low", "medium", "high"].includes(priority)
    ) {
      filter.priority = priority;
    }

    // AGENT FILTER
    if (agentId && agentId !== "all") {
      filter.assignedAgent = agentId;
    }

    // SEARCH
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

    return res.status(200).json({
      success: true,

      tickets,

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

// //
//   MY-TICKETS
//  //

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
     * Always use the authenticated user's ID.
     *
     * The frontend cannot choose which agent's
     * tickets to retrieve.
     */
    const filter = {
      assignedAgent: agentId,
    };

    /* =====================================================
       STATUS
    ===================================================== */

    if (
      status &&
      status !== "all" &&
      ["open", "in-progress", "waiting", "resolved", "closed"].includes(status)
    ) {
      filter.status = status;
    }

    /* =====================================================
       PRIORITY
    ===================================================== */

    if (
      priority &&
      priority !== "all" &&
      ["low", "medium", "high", "urgent"].includes(priority)
    ) {
      filter.priority = priority;
    }

    /* =====================================================
       SEARCH
    ===================================================== */

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
