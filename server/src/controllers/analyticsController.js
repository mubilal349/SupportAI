import mongoose from "mongoose";
import Ticket from "../models/Ticket.js";

// =========================================================
// ANALYTICS PERIOD HELPER
// =========================================================

const getAnalyticsPeriod = (period = "7d") => {
  const now = new Date();

  const daysMap = {
    "7d": 7,
    "30d": 30,
    "90d": 90,
  };

  const days = daysMap[period] || 7;

  // Current period
  const currentStart = new Date(now);
  currentStart.setDate(currentStart.getDate() - days);

  // Previous period
  const previousStart = new Date(currentStart);
  previousStart.setDate(previousStart.getDate() - days);

  return {
    value: period,
    days,
    currentStart,
    currentEnd: now,
    previousStart,
    previousEnd: currentStart,
  };
};

// =========================================================
// PERCENTAGE HELPER
// =========================================================

const calculatePercentage = (value, total) => {
  if (!total || total <= 0) {
    return 0;
  }

  return Math.round((value / total) * 100);
};

// =========================================================
// CHANGE PERCENTAGE HELPER
// =========================================================

const calculateChange = (current, previous) => {
  if (!previous || previous === 0) {
    if (current > 0) {
      return 100;
    }

    return 0;
  }

  return Math.round(((current - previous) / previous) * 100);
};

// =========================================================
// FORMAT DURATION
// =========================================================

const formatDuration = (milliseconds) => {
  if (!milliseconds || milliseconds <= 0) {
    return "0s";
  }

  const totalSeconds = Math.round(milliseconds / 1000);

  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts = [];

  if (days > 0) {
    parts.push(`${days}d`);
  }

  if (hours > 0) {
    parts.push(`${hours}h`);
  }

  if (minutes > 0) {
    parts.push(`${minutes}m`);
  }

  if (seconds > 0 || parts.length === 0) {
    parts.push(`${seconds}s`);
  }

  return parts.join(" ");
};

// =========================================================
// GET FIRST SUPPORT RESPONSE
// Customer message → first AI / Agent / Admin response
// =========================================================

const getFirstSupportResponse = (ticket) => {
  const conversation = Array.isArray(ticket?.conversation)
    ? ticket.conversation
    : [];

  if (!conversation.length) {
    return null;
  }

  // -------------------------------------------------------
  // Find the first customer message
  // -------------------------------------------------------

  const customerMessage = conversation
    .filter(
      (message) => message?.senderRole === "customer" && message?.createdAt,
    )
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    )[0];

  if (!customerMessage) {
    return null;
  }

  // -------------------------------------------------------
  // Find the first support response after customer message
  // -------------------------------------------------------

  const customerMessageTime = new Date(customerMessage.createdAt).getTime();

  const supportReply = conversation
    .filter(
      (message) =>
        ["agent", "admin", "ai"].includes(message?.senderRole) &&
        message?.createdAt &&
        new Date(message.createdAt).getTime() > customerMessageTime,
    )
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    )[0];

  if (!supportReply) {
    return null;
  }

  // -------------------------------------------------------
  // Calculate response time in milliseconds
  // -------------------------------------------------------

  const supportReplyTime = new Date(supportReply.createdAt).getTime();

  const responseTime = supportReplyTime - customerMessageTime;

  if (responseTime < 0) {
    return null;
  }

  return responseTime;
};

// =========================================================
// CALCULATE AVERAGE RESPONSE TIME
// =========================================================

const calculateAverageResponseTime = (tickets) => {
  const responseTimes = [];

  tickets.forEach((ticket) => {
    const responseTime = getFirstSupportResponse(ticket);

    if (responseTime !== null) {
      responseTimes.push(responseTime);
    }
  });

  if (!responseTimes.length) {
    return 0;
  }

  return Math.round(
    responseTimes.reduce((sum, value) => sum + value, 0) / responseTimes.length,
  );
};

// =========================================================
// CALCULATE AVERAGE RESOLUTION TIME
// =========================================================

const calculateAverageResolutionTime = (tickets) => {
  const resolutionTimes = [];

  tickets.forEach((ticket) => {
    if (!ticket?.createdAt || !ticket?.resolvedAt) {
      return;
    }

    const createdAt = new Date(ticket.createdAt).getTime();
    const resolvedAt = new Date(ticket.resolvedAt).getTime();

    const duration = resolvedAt - createdAt;

    if (duration >= 0) {
      resolutionTimes.push(duration);
    }
  });

  if (!resolutionTimes.length) {
    return 0;
  }

  return Math.round(
    resolutionTimes.reduce((sum, value) => sum + value, 0) /
      resolutionTimes.length,
  );
};

// =========================================================
// BUILD ACTIVITY DATA
// =========================================================

const buildActivityData = (tickets, currentStart, now, days) => {
  const activity = [];

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);

    date.setDate(date.getDate() - i);

    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);

    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const dayTickets = tickets.filter((ticket) => {
      const createdAt = new Date(ticket.createdAt);

      return createdAt >= dayStart && createdAt <= dayEnd;
    });

    let messages = 0;
    let resolved = 0;

    dayTickets.forEach((ticket) => {
      messages += Array.isArray(ticket.conversation)
        ? ticket.conversation.length
        : 0;

      if (
        ticket.resolvedAt &&
        new Date(ticket.resolvedAt) >= dayStart &&
        new Date(ticket.resolvedAt) <= dayEnd
      ) {
        resolved++;
      }
    });

    activity.push({
      label: dayStart.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),

      date: dayStart.toISOString(),

      conversations: dayTickets.length,

      tickets: dayTickets.length,

      resolved,

      messages,
    });
  }

  return activity;
};

// =========================================================
// BUILD RECENT ACTIVITY
// =========================================================

const buildRecentActivity = (tickets) => {
  const activities = [];

  tickets.forEach((ticket) => {
    if (!ticket) {
      return;
    }

    // -----------------------------------------------------
    // Ticket created
    // -----------------------------------------------------

    if (ticket.createdAt) {
      activities.push({
        id: `${ticket._id}-created`,
        type: "ticket_created",
        title: "Ticket created",
        description:
          ticket.subject || ticket.ticketNumber || "New support ticket",
        timestamp: ticket.createdAt,
      });
    }

    // -----------------------------------------------------
    // Ticket resolved
    // -----------------------------------------------------

    if (ticket.resolvedAt) {
      activities.push({
        id: `${ticket._id}-resolved`,
        type: "ticket_resolved",
        title: "Ticket resolved",
        description:
          ticket.subject || ticket.ticketNumber || "Support ticket resolved",
        timestamp: ticket.resolvedAt,
      });
    }

    // -----------------------------------------------------
    // Ticket closed
    // -----------------------------------------------------

    if (ticket.closedAt) {
      activities.push({
        id: `${ticket._id}-closed`,
        type: "ticket_closed",
        title: "Ticket closed",
        description:
          ticket.subject || ticket.ticketNumber || "Support ticket closed",
        timestamp: ticket.closedAt,
      });
    }

    // -----------------------------------------------------
    // Ticket reopened
    // -----------------------------------------------------

    if (ticket.reopenedAt) {
      activities.push({
        id: `${ticket._id}-reopened`,
        type: "ticket_reopened",
        title: "Ticket reopened",
        description:
          ticket.subject || ticket.ticketNumber || "Support ticket reopened",
        timestamp: ticket.reopenedAt,
      });
    }

    // -----------------------------------------------------
    // Escalation
    // -----------------------------------------------------

    if (ticket.escalatedAt) {
      activities.push({
        id: `${ticket._id}-escalated`,
        type: "ticket_escalated",
        title: "Ticket escalated",
        description:
          ticket.escalationReason ||
          ticket.subject ||
          "Ticket escalated to support",
        timestamp: ticket.escalatedAt,
      });
    }

    // -----------------------------------------------------
    // Rating
    // -----------------------------------------------------

    if (ticket.ratedAt) {
      activities.push({
        id: `${ticket._id}-rated`,
        type: "ticket_rated",
        title: "Support rated",
        description: ticket.customerRating
          ? `You rated this support ${ticket.customerRating}/5`
          : "Support interaction rated",
        timestamp: ticket.ratedAt,
      });
    }

    // -----------------------------------------------------
    // Conversation messages
    // -----------------------------------------------------

    if (Array.isArray(ticket.conversation)) {
      ticket.conversation.forEach((message) => {
        if (!message?.createdAt) {
          return;
        }

        let type = "message";

        let title = "New message";

        if (message.senderRole === "ai") {
          type = "ai_message";
          title = "AI Assistant replied";
        } else if (
          message.senderRole === "agent" ||
          message.senderRole === "admin"
        ) {
          type = "agent_message";
          title = "Support agent replied";
        } else if (message.senderRole === "customer") {
          type = "customer_message";
          title = "You sent a message";
        }

        activities.push({
          id: `${ticket._id}-message-${message._id}`,
          type,
          title,
          description: message.message?.slice(0, 120) || "New support message",
          timestamp: message.createdAt,
        });
      });
    }
  });

  return activities
    .filter((activity) => activity.timestamp)
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    )
    .slice(0, 10);
};

// =========================================================
// GET CUSTOMER ANALYTICS
// =========================================================

export const getCustomerAnalytics = async (req, res) => {
  try {
    // =====================================================
    // CUSTOMER ID
    // =====================================================

    const customerId = req.user?.id;

    if (!customerId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID",
      });
    }

    // =====================================================
    // PERIOD
    // =====================================================

    const requestedPeriod = req.query.period || "7d";

    if (!["7d", "30d", "90d"].includes(requestedPeriod)) {
      return res.status(400).json({
        success: false,
        message: "Invalid period. Use 7d, 30d, or 90d.",
      });
    }

    const {
      value: period,
      days,
      currentStart,
      currentEnd,
      previousStart,
      previousEnd,
    } = getAnalyticsPeriod(requestedPeriod);

    // =====================================================
    // SELECT FIELDS
    // =====================================================

    const fields = [
      "ticketNumber",
      "subject",
      "category",
      "priority",
      "status",
      "conversation",
      "statusHistory",
      "replies",
      "createdAt",
      "updatedAt",
      "resolvedAt",
      "closedAt",
      "reopenedAt",
      "customerRating",
      "customerFeedback",
      "ratedAt",
      "isEscalated",
      "escalatedAt",
      "escalationReason",
      "attachments",
    ].join(" ");

    // =====================================================
    // CURRENT PERIOD TICKETS
    // =====================================================

    const currentTickets = await Ticket.find({
      customer: customerId,
      createdAt: {
        $gte: currentStart,
        $lte: currentEnd,
      },
    })
      .select(fields)
      .lean();

    // =====================================================
    // PREVIOUS PERIOD TICKETS
    // =====================================================

    const previousTickets = await Ticket.find({
      customer: customerId,
      createdAt: {
        $gte: previousStart,
        $lt: currentStart,
      },
    })
      .select(fields)
      .lean();
    // =====================================================
    // ALL CUSTOMER TICKETS
    //
    // IMPORTANT:
    // This is used for all-time totals and current status
    // overview.
    // =====================================================

    const allCustomerTickets = await Ticket.find({
      customer: customerId,
    })
      .select(fields)
      .lean();

    // =====================================================
    // TICKET COUNTS
    //
    // IMPORTANT FIX:
    //
    // currentPeriodTickets = tickets created in selected
    // period.
    //
    // totalCustomerTickets = ALL tickets belonging to the
    // customer.
    //
    // Therefore "Total Tickets" never becomes 0 simply
    // because the selected period contains no new tickets.
    // =====================================================

    const currentPeriodTickets = currentTickets.length;

    const totalCustomerTickets = allCustomerTickets.length;

    const previousPeriodTickets = previousTickets.length;

    const totalConversations = currentPeriodTickets;

    const previousConversations = previousPeriodTickets;

    // =====================================================
    // CURRENT PERIOD STATUS COUNTS
    // =====================================================

    const statusCounts = {
      open: 0,
      "in-progress": 0,
      waiting: 0,
      resolved: 0,
      closed: 0,
    };

    currentTickets.forEach((ticket) => {
      if (Object.prototype.hasOwnProperty.call(statusCounts, ticket.status)) {
        statusCounts[ticket.status]++;
      }
    });

    // =====================================================
    // ALL-TIME STATUS COUNTS
    // =====================================================

    const allStatusCounts = {
      open: 0,
      "in-progress": 0,
      waiting: 0,
      resolved: 0,
      closed: 0,
    };

    allCustomerTickets.forEach((ticket) => {
      if (
        Object.prototype.hasOwnProperty.call(allStatusCounts, ticket.status)
      ) {
        allStatusCounts[ticket.status]++;
      }
    });

    // =====================================================
    // CURRENT PERIOD RESOLUTION
    // =====================================================

    const resolvedCurrentCount =
      (statusCounts.resolved || 0) + (statusCounts.closed || 0);

    const resolutionRate = calculatePercentage(
      resolvedCurrentCount,
      currentPeriodTickets,
    );

    // =====================================================
    // ALL-TIME OPEN / RESOLVED
    // =====================================================

    const openTickets =
      (allStatusCounts.open || 0) +
      (allStatusCounts["in-progress"] || 0) +
      (allStatusCounts.waiting || 0);

    const resolvedTickets =
      (allStatusCounts.resolved || 0) + (allStatusCounts.closed || 0);

    // =====================================================
    // HISTORICAL RESOLUTION RATE
    // =====================================================

    const historicalResolutionRate = calculatePercentage(
      resolvedTickets,
      totalCustomerTickets,
    );

    // =====================================================
    // RESOLUTION METHOD
    // =====================================================

    let aiResolved = 0;
    let humanResolved = 0;

    currentTickets.forEach((ticket) => {
      if (ticket.status !== "resolved" && ticket.status !== "closed") {
        return;
      }

      const resolutionHistory = Array.isArray(ticket.statusHistory)
        ? ticket.statusHistory
            .filter(
              (entry) =>
                entry.status === "resolved" || entry.status === "closed",
            )
            .sort(
              (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime(),
            )[0]
        : null;

      if (resolutionHistory?.changedByRole === "ai") {
        aiResolved++;
      } else {
        humanResolved++;
      }
    });

    const totalResolvedByMethod = aiResolved + humanResolved;

    const aiResolutionRate = calculatePercentage(
      aiResolved,
      totalResolvedByMethod,
    );

    // =====================================================
    // MESSAGE ANALYTICS
    // =====================================================

    let totalMessages = 0;
    let customerMessages = 0;
    let aiMessages = 0;
    let agentMessages = 0;
    let systemMessages = 0;

    currentTickets.forEach((ticket) => {
      if (!Array.isArray(ticket.conversation)) {
        return;
      }

      ticket.conversation.forEach((message) => {
        totalMessages++;

        switch (message.senderRole) {
          case "customer":
            customerMessages++;
            break;

          case "ai":
            aiMessages++;
            break;

          case "agent":
          case "admin":
            agentMessages++;
            break;

          case "system":
            systemMessages++;
            break;

          default:
            break;
        }
      });
    });

    const customerPercentage = calculatePercentage(
      customerMessages,
      totalMessages,
    );

    const aiPercentage = calculatePercentage(aiMessages, totalMessages);

    const agentPercentage = calculatePercentage(agentMessages, totalMessages);

    // =====================================================
    // RESPONSE TIME
    // =====================================================

    const averageResponseTime = calculateAverageResponseTime(currentTickets);

    const previousAverageResponseTime =
      calculateAverageResponseTime(previousTickets);

    const responseTimeDifference =
      averageResponseTime - previousAverageResponseTime;

    const responseTimeChangePercentage =
      previousAverageResponseTime > 0
        ? Math.round(
            ((averageResponseTime - previousAverageResponseTime) /
              previousAverageResponseTime) *
              100,
          )
        : 0;

    // Lower response time is better.
    const responseTimeImproved =
      previousAverageResponseTime > 0 &&
      averageResponseTime < previousAverageResponseTime;

    // =====================================================
    // RESOLUTION TIME
    // =====================================================

    const averageResolutionTime =
      calculateAverageResolutionTime(currentTickets);

    const previousAverageResolutionTime =
      calculateAverageResolutionTime(previousTickets);

    const resolutionTimeChangePercentage = calculateChange(
      averageResolutionTime,
      previousAverageResolutionTime,
    );

    // Lower resolution time is better.
    const resolutionTimeImproved =
      previousAverageResolutionTime > 0 &&
      averageResolutionTime < previousAverageResolutionTime;

    // =====================================================
    // SATISFACTION / RATINGS
    // =====================================================

    const ratedTickets = currentTickets.filter(
      (ticket) => typeof ticket.customerRating === "number",
    );

    const previousRatedTickets = previousTickets.filter(
      (ticket) => typeof ticket.customerRating === "number",
    );

    const totalRatings = ratedTickets.length;

    const previousRatings = previousRatedTickets.length;

    const averageRating =
      totalRatings > 0
        ? Number(
            (
              ratedTickets.reduce(
                (sum, ticket) => sum + ticket.customerRating,
                0,
              ) / totalRatings
            ).toFixed(1),
          )
        : 0;

    const previousAverageRating =
      previousRatings > 0
        ? Number(
            (
              previousRatedTickets.reduce(
                (sum, ticket) => sum + ticket.customerRating,
                0,
              ) / previousRatings
            ).toFixed(1),
          )
        : 0;

    const satisfactionPercentage =
      totalRatings > 0 ? Math.round((averageRating / 5) * 100) : 0;

    const previousSatisfactionPercentage =
      previousRatings > 0 ? Math.round((previousAverageRating / 5) * 100) : 0;

    const satisfactionChange =
      satisfactionPercentage - previousSatisfactionPercentage;

    // =====================================================
    // RATING DISTRIBUTION
    // =====================================================

    const ratingDistribution = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };

    ratedTickets.forEach((ticket) => {
      const rating = Number(ticket.customerRating);

      if (rating >= 1 && rating <= 5) {
        ratingDistribution[rating]++;
      }
    });

    // =====================================================
    // PRIORITY ANALYTICS
    // =====================================================

    const priorityCounts = {
      low: 0,
      medium: 0,
      high: 0,
    };

    currentTickets.forEach((ticket) => {
      if (
        Object.prototype.hasOwnProperty.call(priorityCounts, ticket.priority)
      ) {
        priorityCounts[ticket.priority]++;
      }
    });

    const priorities = [
      {
        name: "Low",
        value: "low",
        count: priorityCounts.low,
        percentage: calculatePercentage(
          priorityCounts.low,
          currentPeriodTickets,
        ),
      },
      {
        name: "Medium",
        value: "medium",
        count: priorityCounts.medium,
        percentage: calculatePercentage(
          priorityCounts.medium,
          currentPeriodTickets,
        ),
      },
      {
        name: "High",
        value: "high",
        count: priorityCounts.high,
        percentage: calculatePercentage(
          priorityCounts.high,
          currentPeriodTickets,
        ),
      },
    ];

    // =====================================================
    // CATEGORY ANALYTICS
    // =====================================================

    const categoryCounts = {
      Billing: 0,
      Technical: 0,
      Account: 0,
      Subscription: 0,
      General: 0,
    };

    currentTickets.forEach((ticket) => {
      if (
        Object.prototype.hasOwnProperty.call(categoryCounts, ticket.category)
      ) {
        categoryCounts[ticket.category]++;
      }
    });

    const categories = [
      {
        name: "Billing",
        count: categoryCounts.Billing,
        percentage: calculatePercentage(
          categoryCounts.Billing,
          currentPeriodTickets,
        ),
      },
      {
        name: "Technical",
        count: categoryCounts.Technical,
        percentage: calculatePercentage(
          categoryCounts.Technical,
          currentPeriodTickets,
        ),
      },
      {
        name: "Account",
        count: categoryCounts.Account,
        percentage: calculatePercentage(
          categoryCounts.Account,
          currentPeriodTickets,
        ),
      },
      {
        name: "Subscription",
        count: categoryCounts.Subscription,
        percentage: calculatePercentage(
          categoryCounts.Subscription,
          currentPeriodTickets,
        ),
      },
      {
        name: "General",
        count: categoryCounts.General,
        percentage: calculatePercentage(
          categoryCounts.General,
          currentPeriodTickets,
        ),
      },
    ];

    // =====================================================
    // ESCALATIONS
    // =====================================================

    const escalatedTickets = currentTickets.filter(
      (ticket) => ticket.isEscalated === true,
    ).length;

    const escalationPercentage = calculatePercentage(
      escalatedTickets,
      currentPeriodTickets,
    );

    // =====================================================
    // ATTACHMENTS
    // =====================================================

    let ticketAttachments = 0;
    let conversationAttachments = 0;

    currentTickets.forEach((ticket) => {
      if (Array.isArray(ticket.attachments)) {
        ticketAttachments += ticket.attachments.length;
      }

      if (Array.isArray(ticket.conversation)) {
        ticket.conversation.forEach((message) => {
          if (Array.isArray(message.attachments)) {
            conversationAttachments += message.attachments.length;
          }
        });
      }
    });

    const totalAttachments = ticketAttachments + conversationAttachments;

    // =====================================================
    // ACTIVITY CHART
    // =====================================================

    const activity = buildActivityData(
      currentTickets,
      currentStart,
      currentEnd,
      days,
    );

    // =====================================================
    // RECENT ACTIVITY
    // =====================================================

    const recentActivity = buildRecentActivity(currentTickets);

    // =====================================================
    // RESPONSE
    // =====================================================

    return res.status(200).json({
      success: true,

      period: {
        value: period,
        days,

        currentStart,

        currentEnd,

        previousStart,

        previousEnd,
      },

      // ===================================================
      // OVERVIEW
      // ===================================================

      overview: {
        // ALL-TIME TOTAL
        totalTickets: totalCustomerTickets,

        // SELECTED PERIOD
        totalConversations,

        previousTickets: previousPeriodTickets,

        previousConversations,

        ticketChange: calculateChange(
          currentPeriodTickets,
          previousPeriodTickets,
        ),

        conversationChange: calculateChange(
          totalConversations,
          previousConversations,
        ),

        // ALL-TIME STATUS OVERVIEW
        openTickets,

        resolvedTickets,

        // CURRENT PERIOD RESOLUTION RATE
        resolutionRate,

        // ALL-TIME RESOLUTION RATE
        historicalResolutionRate,
      },

      // ===================================================
      // STATUS
      // ===================================================

      status: {
        // SELECTED PERIOD
        current: statusCounts,

        // ALL-TIME
        allTime: allStatusCounts,
      },

      // ===================================================
      // RESOLUTION
      // ===================================================

      resolution: {
        resolved: resolvedCurrentCount,

        aiResolved,

        humanResolved,

        aiResolutionRate,

        totalResolvedByMethod,
      },

      // ===================================================
      // MESSAGES
      // ===================================================

      messages: {
        total: totalMessages,

        customer: customerMessages,

        ai: aiMessages,

        agents: agentMessages,

        system: systemMessages,

        customerPercentage,

        aiPercentage,

        agentPercentage,
      },

      // ===================================================
      // RESPONSE TIME
      // ===================================================

      responseTime: {
        average: formatDuration(averageResponseTime),

        averageMilliseconds: averageResponseTime,

        previousAverage: formatDuration(previousAverageResponseTime),

        previousAverageMilliseconds: previousAverageResponseTime,

        difference: formatDuration(Math.abs(responseTimeDifference)),

        improved: responseTimeImproved,

        changePercentage: Math.abs(responseTimeChangePercentage),
      },

      // ===================================================
      // RESOLUTION TIME
      // ===================================================

      resolutionTime: {
        average: formatDuration(averageResolutionTime),

        averageMilliseconds: averageResolutionTime,

        previousAverage: formatDuration(previousAverageResolutionTime),

        previousAverageMilliseconds: previousAverageResolutionTime,

        changePercentage: Math.abs(resolutionTimeChangePercentage),

        improved: resolutionTimeImproved,
      },

      // ===================================================
      // SATISFACTION
      // ===================================================

      satisfaction: {
        averageRating,

        previousAverageRating,

        percentage: satisfactionPercentage,

        previousPercentage: previousSatisfactionPercentage,

        change: satisfactionChange,

        totalRatings,

        previousRatings,

        distribution: ratingDistribution,
      },

      // ===================================================
      // PRIORITIES
      // ===================================================

      priorities: {
        counts: priorityCounts,

        data: priorities,
      },

      // ===================================================
      // CATEGORIES
      // ===================================================

      categories: {
        counts: categoryCounts,

        data: categories,
      },

      // ===================================================
      // ESCALATIONS
      // ===================================================

      escalations: {
        total: escalatedTickets,

        percentage: escalationPercentage,
      },

      // ===================================================
      // ATTACHMENTS
      // ===================================================

      attachments: {
        ticketAttachments,

        conversationAttachments,

        total: totalAttachments,
      },

      // ===================================================
      // ACTIVITY
      // ===================================================

      activity,

      // ===================================================
      // RECENT ACTIVITY
      // ===================================================

      recentActivity,
    });
  } catch (error) {
    console.error("CUSTOMER ANALYTICS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load customer analytics",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
