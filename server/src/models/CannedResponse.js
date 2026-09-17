import mongoose from "mongoose";

const cannedResponseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    shortcut: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 100,
    },

    category: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
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

// Prevent duplicate shortcuts
cannedResponseSchema.index({ shortcut: 1 }, { unique: true });

// Useful for searching/filtering
cannedResponseSchema.index({
  title: "text",
  shortcut: "text",
  category: "text",
  content: "text",
});

cannedResponseSchema.index({
  isActive: 1,
  category: 1,
});

export default mongoose.model("CannedResponse", cannedResponseSchema);
