import express from "express";

import {
  assignTicketToMe,
  getAgentDashboard,
  getAgentTicketById,
  getAssignedTickets,
  getTicketQueue,
  sendAgentReply,
  updateTicketPriority,
  updateTicketStatus,
} from "../controllers/agentController.js";

import { requireAgent } from "../middleware/agentMiddleware.js";

import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

/*
 * =========================================================
 * ALL AGENT ROUTES REQUIRE AUTH + AGENT ROLE
 * =========================================================
 */

router.use(authenticateToken, requireAgent);

/*
 * =========================================================
 * DASHBOARD
 * =========================================================
 */

router.get("/dashboard", getAgentDashboard);

/*
 * =========================================================
 * TICKET QUEUE
 * =========================================================
 */

router.get("/tickets/queue", getTicketQueue);

/*
 * =========================================================
 * ASSIGNED TICKETS
 * =========================================================
 */

router.get("/tickets", getAssignedTickets);

/*
 * =========================================================
 * SINGLE TICKET
 * =========================================================
 */

router.get("/tickets/:ticketId", getAgentTicketById);

/*
 * =========================================================
 * ASSIGN
 * =========================================================
 */

router.patch("/tickets/:ticketId/assign", assignTicketToMe);

/*
 * =========================================================
 * STATUS
 * =========================================================
 */

router.patch("/tickets/:ticketId/status", updateTicketStatus);

/*
 * =========================================================
 * PRIORITY
 * =========================================================
 */

router.patch("/tickets/:ticketId/priority", updateTicketPriority);

/*
 * =========================================================
 * AGENT REPLY
 * =========================================================
 */

router.post("/tickets/:ticketId/reply", sendAgentReply);

export default router;
