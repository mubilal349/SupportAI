import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileText,
  Filter,
  Loader2,
  MessageSquare,
  Plus,
  RefreshCw,
  Search,
  UserRound,
  X,
  XCircle,
} from "lucide-react";
import { Link } from "react-router-dom";

import { createTicket, getTickets } from "../../services/ticketService";

const Tickets = () => {
  // =========================================================
  // STATE
  // =========================================================

  const [tickets, setTickets] = useState([]);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [priority, setPriority] = useState("all");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [creating, setCreating] = useState(false);

  const [error, setError] = useState("");

  const [showCreateModal, setShowCreateModal] = useState(false);

  const [newTicket, setNewTicket] = useState({
    subject: "",
    description: "",
    category: "General",
    priority: "medium",
  });

  // =========================================================
  // STATUS CONFIG
  // =========================================================

  const statusConfig = {
    open: {
      label: "Open",
      icon: AlertCircle,
      className: "border-blue-500/20 bg-blue-500/10 text-blue-400",
    },

    pending: {
      label: "Pending",
      icon: Clock3,
      className: "border-yellow-500/20 bg-yellow-500/10 text-yellow-400",
    },

    "in-progress": {
      label: "In progress",
      icon: Clock3,
      className: "border-orange-500/20 bg-orange-500/10 text-orange-400",
    },

    resolved: {
      label: "Resolved",
      icon: CheckCircle2,
      className: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
    },

    closed: {
      label: "Closed",
      icon: XCircle,
      className: "border-slate-700 bg-slate-800 text-slate-500",
    },
  };

  const priorityConfig = {
    high: "text-red-400 bg-red-500/10 border-red-500/20",

    medium: "text-orange-400 bg-orange-500/10 border-orange-500/20",

    low: "text-slate-400 bg-slate-800 border-slate-700",
  };

  // =========================================================
  // LOAD TICKETS
  // =========================================================

  useEffect(() => {
    loadTickets();
  }, []);

  const normalizeTicket = (ticket) => {
    if (!ticket) return null;

    return {
      ...ticket,

      // MongoDB ID
      id: ticket.id || ticket._id || `ticket-${Date.now()}`,

      subject: ticket.subject || "Untitled ticket",

      description: ticket.description || "",

      category: ticket.category || "General",

      status: String(ticket.status || "open").toLowerCase(),

      priority: String(ticket.priority || "medium").toLowerCase(),

      agent:
        ticket.agent?.name ||
        ticket.assignedTo?.name ||
        ticket.agentName ||
        "Unassigned",

      updated: ticket.updatedAt
        ? formatDate(ticket.updatedAt)
        : ticket.updated || "—",

      replies:
        ticket.replies?.length || ticket.replyCount || ticket.repliesCount || 0,
    };
  };

  const formatDate = (date) => {
    if (!date) return "—";

    try {
      return new Date(date).toLocaleString();
    } catch {
      return "—";
    }
  };

  const loadTickets = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getTickets();

      console.log("CUSTOMER TICKETS:", response);

      const backendTickets = Array.isArray(response?.tickets)
        ? response.tickets
        : Array.isArray(response)
          ? response
          : [];

      const normalizedTickets = backendTickets
        .map(normalizeTicket)
        .filter(Boolean);

      setTickets(normalizedTickets);
    } catch (err) {
      console.error("LOAD TICKETS ERROR:", err);

      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Failed to load tickets.",
      );

      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // REFRESH TICKETS
  // =========================================================

  const handleRefresh = async () => {
    try {
      setRefreshing(true);

      await loadTickets();
    } finally {
      setRefreshing(false);
    }
  };

  // =========================================================
  // CREATE TICKET
  // =========================================================

  const handleCreateTicket = async (e) => {
    e.preventDefault();

    setError("");

    if (!newTicket.subject.trim()) {
      setError("Please enter a ticket subject.");
      return;
    }

    if (!newTicket.description.trim()) {
      setError("Please describe your issue.");
      return;
    }

    try {
      setCreating(true);

      const payload = {
        subject: newTicket.subject.trim(),

        description: newTicket.description.trim(),

        category: newTicket.category,

        priority: newTicket.priority,
      };

      console.log("CREATING TICKET:", payload);

      const response = await createTicket(payload);

      console.log("CREATED TICKET:", response);

      if (response?.ticket) {
        const createdTicket = normalizeTicket(response.ticket);

        setTickets((previousTickets) => [createdTicket, ...previousTickets]);
      }

      // Reset form
      setNewTicket({
        subject: "",
        description: "",
        category: "General",
        priority: "medium",
      });

      // Close modal
      setShowCreateModal(false);

      // Reload from database
      await loadTickets();
    } catch (err) {
      console.error("CREATE TICKET ERROR:", err);

      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Failed to create ticket.",
      );
    } finally {
      setCreating(false);
    }
  };

  // =========================================================
  // FILTER TICKETS
  // =========================================================

  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      const ticketId = String(ticket.id || ticket._id || "").toLowerCase();

      const subject = String(ticket.subject || "").toLowerCase();

      const category = String(ticket.category || "").toLowerCase();

      const ticketStatus = String(ticket.status || "").toLowerCase();

      const ticketPriority = String(ticket.priority || "").toLowerCase();

      const searchValue = search.toLowerCase().trim();

      const matchesSearch =
        ticketId.includes(searchValue) ||
        subject.includes(searchValue) ||
        category.includes(searchValue);

      const matchesStatus = status === "all" || ticketStatus === status;

      const matchesPriority = priority === "all" || ticketPriority === priority;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [tickets, search, status, priority]);

  // =========================================================
  // STATS
  // =========================================================

  const totalTickets = tickets.length;

  const openTickets = tickets.filter(
    (ticket) => ticket.status === "open",
  ).length;

  const inProgressTickets = tickets.filter(
    (ticket) => ticket.status === "in-progress",
  ).length;

  const resolvedTickets = tickets.filter(
    (ticket) => ticket.status === "resolved" || ticket.status === "closed",
  ).length;

  // =========================================================
  // MODAL CLOSE
  // =========================================================

  const closeModal = () => {
    if (creating) return;

    setShowCreateModal(false);

    setError("");

    setNewTicket({
      subject: "",
      description: "",
      category: "General",
      priority: "medium",
    });
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* =====================================================
          HEADER
      ====================================================== */}

      <header className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <Link
              to="/support"
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 transition hover:bg-blue-700"
            >
              <MessageSquare className="h-5 w-5" />
            </Link>

            <div>
              <h1 className="font-bold">SupportAI</h1>

              <p className="text-xs text-slate-600">Support tickets</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Refresh */}

            <button
              type="button"
              onClick={handleRefresh}
              disabled={loading || refreshing}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-400 transition hover:bg-slate-800 hover:text-white disabled:opacity-50"
              title="Refresh tickets"
            >
              <RefreshCw
                className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
              />
            </button>

            {/* Create */}

            <button
              type="button"
              onClick={() => {
                setError("");
                setShowCreateModal(true);
              }}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold transition hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Create ticket
            </button>
          </div>
        </div>
      </header>

      {/* =====================================================
          MAIN
      ====================================================== */}

      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Heading */}

        <div className="mb-8">
          <h2 className="text-3xl font-bold">Support Tickets</h2>

          <p className="mt-2 text-slate-500">
            Track your support requests and communicate with our support team.
          </p>
        </div>

        {/* Error */}

        {error && !showCreateModal && (
          <div className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3">
            <p className="text-sm text-red-400">{error}</p>

            <button
              type="button"
              onClick={() => setError("")}
              className="text-red-400 hover:text-red-300"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* =================================================
            STATS
        ================================================== */}

        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <TicketStat
            icon={FileText}
            label="Total tickets"
            value={totalTickets}
          />

          <TicketStat icon={AlertCircle} label="Open" value={openTickets} />

          <TicketStat
            icon={Clock3}
            label="In progress"
            value={inProgressTickets}
          />

          <TicketStat
            icon={CheckCircle2}
            label="Resolved"
            value={resolvedTickets}
          />
        </div>

        {/* =================================================
            TICKETS CARD
        ================================================== */}

        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60">
          {/* Filters */}

          <div className="border-b border-slate-800 p-5">
            <div className="flex flex-col gap-3 xl:flex-row">
              {/* Search */}

              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />

                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by ticket ID, subject, or category..."
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 py-3 pl-10 pr-4 text-sm text-white outline-none placeholder:text-slate-700 focus:border-blue-500"
                />
              </div>

              <div className="flex gap-3">
                {/* Status */}

                <div className="relative">
                  <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />

                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="appearance-none rounded-xl border border-slate-800 bg-slate-950 py-3 pl-10 pr-8 text-xs text-slate-400 outline-none focus:border-blue-500"
                  >
                    <option value="all">All statuses</option>

                    <option value="open">Open</option>

                    <option value="pending">Pending</option>

                    <option value="in-progress">In progress</option>

                    <option value="resolved">Resolved</option>

                    <option value="closed">Closed</option>
                  </select>
                </div>

                {/* Priority */}

                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-xs text-slate-400 outline-none focus:border-blue-500"
                >
                  <option value="all">All priorities</option>

                  <option value="high">High</option>

                  <option value="medium">Medium</option>

                  <option value="low">Low</option>
                </select>
              </div>
            </div>
          </div>

          {/* =================================================
              LOADING
          ================================================== */}

          {loading ? (
            <div className="flex min-h-[350px] flex-col items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />

              <p className="mt-4 text-sm text-slate-500">
                Loading your tickets...
              </p>
            </div>
          ) : (
            <>
              {/* =================================================
                  DESKTOP TABLE
              ================================================== */}

              <div className="hidden overflow-x-auto md:block">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-800 text-left">
                      <th className="px-5 py-4 text-[10px] font-semibold uppercase tracking-wider text-slate-700">
                        Ticket
                      </th>

                      <th className="px-5 py-4 text-[10px] font-semibold uppercase tracking-wider text-slate-700">
                        Status
                      </th>

                      <th className="px-5 py-4 text-[10px] font-semibold uppercase tracking-wider text-slate-700">
                        Priority
                      </th>

                      <th className="px-5 py-4 text-[10px] font-semibold uppercase tracking-wider text-slate-700">
                        Assigned to
                      </th>

                      <th className="px-5 py-4 text-[10px] font-semibold uppercase tracking-wider text-slate-700">
                        Updated
                      </th>

                      <th />
                    </tr>
                  </thead>

                  <tbody>
                    {filteredTickets.map((ticket) => {
                      const ticketStatus =
                        statusConfig[ticket.status] || statusConfig.open;

                      const StatusIcon = ticketStatus.icon;

                      return (
                        <tr
                          key={ticket.id}
                          className="border-b border-slate-800/70 transition hover:bg-slate-800/30"
                        >
                          {/* Ticket */}

                          <td className="px-5 py-5">
                            <Link
                              to={`/support/tickets/${ticket.id}`}
                              className="group block"
                            >
                              <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                                  <FileText className="h-4 w-4" />
                                </div>

                                <div>
                                  <p className="text-xs font-semibold group-hover:text-blue-400">
                                    {ticket.subject}
                                  </p>

                                  <p className="mt-1 text-[10px] text-slate-700">
                                    {ticket.id} · {ticket.category}
                                  </p>
                                </div>
                              </div>
                            </Link>
                          </td>

                          {/* Status */}

                          <td className="px-5 py-5">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium ${ticketStatus.className}`}
                            >
                              <StatusIcon className="h-3 w-3" />

                              {ticketStatus.label}
                            </span>
                          </td>

                          {/* Priority */}

                          <td className="px-5 py-5">
                            <span
                              className={`rounded-full border px-2.5 py-1 text-[10px] font-medium capitalize ${
                                priorityConfig[ticket.priority] ||
                                priorityConfig.medium
                              }`}
                            >
                              {ticket.priority}
                            </span>
                          </td>

                          {/* Agent */}

                          <td className="px-5 py-5">
                            <div className="flex items-center gap-2">
                              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-800">
                                <UserRound className="h-3.5 w-3.5 text-slate-500" />
                              </div>

                              <span className="text-xs text-slate-500">
                                {ticket.agent}
                              </span>
                            </div>
                          </td>

                          {/* Updated */}

                          <td className="px-5 py-5">
                            <div>
                              <p className="text-xs text-slate-500">
                                {ticket.updated}
                              </p>

                              <p className="mt-1 text-[10px] text-slate-700">
                                {ticket.replies} replies
                              </p>
                            </div>
                          </td>

                          {/* View */}

                          <td className="px-5 py-5">
                            <Link
                              to={`/support/tickets/${ticket.id}`}
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-800 hover:text-white"
                            >
                              <ChevronRight className="h-4 w-4" />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* =================================================
                  MOBILE
              ================================================== */}

              <div className="divide-y divide-slate-800 md:hidden">
                {filteredTickets.map((ticket) => {
                  const ticketStatus =
                    statusConfig[ticket.status] || statusConfig.open;

                  const StatusIcon = ticketStatus.icon;

                  return (
                    <Link
                      key={ticket.id}
                      to={`/support/tickets/${ticket.id}`}
                      className="block p-5 transition hover:bg-slate-800/30"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                            <FileText className="h-4 w-4" />
                          </div>

                          <div>
                            <p className="text-sm font-semibold">
                              {ticket.subject}
                            </p>

                            <p className="mt-1 text-[10px] text-slate-700">
                              {ticket.id} · {ticket.category}
                            </p>
                          </div>
                        </div>

                        <ChevronRight className="h-4 w-4 shrink-0 text-slate-700" />
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] ${ticketStatus.className}`}
                        >
                          <StatusIcon className="h-3 w-3" />

                          {ticketStatus.label}
                        </span>

                        <span
                          className={`rounded-full border px-2 py-1 text-[10px] capitalize ${
                            priorityConfig[ticket.priority] ||
                            priorityConfig.medium
                          }`}
                        >
                          {ticket.priority}
                        </span>
                      </div>

                      <div className="mt-4 flex justify-between text-[10px] text-slate-700">
                        <span>Assigned to {ticket.agent}</span>

                        <span>{ticket.updated}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </>
          )}

          {/* =================================================
              EMPTY STATE
          ================================================== */}

          {!loading && filteredTickets.length === 0 && (
            <div className="flex min-h-[300px] flex-col items-center justify-center p-8 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800 text-slate-600">
                <FileText className="h-6 w-6" />
              </div>

              <h3 className="mt-5 font-semibold">
                {tickets.length === 0 ? "No tickets yet" : "No tickets found"}
              </h3>

              <p className="mt-2 max-w-sm text-sm text-slate-600">
                {tickets.length === 0
                  ? "Create your first support ticket and our team will help you."
                  : "Try changing your search or filters."}
              </p>

              {tickets.length === 0 && (
                <button
                  type="button"
                  onClick={() => setShowCreateModal(true)}
                  className="mt-5 flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold transition hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4" />
                  Create your first ticket
                </button>
              )}
            </div>
          )}
        </div>
      </main>

      {/* =====================================================
          CREATE TICKET MODAL
      ====================================================== */}

      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              closeModal();
            }
          }}
        >
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            {/* Modal Header */}

            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Create Support Ticket</h3>

                <p className="mt-1 text-sm text-slate-500">
                  Tell us what you need help with.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={creating}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-800 hover:text-white disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}

            <form onSubmit={handleCreateTicket} className="space-y-5">
              {/* Subject */}

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Subject
                </label>

                <input
                  type="text"
                  value={newTicket.subject}
                  onChange={(e) =>
                    setNewTicket((previous) => ({
                      ...previous,
                      subject: e.target.value,
                    }))
                  }
                  placeholder="What do you need help with?"
                  disabled={creating}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-700 focus:border-blue-500 disabled:opacity-50"
                />
              </div>

              {/* Description */}

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Description
                </label>

                <textarea
                  value={newTicket.description}
                  onChange={(e) =>
                    setNewTicket((previous) => ({
                      ...previous,
                      description: e.target.value,
                    }))
                  }
                  rows={5}
                  placeholder="Describe your issue in detail..."
                  disabled={creating}
                  className="w-full resize-none rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-700 focus:border-blue-500 disabled:opacity-50"
                />
              </div>

              {/* Category + Priority */}

              <div className="grid gap-4 sm:grid-cols-2">
                {/* Category */}

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Category
                  </label>

                  <select
                    value={newTicket.category}
                    onChange={(e) =>
                      setNewTicket((previous) => ({
                        ...previous,
                        category: e.target.value,
                      }))
                    }
                    disabled={creating}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-400 outline-none focus:border-blue-500 disabled:opacity-50"
                  >
                    <option value="General">General</option>

                    <option value="Billing">Billing</option>

                    <option value="Technical">Technical</option>

                    <option value="Account">Account</option>

                    <option value="Subscription">Subscription</option>
                  </select>
                </div>

                {/* Priority */}

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Priority
                  </label>

                  <select
                    value={newTicket.priority}
                    onChange={(e) =>
                      setNewTicket((previous) => ({
                        ...previous,
                        priority: e.target.value,
                      }))
                    }
                    disabled={creating}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-400 outline-none focus:border-blue-500 disabled:opacity-50"
                  >
                    <option value="low">Low</option>

                    <option value="medium">Medium</option>

                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              {/* Modal Error */}

              {error && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              {/* Actions */}

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={creating}
                  className="rounded-xl border border-slate-800 px-5 py-3 text-sm text-slate-400 transition hover:bg-slate-800 hover:text-white disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={creating}
                  className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {creating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      Create ticket
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// ===========================================================
// TICKET STAT COMPONENT
// ===========================================================

const TicketStat = ({ icon: Icon, label, value }) => {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
      <div className="flex items-center justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
          <Icon className="h-4 w-4" />
        </div>

        <span className="text-2xl font-bold">{value}</span>
      </div>

      <p className="mt-4 text-xs text-slate-600">{label}</p>
    </div>
  );
};

export default Tickets;
