import express from "express";

import {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from "../controllers/notificationController.js";

import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

/*
 * =========================================================
 * AUTHENTICATION
 * =========================================================
 *
 * All notification routes require an authenticated user.
 *
 * =========================================================
 */

router.use(authenticateToken);

/*
 * =========================================================
 * GET ALL NOTIFICATIONS
 * =========================================================
 *
 * GET /api/notifications
 *
 * Returns the authenticated customer's notifications.
 *
 * =========================================================
 */

router.get("/", getNotifications);

/*
 * =========================================================
 * GET UNREAD NOTIFICATION COUNT
 * =========================================================
 *
 * GET /api/notifications/unread-count
 *
 * Returns the number of unread notifications.
 *
 * =========================================================
 */

router.get("/unread-count", getUnreadNotificationCount);

/*
 * =========================================================
 * MARK ONE NOTIFICATION AS READ
 * =========================================================
 *
 * PATCH /api/notifications/:id/read
 *
 * =========================================================
 */

router.patch("/:id/read", markNotificationAsRead);

/*
 * =========================================================
 * MARK ALL NOTIFICATIONS AS READ
 * =========================================================
 *
 * PATCH /api/notifications/read-all
 *
 * =========================================================
 */

router.patch("/read-all", markAllNotificationsAsRead);

/*
 * =========================================================
 * DELETE NOTIFICATION
 * =========================================================
 *
 * DELETE /api/notifications/:id
 *
 * =========================================================
 */

router.delete("/:id", deleteNotification);

export default router;
