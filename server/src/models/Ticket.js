import mongoose from "mongoose";

const ticketReplySchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    senderRole: {
      type: String,
      enum: ["customer", "agent", "admin", "system"],
      required: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },

    attachments: [
      {
        filename: String,
        originalName: String,
        mimetype: String,
        size: Number,
        path: String,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: true,
  },
);

const ticketSchema = new mongoose.Schema(
  {
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

    attachments: [
      {
        filename: String,
        originalName: String,
        mimetype: String,
        size: Number,
        path: String,

        uploadedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },

        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

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
    // CONVERSATION
    // ==========================================

    conversation: [ticketReplySchema],

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

const Ticket = mongoose.model("Ticket", ticketSchema);

export default Ticket;
