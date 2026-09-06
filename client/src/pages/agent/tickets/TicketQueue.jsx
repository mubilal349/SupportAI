import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowUpRight,
  Clock3,
  Filter,
  Loader2,
  RefreshCw,
  Search,
  Ticket,
  UserRound,
} from "lucide-react";

import { Link } from "react-router-dom";

import {
  assignTicketToMe,
  getTicketQueue,
} from "../../../services/agentService";

/* =========================================================
   RESPONSE NORMALIZER
========================================================= */

const normalizeTickets = (response) => {
  const data =
    response?.data?.tickets ?? response?.tickets ?? response?.data ?? [];

  return Array.isArray(data) ? data : [];
};

/* =========================================================
   ID HELPER
========================================================= */

const getTicketId = (ticket) => {
  return ticket?._id || ticket?.id || null;
};

/* =========================================================
   PRIORITY STYLES
========================================================= */

const getPriorityStyles = (priority) => {
  const value = String(priority || "").toLowerCase();

  if (value === "urgent") {
    return "bg-red-500/10 text-red-400 border-red-500/20";
  }

  if (value === "high") {
    return "bg-orange-500/10 text-orange-400 border-orange-500/20";
  }

  if (value === "medium") {
    return "bg-amber-500/10 text-amber-400 border-amber-500/20";
  }

  if (value === "low") {
    return "bg-slate-800 text-slate-400 border-slate-700";
  }

  return "bg-slate-800 text-slate-400 border-slate-700";
};

/* =========================================================
   STATUS STYLES
========================================================= */

const getStatusStyles = (status) => {
  const value = String(status || "").toLowerCase();

  if (value === "resolved" || value === "closed") {
    return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
  }

  if (value === "in-progress" || value === "in_progress") {
    return "bg-blue-500/10 text-blue-400 border-blue-500/20";
  }

  if (value === "waiting" || value === "pending") {
    return "bg-amber-500/10 text-amber-400 border-amber-500/20";
  }

  if (value === "open") {
    return "bg-cyan-500/10 text-cyan-400 border-cyan-500/20";
  }

  return "bg-slate-800 text-slate-400 border-slate-700";
};

/* =========================================================
   STATUS LABEL
========================================================= */

const getStatusLabel = (status) => {
  const value = String(status || "").toLowerCase();

  if (value === "in-progress" || value === "in_progress") {
    return "In Progress";
  }

  if (value === "waiting" || value === "pending") {
    return "Waiting";
  }

  if (value === "open") {
    return "Open";
  }

  if (value === "resolved") {
    return "Resolved";
  }

  if (value === "closed") {
    return "Closed";
  }

  return status || "Open";
};

/* =========================================================
   TICKET QUEUE
========================================================= */

const TicketQueue = () => {
  const [tickets, setTickets] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [assigningId, setAssigningId] = useState(null);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  /* =========================================================
     LOAD TICKETS
  ========================================================= */

  const loadTickets = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      /*
       * We intentionally load the available queue and perform
       * the visible filters on the client.
       *
       * Backend already guarantees that only unassigned tickets
       * are returned.
       */

      const response = await getTicketQueue();

      const normalizedTickets = normalizeTickets(response);

      console.log("========================================");
      console.log("AGENT TICKET QUEUE");
      console.log("Raw response:", response);
      console.log("Tickets:", normalizedTickets);
      console.log("Ticket count:", normalizedTickets.length);
      console.log("========================================");

      setTickets(normalizedTickets);
    } catch (err) {
      console.error("TICKET QUEUE ERROR:", err);

      setTickets([]);

      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Unable to load the ticket queue.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /* =========================================================
     INITIAL LOAD
  ========================================================= */

  useEffect(() => {
    loadTickets();
  }, []);

  /* =========================================================
     CLIENT-SIDE FILTERING
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

      const ticketNumber =
        ticket?.ticketNumber ||
        ticket?.number ||
        ticket?.id ||
        ticket?._id ||
        "";

      /* ---------------------------------------------
         SEARCH
      --------------------------------------------- */

      const searchableText = `
        ${subject}
        ${description}
        ${customer}
        ${ticketNumber}
      `.toLowerCase();

      const matchesSearch = !query || searchableText.includes(query);

      /* ---------------------------------------------
         PRIORITY
      --------------------------------------------- */

      const priority = String(ticket?.priority || "").toLowerCase();

      const matchesPriority =
        priorityFilter === "all" || priority === priorityFilter;

      /* ---------------------------------------------
         STATUS
      --------------------------------------------- */

      const status = String(ticket?.status || "").toLowerCase();

      /*
       * Backend status:
       *
       * open
       * waiting
       * in-progress
       *
       * Frontend filter uses the same values.
       */

      const matchesStatus = statusFilter === "all" || status === statusFilter;

      return matchesSearch && matchesPriority && matchesStatus;
    });
  }, [tickets, search, priorityFilter, statusFilter]);

  /* =========================================================
     ASSIGN TICKET
  ========================================================= */

  const handleAssign = async (ticketId) => {
    if (!ticketId) {
      return;
    }

    try {
      setAssigningId(ticketId);
      setError("");

      await assignTicketToMe(ticketId);

      /*
       * Remove ticket from available queue immediately because
       * it is no longer unassigned.
       */

      setTickets((current) =>
        current.filter(
          (ticket) => String(getTicketId(ticket)) !== String(ticketId),
        ),
      );
    } catch (err) {
      console.error("ASSIGN TICKET ERROR:", err);

      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Unable to assign this ticket.",
      );
    } finally {
      setAssigningId(null);
    }
  };

  /* =========================================================
     LOADING STATE
  ========================================================= */

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-110px)] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={32} className="animate-spin text-blue-500" />

          <p className="text-sm text-slate-500">Loading ticket queue...</p>
        </div>
      </div>
    );
  }

  /* =========================================================
     PAGE
  ========================================================= */

  return (
    <div className="mx-auto w-full max-w-[1500px] px-4 py-8 sm:px-6 lg:px-10 lg:py-12">
      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-400">
            Workspace
          </p>

          <h1 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Ticket Queue
          </h1>

          <p className="mt-3 text-base text-slate-500">
            Review incoming support requests and pick up tickets.
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

      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (
        <div className="mt-6 flex items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 px-5 py-4">
          <AlertCircle size={19} className="shrink-0 text-red-400" />

          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {/* =====================================================
          FILTERS
      ===================================================== */}

      <div className="mt-8 rounded-3xl border border-slate-800 bg-[#0a1425] p-4">
        <div className="flex flex-col gap-3 lg:flex-row">
          {/* SEARCH */}

          <div className="relative flex-1">
            <Search
              size={19}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600"
            />

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search tickets..."
              className="h-12 w-full rounded-2xl border border-slate-800 bg-slate-900/60 pl-11 pr-4 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-blue-500/40"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            {/* PRIORITY */}

            <div className="relative">
              <Filter
                size={17}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-600"
              />

              <select
                value={priorityFilter}
                onChange={(event) => setPriorityFilter(event.target.value)}
                className="h-12 appearance-none rounded-2xl border border-slate-800 bg-slate-900/60 pl-10 pr-9 text-sm text-slate-400 outline-none focus:border-blue-500/40"
              >
                <option value="all">All Priority</option>

                <option value="urgent">Urgent</option>

                <option value="high">High</option>

                <option value="medium">Medium</option>

                <option value="low">Low</option>
              </select>
            </div>

            {/* STATUS */}

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="h-12 rounded-2xl border border-slate-800 bg-slate-900/60 px-4 text-sm text-slate-400 outline-none focus:border-blue-500/40"
            >
              <option value="all">All Status</option>

              <option value="open">Open</option>

              <option value="waiting">Waiting</option>

              <option value="in-progress">In Progress</option>

              <option value="resolved">Resolved</option>

              <option value="closed">Closed</option>
            </select>
          </div>
        </div>
      </div>

      {/* =====================================================
          SUMMARY
      ===================================================== */}

      <div className="mt-7 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
            <Ticket size={19} />
          </div>

          <div>
            <p className="text-sm font-semibold text-white">
              Available tickets
            </p>

            <p className="text-xs text-slate-600">
              {filteredTickets.length}{" "}
              {filteredTickets.length === 1 ? "ticket" : "tickets"} found
            </p>
          </div>
        </div>
      </div>

      {/* =====================================================
          TICKETS
      ===================================================== */}

      <div className="mt-5 space-y-4">
        {filteredTickets.length > 0 ? (
          filteredTickets.map((ticket) => {
            const id = getTicketId(ticket);

            const customer =
              ticket?.customer?.name ||
              ticket?.customer?.fullName ||
              ticket?.customerName ||
              "Customer";

            return (
              <div
                key={id}
                className="group rounded-3xl border border-slate-800 bg-[#0a1425] p-6 transition duration-300 hover:border-slate-700 hover:bg-[#0c172a]"
              >
                <div className="flex flex-col gap-5 xl:flex-row xl:items-center">
                  {/* =================================================
                      ICON
                  ================================================= */}

                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400">
                    <MessageSquareIcon />
                  </div>

                  {/* =================================================
                      CONTENT
                  ================================================= */}

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-medium text-slate-600">
                        #
                        {ticket?.ticketNumber ||
                          ticket?.number ||
                          String(id || "").slice(-6)}
                      </span>

                      <span
                        className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${getPriorityStyles(
                          ticket?.priority,
                        )}`}
                      >
                        {ticket?.priority
                          ? String(ticket.priority).charAt(0).toUpperCase() +
                            String(ticket.priority).slice(1)
                          : "Low"}
                      </span>
                    </div>

                    <h3 className="mt-2 truncate text-lg font-semibold text-slate-100">
                      {ticket?.subject || ticket?.title || "Support request"}
                    </h3>

                    <p className="mt-1 line-clamp-1 text-sm text-slate-600">
                      {ticket?.description ||
                        ticket?.message ||
                        "No description provided."}
                    </p>

                    <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-600">
                      <span className="flex items-center gap-2">
                        <UserRound size={14} />
                        {customer}
                      </span>

                      <span className="flex items-center gap-2">
                        <Clock3 size={14} />

                        {ticket?.createdAt
                          ? new Date(ticket.createdAt).toLocaleString()
                          : "Recently"}
                      </span>
                    </div>
                  </div>

                  {/* =================================================
                      STATUS
                  ================================================= */}

                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium ${getStatusStyles(
                        ticket?.status,
                      )}`}
                    >
                      {getStatusLabel(ticket?.status)}
                    </span>
                  </div>

                  {/* =================================================
                      ACTIONS
                  ================================================= */}

                  <div className="flex flex-wrap gap-2">
                    <Link
                      to={id ? `/agent/tickets/${id}` : "/agent/queue"}
                      className="flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900/60 px-4 text-sm font-medium text-slate-300 transition hover:border-blue-500/30 hover:text-white"
                    >
                      View
                      <ArrowUpRight size={16} />
                    </Link>

                    {id && (
                      <button
                        type="button"
                        disabled={assigningId === id}
                        onClick={() => handleAssign(id)}
                        className="flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {assigningId === id ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            Assigning...
                          </>
                        ) : (
                          "Assign to me"
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-3xl border border-slate-800 bg-[#0a1425] py-20 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800/70 text-slate-600">
              <Ticket size={28} />
            </div>

            <h3 className="mt-5 text-lg font-semibold text-slate-300">
              No tickets found
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
              {tickets.length === 0
                ? "There are currently no unassigned tickets available."
                : "There are no tickets matching your current filters."}
            </p>

            {(search || priorityFilter !== "all" || statusFilter !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setPriorityFilter("all");
                  setStatusFilter("all");
                }}
                className="mt-5 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm font-medium text-slate-400 transition hover:border-blue-500/30 hover:text-white"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

/* =========================================================
   MESSAGE ICON
========================================================= */

const MessageSquareIcon = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 11.5a8.38 8.38 0 0 1-9 8.5 9.3 9.3 0 0 1-3.7-.8L3 21l1.8-4.3A8.4 8.4 0 0 1 3 11.5 8.5 8.5 0 0 1 12 3a8.5 8.5 0 0 1 9 8.5Z" />
  </svg>
);

export default TicketQueue;
