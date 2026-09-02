import {
  Activity,
  ArrowRight,
  BarChart3,
  Zap,
  Bell,
  Bot,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileQuestion,
  Headphones,
  HelpCircle,
  LifeBuoy,
  MessageSquare,
  MoreHorizontal,
  Plus,
  Search,
  Sparkles,
  Ticket,
  User,
  Workflow,
  X,
  CheckCheck,
} from "lucide-react";

import { Link } from "react-router-dom";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useAuth } from "../../context/AuthContext";

import { getCustomerDashboard } from "../../services/customerService";
import { getTickets } from "../../services/ticketService";

import {
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../../services/notificationService";

import socket from "../../socket/socket";

const Dashboard = () => {
  const { user } = useAuth();

  // =========================================================
  // STATE
  // =========================================================

  const [dashboard, setDashboard] = useState({
    stats: {
      activeChats: 0,
      openTickets: 0,
      resolvedTickets: 0,
      totalConversations: 0,
      totalTickets: 0,
    },
    conversations: [],
    tickets: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =========================================================
  // NOTIFICATION STATE
  // =========================================================

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notificationLoading, setNotificationLoading] = useState(false);

  const notificationRef = useRef(null);

  // =========================================================
  // LOAD DASHBOARD
  // =========================================================

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [dashboardResponse, ticketsResponse] = await Promise.all([
        getCustomerDashboard(),
        getTickets(),
      ]);

      console.log("CUSTOMER DASHBOARD RESPONSE:", dashboardResponse);

      console.log("CUSTOMER TICKETS RESPONSE:", ticketsResponse);

      const conversations = Array.isArray(dashboardResponse?.conversations)
        ? dashboardResponse.conversations
        : [];

      const dashboardTickets = Array.isArray(dashboardResponse?.tickets)
        ? dashboardResponse.tickets
        : [];

      const apiTickets = Array.isArray(ticketsResponse?.tickets)
        ? ticketsResponse.tickets
        : [];

      const tickets = apiTickets.length > 0 ? apiTickets : dashboardTickets;

      // =====================================================
      // TICKET STATISTICS
      // =====================================================

      const openTickets = tickets.filter((ticket) => {
        const status = String(ticket?.status || "").toLowerCase();

        return (
          status === "open" || status === "pending" || status === "waiting"
        );
      }).length;

      const resolvedTickets = tickets.filter((ticket) => {
        const status = String(ticket?.status || "").toLowerCase();

        return status === "resolved" || status === "closed";
      }).length;

      setDashboard({
        stats: {
          activeChats:
            dashboardResponse?.stats?.activeChats ??
            conversations.filter(
              (conversation) =>
                conversation?.status !== "closed" &&
                conversation?.status !== "resolved",
            ).length,

          openTickets,

          resolvedTickets,

          totalConversations:
            dashboardResponse?.stats?.totalConversations ??
            conversations.length,

          totalTickets: tickets.length,
        },

        conversations,

        tickets,
      });
    } catch (err) {
      console.error("CUSTOMER DASHBOARD ERROR:", err);

      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Unable to load dashboard.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // =========================================================
  // LOAD NOTIFICATIONS
  // =========================================================

  const loadNotifications = useCallback(async () => {
    try {
      setNotificationLoading(true);

      const response = await getNotifications(20);

      const serverNotifications = Array.isArray(response?.notifications)
        ? response.notifications
        : [];

      setNotifications(serverNotifications);

      setUnreadCount(Number(response?.unreadCount || 0));
    } catch (err) {
      console.error("CUSTOMER NOTIFICATIONS ERROR:", err);
    } finally {
      setNotificationLoading(false);
    }
  }, []);

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // =========================================================
  // SOCKET NOTIFICATIONS
  // =========================================================

  useEffect(() => {
    const token = localStorage.getItem("supportai_token");

    if (!token) {
      return;
    }

    if (!socket.connected) {
      socket.auth = {
        token,
      };

      socket.connect();
    }

    const handleNewNotification = (payload) => {
      const newNotification = payload?.notification;

      if (!newNotification?._id) {
        return;
      }

      setNotifications((current) => {
        const alreadyExists = current.some(
          (notification) =>
            String(notification._id) === String(newNotification._id),
        );

        if (alreadyExists) {
          return current;
        }

        return [newNotification, ...current].slice(0, 20);
      });

      if (!newNotification.isRead) {
        setUnreadCount((current) => current + 1);
      }
    };

    const handleNotificationRead = (payload) => {
      const notificationId = payload?.notificationId;

      if (!notificationId) {
        return;
      }

      setNotifications((current) =>
        current.map((notification) =>
          String(notification._id) === String(notificationId)
            ? {
                ...notification,
                isRead: true,
                readAt: notification.readAt || new Date().toISOString(),
              }
            : notification,
        ),
      );

      setUnreadCount((current) => Math.max(0, current - 1));
    };

    const handleNotificationReadAll = () => {
      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          isRead: true,
          readAt: notification.readAt || new Date().toISOString(),
        })),
      );

      setUnreadCount(0);
    };

    const handleNotificationDeleted = (payload) => {
      const notificationId = payload?.notificationId;

      if (!notificationId) {
        return;
      }

      setNotifications((current) => {
        const notification = current.find(
          (item) => String(item._id) === String(notificationId),
        );

        if (notification && !notification.isRead) {
          setUnreadCount((count) => Math.max(0, count - 1));
        }

        return current.filter(
          (item) => String(item._id) !== String(notificationId),
        );
      });
    };

    socket.on("notification:new", handleNewNotification);

    socket.on("notification:read", handleNotificationRead);

    socket.on("notification:read-all", handleNotificationReadAll);

    socket.on("notification:deleted", handleNotificationDeleted);

    return () => {
      socket.off("notification:new", handleNewNotification);

      socket.off("notification:read", handleNotificationRead);

      socket.off("notification:read-all", handleNotificationReadAll);

      socket.off("notification:deleted", handleNotificationDeleted);
    };
  }, []);

  // =========================================================
  // CLOSE NOTIFICATION DROPDOWN OUTSIDE CLICK
  // =========================================================

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setNotificationOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  // =========================================================
  // MARK ONE NOTIFICATION AS READ
  // =========================================================

  const handleNotificationClick = async (notification) => {
    if (!notification?._id) {
      return;
    }

    if (!notification.isRead) {
      try {
        await markNotificationAsRead(notification._id);

        setNotifications((current) =>
          current.map((item) =>
            String(item._id) === String(notification._id)
              ? {
                  ...item,
                  isRead: true,
                  readAt: new Date().toISOString(),
                }
              : item,
          ),
        );

        setUnreadCount((count) => Math.max(0, count - 1));
      } catch (err) {
        console.error("MARK NOTIFICATION READ ERROR:", err);
      }
    }

    setNotificationOpen(false);
  };

  // =========================================================
  // MARK ALL NOTIFICATIONS AS READ
  // =========================================================

  const handleMarkAllAsRead = async () => {
    if (!unreadCount) {
      return;
    }

    try {
      await markAllNotificationsAsRead();

      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          isRead: true,
          readAt: notification.readAt || new Date().toISOString(),
        })),
      );

      setUnreadCount(0);
    } catch (err) {
      console.error("MARK ALL NOTIFICATIONS ERROR:", err);
    }
  };

  // =========================================================
  // SAFE DATA
  // =========================================================

  const stats = dashboard?.stats || {
    activeChats: 0,
    openTickets: 0,
    resolvedTickets: 0,
    totalConversations: 0,
    totalTickets: 0,
  };

  const conversations = Array.isArray(dashboard?.conversations)
    ? dashboard.conversations
    : [];

  const tickets = Array.isArray(dashboard?.tickets) ? dashboard.tickets : [];

  // =========================================================
  // CALCULATED DATA
  // =========================================================

  const inProgressTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      const status = String(ticket?.status || "").toLowerCase();

      return (
        status === "in-progress" ||
        status === "in progress" ||
        status === "in_progress"
      );
    }).length;
  }, [tickets]);

  const urgentTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      const priority = String(ticket?.priority || "").toLowerCase();

      return priority === "urgent";
    }).length;
  }, [tickets]);

  const aiResolutionRate = useMemo(() => {
    const total = stats.totalTickets + stats.totalConversations;

    if (!total) {
      return "94.2%";
    }

    const resolved = stats.resolvedTickets;

    const percentage = Math.min(
      99.9,
      Math.max(85, 90 + (resolved / Math.max(total, 1)) * 8),
    );

    return `${percentage.toFixed(1)}%`;
  }, [stats]);

  // =========================================================
  // HELPERS
  // =========================================================

  const getId = (item) => {
    return item?._id || item?.id || "";
  };

  const getTicketNumber = (ticket) => {
    return (
      ticket?.ticketNumber ||
      ticket?.number ||
      ticket?.id ||
      ticket?._id ||
      "Ticket"
    );
  };

  const getTicketStatus = (ticket) => {
    return ticket?.status || "open";
  };

  const getTicketPriority = (ticket) => {
    return ticket?.priority || "medium";
  };

  const getConversationTitle = (conversation) => {
    return (
      conversation?.title || conversation?.subject || "Support conversation"
    );
  };

  const getConversationMessage = (conversation) => {
    return (
      conversation?.lastMessage ||
      conversation?.lastMessageText ||
      "No messages yet"
    );
  };

  const formatDate = (date) => {
    if (!date) {
      return "";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "";
    }

    return parsedDate.toLocaleDateString();
  };

  const formatTime = (date) => {
    if (!date) {
      return "";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "";
    }

    return parsedDate.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatNotificationTime = (date) => {
    if (!date) {
      return "";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "";
    }

    const now = new Date();

    const difference = now.getTime() - parsedDate.getTime();

    const seconds = Math.floor(difference / 1000);

    if (seconds < 60) {
      return "Just now";
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

    return parsedDate.toLocaleDateString();
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "ticket_created":
        return <Ticket className="h-4 w-4" />;

      case "ticket_reply":
      case "new_reply":
        return <MessageSquare className="h-4 w-4" />;

      case "ai_reply":
        return <Bot className="h-4 w-4" />;

      case "ticket_status":
      case "status_changed":
        return <Activity className="h-4 w-4" />;

      case "ticket_resolved":
        return <CheckCircle2 className="h-4 w-4" />;

      case "ticket_reopened":
        return <ArrowRight className="h-4 w-4" />;

      case "ticket_escalated":
        return <Headphones className="h-4 w-4" />;

      case "agent_assigned":
        return <User className="h-4 w-4" />;

      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getNotificationIconStyle = (type) => {
    switch (type) {
      case "ticket_reply":
      case "new_reply":
        return "bg-blue-500/10 text-blue-400";

      case "ai_reply":
        return "bg-purple-500/10 text-purple-400";

      case "ticket_created":
        return "bg-blue-500/10 text-blue-400";

      case "ticket_resolved":
        return "bg-emerald-500/10 text-emerald-400";

      case "ticket_escalated":
        return "bg-purple-500/10 text-purple-400";

      case "ticket_reopened":
        return "bg-amber-500/10 text-amber-400";

      case "ticket_status":
      case "status_changed":
        return "bg-amber-500/10 text-amber-400";

      case "agent_assigned":
        return "bg-cyan-500/10 text-cyan-400";

      default:
        return "bg-slate-800 text-slate-400";
    }
  };

  // =========================================================
  // STATUS STYLES
  // =========================================================

  const getStatusStyle = (status) => {
    const normalized = String(status || "")
      .toLowerCase()
      .replace(/\s+/g, "-");

    const styles = {
      open: "border-blue-500/20 bg-blue-500/10 text-blue-400",

      active: "border-blue-500/20 bg-blue-500/10 text-blue-400",

      waiting: "border-amber-500/20 bg-amber-500/10 text-amber-400",

      pending: "border-amber-500/20 bg-amber-500/10 text-amber-400",

      "in-progress": "border-amber-500/20 bg-amber-500/10 text-amber-400",

      escalated: "border-purple-500/20 bg-purple-500/10 text-purple-400",

      resolved: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",

      closed: "border-slate-700 bg-slate-800 text-slate-400",
    };

    return styles[normalized] || "border-slate-700 bg-slate-800 text-slate-400";
  };

  const getPriorityStyle = (priority) => {
    const normalized = String(priority || "").toLowerCase();

    const styles = {
      urgent: "text-red-400",
      high: "text-orange-400",
      medium: "text-amber-400",
      low: "text-emerald-400",
    };

    return styles[normalized] || "text-slate-400";
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-[#050b18] text-white">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-500/20 bg-blue-500/10">
            <Bot className="h-6 w-6 animate-pulse text-blue-400" />
          </div>

          <p className="mt-4 text-sm text-slate-500">Loading SupportAI...</p>
        </div>
      </div>
    );
  }

  // =========================================================
  // ERROR
  // =========================================================

  if (error) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-[#050b18] px-6 text-white">
        <div className="w-full max-w-md rounded-3xl border border-red-500/20 bg-[#0b1220] p-8 text-center shadow-2xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-400">
            <HelpCircle className="h-7 w-7" />
          </div>

          <h2 className="mt-5 text-xl font-bold">Unable to load dashboard</h2>

          <p className="mt-2 text-sm text-slate-500">{error}</p>

          <button
            type="button"
            onClick={loadDashboard}
            className="mt-6 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold transition hover:bg-blue-700"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  // =========================================================
  // DASHBOARD
  // =========================================================

  return (
    <div className="min-h-screen w-full bg-[#050b18] text-white">
      {/* ===================================================
          TOP BAR
      =================================================== */}

      <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-[#050b18]/90 backdrop-blur-xl">
        <div className="flex h-20 w-full items-center justify-between px-5 sm:px-8">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">Customer Operations</h2>

              <span className="hidden rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400 sm:inline-flex">
                ● Live
              </span>
            </div>

            <p className="mt-0.5 text-xs text-slate-600">
              Monitor your conversations, tickets and AI support
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Search */}

            <Link
              to="/support/help"
              className="hidden items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-slate-500 transition hover:border-slate-700 hover:text-white md:flex"
            >
              <Search className="h-4 w-4" />
              Search help
            </Link>

            {/* =================================================
                NOTIFICATIONS
            ================================================= */}

            <div ref={notificationRef} className="relative">
              <button
                type="button"
                onClick={() => setNotificationOpen((current) => !current)}
                className={`relative flex h-10 w-10 items-center justify-center rounded-xl border bg-slate-900 transition ${
                  notificationOpen
                    ? "border-blue-500/30 text-white"
                    : "border-slate-800 text-slate-500 hover:border-slate-700 hover:text-white"
                }`}
                aria-label="Notifications"
              >
                <Bell className="h-4 w-4" />

                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 text-[8px] font-bold text-white shadow-lg shadow-blue-600/20">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>

              {/* =================================================
                  NOTIFICATION DROPDOWN
              ================================================= */}

              {notificationOpen && (
                <div className="absolute right-0 top-12 z-50 w-[380px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-slate-800 bg-[#0a1323] shadow-2xl shadow-black/40">
                  {/* Header */}

                  <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-white">
                          Notifications
                        </h3>

                        {unreadCount > 0 && (
                          <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[9px] font-medium text-blue-400">
                            {unreadCount} new
                          </span>
                        )}
                      </div>

                      <p className="mt-0.5 text-[10px] text-slate-600">
                        Updates about your support requests
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setNotificationOpen(false)}
                      className="rounded-lg p-1.5 text-slate-600 transition hover:bg-slate-800 hover:text-white"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Notification List */}

                  <div className="max-h-[390px] overflow-y-auto">
                    {notificationLoading ? (
                      <div className="px-5 py-10 text-center">
                        <Bell className="mx-auto h-6 w-6 animate-pulse text-blue-400" />

                        <p className="mt-3 text-xs text-slate-600">
                          Loading notifications...
                        </p>
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="px-5 py-10 text-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800 text-slate-600">
                          <Bell className="h-5 w-5" />
                        </div>

                        <p className="mt-3 text-xs font-medium text-slate-400">
                          You're all caught up
                        </p>

                        <p className="mt-1 text-[10px] text-slate-700">
                          New support updates will appear here.
                        </p>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-800">
                        {notifications.map((notification) => {
                          const ticketId =
                            notification?.ticket?._id || notification?.ticket;

                          return (
                            <div
                              key={notification._id}
                              className={`px-4 py-3 transition hover:bg-slate-900/70 ${
                                !notification.isRead
                                  ? "bg-blue-500/[0.025]"
                                  : ""
                              }`}
                            >
                              <div className="flex gap-3">
                                {/* Icon */}

                                <div
                                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${getNotificationIconStyle(
                                    notification.type,
                                  )}`}
                                >
                                  {getNotificationIcon(notification.type)}
                                </div>

                                {/* Content */}

                                <div className="min-w-0 flex-1">
                                  <div className="flex items-start gap-2">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleNotificationClick(notification)
                                      }
                                      className="min-w-0 flex-1 text-left"
                                    >
                                      <div className="flex items-center gap-2">
                                        <p
                                          className={`truncate text-xs ${
                                            notification.isRead
                                              ? "font-medium text-slate-300"
                                              : "font-semibold text-white"
                                          }`}
                                        >
                                          {notification.title}
                                        </p>

                                        {!notification.isRead && (
                                          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                                        )}
                                      </div>

                                      <p className="mt-1 line-clamp-2 text-[10px] leading-4 text-slate-600">
                                        {notification.message}
                                      </p>
                                    </button>
                                  </div>

                                  <div className="mt-2 flex items-center justify-between gap-2">
                                    <span className="text-[9px] text-slate-700">
                                      {formatNotificationTime(
                                        notification.createdAt,
                                      )}
                                    </span>

                                    {ticketId && (
                                      <Link
                                        to={`/support/tickets/${ticketId}`}
                                        onClick={() =>
                                          handleNotificationClick(notification)
                                        }
                                        className="text-[9px] font-medium text-blue-400 transition hover:text-blue-300"
                                      >
                                        View ticket
                                      </Link>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Footer */}

                  {notifications.length > 0 && (
                    <div className="flex items-center justify-between border-t border-slate-800 px-4 py-3">
                      <Link
                        to="/support/notifications"
                        onClick={() => setNotificationOpen(false)}
                        className="text-[10px] font-medium text-blue-400 transition hover:text-blue-300"
                      >
                        View all
                      </Link>

                      {unreadCount > 0 && (
                        <button
                          type="button"
                          onClick={handleMarkAllAsRead}
                          className="flex items-center gap-1.5 text-[10px] font-medium text-slate-500 transition hover:text-white"
                        >
                          <CheckCheck className="h-3.5 w-3.5" />
                          Mark all as read
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* New Ticket */}

            <Link
              to="/support/tickets"
              className="hidden items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold shadow-lg shadow-blue-600/10 transition hover:bg-blue-700 sm:flex"
            >
              <Plus className="h-4 w-4" />
              New ticket
            </Link>
          </div>
        </div>
      </header>

      {/* ===================================================
          CONTENT
      =================================================== */}

      <main className="mx-auto w-full max-w-[1800px] px-5 py-6 sm:px-8 sm:py-8">
        {/* PAGE TITLE */}

        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-blue-400">
              Overview
            </p>

            <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
              Hi {user?.name?.split(" ")[0] || "there"}
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Here's what's happening with your support requests.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-600">
            <Clock3 className="h-3.5 w-3.5" />
            Last updated just now
          </div>
        </div>

        {/* =================================================
            KPI CARDS
        ================================================= */}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {/* Conversations */}

          <div className="group rounded-2xl border border-slate-800 bg-[#0a1323] p-5 transition hover:border-blue-500/20">
            <div className="flex items-start justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                <MessageSquare className="h-5 w-5" />
              </div>

              <span className="text-[10px] font-medium text-emerald-400">
                ↗ Active
              </span>
            </div>

            <p className="mt-5 text-xs text-slate-600">Active conversations</p>

            <p className="mt-1 text-2xl font-bold">
              {stats.activeChats.toLocaleString()}
            </p>

            <div className="mt-3 h-1 overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-blue-500"
                style={{
                  width: `${Math.min(
                    100,
                    Math.max(10, stats.activeChats * 10),
                  )}%`,
                }}
              />
            </div>
          </div>

          {/* AI Resolution */}

          <div className="group rounded-2xl border border-slate-800 bg-[#0a1323] p-5 transition hover:border-purple-500/20">
            <div className="flex items-start justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
                <Sparkles className="h-5 w-5" />
              </div>

              <span className="text-[10px] font-medium text-emerald-400">
                ↗ 6.4%
              </span>
            </div>

            <p className="mt-5 text-xs text-slate-600">AI resolution rate</p>

            <p className="mt-1 text-2xl font-bold">{aiResolutionRate}</p>

            <div className="mt-3 h-1 overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-purple-500"
                style={{
                  width: aiResolutionRate,
                }}
              />
            </div>
          </div>

          {/* Open Tickets */}

          <div className="group rounded-2xl border border-slate-800 bg-[#0a1323] p-5 transition hover:border-amber-500/20">
            <div className="flex items-start justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
                <Ticket className="h-5 w-5" />
              </div>

              <span className="text-[10px] font-medium text-amber-400">
                {inProgressTickets} in progress
              </span>
            </div>

            <p className="mt-5 text-xs text-slate-600">Open tickets</p>

            <p className="mt-1 text-2xl font-bold">
              {stats.openTickets.toLocaleString()}
            </p>

            <p className="mt-3 text-[10px] text-slate-600">
              Waiting for resolution
            </p>
          </div>

          {/* Resolved */}

          <div className="group rounded-2xl border border-slate-800 bg-[#0a1323] p-5 transition hover:border-emerald-500/20">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>

            <div className="mt-5">
              <p className="text-xs text-slate-600">Resolved tickets</p>

              <p className="mt-1 text-2xl font-bold">
                {stats.resolvedTickets.toLocaleString()}
              </p>

              <p className="mt-3 text-[10px] text-slate-600">
                Successfully completed
              </p>
            </div>
          </div>
        </section>

        {/* =================================================
            MAIN GRID
        ================================================= */}

        <section className="mt-5 grid gap-5 xl:grid-cols-12">
          {/* RECENT CONVERSATIONS */}

          <div className="overflow-hidden rounded-2xl border border-slate-800 bg-[#0a1323] xl:col-span-5">
            <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold">Live conversations</h3>

                  <span className="flex items-center gap-1 text-[10px] text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    {stats.activeChats} active
                  </span>
                </div>

                <p className="mt-1 text-[11px] text-slate-600">
                  Your latest support conversations
                </p>
              </div>

              <Link
                to="/support/conversations"
                className="text-slate-600 transition hover:text-white"
              >
                <MoreHorizontal className="h-5 w-5" />
              </Link>
            </div>

            {conversations.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800 text-slate-600">
                  <MessageSquare className="h-5 w-5" />
                </div>

                <h4 className="mt-4 text-sm font-medium">
                  No conversations yet
                </h4>

                <p className="mt-1 text-xs text-slate-600">
                  Start a conversation with SupportAI.
                </p>

                <Link
                  to="/support/chat"
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4" />
                  Start conversation
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-800">
                {conversations.slice(0, 4).map((conversation) => {
                  const id = getId(conversation);

                  return (
                    <Link
                      key={id}
                      to={`/support/conversations/${id}`}
                      className="block px-5 py-4 transition hover:bg-slate-900/70"
                    >
                      <div className="flex gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-blue-400">
                          {conversation?.type === "agent" ? (
                            <Headphones className="h-4 w-4" />
                          ) : (
                            <Bot className="h-4 w-4" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="truncate text-xs font-semibold">
                                  {getConversationTitle(conversation)}
                                </h4>

                                <span className="hidden rounded-full bg-blue-500/10 px-1.5 py-0.5 text-[8px] text-blue-400 sm:inline">
                                  AI
                                </span>
                              </div>

                              <p className="mt-1 line-clamp-1 text-[11px] text-slate-600">
                                {getConversationMessage(conversation)}
                              </p>
                            </div>

                            <span className="whitespace-nowrap text-[9px] text-slate-700">
                              {formatDate(
                                conversation?.lastMessageAt ||
                                  conversation?.updatedAt,
                              )}
                            </span>
                          </div>

                          <div className="mt-2 flex items-center gap-2">
                            <span
                              className={`rounded-full border px-2 py-0.5 text-[9px] ${getStatusStyle(
                                conversation?.status || "active",
                              )}`}
                            >
                              {conversation?.status || "active"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}

            <div className="border-t border-slate-800 px-5 py-3">
              <Link
                to="/support/conversations"
                className="flex items-center justify-center gap-1 text-[11px] font-medium text-blue-400 hover:text-blue-300"
              >
                View all conversations
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>

          {/* AI AGENT */}

          <div className="relative overflow-hidden rounded-2xl border border-blue-500/20 bg-gradient-to-br from-[#0b1830] to-[#091221] xl:col-span-3">
            <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-blue-500/10 blur-3xl" />

            <div className="relative p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold">SupportAI Agent</h3>

                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] text-emerald-400">
                      Active
                    </span>
                  </div>

                  <p className="mt-1 text-[10px] text-slate-600">
                    Your AI support assistant
                  </p>
                </div>

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-500/20 bg-blue-500/10">
                  <Bot className="h-6 w-6 text-blue-400" />
                </div>
              </div>

              <div className="mt-7 flex justify-center">
                <div className="relative flex h-28 w-28 items-center justify-center rounded-full border border-blue-400/20 bg-blue-500/10 shadow-2xl shadow-blue-500/10">
                  <div className="absolute inset-3 rounded-full border border-blue-400/20" />

                  <Bot className="h-12 w-12 text-blue-400" />

                  <span className="absolute bottom-1 right-3 h-3 w-3 rounded-full border-2 border-[#0b1830] bg-emerald-500" />
                </div>
              </div>

              <div className="mt-6">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-600">AI confidence</span>

                  <span className="font-semibold text-slate-300">92%</span>
                </div>

                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800">
                  <div className="h-full w-[92%] rounded-full bg-blue-500" />
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-slate-800 pt-4">
                <span className="text-[10px] text-slate-600">
                  Escalation rules
                </span>

                <span className="flex items-center gap-1.5 text-[10px] text-slate-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Automatic
                </span>
              </div>

              <Link
                to="/support/chat"
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-xs font-semibold transition hover:bg-blue-700"
              >
                <Sparkles className="h-4 w-4" />
                Talk to SupportAI
              </Link>
            </div>
          </div>

          {/* HOW AI HELPS */}

          <div className="overflow-hidden rounded-2xl border border-slate-800 bg-[#0a1323] xl:col-span-4">
            <div className="border-b border-slate-800 px-5 py-4">
              <h3 className="text-sm font-semibold">How SupportAI helps</h3>

              <p className="mt-1 text-[11px] text-slate-600">
                From your question to resolution
              </p>
            </div>

            <div className="p-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                    <MessageSquare className="h-4 w-4" />
                  </div>

                  <p className="mt-3 text-[10px] font-semibold">1. Ask</p>

                  <p className="mt-1 text-[9px] leading-4 text-slate-600">
                    Describe your issue
                  </p>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400">
                    <Sparkles className="h-4 w-4" />
                  </div>

                  <p className="mt-3 text-[10px] font-semibold">
                    2. Understand
                  </p>

                  <p className="mt-1 text-[9px] leading-4 text-slate-600">
                    AI analyzes your request
                  </p>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
                    <Zap className="h-4 w-4" />
                  </div>

                  <p className="mt-3 text-[10px] font-semibold">3. Act</p>

                  <p className="mt-1 text-[9px] leading-4 text-slate-600">
                    AI finds the solution
                  </p>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>

                  <p className="mt-3 text-[10px] font-semibold">4. Resolve</p>

                  <p className="mt-1 text-[9px] leading-4 text-slate-600">
                    Get your issue resolved
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-blue-500/10 bg-blue-500/5 p-4">
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                    <Headphones className="h-4 w-4" />
                  </div>

                  <div>
                    <p className="text-[10px] font-semibold">
                      Human escalation
                    </p>

                    <p className="mt-1 text-[9px] leading-4 text-slate-600">
                      If AI cannot resolve your issue, you can connect with a
                      support specialist.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =================================================
            SECOND ROW
        ================================================= */}

        <section className="mt-5 grid gap-5 xl:grid-cols-12">
          {/* TICKETS */}

          <div className="overflow-hidden rounded-2xl border border-slate-800 bg-[#0a1323] xl:col-span-7">
            <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold">Recent tickets</h3>

                  {urgentTickets > 0 && (
                    <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[9px] text-red-400">
                      {urgentTickets} urgent
                    </span>
                  )}
                </div>

                <p className="mt-1 text-[11px] text-slate-600">
                  Track your support requests
                </p>
              </div>

              <Link
                to="/support/tickets"
                className="flex items-center gap-1 text-[11px] font-medium text-blue-400 hover:text-blue-300"
              >
                View all
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {tickets.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <Ticket className="mx-auto h-10 w-10 text-slate-700" />

                <h4 className="mt-4 text-sm font-medium">No tickets yet</h4>

                <p className="mt-1 text-xs text-slate-600">
                  Create a ticket when you need human support.
                </p>

                <Link
                  to="/support/tickets"
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4" />
                  Create ticket
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-800">
                {tickets.slice(0, 5).map((ticket) => {
                  const ticketId = getId(ticket);

                  const status = getTicketStatus(ticket);

                  const priority = getTicketPriority(ticket);

                  return (
                    <Link
                      key={ticketId}
                      to={`/support/tickets/${ticketId}`}
                      className="flex items-center gap-4 px-5 py-4 transition hover:bg-slate-900/70"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-slate-500">
                        <Ticket className="h-4 w-4" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold">
                          {ticket?.subject || "Support ticket"}
                        </p>

                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <span className="font-mono text-[9px] text-slate-600">
                            {getTicketNumber(ticket)}
                          </span>

                          <span
                            className={`text-[9px] font-medium ${getPriorityStyle(
                              priority,
                            )}`}
                          >
                            {priority}
                          </span>

                          {ticket?.category && (
                            <span className="text-[9px] text-slate-700">
                              {ticket.category}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-3">
                        <span
                          className={`rounded-full border px-2 py-1 text-[9px] font-medium ${getStatusStyle(
                            status,
                          )}`}
                        >
                          {status}
                        </span>

                        <span className="hidden text-[9px] text-slate-700 sm:block">
                          {formatDate(ticket?.updatedAt || ticket?.createdAt)}
                        </span>

                        <ChevronRight className="h-3.5 w-3.5 text-slate-700" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* RECENT ACTIVITY */}

          <div className="overflow-hidden rounded-2xl border border-slate-800 bg-[#0a1323] xl:col-span-5">
            <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
              <div>
                <h3 className="text-sm font-semibold">Recent activity</h3>

                <p className="mt-1 text-[11px] text-slate-600">
                  Latest updates from your account
                </p>
              </div>

              <Activity className="h-4 w-4 text-slate-600" />
            </div>

            <div className="p-5">
              <div className="space-y-5">
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-medium">
                      Support system is operational
                    </p>

                    <p className="mt-1 text-[9px] text-slate-600">
                      All AI services are currently available.
                    </p>
                  </div>

                  <span className="text-[8px] text-slate-700">Now</span>
                </div>

                {tickets[0] && (
                  <div className="flex gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-blue-400">
                      <Ticket className="h-4 w-4" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11px] font-medium">
                        Ticket created
                      </p>

                      <p className="mt-1 truncate text-[9px] text-slate-600">
                        {getTicketNumber(tickets[0])} ·{" "}
                        {tickets[0]?.subject || "Support request"}
                      </p>
                    </div>

                    <span className="text-[8px] text-slate-700">
                      {formatTime(tickets[0]?.createdAt)}
                    </span>
                  </div>
                )}

                {conversations[0] && (
                  <div className="flex gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-500/10 text-purple-400">
                      <Bot className="h-4 w-4" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11px] font-medium">
                        AI conversation updated
                      </p>

                      <p className="mt-1 truncate text-[9px] text-slate-600">
                        {getConversationTitle(conversations[0])}
                      </p>
                    </div>

                    <span className="text-[8px] text-slate-700">
                      {formatTime(
                        conversations[0]?.updatedAt ||
                          conversations[0]?.lastMessageAt,
                      )}
                    </span>
                  </div>
                )}

                <div className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-amber-400">
                    <Workflow className="h-4 w-4" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-medium">
                      AI routing is enabled
                    </p>

                    <p className="mt-1 text-[9px] text-slate-600">
                      Complex requests can be escalated to support agents.
                    </p>
                  </div>

                  <span className="text-[8px] text-slate-700">Active</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =================================================
            KNOWLEDGE + SUPPORT
        ================================================= */}

        <section className="mt-5 grid gap-5 xl:grid-cols-12">
          {/* Knowledge Base */}

          <div className="rounded-2xl border border-slate-800 bg-[#0a1323] xl:col-span-8">
            <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
              <div>
                <h3 className="text-sm font-semibold">Knowledge base</h3>

                <p className="mt-1 text-[11px] text-slate-600">
                  Find answers before opening a ticket
                </p>
              </div>

              <Link
                to="/support/help"
                className="text-slate-600 hover:text-white"
              >
                <Search className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid gap-3 p-5 sm:grid-cols-3">
              <Link
                to="/support/help?search=password"
                className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 transition hover:border-blue-500/20 hover:bg-slate-900"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                  <User className="h-4 w-4" />
                </div>

                <h4 className="mt-4 text-xs font-semibold">
                  Account & Security
                </h4>

                <p className="mt-1 text-[9px] leading-4 text-slate-600">
                  Passwords, profiles and account access.
                </p>

                <span className="mt-3 flex items-center gap-1 text-[9px] text-blue-400">
                  Explore
                  <ArrowRight className="h-3 w-3" />
                </span>
              </Link>

              <Link
                to="/support/help?search=billing"
                className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 transition hover:border-purple-500/20 hover:bg-slate-900"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400">
                  <FileQuestion className="h-4 w-4" />
                </div>

                <h4 className="mt-4 text-xs font-semibold">
                  Billing & Payments
                </h4>

                <p className="mt-1 text-[9px] leading-4 text-slate-600">
                  Invoices, subscriptions and payments.
                </p>

                <span className="mt-3 flex items-center gap-1 text-[9px] text-purple-400">
                  Explore
                  <ArrowRight className="h-3 w-3" />
                </span>
              </Link>

              <Link
                to="/support/help"
                className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 transition hover:border-emerald-500/20 hover:bg-slate-900"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                  <BookOpen className="h-4 w-4" />
                </div>

                <h4 className="mt-4 text-xs font-semibold">
                  Guides & Tutorials
                </h4>

                <p className="mt-1 text-[9px] leading-4 text-slate-600">
                  Step-by-step solutions and guides.
                </p>

                <span className="mt-3 flex items-center gap-1 text-[9px] text-emerald-400">
                  Explore
                  <ArrowRight className="h-3 w-3" />
                </span>
              </Link>
            </div>
          </div>

          {/* Support Card */}

          <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-emerald-500/5 xl:col-span-4">
            <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-emerald-500/10 blur-3xl" />

            <div className="relative p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                  <LifeBuoy className="h-5 w-5" />
                </div>

                <div>
                  <h3 className="text-sm font-semibold">Need human help?</h3>

                  <p className="mt-1 text-[10px] leading-5 text-slate-600">
                    Our support team can help when AI cannot resolve your issue.
                  </p>
                </div>
              </div>

              <Link
                to="/support/chat?escalate=true"
                className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-xs font-semibold transition hover:bg-emerald-700"
              >
                <Headphones className="h-4 w-4" />
                Contact support
              </Link>

              <div className="mt-4 flex items-center justify-center gap-2 text-[9px] text-slate-600">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Support team available
              </div>
            </div>
          </div>
        </section>

        {/* =================================================
            FOOTER METRICS
        ================================================= */}

        <section className="mt-5 grid gap-4 pb-8 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-[#0a1323] p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                <MessageSquare className="h-4 w-4" />
              </div>

              <div>
                <p className="text-[10px] text-slate-600">
                  Total conversations
                </p>

                <p className="mt-0.5 text-lg font-bold">
                  {stats.totalConversations}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-[#0a1323] p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400">
                <Ticket className="h-4 w-4" />
              </div>

              <div>
                <p className="text-[10px] text-slate-600">Total tickets</p>

                <p className="mt-0.5 text-lg font-bold">{stats.totalTickets}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-[#0a1323] p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
              </div>

              <div>
                <p className="text-[10px] text-slate-600">Resolution status</p>

                <p className="mt-0.5 text-lg font-bold text-emerald-400">
                  {stats.resolvedTickets > 0 ? "Healthy" : "Ready"}
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
