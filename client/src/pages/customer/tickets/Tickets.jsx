import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileText,
  Filter,
  Inbox,
  Bot,
  Loader2,
  MessageSquare,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  UserRound,
  X,
  XCircle,
} from "lucide-react";
import { Link } from "react-router-dom";

import { createTicket, getTickets } from "../../../services/ticketService";

const Tickets = () => {
  // =========================================================
  // STATE
  // =========================================================

  const [tickets, setTickets] = useState([]);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [priority, setPriority] = useState("all");
  const [category, setCategory] = useState("all");

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

  // =========================================================
  // PRIORITY CONFIG
  // =========================================================

  const priorityConfig = {
    high: {
      label: "High",
      className: "text-red-400 bg-red-500/10 border-red-500/20",
    },

    medium: {
      label: "Medium",
      className: "text-orange-400 bg-orange-500/10 border-orange-500/20",
    },

    low: {
      label: "Low",
      className: "text-slate-400 bg-slate-800 border-slate-700",
    },
  };

  // =========================================================
  // LOAD TICKETS
  // =========================================================

  useEffect(() => {
    loadTickets();
  }, []);

  const formatDate = (date) => {
    if (!date) return "—";

    try {
      return new Date(date).toLocaleString();
    } catch {
      return "—";
    }
  };

  const normalizeTicket = (ticket) => {
    if (!ticket) return null;

    return {
      ...ticket,

      // MongoDB ID
      id: ticket.id || ticket._id || `ticket-${Date.now()}`,

      // Human-readable number
      ticketNumber: ticket.ticketNumber || ticket.id || ticket._id || "—",

      subject: ticket.subject || "Untitled ticket",

      description: ticket.description || "",

      category: ticket.category || "General",

      status: String(ticket.status || "open").toLowerCase(),

      priority: String(ticket.priority || "medium").toLowerCase(),

      agent:
        ticket.assignedAgent?.name ||
        ticket.agent?.name ||
        ticket.assignedTo?.name ||
        ticket.agentName ||
        "Unassigned",

      updated: ticket.updatedAt
        ? formatDate(ticket.updatedAt)
        : ticket.updated || "—",

      created: ticket.createdAt
        ? formatDate(ticket.createdAt)
        : ticket.created || "—",

      replies:
        typeof ticket.replies === "number"
          ? ticket.replies
          : ticket.replies?.length ||
            ticket.replyCount ||
            ticket.repliesCount ||
            0,
    };
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
  // REFRESH
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

        if (createdTicket) {
          setTickets((previousTickets) => [createdTicket, ...previousTickets]);
        }
      }

      resetTicketForm();

      setShowCreateModal(false);

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
  // RESET FORM
  // =========================================================

  const resetTicketForm = () => {
    setNewTicket({
      subject: "",
      description: "",
      category: "General",
      priority: "medium",
    });
  };

  // =========================================================
  // CLOSE MODAL
  // =========================================================

  const closeModal = () => {
    if (creating) return;

    setShowCreateModal(false);
    setError("");
    resetTicketForm();
  };

  // =========================================================
  // CLEAR FILTERS
  // =========================================================

  const clearFilters = () => {
    setSearch("");
    setStatus("all");
    setPriority("all");
    setCategory("all");
  };

  const hasActiveFilters =
    search.trim() ||
    status !== "all" ||
    priority !== "all" ||
    category !== "all";

  // =========================================================
  // FILTER TICKETS
  // =========================================================

  const filteredTickets = useMemo(() => {
    const searchValue = search.toLowerCase().trim();

    return tickets.filter((ticket) => {
      const ticketNumber = String(ticket.ticketNumber || "").toLowerCase();

      const ticketId = String(ticket.id || ticket._id || "").toLowerCase();

      const subject = String(ticket.subject || "").toLowerCase();

      const categoryValue = String(ticket.category || "").toLowerCase();

      const description = String(ticket.description || "").toLowerCase();

      const ticketStatus = String(ticket.status || "").toLowerCase();

      const ticketPriority = String(ticket.priority || "").toLowerCase();

      const matchesSearch =
        !searchValue ||
        ticketNumber.includes(searchValue) ||
        ticketId.includes(searchValue) ||
        subject.includes(searchValue) ||
        categoryValue.includes(searchValue) ||
        description.includes(searchValue);

      const matchesStatus = status === "all" || ticketStatus === status;

      const matchesPriority = priority === "all" || ticketPriority === priority;

      const matchesCategory =
        category === "all" || categoryValue === category.toLowerCase();

      return (
        matchesSearch && matchesStatus && matchesPriority && matchesCategory
      );
    });
  }, [tickets, search, status, priority, category]);

  // =========================================================
  // STATISTICS
  // =========================================================

  const totalTickets = tickets.length;

  const openTickets = tickets.filter(
    (ticket) => ticket.status === "open",
  ).length;

  const inProgressTickets = tickets.filter(
    (ticket) => ticket.status === "in-progress",
  ).length;

  const pendingTickets = tickets.filter(
    (ticket) => ticket.status === "pending",
  ).length;

  const resolvedTickets = tickets.filter(
    (ticket) => ticket.status === "resolved" || ticket.status === "closed",
  ).length;

  // =========================================================
  // CATEGORY LIST
  // =========================================================

  const categories = [
    "General",
    "Billing",
    "Technical",
    "Account",
    "Subscription",
  ];

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

              <p className="text-xs text-slate-600">Customer support center</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/support/tickets/create-ai"
              className="flex items-center gap-2 rounded-xl border border-blue-500/20 bg-blue-500/10 px-4 py-2.5 text-sm font-semibold text-blue-400 transition hover:bg-blue-500/20"
            >
              <Bot className="h-4 w-4" />
              Create with AI
            </Link>

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
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-blue-400">
                Customer support
              </p>

              <h2 className="text-3xl font-bold">My Support Tickets</h2>

              <p className="mt-2 max-w-2xl text-slate-500">
                Create, track, and manage your support requests from one place.
              </p>
            </div>

            <Link
              to="/support/conversations"
              className="flex items-center gap-2 self-start rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm font-medium text-slate-400 transition hover:bg-slate-800 hover:text-white sm:self-auto"
            >
              <MessageSquare className="h-4 w-4" />
              Conversations
            </Link>
          </div>
        </div>

        {/* Error */}

        {error && !showCreateModal && (
          <div className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />

              <p className="text-sm text-red-400">{error}</p>
            </div>

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
            STATISTICS
        ================================================== */}

        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
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

          <TicketStat icon={Clock3} label="Pending" value={pendingTickets} />

          <TicketStat
            icon={CheckCircle2}
            label="Resolved"
            value={resolvedTickets}
          />
        </div>

        {/* =================================================
            TICKET CARD
        ================================================== */}

        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60">
          {/* Filters */}

          <div className="border-b border-slate-800 p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-slate-500" />

                <span className="text-sm font-medium">Find a ticket</span>
              </div>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-xs text-blue-400 transition hover:text-blue-300"
                >
                  Clear filters
                </button>
              )}
            </div>

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

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {/* Status */}

                <div className="relative">
                  <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />

                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-slate-800 bg-slate-950 py-3 pl-10 pr-8 text-xs text-slate-400 outline-none focus:border-blue-500"
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

                {/* Category */}

                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-xs text-slate-400 outline-none focus:border-blue-500"
                >
                  <option value="all">All categories</option>

                  {categories.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
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
                  DESKTOP
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

                      const ticketPriority =
                        priorityConfig[ticket.priority] ||
                        priorityConfig.medium;

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
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                                  <FileText className="h-4 w-4" />
                                </div>

                                <div className="min-w-0">
                                  <p className="max-w-sm truncate text-xs font-semibold group-hover:text-blue-400">
                                    {ticket.subject}
                                  </p>

                                  <p className="mt-1 text-[10px] text-slate-700">
                                    {ticket.ticketNumber}
                                    {" · "}
                                    {ticket.category}
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
                              className={`rounded-full border px-2.5 py-1 text-[10px] font-medium ${ticketPriority.className}`}
                            >
                              {ticketPriority.label}
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
                                {ticket.replies}{" "}
                                {ticket.replies === 1 ? "reply" : "replies"}
                              </p>
                            </div>
                          </td>

                          {/* View */}

                          <td className="px-5 py-5">
                            <Link
                              to={`/support/tickets/${ticket.id}`}
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-800 hover:text-white"
                              title="View ticket"
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

                  const ticketPriority =
                    priorityConfig[ticket.priority] || priorityConfig.medium;

                  return (
                    <Link
                      key={ticket.id}
                      to={`/support/tickets/${ticket.id}`}
                      className="block p-5 transition hover:bg-slate-800/30"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                            <FileText className="h-4 w-4" />
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold">
                              {ticket.subject}
                            </p>

                            <p className="mt-1 text-[10px] text-slate-700">
                              {ticket.id}
                              {" · "}
                              {ticket.category}
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
                          className={`rounded-full border px-2 py-1 text-[10px] ${ticketPriority.className}`}
                        >
                          {ticketPriority.label}
                        </span>
                      </div>

                      <div className="mt-4 flex items-center justify-between gap-3 text-[10px] text-slate-700">
                        <span className="truncate">
                          Assigned to {ticket.agent}
                        </span>

                        <span className="shrink-0">
                          {ticket.replies} replies
                        </span>
                      </div>

                      <p className="mt-2 text-[10px] text-slate-700">
                        Updated {ticket.updated}
                      </p>
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
            <div className="flex min-h-[320px] flex-col items-center justify-center p-8 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800 text-slate-600">
                {hasActiveFilters ? (
                  <Search className="h-6 w-6" />
                ) : (
                  <Inbox className="h-6 w-6" />
                )}
              </div>

              <h3 className="mt-5 font-semibold">
                {tickets.length === 0 ? "No tickets yet" : "No tickets found"}
              </h3>

              <p className="mt-2 max-w-sm text-sm text-slate-600">
                {tickets.length === 0
                  ? "Create your first support ticket and our team will help you."
                  : "No tickets match your current search or filters."}
              </p>

              {tickets.length === 0 ? (
                <button
                  type="button"
                  onClick={() => setShowCreateModal(true)}
                  className="mt-5 flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold transition hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4" />
                  Create your first ticket
                </button>
              ) : (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-5 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm font-medium text-slate-400 transition hover:bg-slate-800 hover:text-white"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}
        </div>

        {/* =================================================
            SUPPORT TIP
        ================================================== */}

        <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-blue-500/10 bg-blue-500/[0.03] p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
              <MessageSquare className="h-4 w-4" />
            </div>

            <div>
              <p className="text-sm font-medium">Need quick help?</p>

              <p className="mt-1 text-xs text-slate-600">
                Start a conversation with SupportAI before creating a ticket.
              </p>
            </div>
          </div>

          <Link
            to="/support/chat"
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-xs font-semibold text-slate-400 transition hover:bg-slate-800 hover:text-white"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Start conversation
          </Link>
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
            {/* Header */}

            <div className="mb-6 flex items-center justify-between">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                    <FileText className="h-4 w-4" />
                  </div>

                  <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                    New request
                  </span>
                </div>

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
                  maxLength={150}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-700 focus:border-blue-500 disabled:opacity-50"
                />

                <p className="mt-1 text-right text-[10px] text-slate-700">
                  {newTicket.subject.length}/150
                </p>
              </div>

              {/* Description */}

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Describe your issue
                </label>

                <textarea
                  value={newTicket.description}
                  onChange={(e) =>
                    setNewTicket((previous) => ({
                      ...previous,
                      description: e.target.value,
                    }))
                  }
                  rows={6}
                  maxLength={3000}
                  placeholder="Describe what happened, what you expected, and any relevant details..."
                  disabled={creating}
                  className="w-full resize-none rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-700 focus:border-blue-500 disabled:opacity-50"
                />

                <p className="mt-1 text-right text-[10px] text-slate-700">
                  {newTicket.description.length}/3000
                </p>
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
                    {categories.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
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

              {/* Error */}

              {error && (
                <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-3">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />

                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              {/* Actions */}

              <div className="flex justify-end gap-3 border-t border-slate-800 pt-5">
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
