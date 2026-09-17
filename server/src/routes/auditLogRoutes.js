import express from "express";

import {
  getAuditLogs,
  getAuditLog,
} from "../controllers/auditLogController.js";

import {
  authenticateToken,
  requireAdmin,
} from "../middleware/authMiddleware.js";

const router = express.Router();

// ==========================================
// ADMIN ONLY
// ==========================================

// Get all audit logs
router.get("/", authenticateToken, requireAdmin, getAuditLogs);

// Get a single audit log
router.get("/:id", authenticateToken, requireAdmin, getAuditLog);

export default router;
