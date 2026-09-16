import express from "express";

import {
  getSlaPolicy,
  updateSlaPolicy,
  getSlaStatistics,
} from "../controllers/AdminSlaController.js";

import {
  authenticateToken,
  requireAdmin,
} from "../middleware/authMiddleware.js";

const router = express.Router();

// ==========================================
// ADMIN AUTHENTICATION
// ==========================================

router.use(authenticateToken);
router.use(requireAdmin);

// ==========================================
// SLA POLICY
// ==========================================

// GET current SLA configuration
router.get("/", getSlaPolicy);

// UPDATE SLA configuration
router.put("/", updateSlaPolicy);

// ==========================================
// SLA STATISTICS
// ==========================================

// GET SLA monitoring statistics
router.get("/statistics", getSlaStatistics);

export default router;
