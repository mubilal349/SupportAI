import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    title: {
      type: String,
      trim: true,
      default: "New Support Conversation",
    },

    status: {
      type: String,
      enum: ["active", "resolved", "escalated", "archived"],
      default: "active",
      index: true,
    },

    supportType: {
      type: String,
      enum: ["AI", "Human"],
      default: "AI",
    },

    assignedAgent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    lastMessage: {
      type: String,
      default: "",
    },

    lastMessageAt: {
      type: Date,
      default: Date.now,
    },

    unreadCount: {
      type: Number,
      default: 0,
    },

    messageCount: {
      type: Number,
      default: 0,
    },

    escalatedAt: {
      type: Date,
      default: null,
    },

    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

const Conversation = mongoose.model("Conversation", conversationSchema);

export default Conversation;
