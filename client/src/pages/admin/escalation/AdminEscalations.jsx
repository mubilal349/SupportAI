import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Search,
  RefreshCw,
  Eye,
  UserRound,
  Clock,
  CheckCircle2,
  CircleDot,
  X,
  Loader2,
} from "lucide-react";

import {
  getEscalations,
  updateEscalationStatus,
  assignEscalation,
  resolveEscalation,
} from "../../../services/adminEscalationService";

const AdminEscalations = () => {
  const [escalations, setEscalations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  const [selectedEscalation, setSelectedEscalation] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  // ==========================================
  // LOAD ESCALATIONS
  // ==========================================

  const loadEscalations = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getEscalations();

      const data =
        response?.data?.escalations ||
        response?.data?.tickets ||
        response?.data ||
        [];

      setEscalations(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load escalations:", err);

      setError(
        err?.response?.data?.message || "Failed to load escalated tickets.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEscalations();
  }, []);

  // ==========================================
  // FILTER ESCALATIONS
  // ==========================================

  const filteredEscalations = useMemo(() => {
    return escalations.filter((ticket) => {
      const customer = ticket.customer || ticket.user || {};
      const agent = ticket.assignedAgent || {};

      const searchText = search.toLowerCase().trim();

      const matchesSearch =
        !searchText ||
        String(ticket.ticketNumber || ticket.ticketId || ticket._id || "")
          .toLowerCase()
          .includes(searchText) ||
        String(ticket.subject || "")
          .toLowerCase()
          .includes(searchText) ||
        String(customer.name || customer.fullName || "")
          .toLowerCase()
          .includes(searchText) ||
        String(customer.email || "")
          .toLowerCase()
          .includes(searchText) ||
        String(agent.name || agent.fullName || "")
          .toLowerCase()
          .includes(searchText);

      const matchesStatus =
        statusFilter === "all" ||
        String(ticket.status || "").toLowerCase() ===
          statusFilter.toLowerCase();

      const matchesPriority =
        priorityFilter === "all" ||
        String(ticket.priority || "").toLowerCase() ===
          priorityFilter.toLowerCase();

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [escalations, search, statusFilter, priorityFilter]);

  // ==========================================
  // STATISTICS
  // ==========================================

  const stats = useMemo(() => {
    const total = escalations.length;

    const unassigned = escalations.filter(
      (ticket) => !ticket.assignedAgent,
    ).length;

    const inProgress = escalations.filter(
      (ticket) => String(ticket.status || "").toLowerCase() === "in-progress",
    ).length;

    const resolved = escalations.filter((ticket) =>
      ["resolved", "closed"].includes(
        String(ticket.status || "").toLowerCase(),
      ),
    ).length;

    return {
      total,
      unassigned,
      inProgress,
      resolved,
    };
  }, [escalations]);

  // ==========================================
  // VIEW DETAILS
  // ==========================================

  const handleViewDetails = (ticket) => {
    setSelectedEscalation(ticket);
    setShowDetails(true);
  };

  // ==========================================
  // UPDATE STATUS
  // ==========================================

  const handleStatusChange = async (ticketId, status) => {
    try {
      setActionLoading(true);

      await updateEscalationStatus(ticketId, status);

      await loadEscalations();

      if (selectedEscalation) {
        setSelectedEscalation((prev) => (prev ? { ...prev, status } : prev));
      }
    } catch (err) {
      console.error("Failed to update status:", err);

      setError(
        err?.response?.data?.message || "Failed to update escalation status.",
      );
    } finally {
      setActionLoading(false);
    }
  };

  // ==========================================
  // ASSIGN TO ME
  // ==========================================

  const handleAssignToMe = async (ticketId) => {
    try {
      setActionLoading(true);

      await assignEscalation(ticketId);

      await loadEscalations();
    } catch (err) {
      console.error("Failed to assign escalation:", err);

      setError(err?.response?.data?.message || "Failed to assign escalation.");
    } finally {
      setActionLoading(false);
    }
  };

  // ==========================================
  // RESOLVE
  // ==========================================

  const handleResolve = async (ticketId) => {
    try {
      setActionLoading(true);

      await resolveEscalation(ticketId);

      await loadEscalations();

      setShowDetails(false);
      setSelectedEscalation(null);
    } catch (err) {
      console.error("Failed to resolve escalation:", err);

      setError(err?.response?.data?.message || "Failed to resolve escalation.");
    } finally {
      setActionLoading(false);
    }
  };

  // ==========================================
  // HELPERS
  // ==========================================

  const getPriorityClass = (priority) => {
    switch (String(priority || "").toLowerCase()) {
      case "urgent":
        return "border-red-500/30 bg-red-500/10 text-red-400";

      case "high":
        return "border-orange-500/30 bg-orange-500/10 text-orange-400";

      case "medium":
        return "border-yellow-500/30 bg-yellow-500/10 text-yellow-400";

      default:
        return "border-slate-500/30 bg-slate-500/10 text-slate-400";
    }
  };

  const getStatusClass = (status) => {
    switch (String(status || "").toLowerCase()) {
      case "resolved":
        return "border-emerald-500/30 bg-emerald-500/10 text-emerald-400";

      case "in-progress":
        return "border-blue-500/30 bg-blue-500/10 text-blue-400";

      case "waiting":
        return "border-yellow-500/30 bg-yellow-500/10 text-yellow-400";

      case "closed":
        return "border-slate-500/30 bg-slate-500/10 text-slate-400";

      default:
        return "border-orange-500/30 bg-orange-500/10 text-orange-400";
    }
  };

  const formatDate = (date) => {
    if (!date) return "—";

    try {
      return new Date(date).toLocaleString();
    } catch {
      return "—";
    }
  };

  const getCustomer = (ticket) => ticket?.customer || ticket?.user || {};

  const getAgent = (ticket) => ticket?.assignedAgent || null;

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="min-h-full bg-[#050b18] p-6 text-white">
      {/* HEADER */}
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-500/10">
              <AlertTriangle className="h-6 w-6 text-red-400" />
            </div>

            <div>
              <h1 className="text-2xl font-bold">Escalation Management</h1>

              <p className="text-sm text-slate-400">
                Monitor and handle escalated tickets
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={loadEscalations}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:border-slate-600 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* ERROR */}
      {error && (
        <div className="mb-6 flex items-center justify-between rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          <span>{error}</span>

          <button
            onClick={() => setError("")}
            className="rounded-md p-1 hover:bg-red-500/10"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* STATISTICS */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-slate-800 bg-[#0a1222] p-5">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm text-slate-400">Total Escalations</span>

            <AlertTriangle className="h-5 w-5 text-red-400" />
          </div>

          <p className="text-3xl font-bold">{stats.total}</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#0a1222] p-5">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm text-slate-400">Unassigned</span>

            <UserRound className="h-5 w-5 text-orange-400" />
          </div>

          <p className="text-3xl font-bold">{stats.unassigned}</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#0a1222] p-5">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm text-slate-400">In Progress</span>

            <Clock className="h-5 w-5 text-blue-400" />
          </div>

          <p className="text-3xl font-bold">{stats.inProgress}</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#0a1222] p-5">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm text-slate-400">Resolved</span>

            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          </div>

          <p className="text-3xl font-bold">{stats.resolved}</p>
        </div>
      </div>

      {/* FILTERS */}
      <div className="mb-6 rounded-xl border border-slate-800 bg-[#0a1222] p-4">
        <div className="flex flex-col gap-3 lg:flex-row">
          {/* SEARCH */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ticket, subject, customer or agent..."
              className="w-full rounded-lg border border-slate-700 bg-[#050b18] py-2.5 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-500"
            />
          </div>

          {/* STATUS */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-700 bg-[#050b18] px-4 py-2.5 text-sm text-slate-300 outline-none focus:border-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="open">Open</option>
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="waiting">Waiting</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>

          {/* PRIORITY */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="rounded-lg border border-slate-700 bg-[#050b18] px-4 py-2.5 text-sm text-slate-300 outline-none focus:border-blue-500"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* TABLE */}
      <div className="overflow-hidden rounded-xl border border-slate-800 bg-[#0a1222]">
        {loading ? (
          <div className="flex min-h-[300px] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
          </div>
        ) : filteredEscalations.length === 0 ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center">
            <CircleDot className="mb-3 h-10 w-10 text-slate-600" />

            <h3 className="text-lg font-semibold text-slate-300">
              No escalated tickets found
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              There are no escalations matching your current filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-left">
              <thead className="border-b border-slate-800 bg-slate-900/50">
                <tr>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Ticket
                  </th>

                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Customer
                  </th>

                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Priority
                  </th>

                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Status
                  </th>

                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Assigned Agent
                  </th>

                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Escalated
                  </th>

                  <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-800">
                {filteredEscalations.map((ticket) => {
                  const customer = getCustomer(ticket);
                  const agent = getAgent(ticket);

                  return (
                    <tr
                      key={ticket._id || ticket.ticketId}
                      className="transition hover:bg-slate-900/40"
                    >
                      <td className="px-5 py-4">
                        <div>
                          <p className="font-medium text-white">
                            {ticket.ticketNumber ||
                              ticket.ticketId ||
                              ticket._id}
                          </p>

                          <p className="mt-1 max-w-[260px] truncate text-sm text-slate-400">
                            {ticket.subject || "No subject"}
                          </p>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <p className="text-sm font-medium text-slate-200">
                          {customer.name ||
                            customer.fullName ||
                            "Unknown Customer"}
                        </p>

                        <p className="text-xs text-slate-500">
                          {customer.email || "No email"}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium capitalize ${getPriorityClass(
                            ticket.priority,
                          )}`}
                        >
                          {ticket.priority || "medium"}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium capitalize ${getStatusClass(
                            ticket.status,
                          )}`}
                        >
                          {ticket.status || "open"}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        {agent ? (
                          <div>
                            <p className="text-sm text-slate-200">
                              {agent.name || agent.fullName || "Assigned"}
                            </p>

                            {agent.email && (
                              <p className="text-xs text-slate-500">
                                {agent.email}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-orange-400">
                            Unassigned
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-400">
                        {formatDate(
                          ticket.escalation?.escalatedAt ||
                            ticket.updatedAt ||
                            ticket.createdAt,
                        )}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => handleViewDetails(ticket)}
                          className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-300 transition hover:border-blue-500/40 hover:bg-blue-500/10 hover:text-blue-400"
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* DETAILS MODAL */}
      {showDetails && selectedEscalation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-700 bg-[#0a1222] shadow-2xl">
            {/* MODAL HEADER */}
            <div className="sticky top-0 flex items-center justify-between border-b border-slate-800 bg-[#0a1222] px-6 py-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-red-400">
                  Escalated Ticket
                </p>

                <h2 className="mt-1 text-xl font-bold text-white">
                  {selectedEscalation.ticketNumber ||
                    selectedEscalation.ticketId ||
                    selectedEscalation._id}
                </h2>
              </div>

              <button
                onClick={() => {
                  setShowDetails(false);
                  setSelectedEscalation(null);
                }}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6 p-6">
              {/* SUBJECT */}
              <div>
                <p className="mb-1 text-xs uppercase tracking-wider text-slate-500">
                  Subject
                </p>

                <h3 className="text-lg font-semibold text-white">
                  {selectedEscalation.subject || "No subject"}
                </h3>
              </div>

              {/* DESCRIPTION */}
              <div>
                <p className="mb-2 text-xs uppercase tracking-wider text-slate-500">
                  Description
                </p>

                <div className="rounded-xl border border-slate-800 bg-[#050b18] p-4 text-sm leading-6 text-slate-300">
                  {selectedEscalation.description ||
                    "No description available."}
                </div>
              </div>

              {/* ESCALATION REASON */}
              <div>
                <p className="mb-2 text-xs uppercase tracking-wider text-slate-500">
                  Escalation Reason
                </p>

                <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm leading-6 text-red-200">
                  {selectedEscalation.escalation?.reason ||
                    selectedEscalation.escalationReason ||
                    "No escalation reason provided."}
                </div>
              </div>

              {/* DETAILS GRID */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-slate-800 bg-[#050b18] p-4">
                  <p className="text-xs uppercase tracking-wider text-slate-500">
                    Customer
                  </p>

                  <p className="mt-2 font-medium text-white">
                    {getCustomer(selectedEscalation).name ||
                      getCustomer(selectedEscalation).fullName ||
                      "Unknown"}
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    {getCustomer(selectedEscalation).email || "No email"}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-800 bg-[#050b18] p-4">
                  <p className="text-xs uppercase tracking-wider text-slate-500">
                    Assigned Agent
                  </p>

                  <p className="mt-2 font-medium text-white">
                    {getAgent(selectedEscalation)?.name ||
                      getAgent(selectedEscalation)?.fullName ||
                      "Unassigned"}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-800 bg-[#050b18] p-4">
                  <p className="text-xs uppercase tracking-wider text-slate-500">
                    Priority
                  </p>

                  <span
                    className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-xs font-medium capitalize ${getPriorityClass(
                      selectedEscalation.priority,
                    )}`}
                  >
                    {selectedEscalation.priority || "medium"}
                  </span>
                </div>

                <div className="rounded-xl border border-slate-800 bg-[#050b18] p-4">
                  <p className="text-xs uppercase tracking-wider text-slate-500">
                    Status
                  </p>

                  <span
                    className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-xs font-medium capitalize ${getStatusClass(
                      selectedEscalation.status,
                    )}`}
                  >
                    {selectedEscalation.status || "open"}
                  </span>
                </div>
              </div>

              {/* ACTIONS */}
              <div className="border-t border-slate-800 pt-5">
                <p className="mb-3 text-sm font-semibold text-slate-200">
                  Escalation Actions
                </p>

                <div className="flex flex-wrap gap-3">
                  {!getAgent(selectedEscalation) && (
                    <button
                      disabled={actionLoading}
                      onClick={() =>
                        handleAssignToMe(
                          selectedEscalation._id || selectedEscalation.ticketId,
                        )
                      }
                      className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500 disabled:opacity-50"
                    >
                      {actionLoading ? "Processing..." : "Assign to Me"}
                    </button>
                  )}

                  <select
                    disabled={actionLoading}
                    value={selectedEscalation.status || "open"}
                    onChange={(e) =>
                      handleStatusChange(
                        selectedEscalation._id || selectedEscalation.ticketId,
                        e.target.value,
                      )
                    }
                    className="rounded-lg border border-slate-700 bg-[#050b18] px-4 py-2.5 text-sm text-slate-300 outline-none focus:border-blue-500"
                  >
                    <option value="open">Open</option>
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="waiting">Waiting</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>

                  {!["resolved", "closed"].includes(
                    String(selectedEscalation.status || "").toLowerCase(),
                  ) && (
                    <button
                      disabled={actionLoading}
                      onClick={() =>
                        handleResolve(
                          selectedEscalation._id || selectedEscalation.ticketId,
                        )
                      }
                      className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:opacity-50"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Resolve Escalation
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEscalations;
