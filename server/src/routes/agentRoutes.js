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
  updateTicketPriority,
  updateTicketStatus,
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
   SINGLE TICKET
========================================================= */

router.get("/tickets/:ticketId", getAgentTicketById);

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

export default router;
