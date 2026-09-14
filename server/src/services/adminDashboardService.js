import User from "../models/User.js";
import Ticket from "../models/Ticket.js";

// ============================================================
// ADMIN DASHBOARD SERVICE
// ============================================================

const getAdminDashboardStats = async () => {
  // ==========================================================
  // USER STATISTICS
  // ==========================================================

  const [totalUsers, totalCustomers, totalAgents, totalAdmins, activeAgents] =
    await Promise.all([
      User.countDocuments(),

      User.countDocuments({
        role: "customer",
      }),

      User.countDocuments({
        role: "agent",
      }),

      User.countDocuments({
        role: "admin",
      }),

      User.countDocuments({
        role: "agent",
        status: "online",
      }),
    ]);

  // ==========================================================
  // TICKET STATISTICS
  // ==========================================================

  const [
    totalTickets,
    openTickets,
    inProgressTickets,
    waitingTickets,
    resolvedTickets,
    closedTickets,
    escalatedTickets,
    unassignedTickets,
  ] = await Promise.all([
    Ticket.countDocuments(),

    Ticket.countDocuments({
      status: "open",
    }),

    Ticket.countDocuments({
      status: "in-progress",
    }),

    Ticket.countDocuments({
      status: "waiting",
    }),

    Ticket.countDocuments({
      status: "resolved",
    }),

    Ticket.countDocuments({
      status: "closed",
    }),

    Ticket.countDocuments({
      "escalation.isEscalated": true,
    }),

    Ticket.countDocuments({
      assignedAgent: null,
      status: {
        $in: ["open", "in-progress", "waiting"],
      },
    }),
  ]);

  // ==========================================================
  // AI STATISTICS
  // ==========================================================

  const aiAssistedTickets = await Ticket.countDocuments({
    conversation: {
      $elemMatch: {
        senderRole: "ai",
      },
    },
  });

  /*
   * Your Ticket schema does not have an explicit aiResolved
   * field.
   *
   * Portfolio-friendly heuristic:
   *
   * - Ticket is resolved or closed
   * - AI participated
   * - No agent reply exists
   */

  const aiResolvedTickets = await Ticket.countDocuments({
    status: {
      $in: ["resolved", "closed"],
    },

    conversation: {
      $elemMatch: {
        senderRole: "ai",
      },
    },

    $nor: [
      {
        conversation: {
          $elemMatch: {
            senderRole: "agent",
          },
        },
      },
    ],
  });

  const aiResolutionRate =
    aiAssistedTickets > 0
      ? Number(((aiResolvedTickets / aiAssistedTickets) * 100).toFixed(1))
      : 0;

  // ==========================================================
  // CUSTOMER SATISFACTION
  // ==========================================================

  const satisfactionResult = await Ticket.aggregate([
    {
      $match: {
        $or: [
          {
            customerRating: {
              $ne: null,
            },
          },
          {
            "satisfaction.rating": {
              $ne: null,
            },
          },
        ],
      },
    },

    {
      $project: {
        rating: {
          $ifNull: ["$customerRating", "$satisfaction.rating"],
        },
      },
    },

    {
      $group: {
        _id: null,
        averageRating: {
          $avg: "$rating",
        },
        totalRatings: {
          $sum: 1,
        },
      },
    },
  ]);

  const averageRating =
    satisfactionResult.length > 0
      ? Number((satisfactionResult[0].averageRating || 0).toFixed(2))
      : 0;

  const ratedTickets =
    satisfactionResult.length > 0 ? satisfactionResult[0].totalRatings : 0;

  // ==========================================================
  // AVERAGE FIRST RESPONSE TIME
  // ==========================================================

  const responseTimeResult = await Ticket.aggregate([
    {
      $match: {
        firstAgentResponseTime: {
          $gt: 0,
        },
      },
    },

    {
      $group: {
        _id: null,
        averageResponseTime: {
          $avg: "$firstAgentResponseTime",
        },
      },
    },
  ]);

  const averageResponseTime =
    responseTimeResult.length > 0
      ? Math.round(responseTimeResult[0].averageResponseTime || 0)
      : 0;

  // ==========================================================
  // SLA STATISTICS
  // ==========================================================

  const slaResult = await Ticket.aggregate([
    {
      $match: {
        "sla.responseDueAt": {
          $ne: null,
        },
      },
    },

    {
      $project: {
        responseDueAt: "$sla.responseDueAt",
        firstRespondedAt: "$sla.firstRespondedAt",
      },
    },

    {
      $group: {
        _id: null,

        totalSLATickets: {
          $sum: 1,
        },

        respondedWithinSLA: {
          $sum: {
            $cond: [
              {
                $and: [
                  {
                    $ne: ["$firstRespondedAt", null],
                  },
                  {
                    $lte: ["$firstRespondedAt", "$responseDueAt"],
                  },
                ],
              },
              1,
              0,
            ],
          },
        },
      },
    },
  ]);

  const totalSLATickets =
    slaResult.length > 0 ? slaResult[0].totalSLATickets : 0;

  const respondedWithinSLA =
    slaResult.length > 0 ? slaResult[0].respondedWithinSLA : 0;

  const slaComplianceRate =
    totalSLATickets > 0
      ? Number(((respondedWithinSLA / totalSLATickets) * 100).toFixed(1))
      : 0;

  // ==========================================================
  // RECENT TICKETS
  // ==========================================================

  const recentTicketsRaw = await Ticket.find({})
    .sort({
      createdAt: -1,
    })
    .limit(5)
    .populate({
      path: "customer",
      select: "name email avatar",
    })
    .populate({
      path: "assignedAgent",
      select: "name email avatar status",
    })
    .lean();

  const recentTickets = recentTicketsRaw.map((ticket) => ({
    id: ticket._id,

    ticketNumber: ticket.ticketNumber,

    subject: ticket.subject,

    description: ticket.description,

    category: ticket.category,

    priority: ticket.priority,

    status: ticket.status,

    customer: ticket.customer
      ? {
          id: ticket.customer._id,
          name: ticket.customer.name || "Unknown Customer",
          email: ticket.customer.email || "",
          avatar: ticket.customer.avatar || null,
        }
      : null,

    assignedAgent: ticket.assignedAgent
      ? {
          id: ticket.assignedAgent._id,
          name: ticket.assignedAgent.name || "Unknown Agent",
          email: ticket.assignedAgent.email || "",
          avatar: ticket.assignedAgent.avatar || null,
          status: ticket.assignedAgent.status || "offline",
        }
      : null,

    isEscalated: ticket.escalation?.isEscalated || false,

    createdAt: ticket.createdAt,

    updatedAt: ticket.updatedAt,

    lastReplyAt: ticket.lastReplyAt || null,
  }));

  // ==========================================================
  // AGENT PERFORMANCE
  // ==========================================================

  const agentPerformanceRaw = await Ticket.aggregate([
    // Only tickets assigned to an agent
    {
      $match: {
        assignedAgent: {
          $ne: null,
        },
      },
    },

    {
      $group: {
        _id: "$assignedAgent",

        totalTickets: {
          $sum: 1,
        },

        resolvedTickets: {
          $sum: {
            $cond: [
              {
                $in: ["$status", ["resolved", "closed"]],
              },
              1,
              0,
            ],
          },
        },

        openTickets: {
          $sum: {
            $cond: [
              {
                $in: ["$status", ["open", "in-progress", "waiting"]],
              },
              1,
              0,
            ],
          },
        },

        escalatedTickets: {
          $sum: {
            $cond: [
              {
                $eq: ["$escalation.isEscalated", true],
              },
              1,
              0,
            ],
          },
        },

        averageResponseTime: {
          $avg: {
            $cond: [
              {
                $gt: ["$firstAgentResponseTime", 0],
              },
              "$firstAgentResponseTime",
              null,
            ],
          },
        },

        averageRating: {
          $avg: {
            $ifNull: ["$customerRating", "$satisfaction.rating"],
          },
        },
      },
    },

    {
      $sort: {
        resolvedTickets: -1,
        totalTickets: -1,
      },
    },

    {
      $limit: 10,
    },
  ]);

  // ==========================================================
  // GET AGENT USER DETAILS
  // ==========================================================

  const agentIds = agentPerformanceRaw.map((agent) => agent._id);

  const agentUsers =
    agentIds.length > 0
      ? await User.find({
          _id: {
            $in: agentIds,
          },
          role: "agent",
        })
          .select("name email avatar status lastSeen")
          .lean()
      : [];

  const agentUserMap = new Map(
    agentUsers.map((agent) => [String(agent._id), agent]),
  );

  const agentPerformance = agentPerformanceRaw
    .map((agent) => {
      const user = agentUserMap.get(String(agent._id));

      if (!user) {
        return null;
      }

      const resolutionRate =
        agent.totalTickets > 0
          ? Number(
              ((agent.resolvedTickets / agent.totalTickets) * 100).toFixed(1),
            )
          : 0;

      return {
        id: user._id,

        name: user.name || "Unknown Agent",

        email: user.email || "",

        avatar: user.avatar || null,

        status: user.status || "offline",

        lastSeen: user.lastSeen || null,

        totalTickets: agent.totalTickets || 0,

        openTickets: agent.openTickets || 0,

        resolvedTickets: agent.resolvedTickets || 0,

        escalatedTickets: agent.escalatedTickets || 0,

        resolutionRate,

        averageResponseTime:
          agent.averageResponseTime != null
            ? Math.round(agent.averageResponseTime)
            : 0,

        averageRating:
          agent.averageRating != null
            ? Number(agent.averageRating.toFixed(2))
            : 0,
      };
    })
    .filter(Boolean);

  // ==========================================================
  // RETURN COMPLETE DASHBOARD
  // ==========================================================

  return {
    stats: {
      // Users
      totalUsers,
      totalCustomers,
      totalAgents,
      totalAdmins,
      activeAgents,

      // Tickets
      totalTickets,
      openTickets,
      inProgressTickets,
      waitingTickets,
      resolvedTickets,
      closedTickets,
      escalatedTickets,
      unassignedTickets,

      // AI
      aiAssistedTickets,
      aiResolvedTickets,
      aiResolutionRate,

      // Satisfaction
      ratedTickets,
      averageRating,

      // Response
      averageResponseTime,

      // SLA
      totalSLATickets,
      respondedWithinSLA,
      slaComplianceRate,
    },

    recentTickets,

    agentPerformance,
  };
};

export default getAdminDashboardStats;
