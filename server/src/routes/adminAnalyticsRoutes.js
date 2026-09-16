import express from "express";

import { getSystemAnalytics } from "../controllers/AdminAnalyticsController.js";

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
// SYSTEM ANALYTICS
// ==========================================

router.get("/", getSystemAnalytics);

export default router;
