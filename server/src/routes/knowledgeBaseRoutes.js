import express from "express";

import {
  getAllKnowledgeBaseArticles,
  searchKnowledgeBase,
  getKnowledgeBaseArticle,
  createKnowledgeBaseArticle,
  updateKnowledgeBaseArticle,
  deleteKnowledgeBaseArticle,
} from "../controllers/knowledgeBaseController.js";

import {
  authenticateToken,
  requireAgent,
} from "../middleware/authMiddleware.js";

const router = express.Router();

// ============================================================
// AGENT KNOWLEDGE BASE
// ============================================================

// GET /api/knowledge-base
router.get("/", authenticateToken, requireAgent, getAllKnowledgeBaseArticles);

// GET /api/knowledge-base/search?q=password
router.get("/search", authenticateToken, requireAgent, searchKnowledgeBase);

// GET /api/knowledge-base/:id
router.get("/:id", authenticateToken, requireAgent, getKnowledgeBaseArticle);

// ============================================================
// MANAGEMENT
// ============================================================

router.post("/", authenticateToken, requireAgent, createKnowledgeBaseArticle);

router.put("/:id", authenticateToken, requireAgent, updateKnowledgeBaseArticle);

router.delete(
  "/:id",
  authenticateToken,
  requireAgent,
  deleteKnowledgeBaseArticle,
);

export default router;
