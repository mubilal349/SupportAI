import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import { generateAIResponse } from "../services/aiService.js";

// ==========================================
// GET CONVERSATION MESSAGES
// ==========================================

export const getConversationMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      customer: req.user._id,
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    const messages = await Message.find({
      conversation: conversation._id,
    })
      .populate("sender", "name email avatar role")
      .sort({ createdAt: 1 });

    // Mark AI/agent messages as read
    await Message.updateMany(
      {
        conversation: conversation._id,
        senderType: {
          $in: ["ai", "agent"],
        },
        isRead: false,
      },
      {
        isRead: true,
      },
    );

    await Conversation.findByIdAndUpdate(conversation._id, {
      unreadCount: 0,
    });

    res.json({
      success: true,
      conversation,
      messages,
    });
  } catch (error) {
    console.error("Get messages error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load messages",
    });
  }
};

// ==========================================
// SEND CUSTOMER MESSAGE + AI RESPONSE
// ==========================================

export const sendCustomerMessage = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const { content, attachments = [] } = req.body;

    // ------------------------------------------
    // Validate content
    // ------------------------------------------

    if (!content?.trim() && attachments.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Message content is required",
      });
    }

    // ------------------------------------------
    // Find customer's conversation
    // ------------------------------------------

    const conversation = await Conversation.findOne({
      _id: conversationId,
      customer: req.user._id,
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    // ------------------------------------------
    // Check conversation status
    // ------------------------------------------

    if (
      conversation.status === "resolved" ||
      conversation.status === "archived"
    ) {
      return res.status(400).json({
        success: false,
        message: "This conversation is no longer active",
      });
    }

    // ------------------------------------------
    // Save customer message
    // ------------------------------------------

    const customerMessage = await Message.create({
      conversation: conversation._id,
      sender: req.user._id,
      senderType: "customer",
      content: content?.trim() || "",
      attachments,
      isRead: true,
    });

    // ------------------------------------------
    // Update conversation
    // ------------------------------------------

    await Conversation.findByIdAndUpdate(conversation._id, {
      lastMessage: content?.trim() || "Attachment",
      lastMessageAt: new Date(),

      $inc: {
        messageCount: 1,
      },
    });

    // ------------------------------------------
    // Get previous conversation messages
    // ------------------------------------------

    const history = await Message.find({
      conversation: conversation._id,
      senderType: {
        $in: ["customer", "ai", "agent"],
      },
    })
      .sort({ createdAt: 1 })
      .limit(30);

    // ------------------------------------------
    // Convert DB messages to AI messages
    // ------------------------------------------

    const aiMessages = history
      .filter((message) => message.content?.trim())
      .map((message) => ({
        role: message.senderType === "customer" ? "user" : "assistant",

        content: message.content,
      }));

    // ------------------------------------------
    // Detect explicit human escalation
    // ------------------------------------------

    const escalationKeywords = [
      "talk to a human",
      "human agent",
      "real person",
      "speak to an agent",
      "customer service",
      "human support",
      "live agent",
    ];

    const normalizedContent = content?.toLowerCase().trim() || "";

    const requestedHuman = escalationKeywords.some((keyword) =>
      normalizedContent.includes(keyword),
    );

    // ------------------------------------------
    // Escalate if requested
    // ------------------------------------------

    if (requestedHuman) {
      const updatedConversation = await Conversation.findByIdAndUpdate(
        conversation._id,
        {
          status: "escalated",
          supportType: "Human",
          escalatedAt: new Date(),
        },
        {
          new: true,
        },
      );

      const systemMessage = await Message.create({
        conversation: conversation._id,
        sender: null,
        senderType: "system",
        content:
          "Your conversation has been escalated to a human support agent. An agent will assist you shortly.",
        isRead: false,
      });

      return res.status(201).json({
        success: true,
        escalated: true,
        conversation: updatedConversation,
        customerMessage,
        aiMessage: systemMessage,
      });
    }

    // ------------------------------------------
    // Generate AI response
    // ------------------------------------------

    const aiResponse = await generateAIResponse({
      messages: aiMessages,
    });

    // ------------------------------------------
    // Save AI message
    // ------------------------------------------

    const aiMessage = await Message.create({
      conversation: conversation._id,
      sender: null,
      senderType: "ai",
      content: aiResponse.text,
      isRead: false,

      metadata: {
        model: process.env.OPENAI_MODEL || "gpt-5.6-luna",

        confidence: null,

        intent: null,
      },
    });

    // ------------------------------------------
    // Update conversation
    // ------------------------------------------

    const updatedConversation = await Conversation.findByIdAndUpdate(
      conversation._id,
      {
        lastMessage: aiResponse.text,
        lastMessageAt: new Date(),

        $inc: {
          messageCount: 1,
          unreadCount: 1,
        },
      },
      {
        new: true,
      },
    );

    // ------------------------------------------
    // Populate customer message
    // ------------------------------------------

    const populatedCustomerMessage = await Message.findById(
      customerMessage._id,
    ).populate("sender", "name email avatar role");

    res.status(201).json({
      success: true,

      escalated: false,

      conversation: updatedConversation,

      customerMessage: populatedCustomerMessage,

      aiMessage,

      responseId: aiResponse.responseId,
    });
  } catch (error) {
    console.error("Send customer message error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to process your message",
    });
  }
};

// ==========================================
// ESCALATE CONVERSATION
// ==========================================

export const escalateConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const conversation = await Conversation.findOneAndUpdate(
      {
        _id: conversationId,
        customer: req.user._id,
      },
      {
        status: "escalated",
        supportType: "Human",
        escalatedAt: new Date(),
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

    const systemMessage = await Message.create({
      conversation: conversation._id,
      sender: null,
      senderType: "system",
      content:
        "You have been connected to human support. A support agent will assist you shortly.",
      isRead: false,
    });

    res.json({
      success: true,
      message: "Conversation escalated successfully",

      conversation,

      systemMessage,
    });
  } catch (error) {
    console.error("Escalation error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to escalate conversation",
    });
  }
};

// ==========================================
// RESOLVE CONVERSATION
// ==========================================

export const resolveConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const conversation = await Conversation.findOneAndUpdate(
      {
        _id: conversationId,
        customer: req.user._id,
      },
      {
        status: "resolved",
        resolvedAt: new Date(),
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

    const systemMessage = await Message.create({
      conversation: conversation._id,
      sender: null,
      senderType: "system",
      content: "This conversation has been marked as resolved.",
      isRead: false,
    });

    res.json({
      success: true,
      message: "Conversation resolved successfully",

      conversation,

      systemMessage,
    });
  } catch (error) {
    console.error("Resolve conversation error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to resolve conversation",
    });
  }
};
