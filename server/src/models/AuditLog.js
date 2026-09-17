import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    actor: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      name: {
        type: String,
        trim: true,
        default: "System",
      },

      email: {
        type: String,
        trim: true,
        lowercase: true,
        default: "",
      },

      role: {
        type: String,
        enum: ["admin", "agent", "customer", "system"],
        default: "system",
      },
    },

    action: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      maxlength: 100,
    },

    resource: {
      type: {
        type: String,
        trim: true,
        maxlength: 100,
        default: "",
      },

      id: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
      },
    },

    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    ipAddress: {
      type: String,
      trim: true,
      default: "",
    },

    userAgent: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

// ==========================================
// INDEXES
// ==========================================

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ "actor.userId": 1, createdAt: -1 });
auditLogSchema.index({ "actor.role": 1, createdAt: -1 });
auditLogSchema.index({ "resource.type": 1, createdAt: -1 });
auditLogSchema.index({ "resource.id": 1, createdAt: -1 });

export default mongoose.model("AuditLog", auditLogSchema);
