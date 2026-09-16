import Ticket from "../models/Ticket.js";
import User from "../models/User.js";

// ==========================================
// DATE RANGE HELPER
// ==========================================

const getDateRange = (period = "30d") => {
  const now = new Date();

  const start = new Date(now);

  switch (period) {
    case "7d":
      start.setDate(start.getDate() - 7);
      break;

    case "30d":
      start.setDate(start.getDate() - 30);
      break;

    case "90d":
      start.setDate(start.getDate() - 90);
      break;

    case "1y":
      start.setFullYear(start.getFullYear() - 1);
      break;

    case "all":
      return {
        start: null,
        end: now,
      };

    default:
      start.setDate(start.getDate() - 30);
      break;
  }

  return {
    start,
    end: now,
  };
};

// ==========================================
// BUILD DATE MATCH
// ==========================================

const buildDateMatch = (start, end) => {
  if (!start) {
    return {};
  }

  return {
    createdAt: {
      $gte: start,
      $lte: end,
    },
  };
};

// ==========================================
// OVERVIEW STATISTICS
// ==========================================

const getOverviewStatistics = async (dateMatch) => {
  const [
    totalTickets,
    openTickets,
    pendingTickets,
    inProgressTickets,
    waitingTickets,
    resolvedTickets,
    closedTickets,
    escalatedTickets,
  ] = await Promise.all([
    Ticket.countDocuments(dateMatch),

    Ticket.countDocuments({
      ...dateMatch,
      status: "open",
    }),

    Ticket.countDocuments({
      ...dateMatch,
      status: "pending",
    }),

    Ticket.countDocuments({
      ...dateMatch,
      status: "in-progress",
    }),

    Ticket.countDocuments({
      ...dateMatch,
      status: "waiting",
    }),

    Ticket.countDocuments({
      ...dateMatch,
      status: "resolved",
    }),

    Ticket.countDocuments({
      ...dateMatch,
      status: "closed",
    }),

    Ticket.countDocuments({
      ...dateMatch,
      "escalation.isEscalated": true,
    }),
  ]);

  return {
    totalTickets,
    openTickets,
    pendingTickets,
    inProgressTickets,
    waitingTickets,
    resolvedTickets,
    closedTickets,
    escalatedTickets,
  };
};

// ==========================================
// PRIORITY STATISTICS
// ==========================================

const getPriorityStatistics = async (dateMatch) => {
  const results = await Ticket.aggregate([
    {
      $match: dateMatch,
    },
    {
      $group: {
        _id: "$priority",
        count: {
          $sum: 1,
        },
      },
    },
  ]);

  const priorities = {
    urgent: 0,
    high: 0,
    medium: 0,
    low: 0,
  };

  results.forEach((item) => {
    if (item._id && priorities[item._id] !== undefined) {
      priorities[item._id] = item.count;
    }
  });

  return priorities;
};

// ==========================================
// STATUS STATISTICS
// ==========================================

const getStatusStatistics = async (dateMatch) => {
  const results = await Ticket.aggregate([
    {
      $match: dateMatch,
    },
    {
      $group: {
        _id: "$status",
        count: {
          $sum: 1,
        },
      },
    },
  ]);

  const statuses = {
    open: 0,
    pending: 0,
    "in-progress": 0,
    waiting: 0,
    resolved: 0,
    closed: 0,
  };

  results.forEach((item) => {
    if (item._id && statuses[item._id] !== undefined) {
      statuses[item._id] = item.count;
    }
  });

  return statuses;
};

// ==========================================
// CATEGORY STATISTICS
// ==========================================

const getCategoryStatistics = async (dateMatch) => {
  const results = await Ticket.aggregate([
    {
      $match: dateMatch,
    },
    {
      $group: {
        _id: "$category",
        count: {
          $sum: 1,
        },
      },
    },
    {
      $sort: {
        count: -1,
      },
    },
  ]);

  return results.map((item) => ({
    category: item._id || "General",
    count: item.count,
  }));
};

// ==========================================
// SLA STATISTICS
// ==========================================

const getSlaStatistics = async (dateMatch) => {
  const tickets = await Ticket.find({
    ...dateMatch,
    "sla.responseDueAt": {
      $ne: null,
    },
  }).select(
    "status sla.responseDueAt sla.resolutionDueAt sla.firstRespondedAt sla.resolvedAt resolvedAt closedAt",
  );

  const now = new Date();

  let responseCompleted = 0;
  let responseBreached = 0;
  let responsePending = 0;

  let resolutionCompleted = 0;
  let resolutionBreached = 0;
  let resolutionPending = 0;

  tickets.forEach((ticket) => {
    const sla = ticket.sla;

    // ------------------------------------------
    // RESPONSE SLA
    // ------------------------------------------

    if (sla?.firstRespondedAt) {
      responseCompleted += 1;
    } else if (sla?.responseDueAt && new Date(sla.responseDueAt) < now) {
      responseBreached += 1;
    } else {
      responsePending += 1;
    }

    // ------------------------------------------
    // RESOLUTION SLA
    // ------------------------------------------

    const isResolved =
      ticket.status === "resolved" ||
      ticket.status === "closed" ||
      Boolean(sla?.resolvedAt) ||
      Boolean(ticket.resolvedAt);

    if (isResolved) {
      resolutionCompleted += 1;
    } else if (sla?.resolutionDueAt && new Date(sla.resolutionDueAt) < now) {
      resolutionBreached += 1;
    } else {
      resolutionPending += 1;
    }
  });

  const responseTotal = responseCompleted + responseBreached + responsePending;

  const resolutionTotal =
    resolutionCompleted + resolutionBreached + resolutionPending;

  const responseCompliance =
    responseTotal > 0
      ? Number(
          (
            ((responseCompleted + responsePending) / responseTotal) *
            100
          ).toFixed(1),
        )
      : 100;

  const resolutionCompliance =
    resolutionTotal > 0
      ? Number(
          (
            ((resolutionCompleted + resolutionPending) / resolutionTotal) *
            100
          ).toFixed(1),
        )
      : 100;

  const overallTotal = responseTotal + resolutionTotal;

  const overallCompliant =
    responseCompleted +
    responsePending +
    resolutionCompleted +
    resolutionPending;

  const overallCompliance =
    overallTotal > 0
      ? Number(((overallCompliant / overallTotal) * 100).toFixed(1))
      : 100;

  return {
    response: {
      completed: responseCompleted,
      breached: responseBreached,
      pending: responsePending,
      compliance: responseCompliance,
    },

    resolution: {
      completed: resolutionCompleted,
      breached: resolutionBreached,
      pending: resolutionPending,
      compliance: resolutionCompliance,
    },

    overallCompliance,
  };
};

// ==========================================
// RESPONSE & RESOLUTION PERFORMANCE
// ==========================================

const getPerformanceStatistics = async (dateMatch) => {
  const tickets = await Ticket.find({
    ...dateMatch,
  }).select("firstAgentResponseTime createdAt resolvedAt closedAt status");

  let responseTimes = [];
  let resolutionTimes = [];

  tickets.forEach((ticket) => {
    // ------------------------------------------
    // FIRST RESPONSE TIME
    // ------------------------------------------

    if (
      typeof ticket.firstAgentResponseTime === "number" &&
      ticket.firstAgentResponseTime >= 0
    ) {
      responseTimes.push(ticket.firstAgentResponseTime);
    }

    // ------------------------------------------
    // RESOLUTION TIME
    // ------------------------------------------

    const resolutionDate = ticket.resolvedAt || ticket.closedAt;

    if (resolutionDate && ticket.createdAt) {
      const createdTime = new Date(ticket.createdAt).getTime();

      const resolvedTime = new Date(resolutionDate).getTime();

      const differenceMinutes = (resolvedTime - createdTime) / (1000 * 60);

      if (differenceMinutes >= 0) {
        resolutionTimes.push(differenceMinutes);
      }
    }
  });

  const average = (values) => {
    if (!values.length) {
      return 0;
    }

    return Number(
      (values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(
        1,
      ),
    );
  };

  return {
    averageFirstResponseMinutes: average(responseTimes),

    averageResolutionMinutes: average(resolutionTimes),

    responseSamples: responseTimes.length,

    resolutionSamples: resolutionTimes.length,
  };
};

// ==========================================
// CUSTOMER SATISFACTION
// ==========================================

const getSatisfactionStatistics = async (dateMatch) => {
  const tickets = await Ticket.find({
    ...dateMatch,
  }).select("customerRating satisfaction.rating");

  const ratings = [];

  tickets.forEach((ticket) => {
    const rating = ticket.satisfaction?.rating ?? ticket.customerRating;

    if (typeof rating === "number" && rating >= 1 && rating <= 5) {
      ratings.push(rating);
    }
  });

  const distribution = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };

  ratings.forEach((rating) => {
    distribution[rating] += 1;
  });

  const averageRating =
    ratings.length > 0
      ? Number(
          (
            ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
          ).toFixed(1),
        )
      : 0;

  return {
    averageRating,
    totalRatings: ratings.length,
    distribution,
  };
};

// ==========================================
// AI / HUMAN SUPPORT STATISTICS
// ==========================================

const getSupportChannelStatistics = async (dateMatch) => {
  const tickets = await Ticket.find({
    ...dateMatch,
  }).select("conversation");

  let aiReplies = 0;
  let agentReplies = 0;
  let adminReplies = 0;
  let customerReplies = 0;
  let internalNotes = 0;

  tickets.forEach((ticket) => {
    ticket.conversation?.forEach((message) => {
      if (message.isInternal) {
        internalNotes += 1;
        return;
      }

      switch (message.senderRole) {
        case "ai":
          aiReplies += 1;
          break;

        case "agent":
          agentReplies += 1;
          break;

        case "admin":
          adminReplies += 1;
          break;

        case "customer":
          customerReplies += 1;
          break;

        default:
          break;
      }
    });
  });

  const humanReplies = agentReplies + adminReplies;

  const totalSupportReplies = aiReplies + humanReplies;

  const aiPercentage =
    totalSupportReplies > 0
      ? Number(((aiReplies / totalSupportReplies) * 100).toFixed(1))
      : 0;

  return {
    aiReplies,
    agentReplies,
    adminReplies,
    customerReplies,
    humanReplies,
    internalNotes,
    totalSupportReplies,
    aiPercentage,
  };
};

// ==========================================
// ESCALATION STATISTICS
// ==========================================

const getEscalationStatistics = async (dateMatch) => {
  const tickets = await Ticket.find({
    ...dateMatch,
  }).select("escalation status");

  let totalEscalations = 0;
  let resolvedEscalations = 0;
  let activeEscalations = 0;

  tickets.forEach((ticket) => {
    if (!ticket.escalation?.isEscalated) {
      return;
    }

    totalEscalations += 1;

    const escalationResolved =
      Boolean(ticket.escalation?.resolvedAt) ||
      ["resolved", "closed"].includes(ticket.status);

    if (escalationResolved) {
      resolvedEscalations += 1;
    } else {
      activeEscalations += 1;
    }
  });

  const resolutionRate =
    totalEscalations > 0
      ? Number(((resolvedEscalations / totalEscalations) * 100).toFixed(1))
      : 0;

  return {
    totalEscalations,
    resolvedEscalations,
    activeEscalations,
    resolutionRate,
  };
};

// ==========================================
// AGENT PERFORMANCE
// ==========================================

const getAgentPerformance = async (dateMatch) => {
  const agents = await User.find({
    role: "agent",
  }).select("_id name email avatar status");

  if (!agents.length) {
    return [];
  }

  const agentIds = agents.map((agent) => agent._id);

  const tickets = await Ticket.find({
    ...dateMatch,
    assignedAgent: {
      $in: agentIds,
    },
  }).select(
    "assignedAgent status firstAgentResponseTime createdAt resolvedAt closedAt",
  );

  return agents.map((agent) => {
    const agentTickets = tickets.filter(
      (ticket) => ticket.assignedAgent?.toString() === agent._id.toString(),
    );

    const assignedTickets = agentTickets.length;

    const resolvedTickets = agentTickets.filter((ticket) =>
      ["resolved", "closed"].includes(ticket.status),
    ).length;

    const openTickets = agentTickets.filter(
      (ticket) => !["resolved", "closed"].includes(ticket.status),
    ).length;

    const responseTimes = agentTickets
      .filter(
        (ticket) =>
          typeof ticket.firstAgentResponseTime === "number" &&
          ticket.firstAgentResponseTime >= 0,
      )
      .map((ticket) => ticket.firstAgentResponseTime);

    const averageResponseTime =
      responseTimes.length > 0
        ? Number(
            (
              responseTimes.reduce((sum, value) => sum + value, 0) /
              responseTimes.length
            ).toFixed(1),
          )
        : 0;

    const resolutionTimes = [];

    agentTickets.forEach((ticket) => {
      const resolutionDate = ticket.resolvedAt || ticket.closedAt;

      if (resolutionDate && ticket.createdAt) {
        const differenceMinutes =
          (new Date(resolutionDate).getTime() -
            new Date(ticket.createdAt).getTime()) /
          (1000 * 60);

        if (differenceMinutes >= 0) {
          resolutionTimes.push(differenceMinutes);
        }
      }
    });

    const averageResolutionTime =
      resolutionTimes.length > 0
        ? Number(
            (
              resolutionTimes.reduce((sum, value) => sum + value, 0) /
              resolutionTimes.length
            ).toFixed(1),
          )
        : 0;

    return {
      id: agent._id,
      name: agent.name,
      email: agent.email,
      avatar: agent.avatar,
      status: agent.status,

      assignedTickets,
      resolvedTickets,
      openTickets,

      averageResponseTime,
      averageResolutionTime,
    };
  });
};

// ==========================================
// TICKET TRENDS
// ==========================================

const getTicketTrends = async (start, end) => {
  if (!start) {
    return [];
  }

  const results = await Ticket.aggregate([
    {
      $match: {
        createdAt: {
          $gte: start,
          $lte: end,
        },
      },
    },

    {
      $group: {
        _id: {
          $dateToString: {
            format: "%Y-%m-%d",
            date: "$createdAt",
          },
        },

        created: {
          $sum: 1,
        },
      },
    },

    {
      $sort: {
        _id: 1,
      },
    },
  ]);

  const resolvedResults = await Ticket.aggregate([
    {
      $match: {
        $or: [
          {
            resolvedAt: {
              $gte: start,
              $lte: end,
            },
          },
          {
            closedAt: {
              $gte: start,
              $lte: end,
            },
          },
        ],
      },
    },

    {
      $project: {
        resolutionDate: {
          $ifNull: ["$resolvedAt", "$closedAt"],
        },
      },
    },

    {
      $group: {
        _id: {
          $dateToString: {
            format: "%Y-%m-%d",
            date: "$resolutionDate",
          },
        },

        resolved: {
          $sum: 1,
        },
      },
    },

    {
      $sort: {
        _id: 1,
      },
    },
  ]);

  const resolvedMap = {};

  resolvedResults.forEach((item) => {
    resolvedMap[item._id] = item.resolved;
  });

  return results.map((item) => ({
    date: item._id,
    created: item.created,
    resolved: resolvedMap[item._id] || 0,
  }));
};

// ==========================================
// MAIN ANALYTICS SERVICE
// ==========================================

export const getSystemAnalyticsService = async (period = "30d") => {
  const { start, end } = getDateRange(period);

  const dateMatch = buildDateMatch(start, end);

  const [
    overview,
    priorities,
    statuses,
    categories,
    sla,
    performance,
    satisfaction,
    supportChannels,
    escalations,
    agents,
    trends,
  ] = await Promise.all([
    getOverviewStatistics(dateMatch),

    getPriorityStatistics(dateMatch),

    getStatusStatistics(dateMatch),

    getCategoryStatistics(dateMatch),

    getSlaStatistics(dateMatch),

    getPerformanceStatistics(dateMatch),

    getSatisfactionStatistics(dateMatch),

    getSupportChannelStatistics(dateMatch),

    getEscalationStatistics(dateMatch),

    getAgentPerformance(dateMatch),

    getTicketTrends(start, end),
  ]);

  return {
    period,
    dateRange: {
      start,
      end,
    },

    overview,

    priorities,

    statuses,

    categories,

    sla,

    performance,

    satisfaction,

    supportChannels,

    escalations,

    agents,

    trends,
  };
};

export default {
  getSystemAnalyticsService,
};
