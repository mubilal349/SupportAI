import express from "express";

import {
  getNotificationSettings,
  updateNotificationSettings,
} from "../controllers/notificationSettingsController.js";

import {
  authenticateToken,
  requireAdmin,
} from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", authenticateToken, requireAdmin, getNotificationSettings);

router.put("/", authenticateToken, requireAdmin, updateNotificationSettings);

export default router;
