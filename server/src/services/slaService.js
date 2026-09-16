import mongoose from "mongoose";
import SlaPolicy from "../models/SlaPolicy.js";
import Ticket from "../models/Ticket.js";

const DEFAULT_RULES = [
  {
    priority: "urgent",
    firstResponseMinutes: 30,
    resolutionMinutes: 240,
    isActive: true,
  },
  {
    priority: "high",
    firstResponseMinutes: 60,
    resolutionMinutes: 480,
    isActive: true,
  },
  {
    priority: "medium",
    firstResponseMinutes: 120,
    resolutionMinutes: 1440,
    isActive: true,
  },
  {
    priority: "low",
    firstResponseMinutes: 240,
    resolutionMinutes: 2880,
    isActive: true,
  },
];

const getDefaultPolicy = async () => {
  let policy = await SlaPolicy.findOne({
    isActive: true,
  }).sort({ createdAt: 1 });

  if (!policy) {
    policy = await SlaPolicy.create({
      name: "Default SLA Policy",
      description: "Default SLA rules for SupportAI tickets.",
      rules: DEFAULT_RULES,
      isActive: true,
    });
  }

  return policy;
};

export const getSlaPolicyService = async () => {
  return getDefaultPolicy();
};

export const updateSlaPolicyService = async (policyData, adminId) => {
  const { name, description, rules, isActive } = policyData || {};

  if (!Array.isArray(rules) || rules.length === 0) {
    const error = new Error("At least one SLA rule is required.");

    error.statusCode = 400;

    throw error;
  }

  const validPriorities = ["urgent", "high", "medium", "low"];

  const normalizedRules = rules.map((rule) => {
    if (!validPriorities.includes(rule.priority)) {
      const error = new Error(`Invalid priority: ${rule.priority}`);

      error.statusCode = 400;

      throw error;
    }

    const firstResponseMinutes = Number(rule.firstResponseMinutes);

    const resolutionMinutes = Number(rule.resolutionMinutes);

    if (!Number.isFinite(firstResponseMinutes) || firstResponseMinutes <= 0) {
      const error = new Error(
        `Invalid first response time for ${rule.priority}.`,
      );

      error.statusCode = 400;

      throw error;
    }

    if (!Number.isFinite(resolutionMinutes) || resolutionMinutes <= 0) {
      const error = new Error(`Invalid resolution time for ${rule.priority}.`);

      error.statusCode = 400;

      throw error;
    }

    return {
      priority: rule.priority,
      firstResponseMinutes,
      resolutionMinutes,
      isActive: rule.isActive !== false,
    };
  });

  const uniquePriorities = new Set(
    normalizedRules.map((rule) => rule.priority),
  );

  if (uniquePriorities.size !== normalizedRules.length) {
    const error = new Error("Each priority can only have one SLA rule.");

    error.statusCode = 400;

    throw error;
  }

  let policy = await SlaPolicy.findOne({
    isActive: true,
  }).sort({ createdAt: 1 });

  if (!policy) {
    policy = new SlaPolicy();
  }

  policy.name =
    typeof name === "string" && name.trim()
      ? name.trim()
      : "Default SLA Policy";

  policy.description =
    typeof description === "string" ? description.trim() : "";

  policy.rules = normalizedRules;

  if (typeof isActive === "boolean") {
    policy.isActive = isActive;
  } else {
    policy.isActive = true;
  }

  if (adminId && mongoose.Types.ObjectId.isValid(adminId)) {
    policy.updatedBy = adminId;
  }

  await policy.save();

  return policy;
};

export const getSlaRuleForPriorityService = async (priority) => {
  const policy = await getDefaultPolicy();

  const normalizedPriority = String(priority || "medium").toLowerCase();

  let rule = policy.rules.find(
    (item) => item.priority === normalizedPriority && item.isActive,
  );

  if (!rule) {
    rule = policy.rules.find(
      (item) => item.priority === "medium" && item.isActive,
    );
  }

  if (!rule) {
    const error = new Error("No active SLA rule found.");

    error.statusCode = 500;

    throw error;
  }

  return rule;
};

export const calculateSlaDeadlinesService = async (
  priority,
  startTime = new Date(),
) => {
  const rule = await getSlaRuleForPriorityService(priority);

  const startedAt = new Date(startTime);

  if (Number.isNaN(startedAt.getTime())) {
    const error = new Error("Invalid SLA start time.");

    error.statusCode = 400;

    throw error;
  }

  const responseDueAt = new Date(
    startedAt.getTime() + rule.firstResponseMinutes * 60 * 1000,
  );

  const resolutionDueAt = new Date(
    startedAt.getTime() + rule.resolutionMinutes * 60 * 1000,
  );

  return {
    responseTimeMinutes: rule.firstResponseMinutes,

    resolutionTimeMinutes: rule.resolutionMinutes,

    responseDueAt,
    resolutionDueAt,
  };
};

export const getSlaStatisticsService = async () => {
  const now = new Date();

  const tickets = await Ticket.find({
    status: {
      $nin: ["closed"],
    },
    "sla.responseDueAt": {
      $ne: null,
    },
  }).select("status priority sla resolvedAt createdAt");

  let responsePending = 0;
  let responseBreached = 0;
  let responseCompleted = 0;

  let resolutionPending = 0;
  let resolutionBreached = 0;
  let resolutionCompleted = 0;

  for (const ticket of tickets) {
    const sla = ticket.sla || {};

    if (sla.firstRespondedAt) {
      responseCompleted += 1;
    } else if (sla.responseDueAt && new Date(sla.responseDueAt) < now) {
      responseBreached += 1;
    } else {
      responsePending += 1;
    }

    if (
      ticket.status === "resolved" ||
      ticket.status === "closed" ||
      sla.resolvedAt
    ) {
      resolutionCompleted += 1;
    } else if (sla.resolutionDueAt && new Date(sla.resolutionDueAt) < now) {
      resolutionBreached += 1;
    } else {
      resolutionPending += 1;
    }
  }

  return {
    totalTickets: tickets.length,

    response: {
      pending: responsePending,
      breached: responseBreached,
      completed: responseCompleted,
    },

    resolution: {
      pending: resolutionPending,
      breached: resolutionBreached,
      completed: resolutionCompleted,
    },

    generatedAt: now,
  };
};
