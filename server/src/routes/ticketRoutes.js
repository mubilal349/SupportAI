import express from "express";

import {
  createTicket,
  getCustomerTickets,
  getCustomerTicket,
  uploadTicketAttachments,
} from "../controllers/ticketController.js";

import { authenticateToken } from "../middleware/authMiddleware.js";
import uploadTicket from "../middleware/ticketUploadMiddleware.js";

const router = express.Router();

router.use(authenticateToken);

// Customer tickets
router.get("/", getCustomerTickets);

// Create ticket
router.post("/", createTicket);

// Single ticket
router.get("/:id", getCustomerTicket);

// attachements
router.post(
  "/:id/attachments",
  authenticateToken,
  uploadTicket.array("attachments", 5),
  uploadTicketAttachments,
);
export default router;
