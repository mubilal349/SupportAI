import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  Filter,
  Loader2,
  RefreshCw,
  Search,
  Ticket,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";

import { getMyTickets } from "../../../services/agentService";

/* =========================================================
   HELPERS
========================================================= */

const normalizeTickets = (response) => {
  const data =
    response?.data?.tickets || response?.tickets || response?.data || [];

  return Array.isArray(data) ? data : [];
};

const normalizeStatus = (status) => {
  return String(status || "")
    .trim()
    .toLowerCase()
    .replace(/[-\s]+/g, "_");
};

const formatStatus = (status) => {
  const value = normalizeStatus(status);

  if (value === "in_progress") return "In Progress";
  if (value === "resolved") return "Resolved";
  if (value === "closed") return "Closed";
  if (value === "waiting") return "Waiting";
  if (value === "open") return "Open";

  return status || "Open";
};

const getStatusStyles = (status) => {
  const value = normalizeStatus(status);

  if (value === "resolved" || value === "closed") {
    return "border-emerald-500/20 bg-emerald-500/10 text-emerald-400";
  }

  if (value === "in_progress") {
    return "border-blue-500/20 bg-blue-500/10 text-blue-400";
  }

  if (value === "waiting") {
    return "border-amber-500/20 bg-amber-500/10 text-amber-400";
  }

  if (value === "open") {
    return "border-cyan-500/20 bg-cyan-500/10 text-cyan-400";
  }

  return "border-slate-700 bg-slate-800 text-slate-400";
};

const getPriorityStyles = (priority) => {
  const value = String(priority || "").toLowerCase();

  if (value === "urgent") {
    return "border-red-500/20 bg-red-500/10 text-red-400";
  }

  if (value === "high") {
    return "border-orange-500/20 bg-orange-500/10 text-orange-400";
  }

  if (value === "medium") {
    return "border-amber-500/20 bg-amber-500/10 text-amber-400";
  }

  return "border-slate-700 bg-slate-800 text-slate-400";
};

/* =========================================================
   COMPONENT
========================================================= */

const MyTickets = () => {
  const [tickets, setTickets] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  const [showFilters, setShowFilters] = useState(false);

  /* =======================================================
     LOAD MY TICKETS
  ======================================================= */

  const loadTickets = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      /*
       * IMPORTANT:
       *
       * Do NOT send the agent ID from the frontend.
       *
       * The backend gets the logged-in agent from
       * req.user._id / req.user.id created by the JWT
       * authentication middleware.
       */
      const response = await getMyTickets({
        limit: 100,
      });

      setTickets(normalizeTickets(response));
    } catch (err) {
      console.error("MY TICKETS ERROR:", err);

      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Unable to load your tickets.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  /* =======================================================
     FILTER TICKETS
========================================================= */

  const filteredTickets = useMemo(() => {
    const query = search.trim().toLowerCase();

    return tickets.filter((ticket) => {
      const subject = ticket?.subject || ticket?.title || "";

      const description = ticket?.description || ticket?.message || "";

      const customer =
        ticket?.customer?.name ||
        ticket?.customer?.fullName ||
        ticket?.customerName ||
        "";

      const ticketNumber = ticket?.ticketNumber || ticket?.number || "";

      const status = normalizeStatus(ticket?.status);

      const priority = String(ticket?.priority || "").toLowerCase();

      const matchesSearch =
        !query ||
        `${subject} ${description} ${customer} ${ticketNumber}`
          .toLowerCase()
          .includes(query);

      const matchesStatus = statusFilter === "all" || status === statusFilter;

      const matchesPriority =
        priorityFilter === "all" || priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [tickets, search, statusFilter, priorityFilter]);

  /* =======================================================
     STATISTICS
========================================================= */

  const stats = useMemo(() => {
    const total = tickets.length;

    const open = tickets.filter(
      (ticket) => normalizeStatus(ticket?.status) === "open",
    ).length;

    const inProgress = tickets.filter(
      (ticket) => normalizeStatus(ticket?.status) === "in_progress",
    ).length;

    const waiting = tickets.filter(
      (ticket) => normalizeStatus(ticket?.status) === "waiting",
    ).length;

    const resolved = tickets.filter((ticket) => {
      const status = normalizeStatus(ticket?.status);

      return status === "resolved" || status === "closed";
    }).length;

    const highPriority = tickets.filter((ticket) => {
      const priority = String(ticket?.priority || "").toLowerCase();

      return priority === "high" || priority === "urgent";
    }).length;

    return {
      total,
      open,
      inProgress,
      waiting,
      resolved,
      highPriority,
    };
  }, [tickets]);

  /* =======================================================
     CLEAR FILTERS
========================================================= */

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setPriorityFilter("all");
  };

  const hasFilters =
    Boolean(search) || statusFilter !== "all" || priorityFilter !== "all";

  /* =======================================================
     LOADING
========================================================= */

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-110px)] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-800 bg-[#0a1425]">
            <Loader2 size={26} className="animate-spin text-blue-500" />
          </div>

          <p className="text-sm text-slate-500">Loading your tickets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1500px] px-4 py-8 sm:px-6 lg:px-10 lg:py-12">
      {/* ===================================================
          HEADER
      =================================================== */}

      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-400">
            Personal Workspace
          </p>

          <h1 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">
            My Tickets
          </h1>

          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-500">
            Work on the support tickets currently assigned to you.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadTickets(true)}
          disabled={refreshing}
          className="flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900/70 px-4 text-sm font-medium text-slate-400 transition hover:border-blue-500/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw size={17} className={refreshing ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* ===================================================
          ERROR
      =================================================== */}

      {error && (
        <div className="mt-7 flex items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 px-5 py-4">
          <AlertCircle size={19} className="shrink-0 text-red-400" />

          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {/* ===================================================
          STATS
      =================================================== */}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-3xl border border-slate-800 bg-[#0a1425] p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">
            My Tickets
          </p>

          <p className="mt-3 text-3xl font-bold text-white">{stats.total}</p>

          <p className="mt-1 text-xs text-slate-600">Currently assigned</p>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-[#0a1425] p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">
            Open
          </p>

          <p className="mt-3 text-3xl font-bold text-cyan-400">{stats.open}</p>

          <p className="mt-1 text-xs text-slate-600">Need attention</p>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-[#0a1425] p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">
            In Progress
          </p>

          <p className="mt-3 text-3xl font-bold text-blue-400">
            {stats.inProgress}
          </p>

          <p className="mt-1 text-xs text-slate-600">Currently handling</p>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-[#0a1425] p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">
            Waiting
          </p>

          <p className="mt-3 text-3xl font-bold text-amber-400">
            {stats.waiting}
          </p>

          <p className="mt-1 text-xs text-slate-600">Waiting for response</p>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-[#0a1425] p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">
            Resolved
          </p>

          <p className="mt-3 text-3xl font-bold text-emerald-400">
            {stats.resolved}
          </p>

          <p className="mt-1 text-xs text-slate-600">Completed</p>
        </div>
      </div>

      {/* ===================================================
          HIGH PRIORITY NOTICE
      =================================================== */}

      {stats.highPriority > 0 && (
        <div className="mt-6 flex items-center gap-3 rounded-2xl border border-orange-500/20 bg-orange-500/5 px-5 py-4">
          <AlertCircle size={18} className="text-orange-400" />

          <p className="text-sm text-orange-300">
            You have <span className="font-semibold">{stats.highPriority}</span>{" "}
            high or urgent priority ticket
            {stats.highPriority !== 1 ? "s" : ""} requiring attention.
          </p>
        </div>
      )}

      {/* ===================================================
          SEARCH / FILTERS
      =================================================== */}

      <section className="mt-8 rounded-3xl border border-slate-800 bg-[#0a1425] p-4">
        <div className="flex flex-col gap-3 xl:flex-row">
          <div className="relative flex-1">
            <Search
              size={19}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600"
            />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search my tickets..."
              className="h-12 w-full rounded-2xl border border-slate-800 bg-slate-900/60 pl-11 pr-4 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-blue-500/40"
            />
          </div>

          <button
            type="button"
            onClick={() => setShowFilters((value) => !value)}
            className={[
              "flex h-12 items-center justify-center gap-2 rounded-2xl border px-4 text-sm font-medium transition",
              showFilters || statusFilter !== "all" || priorityFilter !== "all"
                ? "border-blue-500/30 bg-blue-500/10 text-blue-400"
                : "border-slate-800 bg-slate-900/60 text-slate-500 hover:text-slate-200",
            ].join(" ")}
          >
            <Filter size={17} />
            Filters
          </button>

          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-slate-800 bg-slate-900/60 px-4 text-sm text-slate-500 transition hover:text-white"
            >
              <X size={16} />
              Clear
            </button>
          )}
        </div>

        {showFilters && (
          <div className="mt-4 grid gap-3 border-t border-slate-800 pt-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-slate-600">
                Status
              </label>

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="h-11 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 text-sm text-slate-300 outline-none focus:border-blue-500/40"
              >
                <option value="all">All Statuses</option>

                <option value="open">Open</option>

                <option value="in_progress">In Progress</option>

                <option value="waiting">Waiting</option>

                <option value="resolved">Resolved</option>

                <option value="closed">Closed</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-slate-600">
                Priority
              </label>

              <select
                value={priorityFilter}
                onChange={(event) => setPriorityFilter(event.target.value)}
                className="h-11 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 text-sm text-slate-300 outline-none focus:border-blue-500/40"
              >
                <option value="all">All Priorities</option>

                <option value="urgent">Urgent</option>

                <option value="high">High</option>

                <option value="medium">Medium</option>

                <option value="low">Low</option>
              </select>
            </div>
          </div>
        )}
      </section>

      {/* ===================================================
          RESULTS HEADER
      =================================================== */}

      <div className="mt-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">Your Work</h2>

          <p className="mt-1 text-sm text-slate-600">
            Showing {filteredTickets.length} of {tickets.length} tickets
          </p>
        </div>

        {hasFilters && (
          <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1.5 text-xs text-blue-400">
            Filters active
          </span>
        )}
      </div>

      {/* ===================================================
          TICKET LIST
      =================================================== */}

      <div className="mt-5 space-y-4">
        {filteredTickets.length > 0 ? (
          filteredTickets.map((ticket) => {
            const id = ticket?._id || ticket?.id;

            const customer =
              ticket?.customer?.name ||
              ticket?.customer?.fullName ||
              ticket?.customerName ||
              "Customer";

            const ticketNumber =
              ticket?.ticketNumber ||
              ticket?.number ||
              String(id || "").slice(-6);

            return (
              <Link
                key={id || ticketNumber}
                to={id ? `/agent/tickets/${id}` : "/agent/my-tickets"}
                className="group block rounded-3xl border border-slate-800 bg-[#0a1425] p-5 transition duration-300 hover:border-blue-500/20 hover:bg-[#0c172a] sm:p-6"
              >
                <div className="flex flex-col gap-5 xl:flex-row xl:items-center">
                  {/* ICON */}

                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400">
                    <Ticket size={22} />
                  </div>

                  {/* INFORMATION */}

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-medium text-slate-600">
                        #{ticketNumber}
                      </span>

                      <span
                        className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${getPriorityStyles(
                          ticket?.priority,
                        )}`}
                      >
                        {ticket?.priority || "Low"}
                      </span>
                    </div>

                    <h3 className="mt-2 truncate text-lg font-semibold text-slate-100">
                      {ticket?.subject || ticket?.title || "Support request"}
                    </h3>

                    <p className="mt-1 line-clamp-1 text-sm text-slate-600">
                      {ticket?.description ||
                        ticket?.message ||
                        "No description available."}
                    </p>

                    <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-600">
                      <span className="flex items-center gap-2">
                        <Clock3 size={14} />
                        {ticket?.updatedAt
                          ? new Date(ticket.updatedAt).toLocaleString()
                          : "Recently"}
                      </span>

                      <span>
                        Customer:{" "}
                        <span className="text-slate-500">{customer}</span>
                      </span>
                    </div>
                  </div>

                  {/* MY OWNERSHIP */}

                  <div className="rounded-2xl border border-blue-500/10 bg-blue-500/5 px-4 py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-400/70">
                      Assigned To Me
                    </p>

                    <p className="mt-1 text-sm font-medium text-blue-300">
                      Your ticket
                    </p>
                  </div>

                  {/* STATUS */}

                  <div className="flex items-center gap-3">
                    <span
                      className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium ${getStatusStyles(
                        ticket?.status,
                      )}`}
                    >
                      {formatStatus(ticket?.status)}
                    </span>

                    <ArrowUpRight
                      size={19}
                      className="text-slate-700 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-blue-400"
                    />
                  </div>
                </div>
              </Link>
            );
          })
        ) : (
          <div className="rounded-3xl border border-slate-800 bg-[#0a1425] py-20 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 size={28} />
            </div>

            <h3 className="mt-5 text-lg font-semibold text-slate-300">
              {tickets.length === 0
                ? "You have no assigned tickets"
                : "No tickets found"}
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
              {tickets.length === 0
                ? "Tickets assigned to you will appear here."
                : "No tickets match your current search or filters."}
            </p>

            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500"
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyTickets;
