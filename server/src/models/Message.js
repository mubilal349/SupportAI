import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    senderType: {
      type: String,
      enum: ["customer", "ai", "agent", "system"],
      required: true,
    },

    content: {
      type: String,
      trim: true,
      default: "",
    },

    attachments: [
      {
        url: String,
        name: String,
        type: String,
        size: Number,
      },
    ],

    isRead: {
      type: Boolean,
      default: false,
    },

    metadata: {
      confidence: Number,
      model: String,
      tokens: Number,
      intent: String,
    },
  },
  {
    timestamps: true,
  },
);

const Message = mongoose.model("Message", messageSchema);

export default Message;
