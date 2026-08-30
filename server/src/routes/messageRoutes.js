import express from "express";

import {
  getConversationMessages,
  sendCustomerMessage,
  escalateConversation,
  resolveConversation,
} from "../controllers/messageController.js";

import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// ==========================================
// CONVERSATION MESSAGES
// ==========================================

// GET /api/messages/:conversationId
router.get("/:conversationId", authenticateToken, getConversationMessages);

// ==========================================
// SEND MESSAGE + AI RESPONSE
// ==========================================

// POST /api/messages/:conversationId
router.post("/:conversationId", authenticateToken, sendCustomerMessage);

// ==========================================
// TALK TO HUMAN
// ==========================================

// POST /api/messages/:conversationId/escalate
router.post(
  "/:conversationId/escalate",
  authenticateToken,
  escalateConversation,
);

// ==========================================
// RESOLVE
// ==========================================

// POST /api/messages/:conversationId/resolve
router.post("/:conversationId/resolve", authenticateToken, resolveConversation);

export default router;
