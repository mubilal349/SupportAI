import express from "express";

import {
  getAllCannedResponses,
  getCannedResponse,
  createCannedResponse,
  updateCannedResponse,
  deleteCannedResponse,
  toggleCannedResponseStatus,
} from "../controllers/cannedResponseController.js";

import {
  authenticateToken,
  requireAdmin,
} from "../middleware/authMiddleware.js";

const router = express.Router();

// ==========================================================
// VIEW CANNED RESPONSES
// ==========================================================

// Admin + Agent
router.get("/", authenticateToken, getAllCannedResponses);

// ==========================================================
// SINGLE RESPONSE
// ==========================================================

// Admin only
router.get("/:id", authenticateToken, requireAdmin, getCannedResponse);

// ==========================================================
// ADMIN MANAGEMENT
// ==========================================================

// Create
router.post("/", authenticateToken, requireAdmin, createCannedResponse);

// Update
router.put("/:id", authenticateToken, requireAdmin, updateCannedResponse);

// Delete
router.delete("/:id", authenticateToken, requireAdmin, deleteCannedResponse);

// Activate / Deactivate
router.patch(
  "/:id/toggle-status",
  authenticateToken,
  requireAdmin,
  toggleCannedResponseStatus,
);

export default router;
