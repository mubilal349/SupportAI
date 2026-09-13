import { useCallback, useEffect, useState } from "react";
import { Outlet, Link, useNavigate } from "react-router-dom";

import {
  Menu,
  Search,
  Bell,
  Zap,
  Circle,
  X,
  CheckCheck,
  Trash2,
  Ticket,
  MessageSquare,
  UserCheck,
  AlertTriangle,
  Clock,
  Plus,
} from "lucide-react";

import AgentSidebar from "./AgentSidebar";
import socket from "../../socket/socket.js";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

const NOTIFICATIONS_URL = `${API_URL}/notifications`;

const AgentLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [searchOpen, setSearchOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");

  // =========================================================
  // NOTIFICATIONS
  // =========================================================

  const [notifications, setNotifications] = useState([]);

  const [unreadCount, setUnreadCount] = useState(0);

  const [notificationOpen, setNotificationOpen] = useState(false);

  const [notificationLoading, setNotificationLoading] = useState(false);

  const navigate = useNavigate();

  // =========================================================
  // AUTH HEADERS
  // =========================================================

  const getAuthHeaders = () => {
    const token = localStorage.getItem("supportai_token");

    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  };

  // =========================================================
  // SEARCH TICKETS
  // =========================================================

  const handleSearch = (e) => {
    e.preventDefault();

    const query = searchQuery.trim();

    if (!query) {
      navigate("/agent/queue");
      return;
    }

    navigate(`/agent/queue?search=${encodeURIComponent(query)}`);

    setSearchOpen(false);
  };

  // =========================================================
  // CLEAR SEARCH
  // =========================================================

  const clearSearch = () => {
    setSearchQuery("");
    navigate("/agent/queue");
    setSearchOpen(false);
  };

  // =========================================================
  // FETCH NOTIFICATIONS
  // =========================================================

  const fetchNotifications = useCallback(async () => {
    try {
      setNotificationLoading(true);

      const token = localStorage.getItem("supportai_token");

      if (!token) {
        return;
      }

      const response = await fetch(NOTIFICATIONS_URL, {
        method: "GET",
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch notifications: ${response.status}`);
      }

      const data = await response.json();

      if (!data?.success) {
        return;
      }

      const notificationList = data.notifications || data.data || [];

      setNotifications(Array.isArray(notificationList) ? notificationList : []);

      // If your backend returns unreadCount
      // from the main notification endpoint.
      if (typeof data.unreadCount === "number") {
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error("FETCH AGENT NOTIFICATIONS ERROR:", error);
    } finally {
      setNotificationLoading(false);
    }
  }, []);

  // =========================================================
  // FETCH UNREAD COUNT
  // =========================================================

  const fetchUnreadCount = useCallback(async () => {
    try {
      const token = localStorage.getItem("supportai_token");

      if (!token) {
        return;
      }

      const response = await fetch(`${NOTIFICATIONS_URL}/unread-count`, {
        method: "GET",
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch unread count: ${response.status}`);
      }

      const data = await response.json();

      if (!data?.success) {
        return;
      }

      const count =
        typeof data.unreadCount === "number"
          ? data.unreadCount
          : typeof data.count === "number"
            ? data.count
            : 0;

      setUnreadCount(count);
    } catch (error) {
      console.error("FETCH AGENT UNREAD COUNT ERROR:", error);
    }
  }, []);

  // =========================================================
  // INITIAL NOTIFICATION LOAD
  // =========================================================

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
  }, [fetchNotifications, fetchUnreadCount]);

  // =========================================================
  // REALTIME NOTIFICATIONS
  // =========================================================

  useEffect(() => {
    const token = localStorage.getItem("supportai_token");

    if (!token) {
      console.warn("AGENT NOTIFICATION SOCKET: Token not found.");

      return;
    }

    // -------------------------------------------------------
    // NEW NOTIFICATION
    // -------------------------------------------------------

    const handleNewNotification = (payload) => {
      const newNotification = payload?.notification;

      if (!newNotification) {
        return;
      }

      console.log("AGENT REALTIME NOTIFICATION:", newNotification);

      setNotifications((previous) => {
        const exists = previous.some(
          (notification) =>
            String(notification._id) === String(newNotification._id),
        );

        if (exists) {
          return previous;
        }

        return [newNotification, ...previous].slice(0, 50);
      });

      if (!newNotification.isRead) {
        setUnreadCount((previous) => previous + 1);
      }
    };

    // -------------------------------------------------------
    // NOTIFICATION READ
    // -------------------------------------------------------

    const handleNotificationRead = (payload) => {
      const notificationId =
        payload?.notificationId || payload?.notification?._id;

      if (!notificationId) {
        return;
      }

      setNotifications((previous) =>
        previous.map((notification) =>
          String(notification._id) === String(notificationId)
            ? {
                ...notification,
                isRead: true,
                readAt: notification.readAt || new Date().toISOString(),
              }
            : notification,
        ),
      );

      setUnreadCount((previous) => Math.max(0, previous - 1));
    };

    // -------------------------------------------------------
    // MARK ALL READ
    // -------------------------------------------------------

    const handleNotificationReadAll = () => {
      setNotifications((previous) =>
        previous.map((notification) => ({
          ...notification,
          isRead: true,
          readAt: notification.readAt || new Date().toISOString(),
        })),
      );

      setUnreadCount(0);
    };

    // -------------------------------------------------------
    // NOTIFICATION DELETED
    // -------------------------------------------------------

    const handleNotificationDeleted = (payload) => {
      const notificationId =
        payload?.notificationId || payload?.notification?._id;

      if (!notificationId) {
        return;
      }

      setNotifications((previous) => {
        const notification = previous.find(
          (item) => String(item._id) === String(notificationId),
        );

        if (notification && !notification.isRead) {
          setUnreadCount((count) => Math.max(0, count - 1));
        }

        return previous.filter(
          (item) => String(item._id) !== String(notificationId),
        );
      });
    };

    // -------------------------------------------------------
    // SOCKET AUTH
    // -------------------------------------------------------

    socket.auth = {
      token,
    };

    if (!socket.connected) {
      socket.connect();
    }

    // -------------------------------------------------------
    // SOCKET EVENTS
    // -------------------------------------------------------

    socket.on("notification:new", handleNewNotification);

    socket.on("notification:read", handleNotificationRead);

    socket.on("notification:read-all", handleNotificationReadAll);

    socket.on("notification:deleted", handleNotificationDeleted);

    // IMPORTANT:
    // Do not disconnect the socket here.
    // SupportAI uses the same socket for tickets,
    // typing, rooms and notifications.

    return () => {
      socket.off("notification:new", handleNewNotification);

      socket.off("notification:read", handleNotificationRead);

      socket.off("notification:read-all", handleNotificationReadAll);

      socket.off("notification:deleted", handleNotificationDeleted);
    };
  }, []);

  // =========================================================
  // MARK NOTIFICATION AS READ
  // =========================================================

  const markNotificationAsRead = async (notification) => {
    if (!notification?._id) {
      return;
    }

    if (notification.isRead) {
      return;
    }

    try {
      const response = await fetch(
        `${NOTIFICATIONS_URL}/${notification._id}/read`,
        {
          method: "PATCH",
          headers: getAuthHeaders(),
        },
      );

      if (!response.ok) {
        throw new Error(
          `Failed to mark notification as read: ${response.status}`,
        );
      }

      setNotifications((previous) =>
        previous.map((item) =>
          String(item._id) === String(notification._id)
            ? {
                ...item,
                isRead: true,
                readAt: new Date().toISOString(),
              }
            : item,
        ),
      );

      setUnreadCount((previous) => Math.max(0, previous - 1));
    } catch (error) {
      console.error("MARK NOTIFICATION READ ERROR:", error);
    }
  };

  // =========================================================
  // MARK ALL NOTIFICATIONS AS READ
  // =========================================================

  const markAllNotificationsAsRead = async () => {
    if (unreadCount === 0) {
      return;
    }

    try {
      const response = await fetch(`${NOTIFICATIONS_URL}/read-all`, {
        method: "PATCH",
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to mark all notifications as read: ${response.status}`,
        );
      }

      setNotifications((previous) =>
        previous.map((notification) => ({
          ...notification,
          isRead: true,
          readAt: notification.readAt || new Date().toISOString(),
        })),
      );

      setUnreadCount(0);
    } catch (error) {
      console.error("MARK ALL NOTIFICATIONS READ ERROR:", error);
    }
  };

  // =========================================================
  // DELETE NOTIFICATION
  // =========================================================

  const deleteNotification = async (notificationId) => {
    if (!notificationId) {
      return;
    }

    try {
      const notification = notifications.find(
        (item) => String(item._id) === String(notificationId),
      );

      const response = await fetch(`${NOTIFICATIONS_URL}/${notificationId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to delete notification: ${response.status}`);
      }

      setNotifications((previous) =>
        previous.filter((item) => String(item._id) !== String(notificationId)),
      );

      if (notification && !notification.isRead) {
        setUnreadCount((previous) => Math.max(0, previous - 1));
      }
    } catch (error) {
      console.error("DELETE NOTIFICATION ERROR:", error);
    }
  };

  // =========================================================
  // NOTIFICATION CLICK
  // =========================================================

  const handleNotificationClick = async (notification) => {
    if (!notification) {
      return;
    }

    await markNotificationAsRead(notification);

    setNotificationOpen(false);

    // New ticket = queue
    //
    // This is intentional because your
    // business rule says opening a ticket
    // must NOT automatically assign it.
    if (notification.type === "ticket_created") {
      navigate("/agent/queue");
      return;
    }

    // Ticket-specific notification
    if (notification.ticket) {
      navigate(`/agent/tickets/${notification.ticket}`);

      return;
    }

    navigate("/agent");
  };

  // =========================================================
  // NOTIFICATION ICON
  // =========================================================

  const getNotificationIcon = (type) => {
    switch (type) {
      case "ticket_created":
        return Ticket;

      case "new_reply":
      case "ai_reply":
        return MessageSquare;

      case "agent_assigned":
        return UserCheck;

      case "ticket_escalated":
        return AlertTriangle;

      case "status_changed":
      case "ticket_resolved":
      case "ticket_reopened":
        return Clock;

      case "attachment_added":
        return Plus;

      default:
        return Bell;
    }
  };

  // =========================================================
  // NOTIFICATION ICON STYLE
  // =========================================================

  const getNotificationIconStyle = (type) => {
    switch (type) {
      case "ticket_created":
        return "bg-blue-500/10 text-blue-400";

      case "new_reply":
      case "ai_reply":
        return "bg-purple-500/10 text-purple-400";

      case "agent_assigned":
        return "bg-emerald-500/10 text-emerald-400";

      case "ticket_escalated":
        return "bg-red-500/10 text-red-400";

      case "status_changed":
      case "ticket_resolved":
      case "ticket_reopened":
        return "bg-amber-500/10 text-amber-400";

      default:
        return "bg-slate-500/10 text-slate-400";
    }
  };

  // =========================================================
  // NOTIFICATION TIME
  // =========================================================

  const formatNotificationTime = (date) => {
    if (!date) {
      return "";
    }

    const notificationDate = new Date(date);

    if (Number.isNaN(notificationDate.getTime())) {
      return "";
    }

    const now = new Date();

    const difference = now.getTime() - notificationDate.getTime();

    const seconds = Math.floor(difference / 1000);

    const minutes = Math.floor(seconds / 60);

    const hours = Math.floor(minutes / 60);

    const days = Math.floor(hours / 24);

    if (seconds < 60) {
      return "Just now";
    }

    if (minutes < 60) {
      return `${minutes}m ago`;
    }

    if (hours < 24) {
      return `${hours}h ago`;
    }

    if (days < 7) {
      return `${days}d ago`;
    }

    return notificationDate.toLocaleDateString();
  };

  // =========================================================
  // CLOSE NOTIFICATION DROPDOWN
  // =========================================================

  useEffect(() => {
    if (!notificationOpen) {
      return;
    }

    const handleOutsideClick = (event) => {
      if (!event.target.closest("[data-agent-notifications]")) {
        setNotificationOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [notificationOpen]);

  return (
    <div
      className="
        flex
        min-h-screen
        w-full
        overflow-x-hidden
        bg-[#050b18]
        text-slate-100
      "
    >
      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <AgentSidebar
        mobileOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* =====================================================
          MAIN APPLICATION AREA
      ===================================================== */}

      <div
        className="
          flex
          min-w-0
          flex-1
          flex-col
          overflow-x-hidden
        "
      >
        {/* ===================================================
            TOP HEADER
        =================================================== */}

        <header
          className="
            sticky
            top-0
            z-20
            w-full
            shrink-0
            border-b
            border-slate-800/80
            bg-[#050b18]/95
            backdrop-blur-xl
          "
        >
          <div
            className="
              flex
              min-w-0
              h-[110px]
              items-center
              justify-between
              gap-4
              px-4
              sm:px-6
              lg:px-10
            "
          >
            {/* ===============================================
                LEFT SIDE
            ================================================ */}

            <div
              className="
                flex
                min-w-0
                flex-1
                items-center
                gap-4
              "
            >
              {/* MOBILE MENU */}

              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                aria-label="Open sidebar"
                className="
                  flex
                  h-10
                  w-10
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl
                  border
                  border-slate-800
                  bg-slate-900/70
                  text-slate-300
                  transition
                  hover:border-blue-500/40
                  hover:text-white
                  lg:hidden
                "
              >
                <Menu size={21} />
              </button>

              {/* PAGE TITLE */}

              <div className="min-w-0">
                <div className="flex min-w-0 items-center gap-3">
                  <h1
                    className="
                      truncate
                      text-xl
                      font-semibold
                      tracking-tight
                      text-white
                      sm:text-2xl
                    "
                  >
                    Agent Operations
                  </h1>

                  {/* LIVE BADGE */}

                  <span
                    className="
                      hidden
                      shrink-0
                      items-center
                      gap-2
                      rounded-full
                      border
                      border-emerald-500/20
                      bg-emerald-500/10
                      px-3
                      py-1
                      text-xs
                      font-medium
                      text-emerald-400
                      sm:flex
                    "
                  >
                    <Circle
                      size={7}
                      fill="currentColor"
                      className="text-emerald-400"
                    />
                    Live
                  </span>
                </div>

                <p
                  className="
                    mt-1
                    hidden
                    truncate
                    text-sm
                    text-slate-500
                    sm:block
                  "
                >
                  Manage tickets, customers and support conversations
                </p>
              </div>
            </div>

            {/* ===============================================
                RIGHT SIDE
            ================================================ */}

            <div
              className="
                flex
                shrink-0
                items-center
                gap-2
                sm:gap-3
              "
            >
              {/* =============================================
                  SEARCH
              ============================================== */}

              {searchOpen ? (
                <form
                  onSubmit={handleSearch}
                  className="
                    hidden
                    h-12
                    items-center
                    gap-2
                    rounded-2xl
                    border
                    border-blue-500/40
                    bg-slate-900/90
                    px-3
                    shadow-lg
                    shadow-blue-500/5
                    md:flex
                  "
                >
                  <Search size={19} className="shrink-0 text-slate-500" />

                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                    placeholder="Search tickets..."
                    className="
                      w-44
                      bg-transparent
                      text-sm
                      text-white
                      outline-none
                      placeholder:text-slate-600
                      lg:w-56
                    "
                  />

                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      aria-label="Clear search"
                      className="
                        text-slate-500
                        transition
                        hover:text-white
                      "
                    >
                      <X size={17} />
                    </button>
                  )}

                  <button
                    type="submit"
                    className="
                      rounded-xl
                      bg-blue-600
                      px-3
                      py-1.5
                      text-xs
                      font-semibold
                      text-white
                      transition
                      hover:bg-blue-500
                    "
                  >
                    Search
                  </button>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setSearchOpen(true)}
                  className="
                    hidden
                    h-12
                    items-center
                    gap-3
                    rounded-2xl
                    border
                    border-slate-800
                    bg-slate-900/70
                    px-4
                    text-slate-500
                    transition
                    hover:border-blue-500/30
                    hover:text-slate-300
                    md:flex
                  "
                >
                  <Search size={20} />

                  <span className="text-sm">Search tickets</span>
                </button>
              )}

              {/* =============================================
                  NOTIFICATIONS
              ============================================== */}

              <div className="relative" data-agent-notifications>
                {/* BELL */}

                <button
                  type="button"
                  aria-label="Notifications"
                  aria-expanded={notificationOpen}
                  onClick={() => setNotificationOpen((previous) => !previous)}
                  className="
                    relative
                    flex
                    h-12
                    w-12
                    shrink-0
                    items-center
                    justify-center
                    rounded-2xl
                    border
                    border-slate-800
                    bg-slate-900/70
                    text-slate-400
                    transition
                    hover:border-blue-500/30
                    hover:text-white
                  "
                >
                  <Bell size={20} />

                  {/* REAL MONGODB UNREAD COUNT */}

                  {unreadCount > 0 && (
                    <span
                      className="
                        absolute
                        -right-1
                        -top-1
                        flex
                        h-6
                        min-w-6
                        items-center
                        justify-center
                        rounded-full
                        border-2
                        border-[#050b18]
                        bg-blue-600
                        px-1
                        text-[11px]
                        font-bold
                        text-white
                      "
                    >
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </button>

                {/* ===========================================
                    NOTIFICATION DROPDOWN
                ============================================ */}

                {notificationOpen && (
                  <div
                    className="
                      absolute
                      right-0
                      top-full
                      z-50
                      mt-3
                      w-[calc(100vw-2rem)]
                      max-w-[390px]
                      overflow-hidden
                      rounded-2xl
                      border
                      border-slate-800
                      bg-[#0a1222]
                      shadow-2xl
                      shadow-black/50
                    "
                  >
                    {/* DROPDOWN HEADER */}

                    <div
                      className="
                        flex
                        items-center
                        justify-between
                        gap-3
                        border-b
                        border-slate-800
                        px-4
                        py-4
                      "
                    >
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-white">
                          Notifications
                        </h3>

                        <p className="mt-1 text-xs text-slate-500">
                          {unreadCount > 0
                            ? `${unreadCount} unread`
                            : "You're all caught up"}
                        </p>
                      </div>

                      {unreadCount > 0 && (
                        <button
                          type="button"
                          onClick={markAllNotificationsAsRead}
                          className="
                            flex
                            shrink-0
                            items-center
                            gap-1.5
                            rounded-lg
                            px-2
                            py-1.5
                            text-xs
                            font-medium
                            text-blue-400
                            transition
                            hover:bg-blue-500/10
                            hover:text-blue-300
                          "
                        >
                          <CheckCheck size={14} />

                          <span className="hidden sm:inline">
                            Mark all read
                          </span>

                          <span className="sm:hidden">Read all</span>
                        </button>
                      )}
                    </div>

                    {/* NOTIFICATION LIST */}

                    <div
                      className="
                        max-h-[430px]
                        overflow-y-auto
                      "
                    >
                      {notificationLoading && notifications.length === 0 ? (
                        <div className="flex items-center justify-center px-4 py-12">
                          <div
                            className="
                              h-6
                              w-6
                              animate-spin
                              rounded-full
                              border-2
                              border-slate-700
                              border-t-blue-500
                            "
                          />
                        </div>
                      ) : notifications.length === 0 ? (
                        <div className="px-6 py-12 text-center">
                          <div
                            className="
                              mx-auto
                              mb-3
                              flex
                              h-12
                              w-12
                              items-center
                              justify-center
                              rounded-full
                              bg-slate-900
                              text-slate-600
                            "
                          >
                            <Bell size={21} />
                          </div>

                          <p className="text-sm font-medium text-slate-300">
                            No notifications
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            New ticket activity will appear here.
                          </p>
                        </div>
                      ) : (
                        notifications.slice(0, 10).map((notification) => {
                          const Icon = getNotificationIcon(notification.type);

                          return (
                            <div
                              key={notification._id}
                              className={`
                                    group
                                    relative
                                    border-b
                                    border-slate-800/70
                                    transition
                                    hover:bg-white/[0.025]
                                    ${
                                      !notification.isRead
                                        ? "bg-blue-500/[0.035]"
                                        : ""
                                    }
                                  `}
                            >
                              <button
                                type="button"
                                onClick={() =>
                                  handleNotificationClick(notification)
                                }
                                className="
                                      flex
                                      w-full
                                      gap-3
                                      px-4
                                      py-3.5
                                      text-left
                                    "
                              >
                                {/* ICON */}

                                <div
                                  className={`
                                        mt-0.5
                                        flex
                                        h-9
                                        w-9
                                        shrink-0
                                        items-center
                                        justify-center
                                        rounded-xl
                                        ${getNotificationIconStyle(
                                          notification.type,
                                        )}
                                      `}
                                >
                                  <Icon size={17} />
                                </div>

                                {/* CONTENT */}

                                <div className="min-w-0 flex-1 pr-4">
                                  <div className="flex items-start gap-2">
                                    <p
                                      className={`
                                            line-clamp-1
                                            text-sm
                                            ${
                                              notification.isRead
                                                ? "font-medium text-slate-300"
                                                : "font-semibold text-white"
                                            }
                                          `}
                                    >
                                      {notification.title}
                                    </p>

                                    {!notification.isRead && (
                                      <span
                                        className="
                                              mt-1.5
                                              h-1.5
                                              w-1.5
                                              shrink-0
                                              rounded-full
                                              bg-blue-500
                                            "
                                      />
                                    )}
                                  </div>

                                  <p
                                    className="
                                          mt-1
                                          line-clamp-2
                                          text-xs
                                          leading-5
                                          text-slate-500
                                        "
                                  >
                                    {notification.message}
                                  </p>

                                  <div
                                    className="
                                          mt-1.5
                                          flex
                                          flex-wrap
                                          items-center
                                          gap-2
                                        "
                                  >
                                    {notification.ticketNumber && (
                                      <span className="text-[10px] font-medium text-slate-600">
                                        #{notification.ticketNumber}
                                      </span>
                                    )}

                                    <span className="text-[10px] text-slate-600">
                                      {formatNotificationTime(
                                        notification.createdAt,
                                      )}
                                    </span>
                                  </div>
                                </div>
                              </button>

                              {/* DELETE */}

                              <button
                                type="button"
                                onClick={() =>
                                  deleteNotification(notification._id)
                                }
                                aria-label="Delete notification"
                                className="
                                      absolute
                                      right-2
                                      top-2
                                      rounded-lg
                                      p-1.5
                                      text-slate-600
                                      opacity-0
                                      transition
                                      hover:bg-red-500/10
                                      hover:text-red-400
                                      group-hover:opacity-100
                                    "
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* FOOTER */}

                    {notifications.length > 10 && (
                      <div
                        className="
                          border-t
                          border-slate-800
                          px-4
                          py-3
                        "
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setNotificationOpen(false);

                            navigate("/agent/notifications");
                          }}
                          className="
                            w-full
                            rounded-lg
                            py-2
                            text-center
                            text-xs
                            font-medium
                            text-blue-400
                            transition
                            hover:bg-blue-500/10
                          "
                        >
                          View all notifications
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* =============================================
                  ACTION
              ============================================== */}

              <Link
                to="/agent/queue"
                className="
                  hidden
                  h-12
                  shrink-0
                  items-center
                  gap-2
                  rounded-2xl
                  bg-blue-600
                  px-5
                  text-sm
                  font-semibold
                  text-white
                  shadow-lg
                  shadow-blue-600/20
                  transition
                  hover:bg-blue-500
                  sm:flex
                "
              >
                <Zap size={19} />
                Handle Tickets
              </Link>
            </div>
          </div>
        </header>

        {/* ===================================================
            PAGE CONTENT
        =================================================== */}

        <main
          className="
            min-w-0
            flex-1
            overflow-x-hidden
          "
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AgentLayout;
