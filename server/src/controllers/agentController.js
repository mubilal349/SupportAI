import Ticket from "../models/Ticket.js";

/*
 * =========================================================
 * HELPER
 * =========================================================
 */

const getAgentId = (req) => {
  return req.user?._id || req.user?.id;
};

/*
 * =========================================================
 * AGENT DASHBOARD
 * =========================================================
 */

export const getAgentDashboard = async (req, res) => {
  try {
    const agentId = getAgentId(req);

    const startOfToday = new Date();

    startOfToday.setHours(0, 0, 0, 0);

    const [assigned, open, inProgress, resolvedToday, recentTickets] =
      await Promise.all([
        Ticket.countDocuments({
          assignedAgent: agentId,
          status: {
            $nin: ["closed"],
          },
        }),

        Ticket.countDocuments({
          assignedAgent: agentId,
          status: "open",
        }),

        Ticket.countDocuments({
          assignedAgent: agentId,
          status: "in_progress",
        }),

        Ticket.countDocuments({
          assignedAgent: agentId,
          status: "resolved",
          updatedAt: {
            $gte: startOfToday,
          },
        }),

        Ticket.find({
          assignedAgent: agentId,
        })
          .populate("customer", "name email avatar")
          .populate("createdBy", "name email avatar")
          .sort({
            updatedAt: -1,
          })
          .limit(5),
      ]);

    return res.status(200).json({
      success: true,

      stats: {
        assigned,
        open,
        inProgress,
        resolvedToday,
      },

      recentTickets,
    });
  } catch (error) {
    console.error("Agent dashboard error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load agent dashboard.",
    });
  }
};

/*
 * =========================================================
 * GET UNASSIGNED TICKET QUEUE
 * =========================================================
 */

export const getTicketQueue = async (req, res) => {
  try {
    const { priority, status, search } = req.query;

    const query = {
      $or: [
        {
          assignedAgent: null,
        },
        {
          assignedAgent: {
            $exists: false,
          },
        },
      ],
    };

    if (priority && priority !== "all") {
      query.priority = priority;
    }

    if (status && status !== "all") {
      query.status = status;
    }

    if (search?.trim()) {
      query.$and = [
        {
          $or: [
            {
              subject: {
                $regex: search.trim(),
                $options: "i",
              },
            },

            {
              ticketNumber: {
                $regex: search.trim(),
                $options: "i",
              },
            },
          ],
        },
      ];
    }

    const tickets = await Ticket.find(query)
      .populate("customer", "name email avatar")
      .populate("createdBy", "name email avatar")
      .sort({
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,
      count: tickets.length,
      tickets,
    });
  } catch (error) {
    console.error("Ticket queue error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load ticket queue.",
    });
  }
};

/*
 * =========================================================
 * GET AGENT ASSIGNED TICKETS
 * =========================================================
 */

export const getAssignedTickets = async (req, res) => {
  try {
    const agentId = getAgentId(req);

    const { status, priority, search } = req.query;

    const query = {
      assignedAgent: agentId,
    };

    if (status && status !== "all") {
      query.status = status;
    }

    if (priority && priority !== "all") {
      query.priority = priority;
    }

    if (search?.trim()) {
      query.$or = [
        {
          subject: {
            $regex: search.trim(),
            $options: "i",
          },
        },

        {
          ticketNumber: {
            $regex: search.trim(),
            $options: "i",
          },
        },
      ];
    }

    const tickets = await Ticket.find(query)
      .populate("customer", "name email avatar")
      .populate("createdBy", "name email avatar")
      .sort({
        updatedAt: -1,
      });

    return res.status(200).json({
      success: true,
      count: tickets.length,
      tickets,
    });
  } catch (error) {
    console.error("Assigned tickets error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load assigned tickets.",
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
    const agentId = getAgentId(req);

    const ticket = await Ticket.findById(req.params.ticketId)
      .populate("customer", "name email avatar")
      .populate("createdBy", "name email avatar")
      .populate("assignedAgent", "name email avatar role")
      .populate("messages.sender", "name email avatar role");

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found.",
      });
    }

    const assignedAgentId =
      ticket.assignedAgent?._id?.toString() || ticket.assignedAgent?.toString();

    const isAssignedAgent = assignedAgentId === agentId.toString();

    const isAdmin = req.user.role === "admin";

    const isUnassigned = !ticket.assignedAgent;

    if (!isAssignedAgent && !isAdmin && !isUnassigned) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this ticket.",
      });
    }

    return res.status(200).json({
      success: true,
      ticket,
    });
  } catch (error) {
    console.error("Get agent ticket error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load ticket.",
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
    const agentId = getAgentId(req);

    const ticket = await Ticket.findById(req.params.ticketId);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found.",
      });
    }

    if (
      ticket.assignedAgent &&
      ticket.assignedAgent.toString() !== agentId.toString()
    ) {
      return res.status(409).json({
        success: false,
        message: "This ticket has already been assigned to another agent.",
      });
    }

    ticket.assignedAgent = agentId;
    ticket.assignedAt = new Date();

    if (ticket.status === "open") {
      ticket.status = "in_progress";
    }

    await ticket.save();

    const populatedTicket = await Ticket.findById(ticket._id)
      .populate("customer", "name email avatar")
      .populate("createdBy", "name email avatar")
      .populate("assignedAgent", "name email avatar role");

    return res.status(200).json({
      success: true,
      message: "Ticket assigned successfully.",
      ticket: populatedTicket,
    });
  } catch (error) {
    console.error("Assign ticket error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to assign ticket.",
    });
  }
};

/*
 * =========================================================
 * UPDATE STATUS
 * =========================================================
 */

export const updateTicketStatus = async (req, res) => {
  try {
    const agentId = getAgentId(req);

    const { status } = req.body;

    const allowedStatuses = [
      "open",
      "in_progress",
      "waiting_customer",
      "resolved",
      "closed",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ticket status.",
      });
    }

    const ticket = await Ticket.findById(req.params.ticketId);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found.",
      });
    }

    if (
      req.user.role !== "admin" &&
      ticket.assignedAgent?.toString() !== agentId.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Only the assigned agent can update this ticket.",
      });
    }

    ticket.status = status;

    if (status === "resolved") {
      ticket.resolvedAt = new Date();
    }

    if (status === "closed") {
      ticket.closedAt = new Date();
    }

    await ticket.save();

    return res.status(200).json({
      success: true,
      message: "Ticket status updated.",
      ticket,
    });
  } catch (error) {
    console.error("Update status error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update ticket status.",
    });
  }
};

/*
 * =========================================================
 * UPDATE PRIORITY
 * =========================================================
 */

export const updateTicketPriority = async (req, res) => {
  try {
    const agentId = getAgentId(req);

    const { priority } = req.body;

    const allowedPriorities = ["low", "medium", "high", "urgent"];

    if (!allowedPriorities.includes(priority)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ticket priority.",
      });
    }

    const ticket = await Ticket.findById(req.params.ticketId);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found.",
      });
    }

    if (
      req.user.role !== "admin" &&
      ticket.assignedAgent?.toString() !== agentId.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Only the assigned agent can update this ticket.",
      });
    }

    ticket.priority = priority;

    await ticket.save();

    return res.status(200).json({
      success: true,
      message: "Ticket priority updated.",
      ticket,
    });
  } catch (error) {
    console.error("Update priority error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update priority.",
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
    const agentId = getAgentId(req);

    const { message, attachments = [] } = req.body;

    if (!message?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Reply message is required.",
      });
    }

    const ticket = await Ticket.findById(req.params.ticketId);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found.",
      });
    }

    if (
      req.user.role !== "admin" &&
      ticket.assignedAgent?.toString() !== agentId.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "This ticket is not assigned to you.",
      });
    }

    if (!ticket.messages) {
      ticket.messages = [];
    }

    ticket.messages.push({
      sender: agentId,
      senderRole: "agent",
      message: message.trim(),
      attachments,
      createdAt: new Date(),
    });

    if (ticket.status === "open" || ticket.status === "waiting_customer") {
      ticket.status = "in_progress";
    }

    await ticket.save();

    return res.status(201).json({
      success: true,
      message: "Reply sent successfully.",
      ticket,
    });
  } catch (error) {
    console.error("Agent reply error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to send reply.",
    });
  }
};
