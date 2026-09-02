import mongoose from "mongoose";
import Notification from "../models/Notification.js";

/*
 * =========================================================
 * GET CUSTOMER NOTIFICATIONS
 * =========================================================
 *
 * GET /api/notifications
 *
 * Query parameters:
 *
 * ?page=1
 * ?limit=20
 *
 * Optional:
 *
 * ?unread=true
 *
 * =========================================================
 */

export const getNotifications = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);

    const limit = Math.min(
      Math.max(Number.parseInt(req.query.limit, 10) || 20, 1),
      50,
    );

    const skip = (page - 1) * limit;

    /*
     * =====================================================
     * BUILD FILTER
     * =====================================================
     */

    const filter = {
      recipient: userId,
    };

    if (req.query.unread === "true") {
      filter.isRead = false;
    }

    /*
     * =====================================================
     * FETCH NOTIFICATIONS
     * =====================================================
     */

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter)
        .populate("ticket", "ticketNumber subject status priority")
        .sort({
          createdAt: -1,
        })
        .skip(skip)
        .limit(limit)
        .lean(),

      Notification.countDocuments(filter),

      Notification.countDocuments({
        recipient: userId,
        isRead: false,
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return res.status(200).json({
      success: true,

      notifications: Array.isArray(notifications) ? notifications : [],

      unreadCount,

      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    console.error("GET NOTIFICATIONS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load notifications.",
      notifications: [],
      unreadCount: 0,
    });
  }
};

/*
 * =========================================================
 * GET UNREAD NOTIFICATION COUNT
 * =========================================================
 *
 * GET /api/notifications/unread-count
 *
 * =========================================================
 */

export const getUnreadNotificationCount = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const unreadCount = await Notification.countDocuments({
      recipient: userId,
      isRead: false,
    });

    return res.status(200).json({
      success: true,
      unreadCount,
    });
  } catch (error) {
    console.error("GET UNREAD NOTIFICATION COUNT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get unread notification count.",
      unreadCount: 0,
    });
  }
};

/*
 * =========================================================
 * MARK ONE NOTIFICATION AS READ
 * =========================================================
 *
 * PATCH /api/notifications/:id/read
 *
 * =========================================================
 */

export const markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    /*
     * =====================================================
     * VALIDATE NOTIFICATION ID
     * =====================================================
     */

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid notification ID.",
      });
    }

    /*
     * =====================================================
     * FIND USER'S NOTIFICATION
     *
     * recipient is important here.
     *
     * A customer cannot mark another customer's
     * notification as read.
     * =====================================================
     */

    const notification = await Notification.findOne({
      _id: id,
      recipient: userId,
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found.",
      });
    }

    /*
     * =====================================================
     * MARK AS READ
     * =====================================================
     */

    if (!notification.isRead) {
      notification.isRead = true;
      notification.readAt = new Date();

      await notification.save();
    }

    /*
     * =====================================================
     * REAL-TIME UPDATE
     * =====================================================
     */

    const io = req.app.get("io");

    if (io) {
      const room = `user:${String(userId)}`;

      io.to(room).emit("notification:read", {
        notificationId: String(notification._id),
      });
    }

    /*
     * =====================================================
     * GET UPDATED COUNT
     * =====================================================
     */

    const unreadCount = await Notification.countDocuments({
      recipient: userId,
      isRead: false,
    });

    return res.status(200).json({
      success: true,

      message: "Notification marked as read.",

      notification,

      unreadCount,
    });
  } catch (error) {
    console.error("MARK NOTIFICATION AS READ ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to mark notification as read.",
    });
  }
};

/*
 * =========================================================
 * MARK ALL NOTIFICATIONS AS READ
 * =========================================================
 *
 * PATCH /api/notifications/read-all
 *
 * =========================================================
 */

export const markAllNotificationsAsRead = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    /*
     * =====================================================
     * UPDATE ALL UNREAD NOTIFICATIONS
     * =====================================================
     */

    const result = await Notification.updateMany(
      {
        recipient: userId,
        isRead: false,
      },
      {
        $set: {
          isRead: true,
          readAt: new Date(),
        },
      },
    );

    /*
     * =====================================================
     * REAL-TIME UPDATE
     * =====================================================
     */

    const io = req.app.get("io");

    if (io) {
      const room = `user:${String(userId)}`;

      io.to(room).emit("notification:read-all", {
        updatedCount: result.modifiedCount,
      });
    }

    return res.status(200).json({
      success: true,

      message: "All notifications marked as read.",

      updatedCount: result.modifiedCount,

      unreadCount: 0,
    });
  } catch (error) {
    console.error("MARK ALL NOTIFICATIONS AS READ ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to mark all notifications as read.",
    });
  }
};

/*
 * =========================================================
 * DELETE NOTIFICATION
 * =========================================================
 *
 * DELETE /api/notifications/:id
 *
 * =========================================================
 */

export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;

    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    /*
     * =====================================================
     * VALIDATE NOTIFICATION ID
     * =====================================================
     */

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid notification ID.",
      });
    }

    /*
     * =====================================================
     * DELETE ONLY USER'S OWN NOTIFICATION
     * =====================================================
     */

    const notification = await Notification.findOneAndDelete({
      _id: id,
      recipient: userId,
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found.",
      });
    }

    /*
     * =====================================================
     * GET UPDATED UNREAD COUNT
     * =====================================================
     */

    const unreadCount = await Notification.countDocuments({
      recipient: userId,
      isRead: false,
    });

    /*
     * =====================================================
     * REAL-TIME DELETE EVENT
     * =====================================================
     */

    const io = req.app.get("io");

    if (io) {
      const room = `user:${String(userId)}`;

      io.to(room).emit("notification:deleted", {
        notificationId: String(notification._id),
      });
    }

    return res.status(200).json({
      success: true,

      message: "Notification deleted successfully.",

      notificationId: String(notification._id),

      unreadCount,
    });
  } catch (error) {
    console.error("DELETE NOTIFICATION ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete notification.",
    });
  }
};
