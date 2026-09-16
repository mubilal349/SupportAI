import mongoose from "mongoose";
import User from "../models/User.js";
import Ticket from "../models/Ticket.js";

// ============================================================
// GET ALL AGENTS
// ============================================================

export const getAdminAgents = async ({
  search = "",
  status = "",
  availability = "",
} = {}) => {
  const query = {
    role: "agent",
  };

  if (status) {
    query.status = status;
  }

  if (availability) {
    query.availability = availability;
  }

  if (search?.trim()) {
    const searchRegex = new RegExp(search.trim(), "i");

    query.$or = [
      { name: searchRegex },
      { email: searchRegex },
      { phone: searchRegex },
      { company: searchRegex },
    ];
  }

  const agents = await User.find(query)
    .select("-password")
    .sort({ createdAt: -1 })
    .lean();

  if (!agents.length) {
    return [];
  }

  const agentIds = agents.map((agent) => agent._id);

  // ============================================================
  // GET AGENT WORKLOAD + CUSTOMER RATINGS
  // ============================================================

  const agentStats = await Ticket.aggregate([
    {
      $match: {
        assignedAgent: { $in: agentIds },
      },
    },

    {
      $group: {
        _id: "$assignedAgent",

        // ======================================================
        // WORKLOAD
        // ======================================================

        totalTickets: {
          $sum: 1,
        },

        openTickets: {
          $sum: {
            $cond: [{ $eq: ["$status", "open"] }, 1, 0],
          },
        },

        inProgressTickets: {
          $sum: {
            $cond: [{ $eq: ["$status", "in-progress"] }, 1, 0],
          },
        },

        waitingTickets: {
          $sum: {
            $cond: [{ $eq: ["$status", "waiting"] }, 1, 0],
          },
        },

        resolvedTickets: {
          $sum: {
            $cond: [{ $eq: ["$status", "resolved"] }, 1, 0],
          },
        },

        // ======================================================
        // CUSTOMER RATINGS
        //
        // Supports both:
        // customerRating
        // satisfaction.rating
        // ======================================================

        totalRatings: {
          $sum: {
            $cond: [
              {
                $or: [
                  {
                    $and: [
                      { $gte: ["$customerRating", 1] },
                      { $lte: ["$customerRating", 5] },
                    ],
                  },
                  {
                    $and: [
                      { $gte: ["$satisfaction.rating", 1] },
                      { $lte: ["$satisfaction.rating", 5] },
                    ],
                  },
                ],
              },
              1,
              0,
            ],
          },
        },

        ratingSum: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $gte: ["$customerRating", 1] },
                  { $lte: ["$customerRating", 5] },
                ],
              },
              "$customerRating",
              {
                $cond: [
                  {
                    $and: [
                      { $gte: ["$satisfaction.rating", 1] },
                      { $lte: ["$satisfaction.rating", 5] },
                    ],
                  },
                  "$satisfaction.rating",
                  0,
                ],
              },
            ],
          },
        },
      },
    },

    // ==========================================================
    // CALCULATE AVERAGE RATING
    // ==========================================================

    {
      $addFields: {
        averageRating: {
          $cond: [
            { $gt: ["$totalRatings", 0] },
            {
              $divide: ["$ratingSum", "$totalRatings"],
            },
            null,
          ],
        },
      },
    },
  ]);

  const statsMap = new Map(agentStats.map((item) => [String(item._id), item]));

  // ============================================================
  // RETURN AGENTS
  // ============================================================

  return agents.map((agent) => {
    const stats = statsMap.get(String(agent._id));

    return {
      ...agent,

      workload: {
        totalTickets: stats?.totalTickets || 0,
        openTickets: stats?.openTickets || 0,
        inProgressTickets: stats?.inProgressTickets || 0,
        waitingTickets: stats?.waitingTickets || 0,
        resolvedTickets: stats?.resolvedTickets || 0,
      },

      // Customer rating
      averageRating:
        stats?.averageRating != null
          ? Number(stats.averageRating.toFixed(1))
          : null,

      totalRatings: stats?.totalRatings || 0,
    };
  });
};

// ============================================================
// GET AGENT BY ID
// ============================================================

export const getAdminAgentById = async (agentId) => {
  const agent = await User.findOne({
    _id: agentId,
    role: "agent",
  })
    .select("-password")
    .lean();

  if (!agent) {
    return null;
  }

  // ============================================================
  // GET TICKET STATS + CUSTOMER RATING
  // ============================================================

  const [
    totalTickets,
    openTickets,
    inProgressTickets,
    waitingTickets,
    resolvedTickets,
    closedTickets,
    ratingStats,
  ] = await Promise.all([
    // Total
    Ticket.countDocuments({
      assignedAgent: agentId,
    }),

    // Open
    Ticket.countDocuments({
      assignedAgent: agentId,
      status: "open",
    }),

    // In Progress
    Ticket.countDocuments({
      assignedAgent: agentId,
      status: "in-progress",
    }),

    // Waiting
    Ticket.countDocuments({
      assignedAgent: agentId,
      status: "waiting",
    }),

    // Resolved
    Ticket.countDocuments({
      assignedAgent: agentId,
      status: "resolved",
    }),

    // Closed
    Ticket.countDocuments({
      assignedAgent: agentId,
      status: "closed",
    }),

    // ==========================================================
    // CUSTOMER RATING
    // ==========================================================

    Ticket.aggregate([
      {
        $match: {
          assignedAgent: new mongoose.Types.ObjectId(agentId),

          $or: [
            {
              customerRating: {
                $gte: 1,
                $lte: 5,
              },
            },
            {
              "satisfaction.rating": {
                $gte: 1,
                $lte: 5,
              },
            },
          ],
        },
      },

      {
        $project: {
          rating: {
            $cond: [
              {
                $and: [
                  { $gte: ["$customerRating", 1] },
                  { $lte: ["$customerRating", 5] },
                ],
              },
              "$customerRating",
              "$satisfaction.rating",
            ],
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
    ]),
  ]);

  const ratingData = ratingStats[0] || {
    averageRating: null,
    totalRatings: 0,
  };

  // ============================================================
  // RETURN AGENT
  // ============================================================

  return {
    ...agent,

    // ==========================================================
    // CUSTOMER RATING
    // ==========================================================

    averageRating:
      ratingData.averageRating != null
        ? Number(ratingData.averageRating.toFixed(1))
        : null,

    totalRatings: ratingData.totalRatings || 0,

    // ==========================================================
    // WORKLOAD
    // ==========================================================

    workload: {
      totalTickets,
      openTickets,
      inProgressTickets,
      waitingTickets,
      resolvedTickets,
      closedTickets,
    },
  };
};

// ============================================================
// UPDATE AGENT
// ============================================================

export const updateAdminAgent = async (agentId, updateData) => {
  const agent = await User.findOne({
    _id: agentId,
    role: "agent",
  });

  if (!agent) {
    return null;
  }

  const allowedFields = [
    "name",
    "email",
    "phone",
    "company",
    "timezone",
    "language",
    "status",
    "availability",
  ];

  allowedFields.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(updateData, field)) {
      agent[field] = updateData[field];
    }
  });

  await agent.save();

  const response = agent.toObject();

  delete response.password;

  return response;
};

// ============================================================
// UPDATE AGENT STATUS
// ============================================================

export const updateAdminAgentStatus = async (agentId, status) => {
  const agent = await User.findOne({
    _id: agentId,
    role: "agent",
  });

  if (!agent) {
    return null;
  }

  agent.status = status;

  // If deactivated/suspended, make agent offline.
  if (status === "inactive" || status === "suspended") {
    agent.availability = "offline";
  }

  await agent.save();

  const response = agent.toObject();

  delete response.password;

  return response;
};

// ============================================================
// UPDATE AGENT AVAILABILITY
// ============================================================

export const updateAdminAgentAvailability = async (agentId, availability) => {
  const agent = await User.findOne({
    _id: agentId,
    role: "agent",
  });

  if (!agent) {
    return null;
  }

  agent.availability = availability;

  await agent.save();

  const response = agent.toObject();

  delete response.password;

  return response;
};
