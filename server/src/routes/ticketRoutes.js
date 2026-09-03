import express from "express";

import {
  createTicket,
  getCustomerTickets,
  getCustomerTicket,
  addTicketReply,
  uploadTicketAttachments,
  getTicketStatusHistory,
  submitTicketRating,
  getTicketRating,
  resolveCustomerTicket,
  deleteTicketAttachment,
} from "../controllers/ticketController.js";

import { authenticateToken } from "../middleware/authMiddleware.js";

import uploadTicket from "../middleware/ticketUploadMiddleware.js";

const router = express.Router();

/*
 * =========================================================
 * ALL TICKET ROUTES REQUIRE AUTHENTICATION
 * =========================================================
 */

router.use(authenticateToken);

/*
 * =========================================================
 * CUSTOMER TICKETS
 * =========================================================
 */

// GET /api/tickets
router.get("/", getCustomerTickets);

// POST /api/tickets
router.post("/", createTicket);

/*
 * =========================================================
 * IMPORTANT
 *
 * Specific routes must come BEFORE:
 *
 * /:id
 *
 * =========================================================
 */

/*
 * =========================================================
 * TICKET REPLIES
 * =========================================================
 */

router.patch("/:id/resolve", resolveCustomerTicket);

// POST /api/tickets/:id/replies
router.post("/:id/replies", addTicketReply);

/*
 * =========================================================
 * TICKET ATTACHMENTS
 * =========================================================
 */

// POST /api/tickets/:id/attachments
router.post(
  "/:id/attachments",
  uploadTicket.array("attachments", 5),
  uploadTicketAttachments,
);

// DELETE /api/tickets/:id/attachments/:attachmentId
router.delete("/:id/attachments/:attachmentId", deleteTicketAttachment);

/*
 * =========================================================
 * TICKET STATUS HISTORY
 * =========================================================
 */

// GET /api/tickets/:id/status-history
router.get("/:id/status-history", getTicketStatusHistory);

/*
 * =========================================================
 * TICKET RATING & FEEDBACK
 * =========================================================
 */

// POST /api/tickets/:id/rating
router.post("/:id/rating", submitTicketRating);

// GET /api/tickets/:id/rating
router.get("/:id/rating", getTicketRating);

/*
 * =========================================================
 * GET SINGLE CUSTOMER TICKET
 *
 * Keep this AFTER all specific /:id/... routes.
 * =========================================================
 */

// GET /api/tickets/:id
router.get("/:id", getCustomerTicket);

export default router;
