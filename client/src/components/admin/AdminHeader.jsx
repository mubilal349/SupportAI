import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Bell,
  Check,
  ChevronRight,
  Menu,
  Search,
  Settings,
  Ticket,
  Trash2,
  X,
  CheckCheck,
  Inbox,
  AlertCircle,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import socket from "../../socket/socket";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000/api";

const AdminHeader = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const notificationRef = useRef(null);

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [notificationError, setNotificationError] = useState("");

  /*
   * =========================================================
   * PAGE TITLE
   * =========================================================
   */

  const getPageTitle = () => {
    if (location.pathname === "/admin") {
      return "Dashboard";
    }

    if (location.pathname.startsWith("/admin/users")) {
      return "Users";
    }

    if (location.pathname.startsWith("/admin/tickets")) {
      return "Tickets";
    }

    if (location.pathname.startsWith("/admin/agents")) {
      return "Agents";
    }

    if (location.pathname.startsWith("/admin/knowledge-base")) {
      return "Knowledge Base";
    }

    if (location.pathname.startsWith("/admin/canned-responses")) {
      return "Canned Responses";
    }

    if (location.pathname.startsWith("/admin/sla")) {
      return "SLA Management";
    }

    if (location.pathname.startsWith("/admin/analytics")) {
      return "Analytics";
    }

    if (location.pathname.startsWith("/admin/audit-logs")) {
      return "Audit Logs";
    }

    if (location.pathname.startsWith("/admin/settings")) {
      return "Settings";
    }

    return "Admin";
  };

  /*
   * =========================================================
   * INITIALS
   * =========================================================
   */

  const getInitials = () => {
    if (!user?.name) {
      return "AD";
    }

    return user.name
      .split(" ")
      .map((name) => name[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  /*
   * =========================================================
   * AUTH TOKEN
   * =========================================================
   */

  const getToken = () => {
    return (
      localStorage.getItem("supportai_token") || localStorage.getItem("token")
    );
  };

  /*
   * =========================================================
   * NOTIFICATION NORMALIZER
   * =========================================================
   */

  const normalizeNotification = (notification) => {
    if (!notification) {
      return null;
    }

    const ticketId =
      notification.ticket?._id ||
      notification.ticket?.id ||
      notification.ticket ||
      notification.metadata?.ticketId ||
      null;

    const ticketNumber =
      notification.ticketNumber ||
      notification.ticket?.ticketNumber ||
      notification.metadata?.ticketNumber ||
      "";

    return {
      ...notification,

      _id: notification._id || notification.id,

      ticketId: ticketId ? String(ticketId) : null,

      ticketNumber,

      isRead: Boolean(notification.isRead),

      createdAt: notification.createdAt || new Date().toISOString(),
    };
  };

  /*
   * =========================================================
   * FETCH NOTIFICATIONS
   * =========================================================
   */

  const fetchNotifications = async () => {
    try {
      const token = getToken();

      if (!token) {
        return;
      }

      setLoadingNotifications(true);
      setNotificationError("");

      const response = await fetch(
        `${API_BASE_URL}/notifications?page=1&limit=20`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load notifications.");
      }

      const notificationList = Array.isArray(data.notifications)
        ? data.notifications.map(normalizeNotification).filter(Boolean)
        : [];

      setNotifications(notificationList);

      setUnreadCount(Number(data.unreadCount) || 0);
    } catch (error) {
      console.error("ADMIN NOTIFICATIONS FETCH ERROR:", error);

      setNotificationError(error.message || "Failed to load notifications.");
    } finally {
      setLoadingNotifications(false);
    }
  };

  /*
   * =========================================================
   * INITIAL NOTIFICATION LOAD
   * =========================================================
   */

  useEffect(() => {
    if (!user) {
      return;
    }

    if (user.role !== "admin") {
      return;
    }

    fetchNotifications();
  }, [user]);

  /*
   * =========================================================
   * SOCKET AUTHENTICATION
   * =========================================================
   */

  useEffect(() => {
    if (!user) {
      return;
    }

    if (user.role !== "admin") {
      return;
    }

    const token = getToken();

    if (!token) {
      console.warn(
        "Admin notification socket: authentication token not found.",
      );

      return;
    }

    /*
     * Your backend Socket.IO middleware expects:
     *
     * socket.handshake.auth.token
     */

    socket.auth = {
      token,
    };

    /*
     * =====================================================
     * SOCKET CONNECT
     * =====================================================
     */

    const handleConnect = () => {
      console.log("Admin notification socket connected:", socket.id);
    };

    /*
     * =====================================================
     * SOCKET ERROR
     * =====================================================
     */

    const handleConnectError = (error) => {
      console.error(
        "Admin notification socket error:",
        error?.message || error,
      );
    };

    /*
     * =====================================================
     * NEW NOTIFICATION
     * =====================================================
     */

    const handleNewNotification = (payload) => {
      console.log("Admin received notification:", payload);

      const rawNotification = payload?.notification || payload;

      const notification = normalizeNotification(rawNotification);

      if (!notification) {
        return;
      }

      setNotifications((previous) => {
        /*
         * Prevent duplicate notification.
         */

        if (
          previous.some((item) => String(item._id) === String(notification._id))
        ) {
          return previous;
        }

        return [notification, ...previous].slice(0, 20);
      });

      /*
       * Increase unread count only for
       * an unread incoming notification.
       */

      if (!notification.isRead) {
        setUnreadCount((previous) => previous + 1);
      }
    };

    /*
     * =====================================================
     * NOTIFICATION READ
     * =====================================================
     */

    const handleNotificationRead = (payload) => {
      const notificationId = payload?.notificationId;

      if (!notificationId) {
        return;
      }

      setNotifications((previous) =>
        previous.map((notification) =>
          String(notification._id) === String(notificationId)
            ? {
                ...notification,
                isRead: true,
              }
            : notification,
        ),
      );

      /*
       * Recalculate from local state.
       */

      setUnreadCount((previous) => Math.max(previous - 1, 0));
    };

    /*
     * =====================================================
     * ALL NOTIFICATIONS READ
     * =====================================================
     */

    const handleAllNotificationsRead = () => {
      setNotifications((previous) =>
        previous.map((notification) => ({
          ...notification,
          isRead: true,
        })),
      );

      setUnreadCount(0);
    };

    /*
     * =====================================================
     * NOTIFICATION DELETED
     * =====================================================
     */

    const handleNotificationDeleted = (payload) => {
      const notificationId = payload?.notificationId;

      if (!notificationId) {
        return;
      }

      setNotifications((previous) => {
        const deletedNotification = previous.find(
          (notification) => String(notification._id) === String(notificationId),
        );

        if (deletedNotification && !deletedNotification.isRead) {
          setUnreadCount((count) => Math.max(count - 1, 0));
        }

        return previous.filter(
          (notification) => String(notification._id) !== String(notificationId),
        );
      });
    };

    socket.on("connect", handleConnect);

    socket.on("connect_error", handleConnectError);

    socket.on("notification:new", handleNewNotification);

    socket.on("notification:read", handleNotificationRead);

    socket.on("notification:read-all", handleAllNotificationsRead);

    socket.on("notification:deleted", handleNotificationDeleted);

    /*
     * If another component already connected
     * the shared socket, don't reconnect it.
     */

    if (socket.connected) {
      handleConnect();
    } else {
      socket.connect();
    }

    return () => {
      socket.off("connect", handleConnect);

      socket.off("connect_error", handleConnectError);

      socket.off("notification:new", handleNewNotification);

      socket.off("notification:read", handleNotificationRead);

      socket.off("notification:read-all", handleAllNotificationsRead);

      socket.off("notification:deleted", handleNotificationDeleted);
    };
  }, [user]);

  /*
   * =========================================================
   * CLOSE DROPDOWN WHEN CLICKING OUTSIDE
   * =========================================================
   */

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  /*
   * =========================================================
   * MARK ONE AS READ
   * =========================================================
   */

  const markAsRead = async (notificationId) => {
    if (!notificationId) {
      return;
    }

    const token = getToken();

    if (!token) {
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/notifications/${notificationId}/read`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to mark notification as read.");
      }

      setNotifications((previous) =>
        previous.map((notification) =>
          String(notification._id) === String(notificationId)
            ? {
                ...notification,
                isRead: true,
              }
            : notification,
        ),
      );

      setUnreadCount(Number(data.unreadCount) || 0);
    } catch (error) {
      console.error("MARK NOTIFICATION READ ERROR:", error);
    }
  };

  /*
   * =========================================================
   * MARK ALL AS READ
   * =========================================================
   */

  const markAllAsRead = async () => {
    const token = getToken();

    if (!token) {
      return;
    }

    if (unreadCount === 0) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/notifications/read-all`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to mark notifications as read.",
        );
      }

      setNotifications((previous) =>
        previous.map((notification) => ({
          ...notification,
          isRead: true,
        })),
      );

      setUnreadCount(Number(data.unreadCount) || 0);
    } catch (error) {
      console.error("MARK ALL NOTIFICATIONS READ ERROR:", error);
    }
  };

  /*
   * =========================================================
   * DELETE NOTIFICATION
   * =========================================================
   */

  const deleteNotification = async (notificationId) => {
    if (!notificationId) {
      return;
    }

    const token = getToken();

    if (!token) {
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/notifications/${notificationId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete notification.");
      }

      setNotifications((previous) =>
        previous.filter(
          (notification) => String(notification._id) !== String(notificationId),
        ),
      );

      setUnreadCount(Number(data.unreadCount) || 0);
    } catch (error) {
      console.error("DELETE NOTIFICATION ERROR:", error);
    }
  };

  /*
   * =========================================================
   * OPEN NOTIFICATION
   * =========================================================
   */

  const handleNotificationClick = async (notification) => {
    if (!notification) {
      return;
    }

    if (!notification.isRead) {
      await markAsRead(notification._id);
    }

    setNotificationsOpen(false);

    /*
     * Ticket notification
     */

    if (notification.ticketId) {
      navigate(`/admin/tickets/${notification.ticketId}`);

      return;
    }

    /*
     * New ticket notification
     * without ticket ID.
     */

    if (notification.type === "ticket_created") {
      navigate("/admin/tickets");

      return;
    }
  };

  /*
   * =========================================================
   * RELATIVE TIME
   * =========================================================
   */

  const formatNotificationTime = (date) => {
    if (!date) {
      return "";
    }

    const timestamp = new Date(date).getTime();

    if (Number.isNaN(timestamp)) {
      return "";
    }

    const difference = Date.now() - timestamp;

    const seconds = Math.floor(difference / 1000);

    if (seconds < 10) {
      return "Just now";
    }

    if (seconds < 60) {
      return `${seconds}s ago`;
    }

    const minutes = Math.floor(seconds / 60);

    if (minutes < 60) {
      return `${minutes}m ago`;
    }

    const hours = Math.floor(minutes / 60);

    if (hours < 24) {
      return `${hours}h ago`;
    }

    const days = Math.floor(hours / 24);

    if (days < 7) {
      return `${days}d ago`;
    }

    return new Date(date).toLocaleDateString();
  };

  /*
   * =========================================================
   * NOTIFICATION ICON
   * =========================================================
   */

  const getNotificationIcon = (notification) => {
    switch (notification?.type) {
      case "ticket_created":
        return <Inbox className="h-4 w-4" />;

      case "agent_assigned":
        return <Ticket className="h-4 w-4" />;

      case "new_reply":
      case "ai_reply":
        return <Bell className="h-4 w-4" />;

      case "ticket_escalated":
        return <AlertCircle className="h-4 w-4" />;

      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  /*
   * =========================================================
   * NOTIFICATION ICON STYLE
   * =========================================================
   */

  const getNotificationIconStyle = (notification) => {
    switch (notification?.type) {
      case "ticket_created":
        return "bg-blue-500/10 text-blue-400";

      case "agent_assigned":
        return "bg-violet-500/10 text-violet-400";

      case "ticket_escalated":
        return "bg-orange-500/10 text-orange-400";

      case "ticket_resolved":
        return "bg-emerald-500/10 text-emerald-400";

      case "new_reply":
      case "ai_reply":
        return "bg-cyan-500/10 text-cyan-400";

      default:
        return "bg-slate-800 text-slate-400";
    }
  };

  /*
   * =========================================================
   * MEMOIZED DISPLAY COUNT
   * =========================================================
   */

  const displayNotifications = useMemo(
    () => notifications.slice(0, 20),
    [notifications],
  );

  return (
    <header className="sticky top-0 z-30 h-[72px] border-b border-slate-800 bg-[#050b18]/95 backdrop-blur-xl">
      <div className="flex h-full items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* =================================================
            LEFT
        ================================================= */}

        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            className="rounded-xl border border-slate-800 bg-slate-900 p-2 text-slate-400 transition hover:border-slate-700 hover:text-white lg:hidden"
            title="Open menu"
            onClick={() => {
              window.dispatchEvent(new CustomEvent("admin:open-sidebar"));
            }}
          >
            <Menu size={18} />
          </button>

          <div className="hidden items-center gap-2 text-sm text-slate-600 sm:flex">
            <span>Admin</span>

            <ChevronRight size={14} />
          </div>

          <h1 className="truncate text-sm font-semibold text-white sm:text-base">
            {getPageTitle()}
          </h1>
        </div>

        {/* =================================================
            RIGHT
        ================================================= */}

        <div className="flex items-center gap-2 sm:gap-3">
          {/* SEARCH */}

          <button
            type="button"
            className="hidden rounded-xl border border-slate-800 bg-slate-900 p-2.5 text-slate-500 transition hover:border-slate-700 hover:text-white sm:block"
            title="Search"
          >
            <Search size={18} />
          </button>

          {/* =================================================
              NOTIFICATIONS
          ================================================= */}

          <div ref={notificationRef} className="relative">
            <button
              type="button"
              onClick={() => setNotificationsOpen((previous) => !previous)}
              className={`relative rounded-xl border bg-slate-900 p-2.5 transition ${
                notificationsOpen
                  ? "border-violet-500/40 text-white"
                  : "border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white"
              }`}
              title="Notifications"
              aria-label="Notifications"
              aria-expanded={notificationsOpen}
            >
              <Bell size={18} />

              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-[#050b18] bg-violet-600 px-1 text-[9px] font-bold text-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>

            {/* =================================================
                NOTIFICATION DROPDOWN
            ================================================= */}

            {notificationsOpen && (
              <div className="absolute right-0 top-[calc(100%+12px)] z-[100] w-[390px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-slate-800 bg-[#0a1222] shadow-2xl shadow-black/50">
                {/* HEADER */}

                <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3.5">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-white">
                        Notifications
                      </h3>

                      {unreadCount > 0 && (
                        <span className="rounded-full bg-violet-500/10 px-2 py-0.5 text-[10px] font-semibold text-violet-400">
                          {unreadCount} unread
                        </span>
                      )}
                    </div>

                    <p className="mt-0.5 text-[10px] text-slate-600">
                      Platform activity and updates
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setNotificationsOpen(false)}
                    className="rounded-lg p-1.5 text-slate-600 transition hover:bg-slate-800 hover:text-slate-300"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* ACTIONS */}

                {unreadCount > 0 && (
                  <div className="flex items-center justify-end border-b border-slate-800/70 px-4 py-2">
                    <button
                      type="button"
                      onClick={markAllAsRead}
                      className="inline-flex items-center gap-1.5 text-[10px] font-medium text-violet-400 transition hover:text-violet-300"
                    >
                      <CheckCheck className="h-3.5 w-3.5" />
                      Mark all as read
                    </button>
                  </div>
                )}

                {/* CONTENT */}

                <div className="max-h-[430px] overflow-y-auto">
                  {loadingNotifications ? (
                    <div className="flex flex-col items-center justify-center px-6 py-12">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-700 border-t-violet-500" />

                      <p className="mt-3 text-xs text-slate-500">
                        Loading notifications...
                      </p>
                    </div>
                  ) : notificationError ? (
                    <div className="px-6 py-10 text-center">
                      <AlertCircle className="mx-auto h-7 w-7 text-red-400" />

                      <p className="mt-3 text-xs font-medium text-slate-300">
                        Unable to load notifications
                      </p>

                      <p className="mt-1 text-[10px] text-slate-600">
                        {notificationError}
                      </p>

                      <button
                        type="button"
                        onClick={fetchNotifications}
                        className="mt-4 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-[10px] font-semibold text-slate-300 transition hover:border-slate-600 hover:text-white"
                      >
                        Try again
                      </button>
                    </div>
                  ) : displayNotifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900">
                        <Bell className="h-5 w-5 text-slate-600" />
                      </div>

                      <p className="mt-4 text-xs font-medium text-slate-400">
                        You're all caught up
                      </p>

                      <p className="mt-1 max-w-[220px] text-[10px] leading-5 text-slate-600">
                        New platform notifications will appear here.
                      </p>
                    </div>
                  ) : (
                    displayNotifications.map((notification) => (
                      <div
                        key={notification._id}
                        className={`group relative border-b border-slate-800/70 px-4 py-3 transition hover:bg-slate-900/70 ${
                          notification.isRead ? "" : "bg-violet-500/[0.025]"
                        }`}
                      >
                        {/* UNREAD INDICATOR */}

                        {!notification.isRead && (
                          <span className="absolute left-1.5 top-5 h-1.5 w-1.5 rounded-full bg-violet-500" />
                        )}

                        <button
                          type="button"
                          onClick={() => handleNotificationClick(notification)}
                          className="flex w-full items-start gap-3 text-left"
                        >
                          {/* ICON */}

                          <div
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${getNotificationIconStyle(
                              notification,
                            )}`}
                          >
                            {getNotificationIcon(notification)}
                          </div>

                          {/* TEXT */}

                          <div className="min-w-0 flex-1 pr-5">
                            <div className="flex items-start justify-between gap-2">
                              <p
                                className={`truncate text-xs ${
                                  notification.isRead
                                    ? "font-medium text-slate-300"
                                    : "font-semibold text-white"
                                }`}
                              >
                                {notification.title}
                              </p>

                              <span className="shrink-0 text-[9px] text-slate-600">
                                {formatNotificationTime(notification.createdAt)}
                              </span>
                            </div>

                            <p className="mt-1 line-clamp-2 text-[10px] leading-4 text-slate-500">
                              {notification.message}
                            </p>

                            {notification.ticketNumber && (
                              <div className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-slate-800/70 px-2 py-1 text-[9px] font-medium text-slate-400">
                                <Ticket className="h-3 w-3" />

                                {notification.ticketNumber}
                              </div>
                            )}
                          </div>
                        </button>

                        {/* QUICK ACTIONS */}

                        <div className="absolute bottom-3 right-3 hidden items-center gap-1 group-hover:flex">
                          {!notification.isRead && (
                            <button
                              type="button"
                              title="Mark as read"
                              onClick={() => markAsRead(notification._id)}
                              className="rounded-md bg-slate-800 p-1.5 text-slate-500 transition hover:bg-slate-700 hover:text-emerald-400"
                            >
                              <Check className="h-3 w-3" />
                            </button>
                          )}

                          <button
                            type="button"
                            title="Delete notification"
                            onClick={() => deleteNotification(notification._id)}
                            className="rounded-md bg-slate-800 p-1.5 text-slate-500 transition hover:bg-slate-700 hover:text-red-400"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* FOOTER */}

                {displayNotifications.length > 0 && (
                  <div className="border-t border-slate-800 bg-[#08101e] px-4 py-3">
                    <Link
                      to="/admin/notifications"
                      onClick={() => setNotificationsOpen(false)}
                      className="flex items-center justify-center gap-2 text-[10px] font-semibold text-violet-400 transition hover:text-violet-300"
                    >
                      View all notifications
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* SETTINGS */}

          <Link
            to="/admin/settings"
            className="hidden rounded-xl border border-slate-800 bg-slate-900 p-2.5 text-slate-500 transition hover:border-slate-700 hover:text-white sm:block"
            title="Settings"
          >
            <Settings size={18} />
          </Link>

          <div className="hidden h-8 w-px bg-slate-800 sm:block" />

          {/* USER */}

          <div className="hidden text-right md:block">
            <p className="text-sm font-medium text-white">
              {user?.name || "Administrator"}
            </p>

            <p className="text-[11px] capitalize text-slate-500">
              {user?.role || "admin"}
            </p>
          </div>

          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-xs font-bold text-white">
            {getInitials()}
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
