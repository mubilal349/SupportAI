import express from "express";

import {
  createTicket,
  getCustomerTickets,
  getCustomerTicket,
  replyToTicket,
  reopenTicket,
  closeTicket,
  escalateTicket,
  submitTicketRating,
  uploadTicketAttachments,
} from "../controllers/ticketController.js";

import { authenticateToken } from "../middleware/authMiddleware.js";

import uploadTicket from "../middleware/ticketUploadMiddleware.js";

const router = express.Router();

// ==========================================
// CUSTOMER AUTHENTICATION
// ==========================================

router.use(authenticateToken);

// ==========================================
// TICKETS
// ==========================================

// Get customer's tickets
router.get("/", getCustomerTickets);

// Create ticket
router.post("/", createTicket);

// Get single customer ticket
router.get("/:id", getCustomerTicket);

// ==========================================
// CONVERSATION
// ==========================================

// Customer reply
router.post("/:id/replies", replyToTicket);

// ==========================================
// TICKET STATUS
// ==========================================

// Reopen
router.patch("/:id/reopen", reopenTicket);

// Close
router.patch("/:id/close", closeTicket);

// ==========================================
// ESCALATION
// ==========================================

// Escalate
router.patch("/:id/escalate", escalateTicket);

// ==========================================
// CUSTOMER FEEDBACK
// ==========================================

router.post("/:id/rating", submitTicketRating);

// ==========================================
// ATTACHMENTS
// ==========================================

router.post(
  "/:id/attachments",
  uploadTicket.array("attachments", 5),
  uploadTicketAttachments,
);

export default router;
