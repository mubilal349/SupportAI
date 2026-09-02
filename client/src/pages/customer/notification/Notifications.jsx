import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Ticket,
  Bot,
  MessageSquare,
  Clock3,
  AlertTriangle,
  UserRoundCheck,
  Paperclip,
  RefreshCcw,
  Loader2,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from "../../../services/notificationService";

import socket from "../../../socket/socket";

/*
 * =========================================================
 * NOTIFICATION ICON
 * =========================================================
 */

const getNotificationIcon = (type) => {
  switch (type) {
    case "ticket_created":
      return <Ticket className="h-4 w-4" />;

    case "ai_reply":
      return <Bot className="h-4 w-4" />;

    case "new_reply":
      return <MessageSquare className="h-4 w-4" />;

    case "status_changed":
      return <Clock3 className="h-4 w-4" />;

    case "ticket_resolved":
      return <Check className="h-4 w-4" />;

    case "ticket_reopened":
      return <RefreshCcw className="h-4 w-4" />;

    case "ticket_escalated":
      return <AlertTriangle className="h-4 w-4" />;

    case "agent_assigned":
      return <UserRoundCheck className="h-4 w-4" />;

    case "attachment_added":
      return <Paperclip className="h-4 w-4" />;

    default:
      return <Bell className="h-4 w-4" />;
  }
};

/*
 * =========================================================
 * FORMAT NOTIFICATION TIME
 * =========================================================
 */

const formatTime = (date) => {
  if (!date) {
    return "";
  }

  const notificationDate = new Date(date);

  if (Number.isNaN(notificationDate.getTime())) {
    return "";
  }

  const now = new Date();

  const diff = Math.floor((now.getTime() - notificationDate.getTime()) / 1000);

  if (diff < 60) {
    return "Just now";
  }

  if (diff < 3600) {
    const minutes = Math.floor(diff / 60);

    return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
  }

  if (diff < 86400) {
    const hours = Math.floor(diff / 3600);

    return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  }

  if (diff < 604800) {
    const days = Math.floor(diff / 86400);

    return `${days} ${days === 1 ? "day" : "days"} ago`;
  }

  return notificationDate.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

/*
 * =========================================================
 * GET TICKET ID
 * =========================================================
 */

const getTicketId = (ticket) => {
  if (!ticket) {
    return null;
  }

  if (typeof ticket === "object") {
    return ticket._id || null;
  }

  return ticket;
};

/*
 * =========================================================
 * NORMALIZE NOTIFICATION
 * =========================================================
 *
 * Makes sure real-time notifications and API notifications
 * have the same structure.
 *
 * =========================================================
 */

const normalizeNotification = (notification) => {
  if (!notification || !notification._id) {
    return null;
  }

  return {
    _id: notification._id,
    recipient: notification.recipient,
    type: notification.type || "default",
    title: notification.title || "Notification",
    message: notification.message || "",
    ticket: notification.ticket || null,
    ticketNumber: notification.ticketNumber || "",
    isRead: Boolean(notification.isRead),
    readAt: notification.readAt || null,
    metadata: notification.metadata || {},
    createdAt: notification.createdAt || new Date().toISOString(),
    updatedAt: notification.updatedAt || new Date().toISOString(),
  };
};

/*
 * =========================================================
 * COMPONENT
 * =========================================================
 */

const Notifications = () => {
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [processingId, setProcessingId] = useState(null);
  const [markingAll, setMarkingAll] = useState(false);

  const [error, setError] = useState("");

  /*
   * =======================================================
   * LOAD NOTIFICATIONS
   * =======================================================
   */

  const loadNotifications = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setError("");

      /*
       * IMPORTANT:
       *
       * notificationService.js expects:
       *
       * getNotifications(limit)
       *
       * Therefore we pass 50 directly.
       */

      const data = await getNotifications(50);

      const notificationList = Array.isArray(data?.notifications)
        ? data.notifications.map(normalizeNotification).filter(Boolean)
        : [];

      setNotifications(notificationList);

      setUnreadCount(Number(data?.unreadCount) || 0);
    } catch (err) {
      console.error("LOAD NOTIFICATIONS ERROR:", err);

      setError(err?.response?.data?.message || "Failed to load notifications.");
    } finally {
      if (showLoading) {
        setLoading(false);
      } else {
        setRefreshing(false);
      }
    }
  }, []);

  /*
   * =======================================================
   * INITIAL LOAD
   * =======================================================
   */

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  /*
   * =======================================================
   * REAL-TIME NEW NOTIFICATION
   * =======================================================
   *
   * Backend emits:
   *
   * notification:new
   *
   * The notification service sends:
   *
   * {
   *   notification: {...}
   * }
   *
   * =======================================================
   */

  useEffect(() => {
    if (!socket) {
      console.warn("Notifications: Socket.IO client is not available.");

      return undefined;
    }

    /*
     * Make sure socket is connected.
     *
     * If your application already connects the socket globally,
     * calling connect() here is harmless when already connected.
     */

    if (!socket.connected) {
      socket.connect();
    }

    const handleNewNotification = (data) => {
      console.log("REAL-TIME NOTIFICATION RECEIVED:", data);

      const incomingNotification = normalizeNotification(data?.notification);

      if (!incomingNotification) {
        console.warn("Received invalid notification payload:", data);

        return;
      }

      /*
       * Prevent duplicate notifications.
       */

      setNotifications((current) => {
        const alreadyExists = current.some(
          (item) => item._id === incomingNotification._id,
        );

        if (alreadyExists) {
          return current;
        }

        /*
         * Put newest notification at the top.
         */

        return [incomingNotification, ...current];
      });

      /*
       * Only increment if the incoming notification is unread.
       */

      if (!incomingNotification.isRead) {
        setUnreadCount((current) => current + 1);
      }
    };

    socket.on("notification:new", handleNewNotification);

    /*
     * =====================================================
     * REAL-TIME NOTIFICATION READ
     * =====================================================
     */

    const handleNotificationRead = (data) => {
      const notificationId = data?.notificationId;

      if (!notificationId) {
        return;
      }

      setNotifications((current) =>
        current.map((notification) =>
          notification._id === notificationId
            ? {
                ...notification,
                isRead: true,
                readAt: notification.readAt || new Date().toISOString(),
              }
            : notification,
        ),
      );

      /*
       * Recalculate from current state.
       */

      setUnreadCount((current) => Math.max(current - 1, 0));
    };

    socket.on("notification:read", handleNotificationRead);

    /*
     * =====================================================
     * REAL-TIME MARK ALL AS READ
     * =====================================================
     */

    const handleNotificationsReadAll = () => {
      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          isRead: true,
          readAt: notification.readAt || new Date().toISOString(),
        })),
      );

      setUnreadCount(0);
    };

    socket.on("notification:read-all", handleNotificationsReadAll);

    /*
     * =====================================================
     * REAL-TIME DELETE
     * =====================================================
     */

    const handleNotificationDeleted = (data) => {
      const notificationId = data?.notificationId;

      if (!notificationId) {
        return;
      }

      setNotifications((current) => {
        const notification = current.find(
          (item) => item._id === notificationId,
        );

        if (notification && !notification.isRead) {
          setUnreadCount((count) => Math.max(count - 1, 0));
        }

        return current.filter((item) => item._id !== notificationId);
      });
    };

    socket.on("notification:deleted", handleNotificationDeleted);

    /*
     * =====================================================
     * CLEANUP
     * =====================================================
     */

    return () => {
      socket.off("notification:new", handleNewNotification);

      socket.off("notification:read", handleNotificationRead);

      socket.off("notification:read-all", handleNotificationsReadAll);

      socket.off("notification:deleted", handleNotificationDeleted);
    };
  }, []);

  /*
   * =======================================================
   * MARK ONE NOTIFICATION AS READ
   * =======================================================
   */

  const handleMarkAsRead = async (notification) => {
    if (!notification?._id || notification.isRead) {
      return;
    }

    try {
      setProcessingId(notification._id);

      const data = await markNotificationAsRead(notification._id);

      setNotifications((current) =>
        current.map((item) =>
          item._id === notification._id
            ? {
                ...item,
                isRead: true,
                readAt: data?.notification?.readAt || new Date().toISOString(),
              }
            : item,
        ),
      );

      if (Number.isFinite(Number(data?.unreadCount))) {
        setUnreadCount(Number(data.unreadCount));
      } else {
        setUnreadCount((count) => Math.max(count - 1, 0));
      }
    } catch (err) {
      console.error("MARK NOTIFICATION READ ERROR:", err);
    } finally {
      setProcessingId(null);
    }
  };

  /*
   * =======================================================
   * MARK ALL AS READ
   * =======================================================
   */

  const handleMarkAllAsRead = async () => {
    if (markingAll || unreadCount === 0) {
      return;
    }

    try {
      setMarkingAll(true);

      await markAllNotificationsAsRead();

      const readAt = new Date().toISOString();

      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          isRead: true,
          readAt: notification.readAt || readAt,
        })),
      );

      setUnreadCount(0);
    } catch (err) {
      console.error("MARK ALL NOTIFICATIONS READ ERROR:", err);
    } finally {
      setMarkingAll(false);
    }
  };

  /*
   * =======================================================
   * DELETE NOTIFICATION
   * =======================================================
   */

  const handleDelete = async (notificationId) => {
    if (!notificationId || processingId === notificationId) {
      return;
    }

    try {
      setProcessingId(notificationId);

      const notification = notifications.find(
        (item) => item._id === notificationId,
      );

      const data = await deleteNotification(notificationId);

      setNotifications((current) =>
        current.filter((item) => item._id !== notificationId),
      );

      if (Number.isFinite(Number(data?.unreadCount))) {
        setUnreadCount(Number(data.unreadCount));
      } else if (!notification?.isRead) {
        setUnreadCount((count) => Math.max(count - 1, 0));
      }
    } catch (err) {
      console.error("DELETE NOTIFICATION ERROR:", err);
    } finally {
      setProcessingId(null);
    }
  };

  /*
   * =======================================================
   * REFRESH
   * =======================================================
   */

  const handleRefresh = () => {
    loadNotifications(false);
  };

  /*
   * =======================================================
   * RENDER
   * =======================================================
   */

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* =================================================
            BACK BUTTON
            ================================================= */}

        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-6 inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-medium text-slate-400 transition hover:border-slate-700 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        {/* =================================================
            PAGE HEADER
            ================================================= */}

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-800 bg-slate-900">
              <Bell className="h-5 w-5 text-blue-400" />

              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-bold text-white ring-2 ring-slate-950">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </div>

            <div>
              <h1 className="text-xl font-semibold text-white">
                Notifications
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Stay updated with your support activity.
              </p>
            </div>
          </div>

          {/* =================================================
              HEADER ACTIONS
              ================================================= */}

          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-400">
                {unreadCount} unread
              </span>
            )}

            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing || loading}
              title="Refresh notifications"
              className="inline-flex items-center justify-center rounded-xl border border-slate-800 bg-slate-900 p-2.5 text-slate-400 transition hover:border-slate-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCcw
                className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
              />
            </button>

            <button
              type="button"
              onClick={handleMarkAllAsRead}
              disabled={markingAll || unreadCount === 0}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2.5 text-xs font-medium text-slate-300 transition hover:border-slate-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {markingAll ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <CheckCheck className="h-3.5 w-3.5" />
              )}

              {markingAll ? "Marking..." : "Mark all as read"}
            </button>
          </div>
        </div>

        {/* =================================================
            ERROR
            ================================================= */}

        {error && (
          <div className="mb-5 flex items-center justify-between gap-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3">
            <p className="text-sm text-red-400">{error}</p>

            <button
              type="button"
              onClick={() => loadNotifications()}
              className="shrink-0 rounded-lg border border-red-500/20 px-3 py-1.5 text-xs font-medium text-red-400 transition hover:bg-red-500/10"
            >
              Retry
            </button>
          </div>
        )}

        {/* =================================================
            LOADING
            ================================================= */}

        {loading ? (
          <div className="flex min-h-[350px] items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/40">
            <div className="flex items-center gap-3 text-sm text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
              Loading notifications...
            </div>
          </div>
        ) : notifications.length === 0 ? (
          /* =================================================
             EMPTY STATE
             ================================================= */

          <div className="flex min-h-[350px] flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/40 px-6 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800">
              <Bell className="h-6 w-6 text-slate-500" />
            </div>

            <h2 className="text-base font-semibold text-white">
              No notifications
            </h2>

            <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
              You're all caught up. New ticket updates, replies, and AI
              responses will appear here.
            </p>

            <Link
              to="/support/tickets"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-medium text-white transition hover:bg-blue-500"
            >
              <Ticket className="h-3.5 w-3.5" />
              View my tickets
            </Link>
          </div>
        ) : (
          /* =================================================
             NOTIFICATION LIST
             ================================================= */

          <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40">
            <div className="divide-y divide-slate-800">
              {notifications.map((notification) => {
                const ticketId = getTicketId(notification.ticket);

                const isProcessing = processingId === notification._id;

                return (
                  <div
                    key={notification._id}
                    className={`group relative p-4 transition sm:p-5 ${
                      notification.isRead
                        ? "bg-transparent hover:bg-slate-900/50"
                        : "bg-blue-500/[0.04] hover:bg-blue-500/[0.07]"
                    }`}
                  >
                    <div className="flex gap-4">
                      {/* ===================================
                            ICON
                            =================================== */}

                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                          notification.isRead
                            ? "bg-slate-800 text-slate-400"
                            : "bg-blue-500/10 text-blue-400"
                        }`}
                      >
                        {getNotificationIcon(notification.type)}
                      </div>

                      {/* ===================================
                            CONTENT
                            =================================== */}

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h3
                                className={`text-sm font-semibold ${
                                  notification.isRead
                                    ? "text-slate-300"
                                    : "text-white"
                                }`}
                              >
                                {notification.title}
                              </h3>

                              {!notification.isRead && (
                                <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-blue-400">
                                  New
                                </span>
                              )}
                            </div>

                            <p className="mt-1 text-sm leading-6 text-slate-500">
                              {notification.message}
                            </p>
                          </div>

                          <span className="shrink-0 text-[11px] text-slate-600">
                            {formatTime(notification.createdAt)}
                          </span>
                        </div>

                        {/* =================================
                              TICKET NUMBER
                              ================================= */}

                        {notification.ticketNumber && (
                          <div className="mt-3 inline-flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950/50 px-2.5 py-1.5">
                            <Ticket className="h-3 w-3 text-slate-500" />

                            <span className="text-[11px] font-medium text-slate-400">
                              {notification.ticketNumber}
                            </span>
                          </div>
                        )}

                        {/* =================================
                              TICKET LINK
                              ================================= */}

                        {ticketId && (
                          <div className="mt-3">
                            <Link
                              to={`/support/tickets/${ticketId}`}
                              onClick={() => handleMarkAsRead(notification)}
                              className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-400 transition hover:text-blue-300"
                            >
                              <Ticket className="h-3 w-3" />
                              View ticket
                            </Link>
                          </div>
                        )}

                        {/* =================================
                              ACTIONS
                              ================================= */}

                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          {!notification.isRead && (
                            <button
                              type="button"
                              disabled={isProcessing}
                              onClick={() => handleMarkAsRead(notification)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-[11px] font-medium text-slate-400 transition hover:border-slate-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {isProcessing ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Check className="h-3 w-3" />
                              )}
                              Mark as read
                            </button>
                          )}

                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() => handleDelete(notification._id)}
                            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-slate-600 transition hover:bg-red-500/10 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {isProcessing ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Trash2 className="h-3 w-3" />
                            )}
                            Delete
                          </button>
                        </div>
                      </div>

                      {/* ===================================
                            UNREAD INDICATOR
                            =================================== */}

                      {!notification.isRead && (
                        <span className="absolute right-4 top-5 h-2 w-2 rounded-full bg-blue-500 sm:right-5" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
