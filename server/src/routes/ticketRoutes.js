import express from "express";

import {
  createTicket,
  getCustomerTickets,
  getCustomerTicket,
  addTicketReply,
  uploadTicketAttachments,
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
 * These specific routes must come BEFORE:
 *
 * /:id
 *
 * =========================================================
 */

// POST /api/tickets/:id/replies
router.post("/:id/replies", addTicketReply);

// POST /api/tickets/:id/attachments
router.post(
  "/:id/attachments",
  uploadTicket.array("attachments", 5),
  uploadTicketAttachments,
);

// GET /api/tickets/:id
router.get("/:id", getCustomerTicket);

export default router;
