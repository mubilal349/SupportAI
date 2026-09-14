import express from "express";

import {
  authenticateToken,
  requireAdmin,
} from "../middleware/authMiddleware.js";

import { getAdminDashboard } from "../controllers/adminDashboardController.js";

const router = express.Router();

// ============================================================
// ADMIN DASHBOARD
// GET /api/admin/dashboard
// ============================================================

router.get("/", authenticateToken, requireAdmin, getAdminDashboard);

export default router;
