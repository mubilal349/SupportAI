import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";

// ==========================================
// CREATE CONVERSATION
// ==========================================

export const createConversation = async (req, res) => {
  try {
    const conversation = await Conversation.create({
      customer: req.user._id,
      title: "New Support Conversation",
      status: "active",
      supportType: "AI",
    });

    res.status(201).json({
      success: true,
      conversation,
    });
  } catch (error) {
    console.error("Create conversation error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create conversation",
    });
  }
};

// ==========================================
// GET CUSTOMER CONVERSATIONS
// ==========================================

export const getCustomerConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      customer: req.user._id,
      status: { $ne: "archived" },
    })
      .populate("assignedAgent", "name email avatar")
      .sort({ lastMessageAt: -1 });

    res.json({
      success: true,
      conversations,
    });
  } catch (error) {
    console.error("Get conversations error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load conversations",
    });
  }
};

// ==========================================
// GET SINGLE CONVERSATION
// ==========================================

export const getConversationById = async (req, res) => {
  try {
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      customer: req.user._id,
    }).populate("assignedAgent", "name email avatar");

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    res.json({
      success: true,
      conversation,
    });
  } catch (error) {
    console.error("Get conversation error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load conversation",
    });
  }
};

// ==========================================
// ARCHIVE CONVERSATION
// ==========================================

export const archiveConversation = async (req, res) => {
  try {
    const conversation = await Conversation.findOneAndUpdate(
      {
        _id: req.params.id,
        customer: req.user._id,
      },
      {
        status: "archived",
      },
      {
        new: true,
      },
    );

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    res.json({
      success: true,
      message: "Conversation archived",
      conversation,
    });
  } catch (error) {
    console.error("Archive conversation error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to archive conversation",
    });
  }
};
