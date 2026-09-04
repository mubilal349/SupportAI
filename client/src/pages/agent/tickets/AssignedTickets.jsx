import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  Loader2,
  RefreshCw,
  Search,
  Ticket,
  UserRound,
} from "lucide-react";

import { Link } from "react-router-dom";

import { getAssignedTickets } from "../../../services/agentService";

const normalizeTickets = (response) => {
  const data =
    response?.data?.tickets || response?.tickets || response?.data || [];

  return Array.isArray(data) ? data : [];
};

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

  return "bg-slate-800 text-slate-400 border-slate-700";
};

const getStatusStyles = (status) => {
  const value = String(status || "").toLowerCase();

  if (value.includes("resolved") || value.includes("closed")) {
    return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
  }

  if (value.includes("progress")) {
    return "bg-blue-500/10 text-blue-400 border-blue-500/20";
  }

  if (value.includes("pending")) {
    return "bg-amber-500/10 text-amber-400 border-amber-500/20";
  }

  return "bg-slate-800 text-slate-400 border-slate-700";
};

const AssignedTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const loadTickets = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await getAssignedTickets();

      setTickets(normalizeTickets(response));
    } catch (err) {
      console.error("Assigned tickets error:", err);

      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Unable to load your assigned tickets.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const filteredTickets = useMemo(() => {
    const query = search.trim().toLowerCase();

    return tickets.filter((ticket) => {
      const subject = ticket?.subject || ticket?.title || "";

      const customer =
        ticket?.customer?.name ||
        ticket?.customer?.fullName ||
        ticket?.customerName ||
        "";

      const number =
        ticket?.ticketNumber ||
        ticket?.number ||
        ticket?.id ||
        ticket?._id ||
        "";

      const status = String(ticket?.status || "").toLowerCase();

      const matchesSearch =
        !query ||
        `${subject} ${customer} ${number}`.toLowerCase().includes(query);

      const matchesFilter =
        filter === "all" ||
        status === filter ||
        (filter === "open" && status === "open");

      return matchesSearch && matchesFilter;
    });
  }, [tickets, search, filter]);

  const counts = useMemo(() => {
    return {
      all: tickets.length,
      open: tickets.filter(
        (ticket) => String(ticket?.status || "").toLowerCase() === "open",
      ).length,
      progress: tickets.filter((ticket) =>
        String(ticket?.status || "")
          .toLowerCase()
          .includes("progress"),
      ).length,
      resolved: tickets.filter((ticket) => {
        const status = String(ticket?.status || "").toLowerCase();

        return status.includes("resolved") || status.includes("closed");
      }).length,
    };
  }, [tickets]);

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-110px)] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={32} className="animate-spin text-blue-500" />

          <p className="text-sm text-slate-500">Loading your tickets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1500px] px-4 py-8 sm:px-6 lg:px-10 lg:py-12">
      {/* =========================================================
          HEADER
      ========================================================= */}
      <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-400">
            Workspace
          </p>

          <h1 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">
            My Tickets
          </h1>

          <p className="mt-3 text-base text-slate-500">
            Manage the support tickets currently assigned to you.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadTickets(true)}
          className="flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900/70 px-4 text-sm font-medium text-slate-400 transition hover:border-blue-500/30 hover:text-white"
        >
          <RefreshCw size={17} className={refreshing ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* =========================================================
          ERROR
      ========================================================= */}
      {error && (
        <div className="mt-6 flex items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 px-5 py-4">
          <AlertCircle size={19} className="text-red-400" />

          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {/* =========================================================
          STATS
      ========================================================= */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-800 bg-[#0a1425] p-5">
          <p className="text-xs uppercase tracking-wider text-slate-600">
            All tickets
          </p>

          <p className="mt-2 text-2xl font-bold text-white">{counts.all}</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-[#0a1425] p-5">
          <p className="text-xs uppercase tracking-wider text-slate-600">
            Open
          </p>

          <p className="mt-2 text-2xl font-bold text-blue-400">{counts.open}</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-[#0a1425] p-5">
          <p className="text-xs uppercase tracking-wider text-slate-600">
            In progress
          </p>

          <p className="mt-2 text-2xl font-bold text-amber-400">
            {counts.progress}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-[#0a1425] p-5">
          <p className="text-xs uppercase tracking-wider text-slate-600">
            Resolved
          </p>

          <p className="mt-2 text-2xl font-bold text-emerald-400">
            {counts.resolved}
          </p>
        </div>
      </div>

      {/* =========================================================
          SEARCH / FILTER
      ========================================================= */}
      <div className="mt-7 rounded-3xl border border-slate-800 bg-[#0a1425] p-4">
        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="relative flex-1">
            <Search
              size={19}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600"
            />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search your tickets..."
              className="h-12 w-full rounded-2xl border border-slate-800 bg-slate-900/60 pl-11 pr-4 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-blue-500/40"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              ["all", `All ${counts.all}`],
              ["open", `Open ${counts.open}`],
              ["in_progress", `In Progress ${counts.progress}`],
              ["resolved", `Resolved ${counts.resolved}`],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                className={[
                  "h-12 rounded-2xl px-4 text-sm font-medium transition",
                  filter === value
                    ? "bg-blue-600 text-white"
                    : "border border-slate-800 bg-slate-900/60 text-slate-500 hover:text-slate-200",
                ].join(" ")}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* =========================================================
          TICKET LIST
      ========================================================= */}
      <div className="mt-6 space-y-4">
        {filteredTickets.length > 0 ? (
          filteredTickets.map((ticket) => {
            const id = ticket?._id || ticket?.id;

            const customer =
              ticket?.customer?.name ||
              ticket?.customer?.fullName ||
              ticket?.customerName ||
              "Customer";

            return (
              <Link
                key={id}
                to={id ? `/agent/tickets/${id}` : "/agent/tickets"}
                className="group block rounded-3xl border border-slate-800 bg-[#0a1425] p-6 transition duration-300 hover:border-slate-700 hover:bg-[#0c172a]"
              >
                <div className="flex flex-col gap-5 xl:flex-row xl:items-center">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400">
                    <Ticket size={22} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs text-slate-600">
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

                    <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-600">
                      <span className="flex items-center gap-2">
                        <UserRound size={14} />
                        {customer}
                      </span>

                      <span className="flex items-center gap-2">
                        <Clock3 size={14} />
                        {ticket?.updatedAt
                          ? new Date(ticket.updatedAt).toLocaleString()
                          : "Recently"}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium ${getStatusStyles(
                      ticket?.status,
                    )}`}
                  >
                    {ticket?.status || "Open"}
                  </span>

                  <ArrowUpRight
                    size={19}
                    className="text-slate-700 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-blue-400"
                  />
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
              No tickets found
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
              You currently don't have any tickets matching this filter.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssignedTickets;
