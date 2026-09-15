import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  Check,
  CheckCheck,
  ChevronLeft,
  Clock3,
  Loader2,
  MessageSquare,
  RefreshCw,
  Ticket,
  UserCheck,
  X,
  AlertCircle,
  CheckCircle2,
  RotateCcw,
  Paperclip,
  UserPlus,
} from "lucide-react";

import socket from "../../socket/socket";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000/api";

const getToken = () =>
  localStorage.getItem("supportai_token") || localStorage.getItem("token");

const getNotificationIcon = (type) => {
  switch (type) {
    case "ticket_created":
      return Ticket;

    case "new_reply":
      return MessageSquare;

    case "ai_reply":
      return MessageSquare;

    case "status_changed":
      return RefreshCw;

    case "ticket_resolved":
      return CheckCircle2;

    case "ticket_reopened":
      return RotateCcw;

    case "ticket_escalated":
      return AlertCircle;

    case "agent_assigned":
      return UserCheck;

    case "attachment_added":
      return Paperclip;

    default:
      return Bell;
  }
};

const getNotificationLabel = (type) => {
  switch (type) {
    case "ticket_created":
      return "New Ticket";

    case "new_reply":
      return "New Reply";

    case "ai_reply":
      return "AI Reply";

    case "status_changed":
      return "Status Changed";

    case "ticket_resolved":
      return "Ticket Resolved";

    case "ticket_reopened":
      return "Ticket Reopened";

    case "ticket_escalated":
      return "Ticket Escalated";

    case "agent_assigned":
      return "Assignment";

    case "attachment_added":
      return "Attachment";

    default:
      return "Notification";
  }
};

const getRelativeTime = (date) => {
  if (!date) return "";

  const now = Date.now();
  const notificationDate = new Date(date).getTime();

  if (Number.isNaN(notificationDate)) return "";

  const difference = Math.max(0, now - notificationDate);

  const seconds = Math.floor(difference / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return new Date(date).toLocaleDateString();
};

const getNotificationId = (notification) =>
  notification?._id || notification?.id;

const getTicketId = (notification) => {
  if (notification?.ticket?._id) {
    return notification.ticket._id;
  }

  if (typeof notification?.ticket === "string") {
    return notification.ticket;
  }

  if (notification?.metadata?.ticketId) {
    return notification.metadata.ticketId;
  }

  return null;
};

const normalizeNotification = (notification) => ({
  ...notification,
  _id: getNotificationId(notification),
  isRead: Boolean(notification?.isRead),
});

const AdminNotifications = () => {
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [filter, setFilter] = useState("all");

  const [markingReadId, setMarkingReadId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [markingAllRead, setMarkingAllRead] = useState(false);

  const [error, setError] = useState("");

  const token = getToken();

  const fetchNotifications = useCallback(
    async (showRefreshing = false) => {
      if (!token) {
        setError("Authentication token not found.");
        setLoading(false);
        return;
      }

      try {
        if (showRefreshing) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const response = await fetch(
          `${API_BASE_URL}/notifications?page=1&limit=50`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          },
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.message || "Failed to load notifications.");
        }

        const fetchedNotifications = Array.isArray(data?.notifications)
          ? data.notifications.map(normalizeNotification)
          : [];

        setNotifications(fetchedNotifications);
        setUnreadCount(Number(data?.unreadCount || 0));
      } catch (fetchError) {
        console.error("Fetch admin notifications error:", fetchError);
        setError(fetchError.message || "Unable to load notifications.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token],
  );

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // ==========================================
  // SOCKET.IO REAL-TIME NOTIFICATIONS
  // ==========================================

  useEffect(() => {
    if (!token) return;

    socket.auth = {
      token,
    };

    const handleNewNotification = (payload) => {
      const incomingNotification = payload?.notification;

      if (!incomingNotification) return;

      const normalized = normalizeNotification(incomingNotification);

      setNotifications((previous) => {
        const notificationId = getNotificationId(normalized);

        const alreadyExists = previous.some(
          (notification) => getNotificationId(notification) === notificationId,
        );

        if (alreadyExists) {
          return previous;
        }

        return [normalized, ...previous];
      });

      if (!normalized.isRead) {
        setUnreadCount((previous) => previous + 1);
      }
    };

    const handleNotificationRead = (payload) => {
      const notificationId =
        payload?.notificationId || payload?._id || payload?.id;

      if (!notificationId) return;

      setNotifications((previous) =>
        previous.map((notification) => {
          if (getNotificationId(notification) !== notificationId) {
            return notification;
          }

          return {
            ...notification,
            isRead: true,
            readAt: payload?.readAt || notification.readAt,
          };
        }),
      );

      // Refresh the count from the server to keep it accurate.
      fetchNotifications(true);
    };

    const handleNotificationReadAll = () => {
      setNotifications((previous) =>
        previous.map((notification) => ({
          ...notification,
          isRead: true,
        })),
      );

      setUnreadCount(0);
    };

    const handleNotificationDeleted = (payload) => {
      const notificationId =
        payload?.notificationId || payload?._id || payload?.id;

      if (!notificationId) return;

      setNotifications((previous) =>
        previous.filter(
          (notification) => getNotificationId(notification) !== notificationId,
        ),
      );

      if (typeof payload?.unreadCount === "number") {
        setUnreadCount(payload.unreadCount);
      }
    };

    socket.on("notification:new", handleNewNotification);
    socket.on("notification:read", handleNotificationRead);
    socket.on("notification:read-all", handleNotificationReadAll);
    socket.on("notification:deleted", handleNotificationDeleted);

    if (!socket.connected) {
      socket.connect();
    }

    return () => {
      socket.off("notification:new", handleNewNotification);
      socket.off("notification:read", handleNotificationRead);
      socket.off("notification:read-all", handleNotificationReadAll);
      socket.off("notification:deleted", handleNotificationDeleted);
    };
  }, [token, fetchNotifications]);

  // ==========================================
  // MARK SINGLE NOTIFICATION AS READ
  // ==========================================

  const markAsRead = async (notification) => {
    const notificationId = getNotificationId(notification);

    if (!notificationId || notification.isRead) {
      return;
    }

    try {
      setMarkingReadId(notificationId);

      const response = await fetch(
        `${API_BASE_URL}/notifications/${notificationId}/read`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || "Failed to mark notification as read.",
        );
      }

      setNotifications((previous) =>
        previous.map((item) =>
          getNotificationId(item) === notificationId
            ? {
                ...item,
                isRead: true,
                readAt: new Date().toISOString(),
              }
            : item,
        ),
      );

      if (typeof data?.unreadCount === "number") {
        setUnreadCount(data.unreadCount);
      } else {
        setUnreadCount((previous) => Math.max(previous - 1, 0));
      }
    } catch (markError) {
      console.error("Mark notification as read error:", markError);
      setError(markError.message || "Unable to mark notification as read.");
    } finally {
      setMarkingReadId(null);
    }
  };

  // ==========================================
  // MARK ALL AS READ
  // ==========================================

  const markAllAsRead = async () => {
    if (unreadCount === 0) return;

    try {
      setMarkingAllRead(true);
      setError("");

      const response = await fetch(`${API_BASE_URL}/notifications/read-all`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || "Failed to mark all notifications as read.",
        );
      }

      setNotifications((previous) =>
        previous.map((notification) => ({
          ...notification,
          isRead: true,
          readAt: notification.readAt || new Date().toISOString(),
        })),
      );

      setUnreadCount(Number(data?.unreadCount || 0));
    } catch (markError) {
      console.error("Mark all notifications error:", markError);
      setError(
        markError.message || "Unable to mark all notifications as read.",
      );
    } finally {
      setMarkingAllRead(false);
    }
  };

  // ==========================================
  // DELETE NOTIFICATION
  // ==========================================

  const deleteNotification = async (notification) => {
    const notificationId = getNotificationId(notification);

    if (!notificationId) return;

    try {
      setDeletingId(notificationId);
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/notifications/${notificationId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Failed to delete notification.");
      }

      setNotifications((previous) =>
        previous.filter((item) => getNotificationId(item) !== notificationId),
      );

      if (typeof data?.unreadCount === "number") {
        setUnreadCount(data.unreadCount);
      }
    } catch (deleteError) {
      console.error("Delete notification error:", deleteError);
      setError(deleteError.message || "Unable to delete notification.");
    } finally {
      setDeletingId(null);
    }
  };

  // ==========================================
  // OPEN NOTIFICATION
  // ==========================================

  const openNotification = async (notification) => {
    if (!notification.isRead) {
      await markAsRead(notification);
    }

    const ticketId = getTicketId(notification);

    if (ticketId) {
      navigate(`/admin/tickets/${ticketId}`);
      return;
    }

    // Notifications without a ticket go back to admin dashboard.
    navigate("/admin");
  };

  // ==========================================
  // FILTERED NOTIFICATIONS
  // ==========================================

  const filteredNotifications = useMemo(() => {
    if (filter === "unread") {
      return notifications.filter((notification) => !notification.isRead);
    }

    return notifications;
  }, [notifications, filter]);

  // ==========================================
  // LOADING STATE
  // ==========================================

  if (loading) {
    return (
      <div className="min-h-full bg-[#050b18] text-white">
        <div className="flex min-h-[70vh] items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-blue-400" />

            <p className="text-sm text-slate-400">Loading notifications...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#050b18] px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* ==========================================
            HEADER
        ========================================== */}

        <div className="mb-6">
          <button
            type="button"
            onClick={() => navigate("/admin")}
            className="mb-5 inline-flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm font-medium text-slate-300 transition hover:border-slate-700 hover:bg-slate-800 hover:text-white"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Dashboard
          </button>

          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10">
                  <Bell className="h-5 w-5 text-blue-400" />
                </div>

                <div>
                  <h1 className="text-2xl font-bold tracking-tight">
                    Notifications
                  </h1>

                  <p className="text-sm text-slate-400">
                    Stay updated with tickets, assignments, replies and
                    escalations.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fetchNotifications(true)}
                disabled={refreshing}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw
                  className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
                />
                Refresh
              </button>

              <button
                type="button"
                onClick={markAllAsRead}
                disabled={unreadCount === 0 || markingAllRead}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {markingAllRead ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCheck className="h-4 w-4" />
                )}
                Mark all as read
              </button>
            </div>
          </div>
        </div>

        {/* ==========================================
            ERROR
        ========================================== */}

        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />

            <span>{error}</span>

            <button
              type="button"
              onClick={() => setError("")}
              className="ml-auto text-red-300 transition hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* ==========================================
            SUMMARY
        ========================================== */}

        <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-800 bg-[#0a1222] p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Total</span>

              <Bell className="h-4 w-4 text-slate-500" />
            </div>

            <p className="mt-2 text-2xl font-bold">{notifications.length}</p>
          </div>

          <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Unread</span>

              <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-blue-500/20 px-2 text-xs font-bold text-blue-300">
                {unreadCount}
              </span>
            </div>

            <p className="mt-2 text-2xl font-bold text-blue-300">
              {unreadCount}
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-[#0a1222] p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Read</span>

              <CheckCheck className="h-4 w-4 text-emerald-400" />
            </div>

            <p className="mt-2 text-2xl font-bold">
              {Math.max(notifications.length - unreadCount, 0)}
            </p>
          </div>
        </div>

        {/* ==========================================
            FILTER BAR
        ========================================== */}

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-[#0a1222] p-2">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                filter === "all"
                  ? "bg-slate-700 text-white"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              All
            </button>

            <button
              type="button"
              onClick={() => setFilter("unread")}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                filter === "unread"
                  ? "bg-blue-600 text-white"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              Unread
              {unreadCount > 0 && (
                <span className="ml-2 rounded-full bg-white/15 px-2 py-0.5 text-xs">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2 px-2 text-xs text-slate-500">
            <Clock3 className="h-3.5 w-3.5" />
            Real-time updates enabled
          </div>
        </div>

        {/* ==========================================
            EMPTY STATE
        ========================================== */}

        {filteredNotifications.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-[#0a1222] px-6 py-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-800">
              <Bell className="h-7 w-7 text-slate-500" />
            </div>

            <h2 className="text-lg font-semibold text-white">
              {filter === "unread"
                ? "You're all caught up"
                : "No notifications yet"}
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              {filter === "unread"
                ? "There are no unread notifications at the moment."
                : "New ticket activity, replies, assignments and escalations will appear here."}
            </p>
          </div>
        ) : (
          /* ==========================================
             NOTIFICATION LIST
          ========================================== */

          <div className="overflow-hidden rounded-2xl border border-slate-800 bg-[#0a1222]">
            <div className="divide-y divide-slate-800">
              {filteredNotifications.map((notification) => {
                const Icon = getNotificationIcon(notification.type);
                const notificationId = getNotificationId(notification);

                const isDeleting = deletingId === notificationId;

                const isMarking = markingReadId === notificationId;

                return (
                  <div
                    key={notificationId}
                    className={`group relative transition ${
                      notification.isRead
                        ? "bg-[#0a1222]"
                        : "bg-blue-500/[0.035]"
                    } hover:bg-slate-900/70`}
                  >
                    {!notification.isRead && (
                      <div className="absolute left-0 top-0 h-full w-0.5 bg-blue-500" />
                    )}

                    <div className="flex gap-4 px-5 py-5">
                      {/* ICON */}

                      <button
                        type="button"
                        onClick={() => openNotification(notification)}
                        className={`mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition ${
                          notification.isRead
                            ? "border-slate-800 bg-slate-900 text-slate-500"
                            : "border-blue-500/20 bg-blue-500/10 text-blue-400"
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                      </button>

                      {/* CONTENT */}

                      <div className="min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={() => openNotification(notification)}
                          className="block w-full text-left"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`text-xs font-semibold uppercase tracking-wider ${
                                notification.isRead
                                  ? "text-slate-500"
                                  : "text-blue-400"
                              }`}
                            >
                              {getNotificationLabel(notification.type)}
                            </span>

                            {notification.ticketNumber && (
                              <span className="rounded-md border border-slate-700 bg-slate-900 px-2 py-0.5 font-mono text-[11px] text-slate-400">
                                {notification.ticketNumber}
                              </span>
                            )}

                            {!notification.isRead && (
                              <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                            )}
                          </div>

                          <h3
                            className={`mt-1 text-sm font-semibold ${
                              notification.isRead
                                ? "text-slate-300"
                                : "text-white"
                            }`}
                          >
                            {notification.title || "Notification"}
                          </h3>

                          <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-400">
                            {notification.message ||
                              "You have a new notification."}
                          </p>

                          <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                            <Clock3 className="h-3.5 w-3.5" />

                            <span>
                              {getRelativeTime(notification.createdAt)}
                            </span>
                          </div>
                        </button>
                      </div>

                      {/* ACTIONS */}

                      <div className="flex shrink-0 items-start gap-1 opacity-100 transition md:opacity-0 md:group-hover:opacity-100">
                        {!notification.isRead && (
                          <button
                            type="button"
                            title="Mark as read"
                            disabled={isMarking}
                            onClick={() => markAsRead(notification)}
                            className="rounded-lg p-2 text-slate-500 transition hover:bg-emerald-500/10 hover:text-emerald-400 disabled:opacity-50"
                          >
                            {isMarking ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Check className="h-4 w-4" />
                            )}
                          </button>
                        )}

                        <button
                          type="button"
                          title="Delete notification"
                          disabled={isDeleting}
                          onClick={() => deleteNotification(notification)}
                          className="rounded-lg p-2 text-slate-500 transition hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
                        >
                          {isDeleting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <X className="h-4 w-4" />
                          )}
                        </button>
                      </div>
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

export default AdminNotifications;
