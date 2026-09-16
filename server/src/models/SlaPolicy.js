import mongoose from "mongoose";

const slaRuleSchema = new mongoose.Schema(
  {
    priority: {
      type: String,
      enum: ["urgent", "high", "medium", "low"],
      required: true,
    },

    firstResponseMinutes: {
      type: Number,
      required: true,
      min: 1,
    },

    resolutionMinutes: {
      type: Number,
      required: true,
      min: 1,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    _id: false,
  },
);

const slaPolicySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      default: "Default SLA Policy",
    },

    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },

    rules: {
      type: [slaRuleSchema],
      default: [],
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

const SlaPolicy = mongoose.model("SlaPolicy", slaPolicySchema);

export default SlaPolicy;
