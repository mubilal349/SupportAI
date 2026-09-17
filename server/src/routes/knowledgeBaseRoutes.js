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
// CUSTOMER / AGENT / ADMIN — READ ACCESS
// ============================================================

// GET /api/knowledge-base
// Customers can view published articles
router.get("/", authenticateToken, getAllKnowledgeBaseArticles);

// GET /api/knowledge-base/search?q=password
// Customers can search published articles
router.get("/search", authenticateToken, searchKnowledgeBase);

// GET /api/knowledge-base/:id
// Customers can view a published article
router.get("/:id", authenticateToken, getKnowledgeBaseArticle);

// ============================================================
// AGENT / ADMIN — MANAGEMENT
// ============================================================

// POST /api/knowledge-base
router.post("/", authenticateToken, requireAgent, createKnowledgeBaseArticle);

// PUT /api/knowledge-base/:id
router.put("/:id", authenticateToken, requireAgent, updateKnowledgeBaseArticle);

// DELETE /api/knowledge-base/:id
router.delete(
  "/:id",
  authenticateToken,
  requireAgent,
  deleteKnowledgeBaseArticle,
);

export default router;
