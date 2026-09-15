import express from "express";

import {
  getAllAdminTickets,
  getAdminTicketById,
  updateAdminTicketStatus,
  updateAdminTicketPriority,
  assignAdminTicket,
  getAdminAgentsForAssignment,
} from "../controllers/adminTicketController.js";
import {
  authenticateToken,
  requireAdmin,
} from "../middleware/authMiddleware.js";

const router = express.Router();

// ============================================================
// GET ALL TICKETS
// ============================================================

router.get("/", authenticateToken, requireAdmin, getAllAdminTickets);

// ============================================================
// ADMIN - GET AGENTS FOR TICKET ASSIGNMENT
// ============================================================

router.get(
  "/agents",
  authenticateToken,
  requireAdmin,
  getAdminAgentsForAssignment,
);

// ============================================================
// GET SINGLE TICKET
// ============================================================

router.get("/:ticketId", authenticateToken, requireAdmin, getAdminTicketById);

// ============================================================
// UPDATE TICKET STATUS
// ============================================================

router.patch(
  "/:ticketId/status",
  authenticateToken,
  requireAdmin,
  updateAdminTicketStatus,
);

// ============================================================
// UPDATE TICKET PRIORITY
// ============================================================

router.patch(
  "/:ticketId/priority",
  authenticateToken,
  requireAdmin,
  updateAdminTicketPriority,
);

// ============================================================
// ADMIN - ASSIGN / REASSIGN TICKET
// ============================================================

router.patch(
  "/:ticketId/assign",
  authenticateToken,
  requireAdmin,
  assignAdminTicket,
);

export default router;
