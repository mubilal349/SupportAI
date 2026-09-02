import mongoose from "mongoose";

// ==========================================
// TICKET CONVERSATION MESSAGE SCHEMA
// ==========================================

const ticketReplySchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    senderRole: {
      type: String,
      enum: ["customer", "agent", "admin", "ai", "system"],
      required: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 10000,
    },

    attachments: [
      {
        filename: {
          type: String,
          default: "",
        },

        originalName: {
          type: String,
          default: "",
        },

        mimetype: {
          type: String,
          default: "",
        },

        size: {
          type: Number,
          default: 0,
        },

        path: {
          type: String,
          default: "",
        },

        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    isRead: {
      type: Boolean,
      default: false,
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: true,
  },
);

// ==========================================
// TICKET SCHEMA
// ==========================================

const ticketSchema = new mongoose.Schema(
  {
    // ==========================================
    // BASIC INFORMATION
    // ==========================================

    ticketNumber: {
      type: String,
      unique: true,
      index: true,
    },

    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    assignedAgent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // ==========================================
    // ATTACHMENTS
    // ==========================================

    attachments: [
      {
        filename: {
          type: String,
          default: "",
        },

        originalName: {
          type: String,
          default: "",
        },

        mimetype: {
          type: String,
          default: "",
        },

        size: {
          type: Number,
          default: 0,
        },

        path: {
          type: String,
          default: "",
        },

        uploadedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          default: null,
        },

        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // ==========================================
    // TICKET DETAILS
    // ==========================================

    subject: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 10000,
    },

    category: {
      type: String,
      enum: ["Billing", "Technical", "Account", "Subscription", "General"],
      default: "General",
    },

    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },

    status: {
      type: String,
      enum: ["open", "in-progress", "waiting", "resolved", "closed"],
      default: "open",
      index: true,
    },

    // ==========================================
    // STATUS HISTORY
    // ==========================================

    statusHistory: [
      {
        status: {
          type: String,
          enum: ["open", "in-progress", "waiting", "resolved", "closed"],
          required: true,
        },

        changedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          default: null,
        },

        changedByRole: {
          type: String,
          enum: ["customer", "agent", "admin", "ai", "system"],
          default: "system",
        },

        note: {
          type: String,
          trim: true,
          maxlength: 1000,
          default: "",
        },

        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // ==========================================
    // CONVERSATION
    // ==========================================

    conversation: {
      type: [ticketReplySchema],
      default: [],
    },

    replies: {
      type: Number,
      default: 0,
    },

    lastReplyAt: {
      type: Date,
      default: null,
    },

    // ==========================================
    // TICKET LIFECYCLE
    // ==========================================

    resolvedAt: {
      type: Date,
      default: null,
    },

    closedAt: {
      type: Date,
      default: null,
    },

    reopenedAt: {
      type: Date,
      default: null,
    },

    // ==========================================
    // CUSTOMER SATISFACTION
    // ==========================================

    customerRating: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },

    customerFeedback: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },

    ratedAt: {
      type: Date,
      default: null,
    },

    // ==========================================
    // ESCALATION
    // ==========================================

    isEscalated: {
      type: Boolean,
      default: false,
    },

    escalatedAt: {
      type: Date,
      default: null,
    },

    escalationReason: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },

    // ==========================================
    // AI
    // ==========================================

    aiSummary: {
      type: String,
      trim: true,
      default: "",
    },

    aiSummaryGeneratedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// ==========================================
// INDEXES
// ==========================================

ticketSchema.index({
  customer: 1,
  updatedAt: -1,
});

ticketSchema.index({
  assignedAgent: 1,
  status: 1,
});

ticketSchema.index({
  status: 1,
  priority: 1,
});

// ==========================================
// MODEL
// ==========================================

const Ticket = mongoose.model("Ticket", ticketSchema);

export default Ticket;
