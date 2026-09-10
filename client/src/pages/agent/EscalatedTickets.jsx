import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowUpRight,
  Clock3,
  Loader2,
  RefreshCw,
  Search,
  ShieldAlert,
  Ticket,
  UserRound,
} from "lucide-react";
import { Link } from "react-router-dom";

import { getEscalatedTickets } from "../../services/agentService";

// =====================================================
// BACKEND URL
// =====================================================

const BACKEND_URL =
  import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, "") ||
  "http://localhost:8000";

// =====================================================
// AVATAR URL
// =====================================================

const getAvatarUrl = (avatar) => {
  if (!avatar || typeof avatar !== "string") {
    return "";
  }

  const cleanAvatar = avatar.trim();

  if (!cleanAvatar) {
    return "";
  }

  // If MongoDB already contains a complete URL
  if (cleanAvatar.startsWith("http://") || cleanAvatar.startsWith("https://")) {
    return cleanAvatar;
  }

  // Convert relative path:
  // /uploads/avatars/user.jpg
  //
  // into:
  // http://localhost:8000/uploads/avatars/user.jpg

  return `${BACKEND_URL}${
    cleanAvatar.startsWith("/") ? cleanAvatar : `/${cleanAvatar}`
  }`;
};

// =====================================================
// DATE
// =====================================================

const formatDate = (date) => {
  if (!date) {
    return "Unknown";
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Unknown";
  }

  return parsedDate.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

// =====================================================
// PRIORITY STYLE
// =====================================================

const getPriorityStyle = (priority) => {
  switch (priority) {
    case "urgent":
      return "border-red-500/20 bg-red-500/10 text-red-400";

    case "high":
      return "border-orange-500/20 bg-orange-500/10 text-orange-400";

    case "medium":
      return "border-yellow-500/20 bg-yellow-500/10 text-yellow-400";

    case "low":
      return "border-slate-700 bg-slate-800/60 text-slate-400";

    default:
      return "border-slate-700 bg-slate-800/60 text-slate-400";
  }
};

// =====================================================
// STATUS STYLE
// =====================================================

const getStatusStyle = (status) => {
  switch (status) {
    case "open":
      return "border-blue-500/20 bg-blue-500/10 text-blue-400";

    case "in-progress":
      return "border-violet-500/20 bg-violet-500/10 text-violet-400";

    case "waiting":
      return "border-yellow-500/20 bg-yellow-500/10 text-yellow-400";

    case "resolved":
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-400";

    case "closed":
      return "border-slate-700 bg-slate-800/60 text-slate-400";

    default:
      return "border-slate-700 bg-slate-800/60 text-slate-400";
  }
};

// =====================================================
// COMPONENT
// =====================================================

const EscalatedTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  // ===================================================
  // LOAD ESCALATED TICKETS
  // ===================================================

  const loadTickets = useCallback(async (refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await getEscalatedTickets();

      const fetchedTickets = Array.isArray(response?.tickets)
        ? response.tickets
        : [];

      setTickets(fetchedTickets);
    } catch (error) {
      console.error("Load escalated tickets error:", error);

      setError(
        error?.response?.data?.message || "Failed to load escalated tickets.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // ===================================================
  // INITIAL LOAD
  // ===================================================

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  // ===================================================
  // FILTER
  // ===================================================

  const filteredTickets = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) {
      return tickets;
    }

    return tickets.filter((ticket) => {
      return (
        ticket.ticketNumber?.toLowerCase().includes(value) ||
        ticket.subject?.toLowerCase().includes(value) ||
        ticket.customer?.name?.toLowerCase().includes(value) ||
        ticket.customer?.email?.toLowerCase().includes(value) ||
        ticket.escalation?.reason?.toLowerCase().includes(value)
      );
    });
  }, [tickets, search]);

  // ===================================================
  // STATS
  // ===================================================

  const highPriorityCount = useMemo(() => {
    return tickets.filter(
      (ticket) => ticket.priority === "high" || ticket.priority === "urgent",
    ).length;
  }, [tickets]);

  const waitingCount = useMemo(() => {
    return tickets.filter((ticket) => ticket.status === "waiting").length;
  }, [tickets]);

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <div className="min-h-full bg-[#050b18] px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* ============================================= */}
        {/* PAGE HEADER */}
        {/* ============================================= */}

        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-orange-500/20 bg-orange-500/10">
                <ShieldAlert className="h-5 w-5 text-orange-400" />
              </div>

              <span className="text-sm font-medium text-orange-400">
                Escalation Center
              </span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Escalated Tickets
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Tickets requiring additional support or administrative attention.
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadTickets(true)}
            disabled={refreshing}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900/70 px-4 text-sm font-medium text-slate-300 transition hover:border-blue-500/30 hover:bg-slate-900 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>

        {/* ============================================= */}
        {/* STAT CARDS */}
        {/* ============================================= */}

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* TOTAL */}

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 transition hover:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-600">
                  Escalated
                </p>

                <p className="mt-2 text-2xl font-bold text-white">
                  {tickets.length}
                </p>

                <p className="mt-1 text-xs text-slate-600">
                  Active escalations
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-500/10">
                <ShieldAlert className="h-5 w-5 text-orange-400" />
              </div>
            </div>
          </div>

          {/* HIGH PRIORITY */}

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 transition hover:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-600">
                  High Priority
                </p>

                <p className="mt-2 text-2xl font-bold text-white">
                  {highPriorityCount}
                </p>

                <p className="mt-1 text-xs text-slate-600">
                  High or urgent tickets
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-500/10">
                <AlertCircle className="h-5 w-5 text-red-400" />
              </div>
            </div>
          </div>

          {/* WAITING */}

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 transition hover:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-600">
                  Waiting
                </p>

                <p className="mt-2 text-2xl font-bold text-white">
                  {waitingCount}
                </p>

                <p className="mt-1 text-xs text-slate-600">Awaiting action</p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-yellow-500/10">
                <Clock3 className="h-5 w-5 text-yellow-400" />
              </div>
            </div>
          </div>
        </div>

        {/* ============================================= */}
        {/* SEARCH */}
        {/* ============================================= */}

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search tickets..."
              className="h-11 w-full rounded-xl border border-slate-800 bg-slate-900/60 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500/40 focus:bg-slate-900"
            />
          </div>

          <div className="text-sm text-slate-600">
            {filteredTickets.length}{" "}
            {filteredTickets.length === 1 ? "ticket" : "tickets"}
          </div>
        </div>

        {/* ============================================= */}
        {/* ERROR */}
        {/* ============================================= */}

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />

            <div>
              <p className="text-sm font-medium text-red-300">
                Unable to load escalated tickets
              </p>

              <p className="mt-1 text-xs text-red-400/70">{error}</p>
            </div>
          </div>
        )}

        {/* ============================================= */}
        {/* LOADING */}
        {/* ============================================= */}

        {loading ? (
          <div className="flex min-h-[360px] items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/40">
            <div className="flex flex-col items-center">
              <Loader2 className="h-7 w-7 animate-spin text-blue-400" />

              <p className="mt-3 text-sm text-slate-600">
                Loading escalated tickets...
              </p>
            </div>
          </div>
        ) : filteredTickets.length === 0 ? (
          /* =========================================== */
          /* EMPTY */
          /* =========================================== */

          <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/40 px-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800/60">
              <ShieldAlert className="h-7 w-7 text-slate-600" />
            </div>

            <h2 className="mt-5 text-lg font-semibold text-white">
              {search ? "No matching tickets" : "No escalated tickets"}
            </h2>

            <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">
              {search
                ? "Try searching with another ticket number, customer, or escalation reason."
                : "Tickets escalated by agents will appear here when they require additional assistance."}
            </p>
          </div>
        ) : (
          /* =========================================== */
          /* TICKET LIST */
          /* =========================================== */

          <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40">
            {/* TABLE HEADER */}

            <div className="hidden border-b border-slate-800 px-6 py-4 lg:grid lg:grid-cols-[1.5fr_1fr_0.8fr_1fr_auto] lg:items-center lg:gap-6">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-600">
                Ticket
              </p>

              <p className="text-xs font-medium uppercase tracking-wider text-slate-600">
                Customer
              </p>

              <p className="text-xs font-medium uppercase tracking-wider text-slate-600">
                Priority
              </p>

              <p className="text-xs font-medium uppercase tracking-wider text-slate-600">
                Escalated
              </p>

              <span />
            </div>

            {/* TICKETS */}

            <div className="divide-y divide-slate-800/80">
              {filteredTickets.map((ticket) => {
                // Customer avatar URL
                const customerAvatar = getAvatarUrl(ticket.customer?.avatar);

                return (
                  <div
                    key={ticket._id}
                    className="group px-5 py-5 transition hover:bg-slate-900/80 sm:px-6"
                  >
                    <div className="lg:grid lg:grid-cols-[1.5fr_1fr_0.8fr_1fr_auto] lg:items-center lg:gap-6">
                      {/* ================================= */}
                      {/* TICKET */}
                      {/* ================================= */}

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs text-slate-600">
                            {ticket.ticketNumber || `#${ticket._id?.slice(-6)}`}
                          </span>

                          <span className="rounded-full border border-orange-500/20 bg-orange-500/10 px-2 py-0.5 text-[10px] font-medium text-orange-400">
                            Escalated
                          </span>
                        </div>

                        <h3 className="mt-2 truncate text-sm font-semibold text-white">
                          {ticket.subject || "Untitled ticket"}
                        </h3>

                        <div className="mt-2 flex items-center gap-2">
                          <span
                            className={`rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize ${getStatusStyle(
                              ticket.status,
                            )}`}
                          >
                            {ticket.status || "open"}
                          </span>

                          <span className="text-xs text-slate-700">•</span>

                          <span className="truncate text-xs text-slate-600">
                            {ticket.escalation?.reason || "No reason"}
                          </span>
                        </div>
                      </div>

                      {/* ================================= */}
                      {/* CUSTOMER */}
                      {/* ================================= */}

                      <div className="mt-4 lg:mt-0">
                        <div className="flex items-center gap-3">
                          {/* AVATAR */}

                          <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-800">
                            {customerAvatar ? (
                              <img
                                src={customerAvatar}
                                alt={ticket.customer?.name || "Customer"}
                                className="h-full w-full object-cover"
                                onError={(event) => {
                                  event.currentTarget.style.display = "none";
                                }}
                              />
                            ) : (
                              <UserRound className="h-4 w-4 text-slate-600" />
                            )}
                          </div>

                          {/* CUSTOMER INFO */}

                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-slate-300">
                              {ticket.customer?.name || "Unknown customer"}
                            </p>

                            <p className="truncate text-xs text-slate-600">
                              {ticket.customer?.email || "No email"}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* ================================= */}
                      {/* PRIORITY */}
                      {/* ================================= */}

                      <div className="mt-4 lg:mt-0">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium capitalize ${getPriorityStyle(
                            ticket.priority,
                          )}`}
                        >
                          {ticket.priority || "medium"}
                        </span>
                      </div>

                      {/* ================================= */}
                      {/* ESCALATION DATE */}
                      {/* ================================= */}

                      <div className="mt-4 lg:mt-0">
                        <div className="flex items-center gap-2">
                          <Clock3 className="h-4 w-4 text-slate-700" />

                          <div>
                            <p className="text-xs text-slate-600">Escalated</p>

                            <p className="mt-0.5 text-xs text-slate-400">
                              {formatDate(ticket.escalation?.escalatedAt)}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* ================================= */}
                      {/* ACTION */}
                      {/* ================================= */}

                      <div className="mt-5 lg:mt-0">
                        <Link
                          to={`/agent/tickets/${ticket._id}`}
                          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-4 text-xs font-medium text-slate-300 transition hover:border-blue-500/30 hover:bg-blue-500/10 hover:text-blue-400 lg:w-auto"
                        >
                          View
                          <ArrowUpRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>

                    {/* ================================= */}
                    {/* ESCALATION DETAILS */}
                    {/* ================================= */}

                    <div className="mt-5 rounded-xl border border-orange-500/10 bg-orange-500/[0.03] px-4 py-3">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <p className="text-[10px] font-medium uppercase tracking-wider text-orange-400/60">
                            Escalation Reason
                          </p>

                          <p className="mt-1 text-sm text-slate-400">
                            {ticket.escalation?.reason || "No reason provided"}
                          </p>
                        </div>

                        <div className="shrink-0 text-xs text-slate-600">
                          Escalated by{" "}
                          <span className="text-slate-400">
                            {ticket.escalation?.escalatedBy?.name ||
                              ticket.escalation?.escalatedBy?.email ||
                              "Unknown agent"}
                          </span>
                        </div>
                      </div>

                      {ticket.escalation?.note && (
                        <div className="mt-3 border-t border-orange-500/10 pt-3">
                          <p className="text-[10px] font-medium uppercase tracking-wider text-slate-700">
                            Escalation Note
                          </p>

                          <p className="mt-1 text-xs leading-5 text-slate-500">
                            {ticket.escalation.note}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ============================================= */}
        {/* FOOTER */}
        {/* ============================================= */}

        {!loading && tickets.length > 0 && (
          <div className="mt-5 flex items-center gap-2 text-xs text-slate-700">
            <Ticket className="h-3.5 w-3.5" />

            <span>
              Showing {filteredTickets.length} of {tickets.length} escalated
              tickets
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default EscalatedTickets;
