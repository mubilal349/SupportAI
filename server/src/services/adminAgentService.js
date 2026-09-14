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

  const workload = await Ticket.aggregate([
    {
      $match: {
        assignedAgent: { $in: agentIds },
      },
    },
    {
      $group: {
        _id: "$assignedAgent",

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
      },
    },
  ]);

  const workloadMap = new Map(workload.map((item) => [String(item._id), item]));

  return agents.map((agent) => {
    const stats = workloadMap.get(String(agent._id)) || {
      totalTickets: 0,
      openTickets: 0,
      inProgressTickets: 0,
      waitingTickets: 0,
      resolvedTickets: 0,
    };

    return {
      ...agent,

      workload: {
        totalTickets: stats.totalTickets,
        openTickets: stats.openTickets,
        inProgressTickets: stats.inProgressTickets,
        waitingTickets: stats.waitingTickets,
        resolvedTickets: stats.resolvedTickets,
      },
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

  const [
    totalTickets,
    openTickets,
    inProgressTickets,
    waitingTickets,
    resolvedTickets,
    closedTickets,
  ] = await Promise.all([
    Ticket.countDocuments({
      assignedAgent: agentId,
    }),

    Ticket.countDocuments({
      assignedAgent: agentId,
      status: "open",
    }),

    Ticket.countDocuments({
      assignedAgent: agentId,
      status: "in-progress",
    }),

    Ticket.countDocuments({
      assignedAgent: agentId,
      status: "waiting",
    }),

    Ticket.countDocuments({
      assignedAgent: agentId,
      status: "resolved",
    }),

    Ticket.countDocuments({
      assignedAgent: agentId,
      status: "closed",
    }),
  ]);

  return {
    ...agent,

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
