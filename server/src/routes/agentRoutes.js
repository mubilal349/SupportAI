import express from "express";

import {
  assignTicketToMe,
  getAgentDashboard,
  getAgentTicketById,
  getAssignedTickets,
  getAllAssignedTickets,
  getMyTickets,
  getTicketQueue,
  sendAgentReply,
  addInternalNote,
  updateTicketPriority,
  updateTicketStatus,
  getAgentCustomerProfile,
  escalateTicket,
  getEscalatedTickets,
  getAgentAvailability,
  updateAgentAvailability,
  getAgentAnalytics,
} from "../controllers/agentController.js";

import { requireAgent } from "../middleware/agentMiddleware.js";
import { authenticateToken } from "../middleware/authMiddleware.js";
import uploadTicket from "../middleware/ticketUploadMiddleware.js";

const router = express.Router();

/* =========================================================
   AGENT AUTHENTICATION
========================================================= */

router.use(authenticateToken, requireAgent);

/* =========================================================
   DASHBOARD
========================================================= */

router.get("/dashboard", getAgentDashboard);

/*
 * =========================================================
 * AGENT AVAILABILITY
 * =========================================================
 */

router.get(
  "/availability",
  authenticateToken,
  requireAgent,
  getAgentAvailability,
);

router.put(
  "/availability",
  authenticateToken,
  requireAgent,
  updateAgentAvailability,
);

// ==========================================
// AGENT ANALYTICS
// ==========================================

router.get("/analytics", authenticateToken, requireAgent, getAgentAnalytics);

/* =========================================================
   TICKET QUEUE
   Unassigned tickets
========================================================= */

router.get("/tickets/queue", getTicketQueue);

/* =========================================================
   MY TICKETS
   Only tickets assigned to logged-in agent
========================================================= */

router.get("/my-tickets", getMyTickets);

/* =========================================================
   ALL ASSIGNED TICKETS
   Team-wide assigned tickets
========================================================= */

router.get("/assigned-tickets", getAllAssignedTickets);

/* =========================================================
   LEGACY / EXISTING ASSIGNED TICKETS
========================================================= */

router.get("/tickets", getAssignedTickets);

/* =========================================================
   CUSTOMER PROFILE
========================================================= */

router.get(
  "/customers/:customerId",
  authenticateToken,
  requireAgent,
  getAgentCustomerProfile,
);

/* =========================================================
   SINGLE TICKET
========================================================= */

router.get("/tickets/:ticketId", getAgentTicketById);

// =======================================================
// ESCALATED TICKETS
// =======================================================

router.get("/escalated", authenticateToken, requireAgent, getEscalatedTickets);

/* =========================================================
   ASSIGN TICKET
========================================================= */

router.patch("/tickets/:ticketId/assign", assignTicketToMe);

/* =========================================================
   STATUS
========================================================= */

router.patch("/tickets/:ticketId/status", updateTicketStatus);

/* =========================================================
   PRIORITY
========================================================= */

router.patch("/tickets/:ticketId/priority", updateTicketPriority);

/* =========================================================
   REPLY
========================================================= */

router.post(
  "/tickets/:ticketId/reply",
  uploadTicket.array("attachments", 5),
  sendAgentReply,
);

/* =========================================================
   INTERNAL NOTE
   Only agents/admins can create private notes
========================================================= */

router.post("/tickets/:ticketId/internal-note", addInternalNote);

/* =========================================================
   ESCALATE
========================================================= */

router.post(
  "/tickets/:ticketId/escalate",
  authenticateToken,
  requireAgent,
  escalateTicket,
);

export default router;
