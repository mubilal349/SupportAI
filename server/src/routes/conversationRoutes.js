import express from "express";

import {
  createConversation,
  getCustomerConversations,
  getConversationById,
  archiveConversation,
} from "../controllers/conversationController.js";

import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// Customer conversations
router.get("/", authenticateToken, getCustomerConversations);

router.post("/", authenticateToken, createConversation);

router.get("/:id", authenticateToken, getConversationById);

router.put("/:id/archive", authenticateToken, archiveConversation);

export default router;
