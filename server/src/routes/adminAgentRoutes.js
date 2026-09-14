import express from "express";

import {
  authenticateToken,
  requireAdmin,
} from "../middleware/authMiddleware.js";

import {
  getAgents,
  getAgent,
  createAdminAgent,
  updateAgent,
  updateAgentStatus,
  updateAgentAvailability,
} from "../controllers/adminAgentController.js";

const router = express.Router();

router.use(authenticateToken, requireAdmin);

// GET /api/admin/agents
router.get("/", getAgents);

// POST /api/admin/agents
router.post("/", createAdminAgent);

// GET /api/admin/agents/:agentId
router.get("/:agentId", getAgent);

// PUT /api/admin/agents/:agentId
router.put("/:agentId", updateAgent);

// PATCH /api/admin/agents/:agentId/status
router.patch("/:agentId/status", updateAgentStatus);

// PATCH /api/admin/agents/:agentId/availability
router.patch("/:agentId/availability", updateAgentAvailability);

export default router;
