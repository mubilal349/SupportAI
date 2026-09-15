import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Search,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Eye,
  UserRound,
  Clock3,
  AlertTriangle,
  CheckCircle2,
  CircleDot,
  Ticket as TicketIcon,
  Inbox,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

const STATUS_OPTIONS = [
  "all",
  "open",
  "pending",
  "in-progress",
  "waiting",
  "resolved",
  "closed",
];

const PRIORITY_OPTIONS = ["all", "low", "medium", "high", "urgent"];

const CATEGORY_OPTIONS = [
  "all",
  "General",
  "Technical",
  "Billing",
  "Account",
  "Feature Request",
  "Bug",
];

const getToken = () => localStorage.getItem("supportai_token");

const formatDate = (date) => {
  if (!date) return "—";

  const value = new Date(date);

  if (Number.isNaN(value.getTime())) return "—";

  return value.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatTime = (date) => {
  if (!date) return "";

  const value = new Date(date);

  if (Number.isNaN(value.getTime())) return "";

  return value.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
};

const getCustomerName = (ticket) => {
  if (!ticket?.customer) return "Unknown customer";

  if (typeof ticket.customer === "string") {
    return ticket.customer;
  }

  return (
    ticket.customer.name ||
    ticket.customer.fullName ||
    ticket.customer.email ||
    "Unknown customer"
  );
};

const getCustomerEmail = (ticket) => {
  if (!ticket?.customer || typeof ticket.customer === "string") return "";

  return ticket.customer.email || "";
};

const getAgentName = (ticket) => {
  if (!ticket?.assignedAgent) return "Unassigned";

  if (typeof ticket.assignedAgent === "string") {
    return "Assigned agent";
  }

  return (
    ticket.assignedAgent.name ||
    ticket.assignedAgent.fullName ||
    ticket.assignedAgent.email ||
    "Assigned agent"
  );
};

const getInitials = (name = "") => {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (!parts.length) return "?";

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

const getAvatarUrl = (user) => {
  if (!user || typeof user === "string") return null;

  const avatar = user.avatar;

  if (!avatar) return null;

  // Already a complete URL
  if (avatar.startsWith("http://") || avatar.startsWith("https://")) {
    return avatar;
  }

  // Backend stores paths such as /uploads/avatar.jpg
  if (avatar.startsWith("/")) {
    return `http://localhost:8000${avatar}`;
  }

  return `http://localhost:8000/${avatar}`;
};

const normalizeStatus = (status) =>
  String(status || "open")
    .toLowerCase()
    .replace(/\s+/g, "-");

const normalizePriority = (priority) =>
  String(priority || "medium").toLowerCase();

const statusConfig = {
  open: {
    label: "Open",
    className: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    dot: "bg-blue-400",
  },
  pending: {
    label: "Pending",
    className: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    dot: "bg-amber-400",
  },
  "in-progress": {
    label: "In Progress",
    className: "bg-violet-500/10 text-violet-400 border-violet-500/20",
    dot: "bg-violet-400",
  },
  waiting: {
    label: "Waiting",
    className: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    dot: "bg-orange-400",
  },
  resolved: {
    label: "Resolved",
    className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    dot: "bg-emerald-400",
  },
  closed: {
    label: "Closed",
    className: "bg-slate-500/10 text-slate-400 border-slate-500/20",
    dot: "bg-slate-400",
  },
};

const priorityConfig = {
  low: {
    label: "Low",
    className: "text-slate-400",
    dot: "bg-slate-400",
  },
  medium: {
    label: "Medium",
    className: "text-blue-400",
    dot: "bg-blue-400",
  },
  high: {
    label: "High",
    className: "text-orange-400",
    dot: "bg-orange-400",
  },
  urgent: {
    label: "Urgent",
    className: "text-red-400",
    dot: "bg-red-400",
  },
};

const StatusBadge = ({ status }) => {
  const key = normalizeStatus(status);
  const config = statusConfig[key] || statusConfig.open;

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-md border px-2.5 py-1 text-xs font-medium ${config.className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
};

const PriorityBadge = ({ priority }) => {
  const key = normalizePriority(priority);
  const config = priorityConfig[key] || priorityConfig.medium;

  return (
    <span
      className={`inline-flex items-center gap-2 text-xs font-medium ${config.className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
};

const EmptyState = ({ onClear }) => (
  <div className="flex min-h-[360px] flex-col items-center justify-center px-6 text-center">
    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/70">
      <Inbox className="h-6 w-6 text-slate-500" />
    </div>

    <h3 className="text-base font-semibold text-white">No tickets found</h3>

    <p className="mt-1 max-w-sm text-sm text-slate-500">
      No tickets match your current search and filter settings.
    </p>

    <button
      onClick={onClear}
      className="mt-5 rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-slate-600 hover:bg-slate-800 hover:text-white"
    >
      Clear filters
    </button>
  </div>
);

const LoadingRows = () => (
  <div className="divide-y divide-slate-800/80">
    {Array.from({ length: 7 }).map((_, index) => (
      <div
        key={index}
        className="grid grid-cols-[minmax(240px,1.8fr)_minmax(150px,1fr)_120px_120px_120px_70px] gap-4 px-5 py-4"
      >
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 animate-pulse rounded-lg bg-slate-800" />
          <div className="space-y-2">
            <div className="h-3 w-32 animate-pulse rounded bg-slate-800" />
            <div className="h-2.5 w-48 animate-pulse rounded bg-slate-800/70" />
          </div>
        </div>

        {Array.from({ length: 5 }).map((__, cellIndex) => (
          <div key={cellIndex} className="flex items-center">
            <div className="h-3 w-20 animate-pulse rounded bg-slate-800" />
          </div>
        ))}
      </div>
    ))}
  </div>
);

const Tickets = () => {
  const navigate = useNavigate();

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [priority, setPriority] = useState("all");
  const [category, setCategory] = useState("all");
  const [assignment, setAssignment] = useState("all");

  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1,
  });

  const [showFilters, setShowFilters] = useState(false);

  const fetchTickets = useCallback(
    async (showRefresh = false) => {
      try {
        if (showRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const params = new URLSearchParams();

        params.set("page", String(page));
        params.set("limit", "10");

        if (search.trim()) {
          params.set("search", search.trim());
        }

        if (status !== "all") {
          params.set("status", status);
        }

        if (priority !== "all") {
          params.set("priority", priority);
        }

        if (category !== "all") {
          params.set("category", category);
        }

        if (assignment !== "all") {
          params.set("assigned", assignment);
        }

        const response = await fetch(
          `${API_URL}/admin/tickets?${params.toString()}`,
          {
            headers: {
              Authorization: `Bearer ${getToken()}`,
              "Content-Type": "application/json",
            },
          },
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to fetch tickets");
        }

        setTickets(data.tickets || data.data || []);

        setPagination(
          data.pagination || {
            page,
            limit: 10,
            total: (data.tickets || []).length,
            pages: 1,
          },
        );
      } catch (err) {
        console.error("Fetch admin tickets error:", err);
        setError(err.message || "Failed to load tickets");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [page, search, status, priority, category, assignment],
  );

  useEffect(() => {
    const timer = setTimeout(
      () => {
        fetchTickets();
      },
      search ? 350 : 0,
    );

    return () => clearTimeout(timer);
  }, [fetchTickets]);

  useEffect(() => {
    setPage(1);
  }, [search, status, priority, category, assignment]);

  const clearFilters = () => {
    setSearch("");
    setStatus("all");
    setPriority("all");
    setCategory("all");
    setAssignment("all");
    setPage(1);
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;

    if (status !== "all") count++;
    if (priority !== "all") count++;
    if (category !== "all") count++;
    if (assignment !== "all") count++;

    return count;
  }, [status, priority, category, assignment]);

  const summary = useMemo(() => {
    const total = pagination.total || tickets.length;

    const open = tickets.filter(
      (ticket) => normalizeStatus(ticket.status) === "open",
    ).length;

    const inProgress = tickets.filter(
      (ticket) => normalizeStatus(ticket.status) === "in-progress",
    ).length;

    const urgent = tickets.filter(
      (ticket) => normalizePriority(ticket.priority) === "urgent",
    ).length;

    return {
      total,
      open,
      inProgress,
      urgent,
    };
  }, [tickets, pagination.total]);

  const totalPages = Math.max(
    1,
    pagination.pages ||
      Math.ceil(
        (pagination.total || tickets.length) / (pagination.limit || 10),
      ),
  );

  const currentPage = pagination.page || page;

  return (
    <div className="min-h-full bg-[#050b18] text-slate-200">
      <div className="mx-auto max-w-[1600px] px-4 py-5 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-medium text-slate-500">
              <TicketIcon className="h-3.5 w-3.5" />
              Admin
              <span className="text-slate-700">/</span>
              Tickets
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-white">
              Ticket Management
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Monitor, filter, assign, and manage support tickets across the
              platform.
            </p>
          </div>

          <button
            onClick={() => fetchTickets(true)}
            disabled={refreshing}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-700 bg-[#0a1222] px-4 text-sm font-medium text-slate-300 transition hover:border-slate-600 hover:bg-[#0d172a] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>

        {/* Summary */}
        <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="border border-slate-800 bg-[#0a1222] px-4 py-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Total
              </span>
              <TicketIcon className="h-4 w-4 text-slate-600" />
            </div>

            <p className="mt-2 text-2xl font-bold text-white">
              {summary.total}
            </p>
          </div>

          <div className="border border-slate-800 bg-[#0a1222] px-4 py-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Open
              </span>
              <CircleDot className="h-4 w-4 text-blue-400" />
            </div>

            <p className="mt-2 text-2xl font-bold text-white">{summary.open}</p>
          </div>

          <div className="border border-slate-800 bg-[#0a1222] px-4 py-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
                In Progress
              </span>
              <Clock3 className="h-4 w-4 text-violet-400" />
            </div>

            <p className="mt-2 text-2xl font-bold text-white">
              {summary.inProgress}
            </p>
          </div>

          <div className="border border-slate-800 bg-[#0a1222] px-4 py-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Urgent
              </span>
              <AlertTriangle className="h-4 w-4 text-red-400" />
            </div>

            <p className="mt-2 text-2xl font-bold text-white">
              {summary.urgent}
            </p>
          </div>
        </div>

        {/* Search / Filters */}
        <div className="mb-4 border border-slate-800 bg-[#0a1222]">
          <div className="flex flex-col gap-3 p-3 lg:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />

              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search ticket number, subject, customer..."
                className="h-10 w-full border border-slate-800 bg-[#07101f] pl-10 pr-10 text-sm text-white outline-none placeholder:text-slate-600 transition focus:border-blue-500/50"
              />

              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 transition hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="h-10 border border-slate-800 bg-[#07101f] px-3 text-sm text-slate-300 outline-none focus:border-blue-500/50"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option === "all"
                    ? "All Statuses"
                    : option
                        .replace("-", " ")
                        .replace(/\b\w/g, (char) => char.toUpperCase())}
                </option>
              ))}
            </select>

            <button
              onClick={() => setShowFilters((value) => !value)}
              className={`inline-flex h-10 items-center justify-center gap-2 border px-4 text-sm font-medium transition ${
                showFilters || activeFilterCount
                  ? "border-blue-500/30 bg-blue-500/10 text-blue-400"
                  : "border-slate-800 bg-[#07101f] text-slate-400 hover:text-white"
              }`}
            >
              <Filter className="h-4 w-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-500 px-1.5 text-[10px] font-bold text-white">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="h-10 px-3 text-xs font-medium text-slate-500 transition hover:text-white"
              >
                Clear
              </button>
            )}
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 gap-3 border-t border-slate-800 p-3 sm:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-500">
                  Priority
                </label>

                <select
                  value={priority}
                  onChange={(event) => setPriority(event.target.value)}
                  className="h-10 w-full border border-slate-800 bg-[#07101f] px-3 text-sm text-slate-300 outline-none focus:border-blue-500/50"
                >
                  {PRIORITY_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option === "all"
                        ? "All Priorities"
                        : option.charAt(0).toUpperCase() + option.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-500">
                  Category
                </label>

                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  className="h-10 w-full border border-slate-800 bg-[#07101f] px-3 text-sm text-slate-300 outline-none focus:border-blue-500/50"
                >
                  {CATEGORY_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option === "all" ? "All Categories" : option}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-500">
                  Assignment
                </label>

                <select
                  value={assignment}
                  onChange={(event) => setAssignment(event.target.value)}
                  className="h-10 w-full border border-slate-800 bg-[#07101f] px-3 text-sm text-slate-300 outline-none focus:border-blue-500/50"
                >
                  <option value="all">All Tickets</option>
                  <option value="assigned">Assigned</option>
                  <option value="unassigned">Unassigned</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 flex items-center justify-between border border-red-500/20 bg-red-500/5 px-4 py-3">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <span className="text-sm text-red-300">{error}</span>
            </div>

            <button
              onClick={() => fetchTickets()}
              className="text-xs font-medium text-red-300 hover:text-white"
            >
              Retry
            </button>
          </div>
        )}

        {/* Table */}
        <div className="overflow-hidden border border-slate-800 bg-[#0a1222]">
          {/* Table Header */}
          <div className="hidden grid-cols-[minmax(240px,1.8fr)_minmax(150px,1fr)_120px_120px_120px_70px] gap-4 border-b border-slate-800 bg-[#08101e] px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-600 xl:grid">
            <span>Ticket</span>
            <span>Customer</span>
            <span>Status</span>
            <span>Priority</span>
            <span>Created</span>
            <span className="text-right">Action</span>
          </div>

          {loading ? (
            <LoadingRows />
          ) : tickets.length === 0 ? (
            <EmptyState onClear={clearFilters} />
          ) : (
            <div className="divide-y divide-slate-800/80">
              {tickets.map((ticket) => {
                const customerName = getCustomerName(ticket);
                const customerEmail = getCustomerEmail(ticket);
                const agentName = getAgentName(ticket);

                return (
                  <div
                    key={ticket._id}
                    onClick={() => navigate(`/admin/tickets/${ticket._id}`)}
                    className="group cursor-pointer px-5 py-4 transition hover:bg-[#0d1728]"
                  >
                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(240px,1.8fr)_minmax(150px,1fr)_120px_120px_120px_70px] xl:items-center">
                      {/* Ticket */}
                      <div className="min-w-0">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-800 bg-[#07101f] text-blue-400">
                            <TicketIcon className="h-4 w-4" />
                          </div>

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs font-semibold text-blue-400">
                                {ticket.ticketNumber || "No ticket number"}
                              </span>

                              {ticket.escalation?.isEscalated ||
                              ticket.isEscalated ? (
                                <span className="inline-flex items-center gap-1 rounded border border-red-500/20 bg-red-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-red-400">
                                  <AlertTriangle className="h-3 w-3" />
                                  Escalated
                                </span>
                              ) : null}
                            </div>

                            <p className="mt-1 truncate text-sm font-semibold text-white group-hover:text-blue-300">
                              {ticket.subject || "Untitled ticket"}
                            </p>

                            <p className="mt-1 truncate text-xs text-slate-600">
                              {ticket.category || "General"}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Customer */}
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full border border-slate-700 bg-slate-800">
                          {getAvatarUrl(ticket.customer) ? (
                            <img
                              src={getAvatarUrl(ticket.customer)}
                              alt={customerName}
                              className="h-full w-full object-cover"
                              onError={(event) => {
                                event.currentTarget.style.display = "none";
                                event.currentTarget.parentElement.innerHTML = `
          <div class="flex h-full w-full items-center justify-center text-[10px] font-semibold text-slate-300">
            ${getInitials(customerName)}
          </div>
        `;
                              }}
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-slate-300">
                              {getInitials(customerName)}
                            </div>
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-300">
                            {customerName}
                          </p>

                          <p className="truncate text-xs text-slate-600">
                            {customerEmail || agentName}
                          </p>
                        </div>
                      </div>

                      {/* Status */}
                      <div>
                        <StatusBadge status={ticket.status} />
                      </div>

                      {/* Priority */}
                      <div>
                        <PriorityBadge priority={ticket.priority} />
                      </div>

                      {/* Created */}
                      <div className="text-xs">
                        <p className="text-slate-400">
                          {formatDate(ticket.createdAt)}
                        </p>
                        <p className="mt-0.5 text-slate-600">
                          {formatTime(ticket.createdAt)}
                        </p>
                      </div>

                      {/* Action */}
                      <div className="flex justify-start xl:justify-end">
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            navigate(`/admin/tickets/${ticket._id}`);
                          }}
                          className="flex h-8 w-8 items-center justify-center rounded-md border border-transparent text-slate-600 transition hover:border-slate-700 hover:bg-slate-800 hover:text-white"
                          title="View ticket"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {!loading && tickets.length > 0 && (
            <div className="flex flex-col gap-3 border-t border-slate-800 bg-[#08101e] px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-slate-600">
                Showing{" "}
                <span className="font-medium text-slate-400">
                  {(currentPage - 1) * (pagination.limit || 10) + 1}
                </span>{" "}
                to{" "}
                <span className="font-medium text-slate-400">
                  {Math.min(
                    currentPage * (pagination.limit || 10),
                    pagination.total || tickets.length,
                  )}
                </span>{" "}
                of{" "}
                <span className="font-medium text-slate-400">
                  {pagination.total || tickets.length}
                </span>{" "}
                tickets
              </p>

              <div className="flex items-center gap-1">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => setPage((value) => Math.max(1, value - 1))}
                  className="flex h-8 w-8 items-center justify-center border border-slate-800 bg-[#0a1222] text-slate-500 transition hover:border-slate-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                <div className="flex h-8 min-w-8 items-center justify-center border border-blue-500/30 bg-blue-500/10 px-2 text-xs font-semibold text-blue-400">
                  {currentPage}
                </div>

                <button
                  disabled={currentPage >= totalPages}
                  onClick={() =>
                    setPage((value) => Math.min(totalPages, value + 1))
                  }
                  className="flex h-8 w-8 items-center justify-center border border-slate-800 bg-[#0a1222] text-slate-500 transition hover:border-slate-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Tickets;
