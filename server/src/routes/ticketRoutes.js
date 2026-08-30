import express from "express";

import {
  createTicket,
  getCustomerTickets,
  getCustomerTicket,
} from "../controllers/ticketController.js";

import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authenticateToken);

// Customer tickets
router.get("/", getCustomerTickets);

// Create ticket
router.post("/", createTicket);

// Single ticket
router.get("/:id", getCustomerTicket);

export default router;
