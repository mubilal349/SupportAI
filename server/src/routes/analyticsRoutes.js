import express from "express";

import { getCustomerAnalytics } from "../controllers/analyticsController.js";

import { getAgentAnalytics } from "../controllers/agentAnalyticsController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

/*
 * =========================================================
 * ALL ANALYTICS ROUTES REQUIRE AUTHENTICATION
 * =========================================================
 */

router.use(authenticateToken);

/*
 * =========================================================
 * CUSTOMER ANALYTICS
 * =========================================================
 */

// GET /api/analytics/customer
// GET /api/analytics/customer?period=7d
// GET /api/analytics/customer?period=30d
// GET /api/analytics/customer?period=90d

router.get("/customer", getCustomerAnalytics);

// Agent Analytics
router.get("/agent", getAgentAnalytics);

export default router;
