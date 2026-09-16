import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Mail,
  ShieldCheck,
  CalendarDays,
  Ticket,
  MessageSquare,
  Edit,
  UserCheck,
  UserX,
  Phone,
  Building2,
  Clock3,
  Globe2,
  Languages,
  Bot,
  Bell,
  RefreshCw,
  AlertTriangle,
  X,
  CheckCircle2,
  CircleDot,
  Clock,
  UserRound,
  Star,
  Activity,
  PlusCircle,
  ArrowRight,
  RotateCcw,
  ExternalLink,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import {
  getAdminUser,
  getAdminUserTicketStats,
  getAdminCustomerTickets,
  getAdminCustomerActivity,
  updateAdminUserStatus,
} from "../../../services/adminUserService";

const API_SERVER = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

// ============================================================
// HELPERS
// ============================================================

const getAvatarUrl = (avatar) => {
  if (!avatar) return null;

  if (avatar.startsWith("http://") || avatar.startsWith("https://")) {
    return avatar;
  }

  const baseUrl = API_SERVER.replace("/api", "");

  return `${baseUrl}${avatar.startsWith("/") ? "" : "/"}${avatar}`;
};

const formatDate = (date) => {
  if (!date) return "—";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "—";
  }

  return parsed.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatDateTime = (date) => {
  if (!date) return "—";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "—";
  }

  return parsed.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const getRelativeTime = (date) => {
  if (!date) return "";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  const diff = Date.now() - parsed.getTime();

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return formatDate(date);
};

// ============================================================
// STYLE HELPERS
// ============================================================

const roleStyles = {
  customer: {
    badge: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    label: "Customer",
  },
  agent: {
    badge: "bg-violet-500/10 text-violet-400 border-violet-500/20",
    label: "Agent",
  },
  admin: {
    badge: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    label: "Administrator",
  },
};

const statusStyles = {
  active: {
    badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    dot: "bg-emerald-400",
    label: "Active",
  },
  inactive: {
    badge: "bg-slate-500/10 text-slate-400 border-slate-500/20",
    dot: "bg-slate-400",
    label: "Inactive",
  },
  suspended: {
    badge: "bg-red-500/10 text-red-400 border-red-500/20",
    dot: "bg-red-400",
    label: "Suspended",
  },
};

const ticketStatusStyles = {
  open: {
    badge: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    label: "Open",
    icon: CircleDot,
  },
  pending: {
    badge: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    label: "Pending",
    icon: Clock,
  },
  "in-progress": {
    badge: "bg-violet-500/10 text-violet-400 border-violet-500/20",
    label: "In Progress",
    icon: Activity,
  },
  waiting: {
    badge: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    label: "Waiting",
    icon: Clock3,
  },
  resolved: {
    badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    label: "Resolved",
    icon: CheckCircle2,
  },
  closed: {
    badge: "bg-slate-500/10 text-slate-400 border-slate-500/20",
    label: "Closed",
    icon: CheckCircle2,
  },
};

const priorityStyles = {
  low: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  medium: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  high: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  urgent: "bg-red-500/10 text-red-400 border-red-500/20",
};

// ============================================================
// COMPONENT
// ============================================================

const UserDetails = () => {
  const navigate = useNavigate();
  const { userId } = useParams();

  // ==========================================================
  // USER STATE
  // ==========================================================

  const [user, setUser] = useState(null);

  const [ticketStats, setTicketStats] = useState({
    totalTickets: 0,
    openTickets: 0,
    inProgressTickets: 0,
    waitingTickets: 0,
    resolvedTickets: 0,
    closedTickets: 0,
    escalatedTickets: 0,
  });

  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState("");

  // ==========================================================
  // CUSTOMER MANAGEMENT STATE
  // ==========================================================

  const [customerTickets, setCustomerTickets] = useState([]);
  const [customerActivity, setCustomerActivity] = useState([]);

  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [activityLoading, setActivityLoading] = useState(false);

  const [ticketPage, setTicketPage] = useState(1);
  const [ticketPagination, setTicketPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1,
  });

  // ==========================================================
  // ACTION STATE
  // ==========================================================

  const [actionLoading, setActionLoading] = useState(false);

  const [statusModal, setStatusModal] = useState({
    open: false,
    status: "",
  });

  // ==========================================================
  // FETCH USER
  // ==========================================================

  const fetchUser = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError("");

      const response = await getAdminUser(userId);

      setUser(response?.user || response?.data || response);
    } catch (err) {
      console.error("Failed to fetch user:", err);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load user details.",
      );
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // ==========================================================
  // FETCH TICKET STATS
  // ==========================================================

  const fetchTicketStats = useCallback(async () => {
    if (!userId) return;

    try {
      setStatsLoading(true);

      const response = await getAdminUserTicketStats(userId);

      setTicketStats(
        response?.stats ||
          response?.ticketStats ||
          response?.data ||
          response || {
            totalTickets: 0,
            openTickets: 0,
            inProgressTickets: 0,
            waitingTickets: 0,
            resolvedTickets: 0,
            closedTickets: 0,
            escalatedTickets: 0,
          },
      );
    } catch (err) {
      console.error("Failed to fetch ticket stats:", err);
    } finally {
      setStatsLoading(false);
    }
  }, [userId]);

  // ==========================================================
  // FETCH CUSTOMER TICKETS
  // ==========================================================

  const fetchCustomerTickets = useCallback(async () => {
    if (!userId || user?.role !== "customer") return;

    try {
      setTicketsLoading(true);

      const response = await getAdminCustomerTickets(userId, {
        page: ticketPage,
        limit: 10,
      });

      setCustomerTickets(
        response?.tickets || response?.data || response?.results || [],
      );

      if (response?.pagination) {
        setTicketPagination({
          page: Number(response.pagination.page) || ticketPage,
          limit: Number(response.pagination.limit) || 10,
          total: Number(response.pagination.total) || 0,
          pages:
            Number(response.pagination.pages) ||
            Number(response.pagination.totalPages) ||
            1,
        });
      } else {
        setTicketPagination((prev) => ({
          ...prev,
          page: ticketPage,
          total: response?.total || prev.total,
          pages: response?.pages || prev.pages,
        }));
      }
    } catch (err) {
      console.error("Failed to fetch customer tickets:", err);

      setCustomerTickets([]);
    } finally {
      setTicketsLoading(false);
    }
  }, [userId, user?.role, ticketPage]);

  // ==========================================================
  // FETCH CUSTOMER ACTIVITY
  // ==========================================================

  const fetchCustomerActivity = useCallback(async () => {
    if (!userId || user?.role !== "customer") return;

    try {
      setActivityLoading(true);

      const response = await getAdminCustomerActivity(userId, {
        limit: 30,
      });

      setCustomerActivity(response?.activities || response?.data || []);
    } catch (err) {
      console.error("Failed to fetch customer activity:", err);

      setCustomerActivity([]);
    } finally {
      setActivityLoading(false);
    }
  }, [userId, user?.role]);

  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {
    fetchUser();
    fetchTicketStats();
  }, [fetchUser, fetchTicketStats]);

  // ==========================================================
  // CUSTOMER DATA LOAD
  // ==========================================================

  useEffect(() => {
    if (user?.role !== "customer") return;

    fetchCustomerTickets();
    fetchCustomerActivity();
  }, [user?.role, fetchCustomerTickets, fetchCustomerActivity]);

  // ==========================================================
  // STATUS UPDATE
  // ==========================================================

  const handleStatusChange = async () => {
    if (!statusModal.status || !userId) return;

    try {
      setActionLoading(true);

      await updateAdminUserStatus(userId, statusModal.status);

      setUser((prev) => ({
        ...prev,
        status: statusModal.status,
      }));

      setStatusModal({
        open: false,
        status: "",
      });
    } catch (err) {
      console.error("Failed to update status:", err);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to update user status.",
      );
    } finally {
      setActionLoading(false);
    }
  };

  // ==========================================================
  // REFRESH
  // ==========================================================

  const handleRefresh = async () => {
    await Promise.all([
      fetchUser(),
      fetchTicketStats(),
      user?.role === "customer" ? fetchCustomerTickets() : Promise.resolve(),
      user?.role === "customer" ? fetchCustomerActivity() : Promise.resolve(),
    ]);
  };

  // ==========================================================
  // RESOLUTION RATE
  // ==========================================================

  const resolutionRate = useMemo(() => {
    const total = Number(ticketStats.totalTickets) || 0;

    const resolved = Number(ticketStats.resolvedTickets) || 0;

    if (!total) return 0;

    return Math.round((resolved / total) * 100);
  }, [ticketStats]);

  // ==========================================================
  // CUSTOMER RATING
  // ==========================================================

  const getTicketRating = (ticket) => {
    return ticket?.satisfaction?.rating ?? ticket?.customerRating ?? null;
  };

  // ==========================================================
  // TICKET STATUS
  // ==========================================================

  const getTicketStatus = (status) => {
    return (
      ticketStatusStyles[status] || {
        badge: "bg-slate-500/10 text-slate-400 border-slate-500/20",
        label: status || "Unknown",
        icon: CircleDot,
      }
    );
  };

  // ==========================================================
  // ACTIVITY ICON
  // ==========================================================

  const getActivityIcon = (activity) => {
    const type = activity?.type || activity?.action || activity?.event || "";

    const normalized = String(type).toLowerCase();

    if (
      normalized.includes("created") ||
      normalized.includes("ticket_created")
    ) {
      return PlusCircle;
    }

    if (normalized.includes("status") || normalized.includes("changed")) {
      return ArrowRight;
    }

    if (normalized.includes("rating") || normalized.includes("feedback")) {
      return Star;
    }

    if (normalized.includes("reply") || normalized.includes("message")) {
      return MessageSquare;
    }

    if (normalized.includes("resolved")) {
      return CheckCircle2;
    }

    if (normalized.includes("reopened")) {
      return RotateCcw;
    }

    return Activity;
  };

  // ==========================================================
  // ACTIVITY TITLE
  // ==========================================================

  const getActivityTitle = (activity) => {
    if (activity?.title) return activity.title;

    const type = activity?.type || activity?.action || activity?.event || "";

    const normalized = String(type).toLowerCase();

    if (normalized.includes("ticket_created")) {
      return "Created a ticket";
    }

    if (normalized.includes("status_changed")) {
      return "Ticket status changed";
    }

    if (normalized.includes("rating")) {
      return "Submitted a ticket rating";
    }

    if (normalized.includes("reply")) {
      return "Replied to a ticket";
    }

    if (normalized.includes("resolved")) {
      return "Ticket resolved";
    }

    if (normalized.includes("reopened")) {
      return "Ticket reopened";
    }

    return activity?.description || "Customer activity";
  };

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050b18] text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
          <p className="text-sm text-slate-400">Loading user details...</p>
        </div>
      </div>
    );
  }

  // ==========================================================
  // USER NOT FOUND
  // ==========================================================

  if (!user) {
    return (
      <div className="min-h-screen bg-[#050b18] text-white p-6">
        <button
          onClick={() => navigate("/admin/users")}
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Users
        </button>

        <div className="mt-10 rounded-xl border border-red-500/20 bg-red-500/5 p-6 text-center">
          <AlertTriangle className="w-8 h-8 mx-auto mb-3 text-red-400" />
          <h2 className="text-lg font-semibold">User not found</h2>
          <p className="mt-2 text-sm text-slate-400">
            The requested user could not be found.
          </p>
        </div>
      </div>
    );
  }

  const role = roleStyles[user.role] || roleStyles.customer;

  const status = statusStyles[user.status] || statusStyles.inactive;

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="min-h-screen bg-[#050b18] text-white p-4 md:p-6">
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* ======================================================
            TOP BAR
        ====================================================== */}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <button
            onClick={() => navigate("/admin/users")}
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition w-fit"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Users
          </button>

          <button
            onClick={handleRefresh}
            disabled={
              loading || statsLoading || ticketsLoading || activityLoading
            }
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-slate-700 bg-[#0a1222] text-sm text-slate-300 hover:text-white hover:border-slate-600 transition disabled:opacity-50"
          >
            <RefreshCw
              className={`w-4 h-4 ${
                loading || statsLoading || ticketsLoading || activityLoading
                  ? "animate-spin"
                  : ""
              }`}
            />
            Refresh
          </button>
        </div>

        {/* ======================================================
            ERROR
        ====================================================== */}

        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3">
            <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5" />

            <div className="flex-1">
              <p className="text-sm text-red-300">{error}</p>
            </div>

            <button
              onClick={() => setError("")}
              className="text-slate-500 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ======================================================
            USER HEADER
        ====================================================== */}

        <div className="rounded-2xl border border-slate-800 bg-[#0a1222] p-5 md:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-4 min-w-0">
              {user.avatar ? (
                <img
                  src={getAvatarUrl(user.avatar)}
                  alt={user.name || "User"}
                  className="w-20 h-20 rounded-2xl object-cover border border-slate-700"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-2xl font-bold text-slate-300">
                  {user.name?.charAt(0)?.toUpperCase() || "U"}
                </div>
              )}

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold truncate">
                    {user.name || "Unnamed User"}
                  </h1>

                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-medium border ${role.badge}`}
                  >
                    {role.label}
                  </span>

                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${status.badge}`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${status.dot}`}
                    />
                    {status.label}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-slate-400">
                  <span className="inline-flex items-center gap-1.5">
                    <Mail className="w-4 h-4" />
                    {user.email || "No email"}
                  </span>

                  {user.phone && (
                    <span className="inline-flex items-center gap-1.5">
                      <Phone className="w-4 h-4" />
                      {user.phone}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => navigate(`/admin/users/${user._id}/edit`)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-sm font-medium transition"
              >
                <Edit className="w-4 h-4" />
                Edit User
              </button>

              <button
                onClick={() =>
                  setStatusModal({
                    open: true,
                    status: user.status,
                  })
                }
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-700 bg-slate-800/60 hover:bg-slate-700 text-sm font-medium transition"
              >
                {user.status === "active" ? (
                  <UserX className="w-4 h-4" />
                ) : (
                  <UserCheck className="w-4 h-4" />
                )}
                Change Status
              </button>
            </div>
          </div>
        </div>

        {/* ======================================================
            CUSTOMER PROFILE SUMMARY
        ====================================================== */}

        {user.role === "customer" && (
          <div className="rounded-2xl border border-blue-500/10 bg-gradient-to-r from-blue-500/5 to-violet-500/5 p-5">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <UserRound className="w-5 h-5 text-blue-400" />
              </div>

              <div>
                <h2 className="font-semibold">Customer Profile</h2>

                <p className="text-xs text-slate-500">
                  Customer information, support history and activity
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-slate-500">Customer Since</p>
                <p className="mt-1 text-sm text-slate-200">
                  {formatDate(user.createdAt)}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-500">Last Active</p>
                <p className="mt-1 text-sm text-slate-200">
                  {formatRelativeOrDate(user.lastSeen)}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-500">Company</p>
                <p className="mt-1 text-sm text-slate-200">
                  {user.company || "Individual"}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-500">Preferred Channel</p>
                <p className="mt-1 text-sm text-slate-200 capitalize">
                  {user.preferences?.preferredChannel ||
                    user.preferredChannel ||
                    "Chat"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================
            METRICS
        ====================================================== */}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <MetricCard
            title="Total Tickets"
            value={ticketStats.totalTickets}
            icon={Ticket}
            iconClass="text-blue-400"
            loading={statsLoading}
          />

          <MetricCard
            title="Resolved Tickets"
            value={ticketStats.resolvedTickets}
            icon={CheckCircle2}
            iconClass="text-emerald-400"
            loading={statsLoading}
          />

          <MetricCard
            title="Resolution Rate"
            value={`${resolutionRate}%`}
            icon={Activity}
            iconClass="text-violet-400"
            loading={statsLoading}
          />
        </div>

        {/* ======================================================
            TICKET OVERVIEW
        ====================================================== */}

        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold">Ticket Overview</h2>
              <p className="text-sm text-slate-500 mt-1">
                Current support workload
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <OverviewCard
              label="Open"
              value={ticketStats.openTickets}
              className="text-blue-400"
            />

            <OverviewCard
              label="In Progress"
              value={ticketStats.inProgressTickets}
              className="text-violet-400"
            />

            <OverviewCard
              label="Waiting"
              value={ticketStats.waitingTickets}
              className="text-orange-400"
            />

            <OverviewCard
              label="Resolved"
              value={ticketStats.resolvedTickets}
              className="text-emerald-400"
            />

            <OverviewCard
              label="Closed"
              value={ticketStats.closedTickets}
              className="text-slate-300"
            />

            <OverviewCard
              label="Escalated"
              value={ticketStats.escalatedTickets}
              className="text-red-400"
            />
          </div>
        </div>

        {/* ======================================================
            CUSTOMER TICKET HISTORY
        ====================================================== */}

        {user.role === "customer" && (
          <div className="rounded-2xl border border-slate-800 bg-[#0a1222] overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Ticket className="w-5 h-5 text-blue-400" />
                  <h2 className="text-lg font-semibold">Ticket History</h2>
                </div>

                <p className="text-sm text-slate-500 mt-1">
                  Complete history of tickets created by this customer
                </p>
              </div>

              <span className="text-xs text-slate-500">
                {ticketPagination.total} total tickets
              </span>
            </div>

            {ticketsLoading ? (
              <div className="py-14 flex flex-col items-center justify-center">
                <Loader2 className="w-7 h-7 text-blue-400 animate-spin" />
                <p className="text-sm text-slate-500 mt-3">
                  Loading ticket history...
                </p>
              </div>
            ) : customerTickets.length === 0 ? (
              <div className="py-14 text-center">
                <Ticket className="w-10 h-10 mx-auto text-slate-700" />

                <h3 className="mt-3 text-sm font-medium text-slate-300">
                  No tickets found
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  This customer has not created any support tickets yet.
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[950px]">
                    <thead>
                      <tr className="border-b border-slate-800 text-left">
                        <th className="px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Ticket
                        </th>

                        <th className="px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Subject
                        </th>

                        <th className="px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Status
                        </th>

                        <th className="px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Priority
                        </th>

                        <th className="px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Assigned Agent
                        </th>

                        <th className="px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Rating
                        </th>

                        <th className="px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Created
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-800/80">
                      {customerTickets.map((ticket) => {
                        const ticketStatus = getTicketStatus(ticket.status);

                        const StatusIcon = ticketStatus.icon;

                        const rating = getTicketRating(ticket);

                        return (
                          <tr
                            key={ticket._id}
                            onClick={() =>
                              navigate(`/admin/tickets/${ticket._id}`)
                            }
                            className="hover:bg-slate-800/30 cursor-pointer transition group"
                          >
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs text-blue-400">
                                  {ticket.ticketNumber ||
                                    ticket._id?.slice(-8) ||
                                    "—"}
                                </span>

                                <ExternalLink className="w-3 h-3 text-slate-700 group-hover:text-blue-400 transition" />
                              </div>
                            </td>

                            <td className="px-5 py-4 max-w-[260px]">
                              <p className="text-sm font-medium text-slate-200 truncate">
                                {ticket.subject || "Untitled Ticket"}
                              </p>

                              {ticket.category && (
                                <p className="text-xs text-slate-500 mt-1">
                                  {ticket.category}
                                </p>
                              )}
                            </td>

                            <td className="px-5 py-4">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${ticketStatus.badge}`}
                              >
                                <StatusIcon className="w-3 h-3" />
                                {ticketStatus.label}
                              </span>
                            </td>

                            <td className="px-5 py-4">
                              <span
                                className={`inline-flex px-2.5 py-1 rounded-full border text-xs font-medium capitalize ${
                                  priorityStyles[ticket.priority] ||
                                  priorityStyles.medium
                                }`}
                              >
                                {ticket.priority || "medium"}
                              </span>
                            </td>

                            <td className="px-5 py-4">
                              {ticket.assignedAgent ? (
                                <div className="flex items-center gap-2">
                                  {ticket.assignedAgent.avatar ? (
                                    <img
                                      src={getAvatarUrl(
                                        ticket.assignedAgent.avatar,
                                      )}
                                      alt={ticket.assignedAgent.name || "Agent"}
                                      className="w-7 h-7 rounded-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-7 h-7 rounded-full bg-violet-500/10 flex items-center justify-center text-xs text-violet-400">
                                      {ticket.assignedAgent.name
                                        ?.charAt(0)
                                        ?.toUpperCase() || "A"}
                                    </div>
                                  )}

                                  <div className="min-w-0">
                                    <p className="text-xs text-slate-300 truncate max-w-[130px]">
                                      {ticket.assignedAgent.name || "Agent"}
                                    </p>

                                    <p className="text-[11px] text-slate-600 truncate max-w-[130px]">
                                      {ticket.assignedAgent.email || ""}
                                    </p>
                                  </div>
                                </div>
                              ) : (
                                <span className="text-xs text-slate-600">
                                  Unassigned
                                </span>
                              )}
                            </td>

                            <td className="px-5 py-4">
                              {rating ? (
                                <div className="flex items-center gap-1">
                                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                                  <span className="text-sm text-slate-300">
                                    {rating}/5
                                  </span>
                                </div>
                              ) : (
                                <span className="text-xs text-slate-600">
                                  Not rated
                                </span>
                              )}
                            </td>

                            <td className="px-5 py-4">
                              <div>
                                <p className="text-xs text-slate-300">
                                  {formatDate(ticket.createdAt)}
                                </p>

                                <p className="text-[11px] text-slate-600 mt-1">
                                  {getRelativeTime(ticket.createdAt)}
                                </p>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* PAGINATION */}

                {ticketPagination.pages > 1 && (
                  <div className="px-5 py-4 border-t border-slate-800 flex items-center justify-between">
                    <p className="text-xs text-slate-500">
                      Page {ticketPagination.page} of {ticketPagination.pages}
                    </p>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          setTicketPage((prev) => Math.max(1, prev - 1))
                        }
                        disabled={ticketPage <= 1}
                        className="p-2 rounded-lg border border-slate-700 bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() =>
                          setTicketPage((prev) =>
                            Math.min(ticketPagination.pages, prev + 1),
                          )
                        }
                        disabled={ticketPage >= ticketPagination.pages}
                        className="p-2 rounded-lg border border-slate-700 bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ======================================================
            MAIN CONTENT
        ====================================================== */}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* ====================================================
              PROFILE INFORMATION
          ==================================================== */}

          <div className="xl:col-span-2 rounded-2xl border border-slate-800 bg-[#0a1222] p-5">
            <div className="flex items-center gap-2 mb-5">
              <UserRound className="w-5 h-5 text-blue-400" />

              <div>
                <h2 className="font-semibold">Profile Information</h2>

                <p className="text-xs text-slate-500 mt-1">
                  Personal and contact information
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <InfoItem icon={Mail} label="Email Address" value={user.email} />

              <InfoItem icon={Phone} label="Phone Number" value={user.phone} />

              <InfoItem icon={Building2} label="Company" value={user.company} />

              <InfoItem
                icon={Globe2}
                label="Timezone"
                value={user.timezone || user.preferences?.timezone}
              />

              <InfoItem
                icon={Languages}
                label="Language"
                value={user.language || user.preferences?.language}
              />

              <InfoItem
                icon={Clock3}
                label="Last Seen"
                value={formatDateTime(user.lastSeen)}
              />
            </div>
          </div>

          {/* ====================================================
              ACCOUNT INFORMATION
          ==================================================== */}

          <div className="rounded-2xl border border-slate-800 bg-[#0a1222] p-5">
            <div className="flex items-center gap-2 mb-5">
              <ShieldCheck className="w-5 h-5 text-violet-400" />

              <div>
                <h2 className="font-semibold">Account Information</h2>

                <p className="text-xs text-slate-500 mt-1">Account metadata</p>
              </div>
            </div>

            <div className="space-y-4">
              <InfoItem icon={ShieldCheck} label="Role" value={role.label} />

              <InfoItem
                icon={CircleDot}
                label="Account Status"
                value={status.label}
              />

              <InfoItem
                icon={CalendarDays}
                label="Joined"
                value={formatDate(user.createdAt)}
              />

              <InfoItem
                icon={Clock3}
                label="Last Updated"
                value={formatDateTime(user.updatedAt)}
              />

              <div>
                <p className="text-xs text-slate-500 mb-1">User ID</p>

                <p className="font-mono text-xs text-slate-400 break-all">
                  {user._id}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ======================================================
            CUSTOMER ACTIVITY TIMELINE
        ====================================================== */}

        {user.role === "customer" && (
          <div className="rounded-2xl border border-slate-800 bg-[#0a1222]">
            <div className="px-5 py-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-violet-400" />

                <div>
                  <h2 className="text-lg font-semibold">Customer Activity</h2>

                  <p className="text-sm text-slate-500 mt-1">
                    Recent customer interactions and ticket activity
                  </p>
                </div>
              </div>
            </div>

            {activityLoading ? (
              <div className="py-14 flex flex-col items-center justify-center">
                <Loader2 className="w-7 h-7 text-violet-400 animate-spin" />

                <p className="text-sm text-slate-500 mt-3">
                  Loading activity...
                </p>
              </div>
            ) : customerActivity.length === 0 ? (
              <div className="py-14 text-center">
                <Activity className="w-10 h-10 mx-auto text-slate-700" />

                <h3 className="mt-3 text-sm font-medium text-slate-300">
                  No activity yet
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  Customer activity will appear here.
                </p>
              </div>
            ) : (
              <div className="p-5">
                <div className="relative">
                  <div className="absolute left-5 top-3 bottom-3 w-px bg-slate-800" />

                  <div className="space-y-7">
                    {customerActivity.map((activity, index) => {
                      const ActivityIcon = getActivityIcon(activity);

                      const activityDate =
                        activity.createdAt ||
                        activity.timestamp ||
                        activity.date;

                      return (
                        <div
                          key={activity._id || `${activityDate}-${index}`}
                          className="relative flex gap-4"
                        >
                          <div className="relative z-10 w-10 h-10 shrink-0 rounded-full bg-[#0a1222] border border-slate-700 flex items-center justify-center">
                            <ActivityIcon className="w-4 h-4 text-violet-400" />
                          </div>

                          <div className="min-w-0 flex-1 pt-1">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                              <h3 className="text-sm font-medium text-slate-200">
                                {getActivityTitle(activity)}
                              </h3>

                              <span className="text-xs text-slate-600">
                                {getRelativeTime(activityDate)}
                              </span>
                            </div>

                            {activity.description && (
                              <p className="text-sm text-slate-500 mt-1">
                                {activity.description}
                              </p>
                            )}

                            {activity.ticketNumber && (
                              <button
                                onClick={() =>
                                  activity.ticketId &&
                                  navigate(
                                    `/admin/tickets/${activity.ticketId}`,
                                  )
                                }
                                className="inline-flex items-center gap-1.5 mt-2 text-xs text-blue-400 hover:text-blue-300 transition"
                              >
                                <Ticket className="w-3.5 h-3.5" />
                                {activity.ticketNumber}
                              </button>
                            )}

                            {activity.oldStatus && activity.newStatus && (
                              <div className="flex items-center gap-2 mt-2">
                                <span className="text-xs text-slate-500 capitalize">
                                  {activity.oldStatus}
                                </span>

                                <ArrowRight className="w-3 h-3 text-slate-700" />

                                <span className="text-xs text-slate-300 capitalize">
                                  {activity.newStatus}
                                </span>
                              </div>
                            )}

                            {activity.rating && (
                              <div className="flex items-center gap-1 mt-2">
                                {Array.from({
                                  length: 5,
                                }).map((_, starIndex) => (
                                  <Star
                                    key={starIndex}
                                    className={`w-3.5 h-3.5 ${
                                      starIndex < activity.rating
                                        ? "text-amber-400 fill-amber-400"
                                        : "text-slate-700"
                                    }`}
                                  />
                                ))}

                                <span className="ml-1 text-xs text-slate-500">
                                  {activity.rating}/5
                                </span>
                              </div>
                            )}

                            {activity.feedback && (
                              <div className="mt-2 rounded-lg border border-slate-800 bg-slate-900/30 p-3">
                                <p className="text-xs text-slate-500">
                                  Customer feedback
                                </p>

                                <p className="text-sm text-slate-400 mt-1">
                                  “{activity.feedback}”
                                </p>
                              </div>
                            )}

                            <p className="text-[11px] text-slate-700 mt-2">
                              {formatDateTime(activityDate)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======================================================
            PREFERENCES
        ====================================================== */}

        <div className="rounded-2xl border border-slate-800 bg-[#0a1222] p-5">
          <div className="flex items-center gap-2 mb-5">
            <Bell className="w-5 h-5 text-blue-400" />

            <div>
              <h2 className="font-semibold">Preferences</h2>

              <p className="text-xs text-slate-500 mt-1">
                Communication and support preferences
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <PreferenceItem
              icon={Globe2}
              label="Timezone"
              value={
                user.timezone || user.preferences?.timezone || "Asia/Karachi"
              }
            />

            <PreferenceItem
              icon={Languages}
              label="Language"
              value={user.language || user.preferences?.language || "English"}
            />

            <PreferenceItem
              icon={MessageSquare}
              label="Preferred Channel"
              value={
                user.preferredChannel ||
                user.preferences?.preferredChannel ||
                "Chat"
              }
            />

            <PreferenceItem
              icon={Bot}
              label="AI Support"
              value={
                user.aiSupportEnabled === false ||
                user.preferences?.aiSupportEnabled === false
                  ? "Disabled"
                  : "Enabled"
              }
            />

            <PreferenceItem
              icon={Bell}
              label="Email Notifications"
              value={
                user.emailNotifications === false ||
                user.preferences?.emailNotifications === false
                  ? "Disabled"
                  : "Enabled"
              }
            />
          </div>
        </div>

        {/* ======================================================
            AGENT AVAILABILITY
        ====================================================== */}

        {user.role === "agent" && (
          <div className="rounded-2xl border border-slate-800 bg-[#0a1222] p-5">
            <div className="flex items-center gap-2 mb-5">
              <UserCheck className="w-5 h-5 text-violet-400" />

              <div>
                <h2 className="font-semibold">Agent Availability</h2>

                <p className="text-xs text-slate-500 mt-1">
                  Current agent availability information
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InfoItem
                icon={CircleDot}
                label="Availability"
                value={
                  user.availability || user.agentAvailability || "Not specified"
                }
              />

              <InfoItem
                icon={Clock3}
                label="Last Seen"
                value={formatDateTime(user.lastSeen)}
              />

              <InfoItem
                icon={Ticket}
                label="Assigned Tickets"
                value={ticketStats.totalTickets}
              />
            </div>
          </div>
        )}
      </div>

      {/* ========================================================
          STATUS MODAL
      ======================================================== */}

      {statusModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() =>
              !actionLoading &&
              setStatusModal({
                open: false,
                status: "",
              })
            }
          />

          <div className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-[#0a1222] shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
              <div>
                <h2 className="font-semibold">Change User Status</h2>

                <p className="text-xs text-slate-500 mt-1">
                  Update the account status for this user.
                </p>
              </div>

              <button
                onClick={() =>
                  !actionLoading &&
                  setStatusModal({
                    open: false,
                    status: "",
                  })
                }
                className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3">
              {[
                {
                  value: "active",
                  label: "Active",
                  description: "User can access the platform normally.",
                },
                {
                  value: "inactive",
                  label: "Inactive",
                  description: "User account is temporarily inactive.",
                },
                {
                  value: "suspended",
                  label: "Suspended",
                  description: "Restrict the user's account access.",
                },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() =>
                    setStatusModal((prev) => ({
                      ...prev,
                      status: option.value,
                    }))
                  }
                  className={`w-full text-left rounded-xl border p-4 transition ${
                    statusModal.status === option.value
                      ? "border-blue-500/50 bg-blue-500/5"
                      : "border-slate-800 bg-slate-900/30 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        option.value === "active"
                          ? "bg-emerald-400"
                          : option.value === "inactive"
                            ? "bg-slate-400"
                            : "bg-red-400"
                      }`}
                    />

                    <div>
                      <p className="text-sm font-medium text-slate-200">
                        {option.label}
                      </p>

                      <p className="text-xs text-slate-500 mt-1">
                        {option.description}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex justify-end gap-2 px-5 py-4 border-t border-slate-800">
              <button
                onClick={() =>
                  setStatusModal({
                    open: false,
                    status: "",
                  })
                }
                disabled={actionLoading}
                className="px-4 py-2 rounded-lg border border-slate-700 text-sm text-slate-300 hover:text-white hover:bg-slate-800 transition"
              >
                Cancel
              </button>

              <button
                onClick={handleStatusChange}
                disabled={actionLoading || !statusModal.status}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition"
              >
                {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Update Status
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================
// METRIC CARD
// ============================================================

const MetricCard = ({ title, value, icon: Icon, iconClass, loading }) => {
  return (
    <div className="rounded-2xl border border-slate-800 bg-[#0a1222] p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider">
            {title}
          </p>

          {loading ? (
            <div className="w-12 h-8 mt-2 rounded bg-slate-800 animate-pulse" />
          ) : (
            <p className="text-2xl font-bold mt-2 text-white">{value}</p>
          )}
        </div>

        <div className="w-11 h-11 rounded-xl bg-slate-800/60 flex items-center justify-center">
          <Icon className={`w-5 h-5 ${iconClass}`} />
        </div>
      </div>
    </div>
  );
};

// ============================================================
// OVERVIEW CARD
// ============================================================

const OverviewCard = ({ label, value, className }) => {
  return (
    <div className="rounded-xl border border-slate-800 bg-[#0a1222] p-4">
      <p className="text-xs text-slate-500">{label}</p>

      <p className={`text-xl font-bold mt-2 ${className}`}>{value ?? 0}</p>
    </div>
  );
};

// ============================================================
// INFO ITEM
// ============================================================

const InfoItem = ({ icon: Icon, label, value }) => {
  return (
    <div className="flex items-start gap-3">
      <div className="w-9 h-9 shrink-0 rounded-lg bg-slate-800/60 flex items-center justify-center">
        <Icon className="w-4 h-4 text-slate-400" />
      </div>

      <div className="min-w-0">
        <p className="text-xs text-slate-500">{label}</p>

        <p className="text-sm text-slate-300 mt-1 break-words">
          {value || "Not provided"}
        </p>
      </div>
    </div>
  );
};

// ============================================================
// PREFERENCE ITEM
// ============================================================

const PreferenceItem = ({ icon: Icon, label, value }) => {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-4">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-slate-500" />

        <p className="text-xs text-slate-500">{label}</p>
      </div>

      <p className="text-sm text-slate-300 mt-2 capitalize">
        {value || "Not specified"}
      </p>
    </div>
  );
};

// ============================================================
// RELATIVE DATE HELPER
// ============================================================

const formatRelativeOrDate = (date) => {
  if (!date) return "Never";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "—";
  }

  const diff = Date.now() - parsed.getTime();

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} minutes ago`;
  if (hours < 24) return `${hours} hours ago`;
  if (days < 7) return `${days} days ago`;

  return formatDate(date);
};

export default UserDetails;
