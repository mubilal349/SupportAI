// ==========================================
// SUPPORTAI ROLE & PERMISSION CONFIGURATION
// ==========================================

// ==========================================
// PERMISSION KEYS
// ==========================================

export const PERMISSIONS = {
  // Dashboard
  DASHBOARD_VIEW: "dashboard.view",

  // Tickets
  TICKETS_VIEW: "tickets.view",
  TICKETS_CREATE: "tickets.create",
  TICKETS_REPLY: "tickets.reply",
  TICKETS_ASSIGN: "tickets.assign",

  // Users & Agents
  USERS_MANAGE: "users.manage",
  AGENTS_MANAGE: "agents.manage",

  // Knowledge Base
  KNOWLEDGE_BASE_VIEW: "knowledge_base.view",
  KNOWLEDGE_BASE_MANAGE: "knowledge_base.manage",

  // Canned Responses
  CANNED_RESPONSES_VIEW: "canned_responses.view",
  CANNED_RESPONSES_USE: "canned_responses.use",

  // SLA
  SLA_VIEW: "sla.view",
  SLA_MANAGE: "sla.manage",

  // Analytics
  ANALYTICS_VIEW: "analytics.view",
  ANALYTICS_LIMITED: "analytics.limited",
  ANALYTICS_OWN: "analytics.own",

  // Audit Logs
  AUDIT_LOGS_VIEW: "audit_logs.view",

  // System Settings
  SETTINGS_VIEW: "settings.view",
  SETTINGS_MANAGE: "settings.manage",
};

// ==========================================
// PERMISSION DEFINITIONS
// Used by Admin Role & Permissions UI
// ==========================================

export const PERMISSION_DEFINITIONS = [
  // ------------------------------------------
  // Dashboard
  // ------------------------------------------

  {
    key: PERMISSIONS.DASHBOARD_VIEW,
    label: "Dashboard",
    description: "Access the dashboard",
  },

  // ------------------------------------------
  // Tickets
  // ------------------------------------------

  {
    key: PERMISSIONS.TICKETS_VIEW,
    label: "View Tickets",
    description: "View support tickets",
  },

  {
    key: PERMISSIONS.TICKETS_CREATE,
    label: "Create Tickets",
    description: "Create new support tickets",
  },

  {
    key: PERMISSIONS.TICKETS_REPLY,
    label: "Reply to Tickets",
    description: "Reply to ticket conversations",
  },

  {
    key: PERMISSIONS.TICKETS_ASSIGN,
    label: "Assign Tickets",
    description: "Assign tickets to agents",
  },

  // ------------------------------------------
  // Users & Agents
  // ------------------------------------------

  {
    key: PERMISSIONS.USERS_MANAGE,
    label: "Manage Users",
    description: "Create, update and manage users",
  },

  {
    key: PERMISSIONS.AGENTS_MANAGE,
    label: "Manage Agents",
    description: "Create, update and manage agents",
  },

  // ------------------------------------------
  // Knowledge Base
  // ------------------------------------------

  {
    key: PERMISSIONS.KNOWLEDGE_BASE_VIEW,
    label: "Knowledge Base",
    description: "View knowledge base articles",
  },

  {
    key: PERMISSIONS.KNOWLEDGE_BASE_MANAGE,
    label: "Manage Knowledge Base",
    description: "Create, update and delete knowledge base articles",
  },

  // ------------------------------------------
  // Canned Responses
  // ------------------------------------------

  {
    key: PERMISSIONS.CANNED_RESPONSES_VIEW,
    label: "Canned Responses",
    description: "View canned responses",
  },

  {
    key: PERMISSIONS.CANNED_RESPONSES_USE,
    label: "Canned Responses",
    description: "Use canned responses while replying",
  },

  // ------------------------------------------
  // SLA
  // ------------------------------------------

  {
    key: PERMISSIONS.SLA_VIEW,
    label: "SLA Management",
    description: "View SLA information",
  },

  {
    key: PERMISSIONS.SLA_MANAGE,
    label: "SLA Management",
    description: "Create and manage SLA policies",
  },

  // ------------------------------------------
  // Analytics
  // ------------------------------------------

  {
    key: PERMISSIONS.ANALYTICS_VIEW,
    label: "Analytics",
    description: "Access full analytics",
  },

  {
    key: PERMISSIONS.ANALYTICS_LIMITED,
    label: "Analytics",
    description: "Access limited agent analytics",
  },

  {
    key: PERMISSIONS.ANALYTICS_OWN,
    label: "Analytics",
    description: "Access own customer analytics",
  },

  // ------------------------------------------
  // Audit Logs
  // ------------------------------------------

  {
    key: PERMISSIONS.AUDIT_LOGS_VIEW,
    label: "Audit Logs",
    description: "View system audit logs",
  },

  // ------------------------------------------
  // System Settings
  // ------------------------------------------

  {
    key: PERMISSIONS.SETTINGS_VIEW,
    label: "System Settings",
    description: "View system settings",
  },

  {
    key: PERMISSIONS.SETTINGS_MANAGE,
    label: "System Settings",
    description: "Manage system settings",
  },
];

// ==========================================
// DEFAULT ROLE PERMISSIONS
//
// These are used when a role has not yet
// been customized in MongoDB.
// ==========================================

export const ROLE_PERMISSIONS = {
  // ========================================
  // ADMIN
  // ========================================

  admin: [
    PERMISSIONS.DASHBOARD_VIEW,

    PERMISSIONS.TICKETS_VIEW,
    PERMISSIONS.TICKETS_CREATE,
    PERMISSIONS.TICKETS_REPLY,
    PERMISSIONS.TICKETS_ASSIGN,

    PERMISSIONS.USERS_MANAGE,
    PERMISSIONS.AGENTS_MANAGE,

    PERMISSIONS.KNOWLEDGE_BASE_VIEW,
    PERMISSIONS.KNOWLEDGE_BASE_MANAGE,

    PERMISSIONS.CANNED_RESPONSES_VIEW,
    PERMISSIONS.CANNED_RESPONSES_USE,

    PERMISSIONS.SLA_VIEW,
    PERMISSIONS.SLA_MANAGE,

    PERMISSIONS.ANALYTICS_VIEW,

    PERMISSIONS.AUDIT_LOGS_VIEW,

    PERMISSIONS.SETTINGS_VIEW,
    PERMISSIONS.SETTINGS_MANAGE,
  ],

  // ========================================
  // AGENT
  // ========================================

  agent: [
    PERMISSIONS.DASHBOARD_VIEW,

    PERMISSIONS.TICKETS_VIEW,
    PERMISSIONS.TICKETS_CREATE,
    PERMISSIONS.TICKETS_REPLY,

    PERMISSIONS.KNOWLEDGE_BASE_VIEW,

    PERMISSIONS.CANNED_RESPONSES_VIEW,
    PERMISSIONS.CANNED_RESPONSES_USE,

    PERMISSIONS.SLA_VIEW,

    PERMISSIONS.ANALYTICS_LIMITED,
  ],

  // ========================================
  // CUSTOMER
  // ========================================

  customer: [
    PERMISSIONS.DASHBOARD_VIEW,

    PERMISSIONS.TICKETS_VIEW,
    PERMISSIONS.TICKETS_CREATE,
    PERMISSIONS.TICKETS_REPLY,

    PERMISSIONS.KNOWLEDGE_BASE_VIEW,

    PERMISSIONS.ANALYTICS_OWN,
  ],
};

// ==========================================
// ROLE ACCESS LEVELS
//
// Used when a permission requires additional
// ownership/access rules.
// ==========================================

export const ROLE_ACCESS_LEVELS = {
  admin: {
    tickets: "all",
    knowledgeBase: "manage",
    cannedResponses: "manage",
    sla: "manage",
    analytics: "full",
  },

  agent: {
    tickets: "assigned",
    knowledgeBase: "view",
    cannedResponses: "use",
    sla: "view",
    analytics: "limited",
  },

  customer: {
    tickets: "own",
    knowledgeBase: "view",
    cannedResponses: "none",
    sla: "none",
    analytics: "own",
  },
};
