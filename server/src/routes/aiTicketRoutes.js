import express from "express";

import {
  suggestTicket,
  generateTicketSummary,
} from "../controllers/aiTicketController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// ============================================================
// AI TICKET CREATION
// ============================================================

// Generate subject, category, priority, summary,
// and suggested resolution from customer's description.
router.post("/suggest", authenticateToken, suggestTicket);

router.post("/:id/summary", authenticateToken, generateTicketSummary);

export default router;
