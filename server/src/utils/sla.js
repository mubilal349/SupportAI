// ==========================================
// SLA CONFIGURATION
// ==========================================

export const SLA_CONFIG = {
  low: {
    responseTimeMinutes: 240, // 4 hours
    resolutionTimeMinutes: 2880, // 48 hours
  },

  medium: {
    responseTimeMinutes: 120, // 2 hours
    resolutionTimeMinutes: 1440, // 24 hours
  },

  high: {
    responseTimeMinutes: 60, // 1 hour
    resolutionTimeMinutes: 720, // 12 hours
  },

  urgent: {
    responseTimeMinutes: 15, // 15 minutes
    resolutionTimeMinutes: 240, // 4 hours
  },
};

// ==========================================
// GET SLA CONFIGURATION
// ==========================================

export const getSlaConfig = (priority = "medium") => {
  return SLA_CONFIG[priority] || SLA_CONFIG.medium;
};

// ==========================================
// CREATE SLA
// ==========================================

export const createSlaDates = ({
  createdAt = new Date(),
  priority = "medium",
}) => {
  const config = getSlaConfig(priority);

  const created = new Date(createdAt);

  const responseDueAt = new Date(
    created.getTime() + config.responseTimeMinutes * 60 * 1000,
  );

  const resolutionDueAt = new Date(
    created.getTime() + config.resolutionTimeMinutes * 60 * 1000,
  );

  return {
    responseTimeMinutes: config.responseTimeMinutes,

    resolutionTimeMinutes: config.resolutionTimeMinutes,

    responseDueAt,

    resolutionDueAt,
  };
};
