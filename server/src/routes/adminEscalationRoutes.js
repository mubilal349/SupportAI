import express from "express";

import {
  getEscalations,
  getEscalation,
  updateEscalationStatus,
  assignEscalation,
  updateEscalationPriority,
  addEscalationNote,
  resolveEscalation,
  reassignToHumanSupport,
} from "../controllers/AdminEscalationController.js";

import {
  authenticateToken,
  requireAdmin,
} from "../middleware/authMiddleware.js";

const router = express.Router();

// ==========================================
// ADMIN ESCALATION MANAGEMENT
// ==========================================

router.use(authenticateToken);
router.use(requireAdmin);

// GET /api/admin/escalations
router.get("/", getEscalations);

// GET /api/admin/escalations/:ticketId
router.get("/:ticketId", getEscalation);

// PATCH /api/admin/escalations/:ticketId/status
router.patch("/:ticketId/status", updateEscalationStatus);

// PATCH /api/admin/escalations/:ticketId/assign
router.patch("/:ticketId/assign", assignEscalation);

// PATCH /api/admin/escalations/:ticketId/priority
router.patch("/:ticketId/priority", updateEscalationPriority);

// POST /api/admin/escalations/:ticketId/note
router.post("/:ticketId/note", addEscalationNote);

// PATCH /api/admin/escalations/:ticketId/resolve
router.patch("/:ticketId/resolve", resolveEscalation);

router.patch("/:ticketId/reassign-human", reassignToHumanSupport);

export default router;
