import mongoose from "mongoose";
import Ticket from "../models/Ticket.js";

/*
 * =========================================================
 * AGENT ANALYTICS HELPERS
 * =========================================================
 */

const VALID_PERIODS = ["7d", "30d", "90d", "all"];

const getPeriodDays = (period) => {
  switch (period) {
    case "7d":
      return 7;

    case "90d":
      return 90;

    case "all":
      return null;

    case "30d":
    default:
      return 30;
  }
};

const formatDuration = (milliseconds) => {
  if (!milliseconds || milliseconds < 0) {
    return "0m";
  }

  const totalMinutes = Math.round(milliseconds / (1000 * 60));

  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) {
    return `${days}d ${hours}h`;
  }

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
};

const getAverage = (values) => {
  if (!values.length) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
};

const calculatePercentageChange = (current, previous) => {
  if (!previous) {
    return current > 0 ? 100 : 0;
  }

  return Number((((current - previous) / previous) * 100).toFixed(1));
};

/*
 * =========================================================
 * RATING HELPERS
 * =========================================================
 *
 * satisfaction = canonical
 * customerRating = legacy fallback
 */

const getTicketRating = (ticket) => {
  const canonicalRating = ticket?.satisfaction?.rating;

  if (canonicalRating !== null && canonicalRating !== undefined) {
    const rating = Number(canonicalRating);

    if (Number.isInteger(rating) && rating >= 1 && rating <= 5) {
      return rating;
    }
  }

  const legacyRating = ticket?.customerRating;

  if (legacyRating !== null && legacyRating !== undefined) {
    const rating = Number(legacyRating);

    if (Number.isInteger(rating) && rating >= 1 && rating <= 5) {
      return rating;
    }
  }

  return null;
};

const getTicketFeedback = (ticket) => {
  const canonicalFeedback = ticket?.satisfaction?.feedback;

  if (typeof canonicalFeedback === "string" && canonicalFeedback.trim()) {
    return canonicalFeedback.trim();
  }

  const legacyFeedback = ticket?.customerFeedback;

  if (typeof legacyFeedback === "string" && legacyFeedback.trim()) {
    return legacyFeedback.trim();
  }

  return "";
};

const getRatingDate = (ticket) => {
  const date = ticket?.satisfaction?.submittedAt || ticket?.ratedAt;

  if (!date) {
    return null;
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return parsedDate;
};

/*
 * =========================================================
 * FIRST HUMAN AGENT RESPONSE
 * =========================================================
 *
 * AI replies are NOT counted.
 * Customer replies are NOT counted.
 * Internal notes are NOT counted.
 *
 * Only public agent/admin replies count.
 * =========================================================
 */

const getFirstAgentResponse = (ticket) => {
  const conversation = Array.isArray(ticket?.conversation)
    ? ticket.conversation
    : [];

  const agentMessage = conversation.find((message) =>
    ["agent", "admin"].includes(
      String(message?.senderRole || "").toLowerCase(),
    ),
  );

  if (!agentMessage) {
    return null;
  }

  const responseDate =
    agentMessage.createdAt || agentMessage.timestamp || agentMessage.sentAt;

  if (!responseDate) {
    return null;
  }

  const responseAt = new Date(responseDate);

  if (Number.isNaN(responseAt.getTime())) {
    return null;
  }

  return responseAt;
};

/*
 * =========================================================
 * RESOLUTION DATE
 * =========================================================
 */

const getResolutionDate = (ticket) => {
  if (ticket?.resolvedAt) {
    const date = new Date(ticket.resolvedAt);

    if (!Number.isNaN(date.getTime())) {
      return date;
    }
  }

  if (ticket?.closedAt) {
    const date = new Date(ticket.closedAt);

    if (!Number.isNaN(date.getTime())) {
      return date;
    }
  }

  if (
    ["resolved", "closed"].includes(
      String(ticket?.status || "").toLowerCase(),
    ) &&
    ticket?.updatedAt
  ) {
    const date = new Date(ticket.updatedAt);

    if (!Number.isNaN(date.getTime())) {
      return date;
    }
  }

  return null;
};

/*
 * =========================================================
 * TICKET METRICS
 * =========================================================
 */

const calculateMetrics = (tickets) => {
  const totalTickets = tickets.length;

  let resolvedTickets = 0;
  let respondedTickets = 0;

  const responseTimes = [];
  const resolutionTimes = [];

  const statusBreakdown = {
    open: 0,
    pending: 0,
    "in-progress": 0,
    waiting: 0,
    resolved: 0,
    closed: 0,
  };

  const priorityBreakdown = {
    low: 0,
    medium: 0,
    high: 0,
    urgent: 0,
  };

  const categoryBreakdown = {};

  tickets.forEach((ticket) => {
    const status = String(ticket?.status || "open").toLowerCase();

    if (statusBreakdown[status] !== undefined) {
      statusBreakdown[status] += 1;
    }

    const priority = String(ticket?.priority || "medium").toLowerCase();

    if (priorityBreakdown[priority] !== undefined) {
      priorityBreakdown[priority] += 1;
    }

    const category = ticket?.category || "General";

    categoryBreakdown[category] = (categoryBreakdown[category] || 0) + 1;

    /*
     * Response time
     */

    const firstResponse = getFirstAgentResponse(ticket);

    if (firstResponse && ticket?.createdAt) {
      const createdAt = new Date(ticket.createdAt);

      if (!Number.isNaN(createdAt.getTime())) {
        const responseTime = firstResponse.getTime() - createdAt.getTime();

        if (responseTime >= 0) {
          respondedTickets += 1;
          responseTimes.push(responseTime);
        }
      }
    }

    /*
     * Resolution time
     */

    const resolutionDate = getResolutionDate(ticket);

    if (resolutionDate && ticket?.createdAt) {
      const createdAt = new Date(ticket.createdAt);

      if (!Number.isNaN(createdAt.getTime())) {
        const resolutionTime = resolutionDate.getTime() - createdAt.getTime();

        if (resolutionTime >= 0) {
          resolutionTimes.push(resolutionTime);
        }
      }
    }

    if (["resolved", "closed"].includes(status)) {
      resolvedTickets += 1;
    }
  });

  const averageResponseTime = getAverage(responseTimes);

  const averageResolutionTime = getAverage(resolutionTimes);

  const fastestResponseTime = responseTimes.length
    ? Math.min(...responseTimes)
    : 0;

  const slowestResponseTime = responseTimes.length
    ? Math.max(...responseTimes)
    : 0;

  const resolutionRate = totalTickets
    ? Number(((resolvedTickets / totalTickets) * 100).toFixed(1))
    : 0;

  const responseRate = totalTickets
    ? Number(((respondedTickets / totalTickets) * 100).toFixed(1))
    : 0;

  return {
    totalTickets,
    resolvedTickets,
    respondedTickets,

    resolutionRate,
    responseRate,

    responseTimes,
    resolutionTimes,

    averageResponseTime,
    fastestResponseTime,
    slowestResponseTime,

    averageResolutionTime,

    statusBreakdown,
    priorityBreakdown,
    categoryBreakdown,
  };
};

/*
 * =========================================================
 * CUSTOMER SATISFACTION / CSAT
 * =========================================================
 *
 * CSAT:
 *
 *     satisfied ratings / total ratings * 100
 *
 * Satisfied = 4 or 5 stars.
 * =========================================================
 */

const calculateSatisfaction = (tickets) => {
  const ratings = [];

  const distribution = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };

  let feedbackCount = 0;

  tickets.forEach((ticket) => {
    const rating = getTicketRating(ticket);

    if (rating !== null) {
      ratings.push(rating);
      distribution[rating] += 1;
    }

    const feedback = getTicketFeedback(ticket);

    if (feedback) {
      feedbackCount += 1;
    }
  });

  const totalRatings = ratings.length;

  const averageRating = totalRatings
    ? Number(
        (
          ratings.reduce((sum, rating) => sum + rating, 0) / totalRatings
        ).toFixed(2),
      )
    : 0;

  const satisfiedRatings = ratings.filter((rating) => rating >= 4).length;

  const csat = totalRatings
    ? Number(((satisfiedRatings / totalRatings) * 100).toFixed(1))
    : 0;

  const ratingScorePercentage = totalRatings
    ? Number(((averageRating / 5) * 100).toFixed(1))
    : 0;

  const feedbackPercentage = totalRatings
    ? Number(((feedbackCount / totalRatings) * 100).toFixed(1))
    : 0;

  return {
    averageRating,
    previousAverageRating: 0,
    averageRatingChange: 0,

    csat,
    previousCsat: 0,
    csatChange: 0,

    ratingScorePercentage,
    previousRatingScorePercentage: 0,

    totalRatings,
    previousRatings: 0,

    satisfiedRatings,
    previousSatisfiedRatings: 0,

    feedbackCount,
    previousFeedbackCount: 0,

    feedbackPercentage,
    previousFeedbackPercentage: 0,

    distribution,

    previousDistribution: {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    },
  };
};

/*
 * =========================================================
 * SATISFACTION TICKETS QUERY
 * =========================================================
 *
 * IMPORTANT:
 *
 * Ticket analytics are based on ticket.createdAt.
 *
 * Satisfaction analytics are based on the date the
 * customer submitted the rating.
 *
 * This means an old ticket rated today is counted in
 * today's/current-period CSAT.
 * =========================================================
 */

const buildSatisfactionQuery = (baseQuery, period, start, end) => {
  const query = {
    ...baseQuery,
  };

  if (period === "all") {
    query.$or = [
      {
        "satisfaction.rating": {
          $gte: 1,
          $lte: 5,
        },
      },
      {
        customerRating: {
          $gte: 1,
          $lte: 5,
        },
      },
    ];

    return query;
  }

  query.$or = [
    {
      "satisfaction.submittedAt": {
        $gte: start,
        $lt: end,
      },
    },
    {
      ratedAt: {
        $gte: start,
        $lt: end,
      },
    },
  ];

  return query;
};

/*
 * =========================================================
 * TICKET TREND
 * =========================================================
 */

const createTrend = (tickets, period, currentStart, currentEnd) => {
  const trendMap = new Map();

  /*
   * ALL TIME
   *
   * Monthly trend.
   */

  if (period === "all") {
    tickets.forEach((ticket) => {
      if (!ticket?.createdAt) {
        return;
      }

      const date = new Date(ticket.createdAt);

      if (Number.isNaN(date.getTime())) {
        return;
      }

      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
        2,
        "0",
      )}`;

      if (!trendMap.has(key)) {
        trendMap.set(key, {
          date: key,
          handled: 0,
          resolved: 0,
        });
      }

      const item = trendMap.get(key);

      item.handled += 1;

      if (
        ["resolved", "closed"].includes(
          String(ticket?.status || "").toLowerCase(),
        )
      ) {
        item.resolved += 1;
      }
    });

    return Array.from(trendMap.values()).sort((a, b) =>
      a.date.localeCompare(b.date),
    );
  }

  /*
   * FINITE PERIODS
   *
   * Daily trend.
   */

  if (!currentStart || !currentEnd) {
    return [];
  }

  const cursor = new Date(currentStart);

  cursor.setHours(0, 0, 0, 0);

  const end = new Date(currentEnd);

  end.setHours(0, 0, 0, 0);

  while (cursor <= end) {
    const key = cursor.toISOString().split("T")[0];

    trendMap.set(key, {
      date: key,
      handled: 0,
      resolved: 0,
    });

    cursor.setDate(cursor.getDate() + 1);
  }

  tickets.forEach((ticket) => {
    if (!ticket?.createdAt) {
      return;
    }

    const date = new Date(ticket.createdAt);

    if (Number.isNaN(date.getTime())) {
      return;
    }

    const key = date.toISOString().split("T")[0];

    if (!trendMap.has(key)) {
      trendMap.set(key, {
        date: key,
        handled: 0,
        resolved: 0,
      });
    }

    const item = trendMap.get(key);

    item.handled += 1;

    if (
      ["resolved", "closed"].includes(
        String(ticket?.status || "").toLowerCase(),
      )
    ) {
      item.resolved += 1;
    }
  });

  return Array.from(trendMap.values()).sort((a, b) =>
    a.date.localeCompare(b.date),
  );
};

/*
 * =========================================================
 * SATISFACTION TREND
 * =========================================================
 *
 * Uses rating submission date.
 *
 * 7d / 30d / 90d = daily
 * all = monthly
 * =========================================================
 */

const createSatisfactionTrend = (tickets, period, currentStart, currentEnd) => {
  const trendMap = new Map();

  /*
   * ALL TIME
   *
   * Monthly satisfaction trend.
   */

  if (period === "all") {
    tickets.forEach((ticket) => {
      const rating = getTicketRating(ticket);

      if (rating === null) {
        return;
      }

      const date = getRatingDate(ticket);

      if (!date) {
        return;
      }

      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
        2,
        "0",
      )}`;

      if (!trendMap.has(key)) {
        trendMap.set(key, {
          date: key,
          ratings: 0,
          averageRating: 0,
          csat: 0,
          satisfied: 0,
        });
      }

      const item = trendMap.get(key);

      item.ratings += 1;
      item.averageRating += rating;

      if (rating >= 4) {
        item.satisfied += 1;
      }
    });
  } else {
    /*
     * FINITE PERIOD
     *
     * Daily satisfaction trend.
     */

    if (currentStart && currentEnd) {
      const cursor = new Date(currentStart);

      cursor.setHours(0, 0, 0, 0);

      const end = new Date(currentEnd);

      end.setHours(0, 0, 0, 0);

      while (cursor <= end) {
        const key = cursor.toISOString().split("T")[0];

        trendMap.set(key, {
          date: key,
          ratings: 0,
          averageRating: 0,
          csat: 0,
          satisfied: 0,
        });

        cursor.setDate(cursor.getDate() + 1);
      }
    }

    tickets.forEach((ticket) => {
      const rating = getTicketRating(ticket);

      if (rating === null) {
        return;
      }

      const date = getRatingDate(ticket);

      if (!date) {
        return;
      }

      const key = date.toISOString().split("T")[0];

      if (!trendMap.has(key)) {
        trendMap.set(key, {
          date: key,
          ratings: 0,
          averageRating: 0,
          csat: 0,
          satisfied: 0,
        });
      }

      const item = trendMap.get(key);

      item.ratings += 1;
      item.averageRating += rating;

      if (rating >= 4) {
        item.satisfied += 1;
      }
    });
  }

  return Array.from(trendMap.values())
    .map((item) => {
      if (!item.ratings) {
        return {
          ...item,
          averageRating: 0,
          csat: 0,
        };
      }

      return {
        ...item,
        averageRating: Number((item.averageRating / item.ratings).toFixed(2)),
        csat: Number(((item.satisfied / item.ratings) * 100).toFixed(1)),
      };
    })
    .sort((a, b) => a.date.localeCompare(b.date));
};

/*
 * =========================================================
 * RECENT ACTIVITY
 * =========================================================
 */

const createRecentActivity = (tickets) => {
  const activities = [];

  tickets.forEach((ticket) => {
    if (ticket?.createdAt) {
      activities.push({
        type: "handled",
        ticketId: String(ticket._id),
        ticketNumber: ticket.ticketNumber,
        subject: ticket.subject,
        timestamp: ticket.createdAt,
      });
    }

    const resolutionDate = getResolutionDate(ticket);

    if (resolutionDate) {
      activities.push({
        type: "resolved",
        ticketId: String(ticket._id),
        ticketNumber: ticket.ticketNumber,
        subject: ticket.subject,
        timestamp: resolutionDate,
      });
    }

    const rating = getTicketRating(ticket);
    const ratingDate = getRatingDate(ticket);

    if (rating !== null && ratingDate) {
      activities.push({
        type: "rated",
        ticketId: String(ticket._id),
        ticketNumber: ticket.ticketNumber,
        subject: ticket.subject,
        rating,
        timestamp: ratingDate,
      });
    }
  });

  return activities
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 10);
};

/*
 * =========================================================
 * GET AGENT ANALYTICS
 * =========================================================
 *
 * GET /api/analytics/agent
 * GET /api/analytics/agent?period=7d
 * GET /api/analytics/agent?period=30d
 * GET /api/analytics/agent?period=90d
 * GET /api/analytics/agent?period=all
 *
 * =========================================================
 */

export const getAgentAnalytics = async (req, res) => {
  console.log("🔥🔥🔥 NEW AGENT ANALYTICS CONTROLLER 🔥🔥🔥");
  try {
    const agentId = req.user?.id;

    if (!agentId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(agentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid agent ID.",
      });
    }

    const requestedPeriod = String(req.query.period || "30d").toLowerCase();

    const period = VALID_PERIODS.includes(requestedPeriod)
      ? requestedPeriod
      : "30d";

    const now = new Date();

    /*
     * =====================================================
     * CURRENT / PREVIOUS PERIOD
     * =====================================================
     */

    let currentStart = null;
    let currentEnd = now;

    let previousStart = null;
    let previousEnd = null;

    if (period !== "all") {
      const days = getPeriodDays(period);

      currentStart = new Date(now);
      currentStart.setDate(currentStart.getDate() - days);

      previousEnd = new Date(currentStart);

      previousStart = new Date(previousEnd);
      previousStart.setDate(previousStart.getDate() - days);
    }

    /*
     * =====================================================
     * BASE QUERY
     * =====================================================
     *
     * ONLY tickets assigned to this agent.
     *
     * Viewing an unassigned ticket does NOT assign it.
     * Therefore unassigned tickets are excluded.
     * =====================================================
     */

    const baseQuery = {
      assignedAgent: agentId,
    };

    const ticketFields = [
      "ticketNumber",
      "subject",
      "status",
      "priority",
      "category",
      "assignedAgent",

      "conversation",
      "statusHistory",

      "createdAt",
      "updatedAt",
      "resolvedAt",
      "closedAt",
      "reopenedAt",

      "satisfaction",
      "customerRating",
      "customerFeedback",
      "ratedAt",

      "isEscalated",
      "escalatedAt",
      "escalationReason",

      "attachments",
    ].join(" ");

    /*
     * =====================================================
     * CURRENT TICKETS
     * =====================================================
     */

    const currentQuery = {
      ...baseQuery,
    };

    if (period !== "all") {
      currentQuery.createdAt = {
        $gte: currentStart,
        $lte: currentEnd,
      };
    }

    const currentTickets = await Ticket.find(currentQuery)
      .select(ticketFields)
      .sort({ createdAt: -1 })
      .lean();

    console.log(
      "🔥 AGENT ANALYTICS ESCALATIONS:",
      currentTickets.map((ticket) => ({
        id: ticket._id,
        ticketNumber: ticket.ticketNumber,
        assignedAgent: ticket.assignedAgent,
        escalation: ticket.escalation,
      })),
    );

    /*
     * =====================================================
     * PREVIOUS TICKETS
     * =====================================================
     */

    let previousTickets = [];

    if (period !== "all") {
      previousTickets = await Ticket.find({
        ...baseQuery,

        createdAt: {
          $gte: previousStart,
          $lt: previousEnd,
        },
      })
        .select(ticketFields)
        .sort({ createdAt: -1 })
        .lean();
    }

    /*
     * =====================================================
     * CURRENT TICKET METRICS
     * =====================================================
     */

    const currentMetrics = calculateMetrics(currentTickets);

    /*
     * =====================================================
     * PREVIOUS TICKET METRICS
     * =====================================================
     */

    const previousMetrics =
      period !== "all"
        ? calculateMetrics(previousTickets)
        : {
            totalTickets: 0,
            resolvedTickets: 0,
            respondedTickets: 0,

            resolutionRate: 0,
            responseRate: 0,

            responseTimes: [],
            resolutionTimes: [],

            averageResponseTime: 0,
            fastestResponseTime: 0,
            slowestResponseTime: 0,

            averageResolutionTime: 0,

            statusBreakdown: {
              open: 0,
              pending: 0,
              "in-progress": 0,
              waiting: 0,
              resolved: 0,
              closed: 0,
            },

            priorityBreakdown: {
              low: 0,
              medium: 0,
              high: 0,
              urgent: 0,
            },

            categoryBreakdown: {},
          };

    /*
     * =====================================================
     * SATISFACTION TICKETS
     * =====================================================
     *
     * Satisfaction uses rating submission date rather than
     * ticket creation date.
     * =====================================================
     */

    const satisfactionQuery = buildSatisfactionQuery(
      baseQuery,
      period,
      currentStart,
      currentEnd,
    );

    const satisfactionTickets = await Ticket.find(satisfactionQuery)
      .select(ticketFields)
      .lean();

    /*
     * =====================================================
     * PREVIOUS SATISFACTION
     * =====================================================
     */

    let previousSatisfactionTickets = [];

    if (period !== "all") {
      const previousSatisfactionQuery = buildSatisfactionQuery(
        baseQuery,
        period,
        previousStart,
        previousEnd,
      );

      previousSatisfactionTickets = await Ticket.find(previousSatisfactionQuery)
        .select(ticketFields)
        .lean();
    }

    /*
     * =====================================================
     * SATISFACTION METRICS
     * =====================================================
     */

    const satisfaction = calculateSatisfaction(satisfactionTickets);

    const previousSatisfaction =
      period !== "all"
        ? calculateSatisfaction(previousSatisfactionTickets)
        : calculateSatisfaction([]);

    /*
     * Previous satisfaction values
     */

    satisfaction.previousAverageRating = previousSatisfaction.averageRating;

    satisfaction.previousCsat = previousSatisfaction.csat;

    satisfaction.previousRatingScorePercentage =
      previousSatisfaction.ratingScorePercentage;

    satisfaction.previousRatings = previousSatisfaction.totalRatings;

    satisfaction.previousSatisfiedRatings =
      previousSatisfaction.satisfiedRatings;

    satisfaction.previousFeedbackCount = previousSatisfaction.feedbackCount;

    satisfaction.previousFeedbackPercentage =
      previousSatisfaction.feedbackPercentage;

    satisfaction.previousDistribution = previousSatisfaction.distribution;

    /*
     * Satisfaction changes
     */

    satisfaction.csatChange =
      period !== "all"
        ? calculatePercentageChange(
            satisfaction.csat,
            previousSatisfaction.csat,
          )
        : 0;

    satisfaction.averageRatingChange =
      period !== "all"
        ? calculatePercentageChange(
            satisfaction.averageRating,
            previousSatisfaction.averageRating,
          )
        : 0;

    /*
     * =====================================================
     * TICKET TREND
     * =====================================================
     */

    let trendStart = currentStart;

    if (period === "all" && !currentStart) {
      const ticketDates = currentTickets
        .filter((ticket) => ticket?.createdAt)
        .map((ticket) => new Date(ticket.createdAt).getTime())
        .filter(Number.isFinite);

      if (ticketDates.length) {
        trendStart = new Date(Math.min(...ticketDates));
      } else {
        trendStart = now;
      }
    }

    const trend = createTrend(currentTickets, period, trendStart, currentEnd);

    /*
     * =====================================================
     * SATISFACTION TREND
     * =====================================================
     */

    const satisfactionTrend = createSatisfactionTrend(
      satisfactionTickets,
      period,
      currentStart,
      currentEnd,
    );

    /*
     * =====================================================
     * MESSAGE METRICS
     * =====================================================
     */

    let totalMessages = 0;
    let agentMessages = 0;
    let customerMessages = 0;
    let aiMessages = 0;

    currentTickets.forEach((ticket) => {
      const conversation = Array.isArray(ticket?.conversation)
        ? ticket.conversation
        : [];

      conversation.forEach((message) => {
        totalMessages += 1;

        const senderRole = String(message?.senderRole || "").toLowerCase();

        if (["agent", "admin"].includes(senderRole)) {
          agentMessages += 1;
        } else if (senderRole === "customer") {
          customerMessages += 1;
        } else if (senderRole === "ai") {
          aiMessages += 1;
        }
      });
    });

    /*
     * =====================================================
     * ESCALATIONS
     * =====================================================
     */

    const escalatedTickets = currentTickets.filter(
      (ticket) => ticket?.escalation?.isEscalated === true,
    );

    /*
     * =====================================================
     * ATTACHMENTS
     * =====================================================
     */

    let totalAttachments = 0;

    currentTickets.forEach((ticket) => {
      if (Array.isArray(ticket?.attachments)) {
        totalAttachments += ticket.attachments.length;
      }
    });

    /*
     * =====================================================
     * RECENT ACTIVITY
     * =====================================================
     */

    const recentActivity = createRecentActivity(currentTickets);

    /*
     * =====================================================
     * ALL-TIME TOTALS
     * =====================================================
     */

    let allTimeTickets = 0;
    let allTimeResolved = 0;
    let allTimeRatings = 0;

    if (period === "all") {
      allTimeTickets = currentMetrics.totalTickets;

      allTimeResolved = currentMetrics.resolvedTickets;

      allTimeRatings = satisfaction.totalRatings;
    } else {
      const allTimeTicketsData = await Ticket.find(baseQuery)
        .select("status satisfaction customerRating")
        .lean();

      allTimeTickets = allTimeTicketsData.length;

      allTimeResolved = allTimeTicketsData.filter((ticket) =>
        ["resolved", "closed"].includes(
          String(ticket?.status || "").toLowerCase(),
        ),
      ).length;

      allTimeRatings = allTimeTicketsData.filter(
        (ticket) => getTicketRating(ticket) !== null,
      ).length;
    }

    /*
     * =====================================================
     * TICKET CHANGES
     * =====================================================
     */

    const ticketsHandledChange =
      period !== "all"
        ? calculatePercentageChange(
            currentMetrics.totalTickets,
            previousMetrics.totalTickets,
          )
        : 0;

    const resolutionRateChange =
      period !== "all"
        ? calculatePercentageChange(
            currentMetrics.resolutionRate,
            previousMetrics.resolutionRate,
          )
        : 0;

    const responseRateChange =
      period !== "all"
        ? calculatePercentageChange(
            currentMetrics.responseRate,
            previousMetrics.responseRate,
          )
        : 0;

    /*
     * Lower response time is better.
     *
     * Positive value means response time increased.
     */

    const responseTimeChange =
      period !== "all" && previousMetrics.averageResponseTime
        ? Number(
            (
              ((currentMetrics.averageResponseTime -
                previousMetrics.averageResponseTime) /
                previousMetrics.averageResponseTime) *
              100
            ).toFixed(1),
          )
        : 0;

    /*
     * =====================================================
     * FINAL RESPONSE
     * =====================================================
     */

    return res.status(200).json({
      success: true,

      analytics: {
        /*
         * =================================================
         * PERIOD
         * =================================================
         */

        period: {
          value: period,

          days: period === "all" ? null : getPeriodDays(period),

          currentStart,
          currentEnd,

          previousStart,
          previousEnd,
        },

        /*
         * =================================================
         * TICKET METRICS
         * =================================================
         */

        ticketsHandled: currentMetrics.totalTickets,

        previousTicketsHandled: previousMetrics.totalTickets,

        ticketsHandledChange,

        resolvedTickets: currentMetrics.resolvedTickets,

        previousResolvedTickets: previousMetrics.resolvedTickets,

        resolutionRate: currentMetrics.resolutionRate,

        previousResolutionRate: previousMetrics.resolutionRate,

        resolutionRateChange,

        /*
         * =================================================
         * STATUS ALIASES
         * =================================================
         *
         * These are useful for existing dashboard cards.
         * =================================================
         */

        openTickets: currentMetrics.statusBreakdown.open,

        inProgressTickets: currentMetrics.statusBreakdown["in-progress"],

        waitingTickets: currentMetrics.statusBreakdown.waiting,

        closedTickets: currentMetrics.statusBreakdown.closed,

        /*
         * =================================================
         * RESPONSE METRICS
         * =================================================
         */

        respondedTickets: currentMetrics.respondedTickets,

        previousRespondedTickets: previousMetrics.respondedTickets,

        responseRate: currentMetrics.responseRate,

        previousResponseRate: previousMetrics.responseRate,

        responseRateChange,

        averageResponseTime: currentMetrics.averageResponseTime,

        averageResponseTimeFormatted: formatDuration(
          currentMetrics.averageResponseTime,
        ),

        previousAverageResponseTime: previousMetrics.averageResponseTime,

        previousAverageResponseTimeFormatted: formatDuration(
          previousMetrics.averageResponseTime,
        ),

        responseTimeChange,

        fastestResponseTime: currentMetrics.fastestResponseTime,

        fastestResponseTimeFormatted: formatDuration(
          currentMetrics.fastestResponseTime,
        ),

        slowestResponseTime: currentMetrics.slowestResponseTime,

        slowestResponseTimeFormatted: formatDuration(
          currentMetrics.slowestResponseTime,
        ),

        /*
         * =================================================
         * RESOLUTION METRICS
         * =================================================
         */

        averageResolutionTime: currentMetrics.averageResolutionTime,

        averageResolutionTimeFormatted: formatDuration(
          currentMetrics.averageResolutionTime,
        ),

        previousAverageResolutionTime: previousMetrics.averageResolutionTime,

        previousAverageResolutionTimeFormatted: formatDuration(
          previousMetrics.averageResolutionTime,
        ),

        /*
         * =================================================
         * BREAKDOWNS
         * =================================================
         */

        statusBreakdown: currentMetrics.statusBreakdown,

        priorityBreakdown: currentMetrics.priorityBreakdown,

        categoryBreakdown: currentMetrics.categoryBreakdown,

        /*
         * =================================================
         * CUSTOMER SATISFACTION
         * =================================================
         *
         * Canonical satisfaction analytics.
         * =================================================
         */

        satisfaction: {
          averageRating: satisfaction.averageRating,

          previousAverageRating: satisfaction.previousAverageRating,

          averageRatingChange: satisfaction.averageRatingChange,

          csat: satisfaction.csat,

          previousCsat: satisfaction.previousCsat,

          csatChange: satisfaction.csatChange,

          ratingScorePercentage: satisfaction.ratingScorePercentage,

          previousRatingScorePercentage:
            satisfaction.previousRatingScorePercentage,

          totalRatings: satisfaction.totalRatings,

          previousRatings: satisfaction.previousRatings,

          satisfiedRatings: satisfaction.satisfiedRatings,

          previousSatisfiedRatings: satisfaction.previousSatisfiedRatings,

          feedbackCount: satisfaction.feedbackCount,

          previousFeedbackCount: satisfaction.previousFeedbackCount,

          feedbackPercentage: satisfaction.feedbackPercentage,

          previousFeedbackPercentage: satisfaction.previousFeedbackPercentage,

          distribution: satisfaction.distribution,

          previousDistribution: satisfaction.previousDistribution,
        },

        /*
         * =================================================
         * TRENDS
         * =================================================
         */

        trend,

        satisfactionTrend,

        /*
         * =================================================
         * CONVERSATION METRICS
         * =================================================
         */

        messages: {
          total: totalMessages,
          agent: agentMessages,
          customer: customerMessages,
          ai: aiMessages,
        },

        /*
         * =================================================
         * ESCALATIONS
         * =================================================
         */

        escalations: {
          total: escalatedTickets.length,

          percentage: currentMetrics.totalTickets
            ? Number(
                (
                  (escalatedTickets.length / currentMetrics.totalTickets) *
                  100
                ).toFixed(1),
              )
            : 0,

          tickets: escalatedTickets.slice(0, 10).map((ticket) => ({
            ticketId: String(ticket._id),

            ticketNumber: ticket.ticketNumber,

            subject: ticket.subject,

            escalatedAt: ticket.escalation?.escalatedAt || null,

            reason: ticket.escalation?.reason || "",

            note: ticket.escalation?.note || "",

            escalatedBy: ticket.escalation?.escalatedBy || null,

            escalatedTo: ticket.escalation?.escalatedTo || null,
          })),
        },

        /*
         * =================================================
         * ATTACHMENTS
         * =================================================
         */

        attachments: {
          total: totalAttachments,
        },

        /*
         * =================================================
         * RECENT ACTIVITY
         * =================================================
         */

        recentActivity,

        /*
         * =================================================
         * ALL-TIME
         * =================================================
         */

        allTime: {
          tickets: allTimeTickets,
          resolved: allTimeResolved,
          ratings: allTimeRatings,
        },
      },
    });
  } catch (error) {
    console.error("GET AGENT ANALYTICS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load agent analytics.",

      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
