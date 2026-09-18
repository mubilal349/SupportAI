import express from "express";

import {
  getSystemSettings,
  updateSystemSettings,
} from "../controllers/systemSettingsController.js";

import {
  authenticateToken,
  requireAdmin,
} from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", authenticateToken, requireAdmin, getSystemSettings);

router.put("/", authenticateToken, requireAdmin, updateSystemSettings);

export default router;
