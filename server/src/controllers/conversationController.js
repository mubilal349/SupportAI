import mongoose from "mongoose";

import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import { generateAIResponse } from "../services/aiService.js";

// ==========================================
// CREATE CONVERSATION
// ==========================================

export const createConversation = async (req, res) => {
  try {
    const customerId = req.user?._id || req.user?.id;

    if (!customerId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const conversation = await Conversation.create({
      customer: customerId,
      title: "New Support Conversation",
      status: "active",
      supportType: "AI",
      lastMessage: "",
      lastMessageAt: new Date(),
      unreadCount: 0,
      messageCount: 0,
    });

    return res.status(201).json({
      success: true,
      conversation,
    });
  } catch (error) {
    console.error("Create conversation error:", error);

    return res.status(500).json({
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
    const customerId = req.user?._id || req.user?.id;

    if (!customerId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const conversations = await Conversation.find({
      customer: customerId,
      status: { $ne: "archived" },
    })
      .populate("assignedAgent", "name email avatar")
      .sort({ lastMessageAt: -1 });

    return res.json({
      success: true,
      conversations,
    });
  } catch (error) {
    console.error("Get conversations error:", error);

    return res.status(500).json({
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
    const customerId = req.user?._id || req.user?.id;
    const conversationId = req.params.id;

    if (!customerId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid conversation ID",
      });
    }

    const conversation = await Conversation.findOne({
      _id: conversationId,
      customer: customerId,
    }).populate("assignedAgent", "name email avatar");

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    return res.json({
      success: true,
      conversation,
    });
  } catch (error) {
    console.error("Get conversation error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load conversation",
    });
  }
};

// ==========================================
// GET CONVERSATION MESSAGES
// ==========================================

export const getConversationMessages = async (req, res) => {
  try {
    const customerId = req.user?._id || req.user?.id;
    const conversationId = req.params.id;

    if (!customerId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid conversation ID",
      });
    }

    const conversation = await Conversation.findOne({
      _id: conversationId,
      customer: customerId,
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    const messages = await Message.find({
      conversation: conversationId,
    })
      .populate("sender", "name email avatar role")
      .sort({ createdAt: 1 })
      .lean();

    return res.json({
      success: true,
      messages,
    });
  } catch (error) {
    console.error("Get conversation messages error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load messages",
    });
  }
};

// ==========================================
// SEND MESSAGE
// ==========================================

export const sendMessage = async (req, res) => {
  try {
    const customerId = req.user?._id || req.user?.id;
    const conversationId = req.params.id;

    const messageText =
      typeof req.body?.message === "string" ? req.body.message.trim() : "";

    const history = Array.isArray(req.body?.history) ? req.body.history : [];

    // ----------------------------------------
    // VALIDATION
    // ----------------------------------------

    if (!customerId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid conversation ID",
      });
    }

    if (!messageText) {
      return res.status(400).json({
        success: false,
        message: "Message is required",
      });
    }

    if (messageText.length > 10000) {
      return res.status(400).json({
        success: false,
        message: "Message cannot exceed 10,000 characters",
      });
    }

    // ----------------------------------------
    // FIND CUSTOMER CONVERSATION
    // ----------------------------------------

    const conversation = await Conversation.findOne({
      _id: conversationId,
      customer: customerId,
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    if (conversation.status === "archived") {
      return res.status(400).json({
        success: false,
        message: "This conversation has been archived",
      });
    }

    // ----------------------------------------
    // SAVE CUSTOMER MESSAGE
    // ----------------------------------------

    const customerMessage = await Message.create({
      conversation: conversation._id,
      sender: customerId,
      senderType: "customer",
      content: messageText,
      isRead: true,
    });

    // ----------------------------------------
    // UPDATE CONVERSATION
    // ----------------------------------------

    conversation.lastMessage = messageText;
    conversation.lastMessageAt = new Date();
    conversation.messageCount = (conversation.messageCount || 0) + 1;

    await conversation.save();

    // ----------------------------------------
    // BUILD AI HISTORY
    // ----------------------------------------

    const databaseMessages = await Message.find({
      conversation: conversation._id,
    })
      .sort({ createdAt: 1 })
      .lean();

    const aiMessages = [];

    for (const message of databaseMessages) {
      if (!message.content?.trim()) {
        continue;
      }

      if (message.senderType === "customer") {
        aiMessages.push({
          role: "user",
          content: message.content,
        });
      } else if (
        message.senderType === "ai" ||
        message.senderType === "agent"
      ) {
        aiMessages.push({
          role: "assistant",
          content: message.content,
        });
      }
    }

    // ----------------------------------------
    // OPTIONAL FRONTEND HISTORY
    // ----------------------------------------

    if (history.length > 0 && databaseMessages.length <= 1) {
      const safeHistory = history
        .filter(
          (item) =>
            item && typeof item.content === "string" && item.content.trim(),
        )
        .slice(-20)
        .map((item) => ({
          role:
            item.sender === "ai" || item.role === "assistant"
              ? "assistant"
              : "user",
          content: item.content.trim(),
        }));

      if (safeHistory.length > 0) {
        aiMessages.splice(0, aiMessages.length - 1, ...safeHistory, {
          role: "user",
          content: messageText,
        });
      }
    }

    // ----------------------------------------
    // GENERATE AI RESPONSE
    // ----------------------------------------

    let aiResult;

    try {
      aiResult = await generateAIResponse({
        messages: aiMessages,
      });
    } catch (aiError) {
      console.error("Generate AI response error:", aiError);

      return res.status(502).json({
        success: false,
        message:
          "Your message was saved, but the AI service is currently unavailable.",
        userMessage: customerMessage,
      });
    }

    const aiText = aiResult?.text?.trim();

    if (!aiText) {
      return res.status(502).json({
        success: false,
        message:
          "Your message was saved, but the AI returned an empty response.",
        userMessage: customerMessage,
      });
    }

    // ----------------------------------------
    // SAVE AI MESSAGE
    // ----------------------------------------

    const aiMessage = await Message.create({
      conversation: conversation._id,
      sender: null,
      senderType: "ai",
      content: aiText,
      isRead: false,
      metadata: {
        model: aiResult.model || null,
      },
    });

    // ----------------------------------------
    // UPDATE CONVERSATION WITH AI RESPONSE
    // ----------------------------------------

    conversation.lastMessage = aiText;
    conversation.lastMessageAt = new Date();
    conversation.messageCount = (conversation.messageCount || 0) + 1;

    conversation.unreadCount = (conversation.unreadCount || 0) + 1;

    await conversation.save();

    // ----------------------------------------
    // POPULATE RESPONSES
    // ----------------------------------------

    const populatedCustomerMessage = await Message.findById(customerMessage._id)
      .populate("sender", "name email avatar role")
      .lean();

    const populatedAIMessage = await Message.findById(aiMessage._id)
      .populate("sender", "name email avatar role")
      .lean();

    // ----------------------------------------
    // RESPONSE
    // ----------------------------------------

    return res.status(201).json({
      success: true,

      message: "Message sent successfully",

      userMessage: populatedCustomerMessage,

      aiMessage: populatedAIMessage,

      response: aiText,

      model: aiResult.model || null,

      conversation: {
        id: conversation._id,
        lastMessage: conversation.lastMessage,
        lastMessageAt: conversation.lastMessageAt,
        messageCount: conversation.messageCount,
        unreadCount: conversation.unreadCount,
      },
    });
  } catch (error) {
    console.error("Send message error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to send message",
    });
  }
};

// ==========================================
// ARCHIVE CONVERSATION
// ==========================================

export const archiveConversation = async (req, res) => {
  try {
    const customerId = req.user?._id || req.user?.id;
    const conversationId = req.params.id;

    if (!customerId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid conversation ID",
      });
    }

    const conversation = await Conversation.findOneAndUpdate(
      {
        _id: conversationId,
        customer: customerId,
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

    return res.json({
      success: true,
      message: "Conversation archived",
      conversation,
    });
  } catch (error) {
    console.error("Archive conversation error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to archive conversation",
    });
  }
};
