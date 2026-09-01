import express from "express";

import {
  createConversation,
  getCustomerConversations,
  getConversationById,
  getConversationMessages,
  sendMessage,
  archiveConversation,
} from "../controllers/conversationController.js";

import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// ==========================================
// CUSTOMER CONVERSATIONS
// ==========================================

router.use(authenticateToken);

// Create conversation
router.post("/", createConversation);

// Get customer's conversations
router.get("/", getCustomerConversations);

// Get single conversation
router.get("/:id", getConversationById);

// Get conversation messages
router.get("/:id/messages", getConversationMessages);

// Send customer message + generate AI response
router.post("/:id/messages", sendMessage);

// Archive conversation
router.put("/:id/archive", archiveConversation);

export default router;
