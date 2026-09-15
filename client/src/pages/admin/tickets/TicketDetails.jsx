import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Mail,
  MessageSquare,
  RefreshCw,
  Ticket,
  UserRound,
  Users,
  XCircle,
  Zap,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

const getToken = () => localStorage.getItem("supportai_token");

const STATUS_OPTIONS = [
  "open",
  "pending",
  "in-progress",
  "waiting",
  "resolved",
  "closed",
];

const PRIORITY_OPTIONS = ["low", "medium", "high", "urgent"];

const statusConfig = {
  open: {
    label: "Open",
    className: "border-blue-500/20 bg-blue-500/10 text-blue-400",
    dot: "bg-blue-400",
  },
  pending: {
    label: "Pending",
    className: "border-amber-500/20 bg-amber-500/10 text-amber-400",
    dot: "bg-amber-400",
  },
  "in-progress": {
    label: "In Progress",
    className: "border-violet-500/20 bg-violet-500/10 text-violet-400",
    dot: "bg-violet-400",
  },
  waiting: {
    label: "Waiting",
    className: "border-orange-500/20 bg-orange-500/10 text-orange-400",
    dot: "bg-orange-400",
  },
  resolved: {
    label: "Resolved",
    className: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
    dot: "bg-emerald-400",
  },
  closed: {
    label: "Closed",
    className: "border-slate-500/20 bg-slate-500/10 text-slate-400",
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

const normalizeStatus = (status) =>
  String(status || "open")
    .toLowerCase()
    .replace(/\s+/g, "-");

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

const formatDateTime = (date) => {
  if (!date) return "—";

  const value = new Date(date);

  if (Number.isNaN(value.getTime())) return "—";

  return value.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const getInitials = (name = "") => {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (!parts.length) return "?";

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

const getName = (user, fallback = "Unknown") => {
  if (!user) return fallback;

  if (typeof user === "string") return user;

  return user.name || user.fullName || user.email || fallback;
};

const getMessages = (ticket) => {
  if (!ticket) return [];

  if (Array.isArray(ticket.conversation)) {
    return ticket.conversation;
  }

  if (Array.isArray(ticket.messages)) {
    return ticket.messages;
  }

  if (Array.isArray(ticket.replies)) {
    return ticket.replies;
  }

  return [];
};

const getMessageText = (message) => {
  if (!message) return "";

  return (
    message.message || message.content || message.text || message.body || ""
  );
};

const getSenderName = (message) => {
  if (!message) return "User";

  if (message.sender) {
    return getName(message.sender, "User");
  }

  return (
    message.senderName ||
    message.name ||
    (message.senderRole === "customer" ? "Customer" : "Support Agent")
  );
};

const isCustomerMessage = (message) => {
  if (!message) return false;

  const role = String(
    message.senderRole || message.role || message.authorRole || "",
  ).toLowerCase();

  return role === "customer";
};

const StatusBadge = ({ status }) => {
  const key = normalizeStatus(status);
  const config = statusConfig[key] || statusConfig.open;

  return (
    <span
      className={`inline-flex items-center gap-2 border px-2.5 py-1 text-xs font-medium ${config.className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
};

const InfoRow = ({ label, children }) => (
  <div className="flex items-center justify-between gap-4 border-b border-slate-800/80 py-3 last:border-b-0">
    <span className="text-xs text-slate-600">{label}</span>
    <div className="text-right text-xs font-medium text-slate-300">
      {children}
    </div>
  </div>
);

const LoadingPage = () => (
  <div className="min-h-full bg-[#050b18] p-5">
    <div className="mx-auto max-w-[1500px] animate-pulse">
      <div className="mb-6 h-4 w-28 rounded bg-slate-800" />
      <div className="mb-2 h-7 w-80 rounded bg-slate-800" />
      <div className="mb-8 h-3 w-52 rounded bg-slate-800/70" />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="h-[600px] border border-slate-800 bg-[#0a1222]" />
        <div className="h-[600px] border border-slate-800 bg-[#0a1222]" />
      </div>
    </div>
  </div>
);

const TicketDetails = () => {
  const navigate = useNavigate();
  const { ticketId } = useParams();

  const [ticket, setTicket] = useState(null);
  const [agents, setAgents] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedPriority, setSelectedPriority] = useState("");
  const [selectedAgent, setSelectedAgent] = useState("");

  const fetchTicket = async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await fetch(`${API_URL}/admin/tickets/${ticketId}`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch ticket");
      }

      const fetchedTicket = data.ticket || data.data;

      setTicket(fetchedTicket);
      setSelectedStatus(normalizeStatus(fetchedTicket?.status));
      setSelectedPriority(
        String(fetchedTicket?.priority || "medium").toLowerCase(),
      );

      setSelectedAgent(
        fetchedTicket?.assignedAgent?._id || fetchedTicket?.assignedAgent || "",
      );
    } catch (err) {
      console.error("Fetch admin ticket error:", err);
      setError(err.message || "Failed to load ticket");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchAgents = async () => {
    try {
      const response = await fetch(`${API_URL}/admin/tickets/agents`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch agents");
      }

      setAgents(data.agents || data.data || []);
    } catch (err) {
      console.error("Fetch admin agents error:", err);
    }
  };

  useEffect(() => {
    fetchTicket();
    fetchAgents();
  }, [ticketId]);

  const showSuccess = (message) => {
    setSuccess(message);

    setTimeout(() => {
      setSuccess("");
    }, 2500);
  };

  const updateStatus = async (newStatus) => {
    if (!ticket || newStatus === normalizeStatus(ticket.status)) return;

    try {
      setSaving(true);
      setError("");

      const response = await fetch(
        `${API_URL}/admin/tickets/${ticketId}/status`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${getToken()}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: newStatus,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update status");
      }

      const updatedTicket = data.ticket || data.data;

      setTicket(updatedTicket || { ...ticket, status: newStatus });
      setSelectedStatus(newStatus);

      showSuccess("Ticket status updated");
    } catch (err) {
      console.error("Update status error:", err);
      setError(err.message || "Failed to update status");
      setSelectedStatus(normalizeStatus(ticket.status));
    } finally {
      setSaving(false);
    }
  };

  const updatePriority = async (newPriority) => {
    if (!ticket || newPriority === ticket.priority) return;

    try {
      setSaving(true);
      setError("");

      const response = await fetch(
        `${API_URL}/admin/tickets/${ticketId}/priority`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${getToken()}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            priority: newPriority,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update priority");
      }

      const updatedTicket = data.ticket || data.data;

      setTicket(
        updatedTicket || {
          ...ticket,
          priority: newPriority,
        },
      );

      setSelectedPriority(newPriority);

      showSuccess("Ticket priority updated");
    } catch (err) {
      console.error("Update priority error:", err);
      setError(err.message || "Failed to update priority");
      setSelectedPriority(ticket.priority || "medium");
    } finally {
      setSaving(false);
    }
  };

  const assignAgent = async (agentId) => {
    if (!agentId || !ticket) return;

    const currentAgentId =
      ticket.assignedAgent?._id || ticket.assignedAgent || "";

    if (String(currentAgentId) === String(agentId)) return;

    try {
      setSaving(true);
      setError("");

      const response = await fetch(
        `${API_URL}/admin/tickets/${ticketId}/assign`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${getToken()}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            agentId,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to assign agent");
      }

      await fetchTicket(true);

      showSuccess("Ticket assigned successfully");
    } catch (err) {
      console.error("Assign agent error:", err);
      setError(err.message || "Failed to assign agent");
    } finally {
      setSaving(false);
    }
  };

  const messages = useMemo(() => getMessages(ticket), [ticket]);

  const customerName = getName(ticket?.customer, "Unknown customer");

  const customerEmail =
    ticket?.customer && typeof ticket.customer !== "string"
      ? ticket.customer.email
      : "";

  const agentName = getName(ticket?.assignedAgent, "Unassigned");

  const sla = ticket?.sla || ticket?.slaStatus || null;

  const isEscalated =
    Boolean(ticket?.escalation?.isEscalated) || Boolean(ticket?.isEscalated);

  if (loading) {
    return <LoadingPage />;
  }

  if (!ticket) {
    return (
      <div className="min-h-full bg-[#050b18] p-5">
        <div className="mx-auto max-w-3xl border border-slate-800 bg-[#0a1222] p-8 text-center">
          <XCircle className="mx-auto h-10 w-10 text-red-400" />

          <h2 className="mt-4 text-lg font-semibold text-white">
            Ticket not found
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {error || "The requested ticket could not be loaded."}
          </p>

          <button
            onClick={() => navigate("/admin/tickets")}
            className="mt-6 inline-flex items-center gap-2 border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Tickets
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#050b18] text-slate-200">
      <div className="mx-auto max-w-[1500px] px-4 py-5 sm:px-6 lg:px-8">
        {/* Back */}
        <button
          onClick={() => navigate("/admin/tickets")}
          className="mb-5 inline-flex items-center gap-2 text-xs font-medium text-slate-500 transition hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Tickets
        </button>

        {/* Header */}
        <div className="mb-6 border-b border-slate-800 pb-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-blue-400">
                  {ticket.ticketNumber || "Ticket"}
                </span>

                <span className="text-slate-700">•</span>

                <span className="text-xs text-slate-600">
                  Created {formatDateTime(ticket.createdAt)}
                </span>

                {isEscalated && (
                  <span className="inline-flex items-center gap-1.5 border border-red-500/20 bg-red-500/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-red-400">
                    <AlertTriangle className="h-3 w-3" />
                    Escalated
                  </span>
                )}
              </div>

              <h1 className="max-w-4xl text-2xl font-bold tracking-tight text-white sm:text-3xl">
                {ticket.subject || "Untitled ticket"}
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                {ticket.category || "General"}{" "}
                {ticket.description ? " · Customer support request" : ""}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedStatus}
                disabled={saving}
                onChange={(event) => updateStatus(event.target.value)}
                className="h-9 border border-slate-800 bg-[#0a1222] px-3 text-xs font-medium text-slate-300 outline-none transition focus:border-blue-500/50"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {statusConfig[option]?.label || option}
                  </option>
                ))}
              </select>

              <select
                value={selectedPriority}
                disabled={saving}
                onChange={(event) => updatePriority(event.target.value)}
                className="h-9 border border-slate-800 bg-[#0a1222] px-3 text-xs font-medium text-slate-300 outline-none transition focus:border-blue-500/50"
              >
                {PRIORITY_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option.charAt(0).toUpperCase() + option.slice(1)} Priority
                  </option>
                ))}
              </select>

              <button
                onClick={() => fetchTicket(true)}
                disabled={refreshing}
                className="flex h-9 w-9 items-center justify-center border border-slate-800 bg-[#0a1222] text-slate-500 transition hover:border-slate-700 hover:text-white disabled:opacity-50"
                title="Refresh"
              >
                <RefreshCw
                  className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-4 flex items-center gap-3 border border-red-500/20 bg-red-500/5 px-4 py-3">
            <AlertTriangle className="h-4 w-4 shrink-0 text-red-400" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 flex items-center gap-3 border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <p className="text-sm text-emerald-300">{success}</p>
          </div>
        )}

        {/* Workspace */}
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_350px]">
          {/* Main */}
          <div className="min-w-0 space-y-5">
            {/* Description */}
            {ticket.description && (
              <section className="border border-slate-800 bg-[#0a1222]">
                <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
                  <div>
                    <h2 className="text-sm font-semibold text-white">
                      Ticket Description
                    </h2>
                    <p className="mt-0.5 text-xs text-slate-600">
                      Original request from the customer
                    </p>
                  </div>

                  <MessageSquare className="h-4 w-4 text-slate-600" />
                </div>

                <div className="px-5 py-5">
                  <p className="whitespace-pre-wrap text-sm leading-7 text-slate-400">
                    {ticket.description}
                  </p>
                </div>
              </section>
            )}

            {/* Conversation */}
            <section className="border border-slate-800 bg-[#0a1222]">
              <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
                <div>
                  <h2 className="text-sm font-semibold text-white">
                    Conversation
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-600">
                    {messages.length}{" "}
                    {messages.length === 1 ? "message" : "messages"}
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Live ticket
                </div>
              </div>

              {messages.length === 0 ? (
                <div className="flex min-h-[260px] flex-col items-center justify-center px-6 text-center">
                  <div className="flex h-12 w-12 items-center justify-center border border-slate-800 bg-[#07101f]">
                    <MessageSquare className="h-5 w-5 text-slate-600" />
                  </div>

                  <p className="mt-4 text-sm font-medium text-slate-400">
                    No conversation messages
                  </p>

                  <p className="mt-1 max-w-sm text-xs leading-5 text-slate-600">
                    Conversation messages will appear here when the customer or
                    support team replies.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-800/70">
                  {messages.map((message, index) => {
                    const customer = isCustomerMessage(message);
                    const senderName = getSenderName(message);
                    const text = getMessageText(message);

                    return (
                      <div
                        key={message._id || message.id || index}
                        className="px-5 py-5"
                      >
                        <div className="flex gap-3">
                          <div
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold ${
                              customer
                                ? "border-blue-500/20 bg-blue-500/10 text-blue-400"
                                : "border-violet-500/20 bg-violet-500/10 text-violet-400"
                            }`}
                          >
                            {getInitials(senderName)}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-semibold text-slate-200">
                                {senderName}
                              </span>

                              <span className="border border-slate-800 bg-[#07101f] px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-slate-600">
                                {customer ? "Customer" : "Support"}
                              </span>

                              <span className="text-[11px] text-slate-600">
                                {formatDateTime(
                                  message.createdAt ||
                                    message.timestamp ||
                                    message.sentAt,
                                )}
                              </span>
                            </div>

                            <div className="mt-3 border border-slate-800/80 bg-[#07101f] px-4 py-3">
                              <p className="whitespace-pre-wrap text-sm leading-6 text-slate-400">
                                {text || "No message content"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Status History */}
            {Array.isArray(ticket.statusHistory) &&
              ticket.statusHistory.length > 0 && (
                <section className="border border-slate-800 bg-[#0a1222]">
                  <div className="border-b border-slate-800 px-5 py-4">
                    <h2 className="text-sm font-semibold text-white">
                      Activity History
                    </h2>
                    <p className="mt-0.5 text-xs text-slate-600">
                      Ticket status and administrative activity
                    </p>
                  </div>

                  <div className="px-5 py-5">
                    <div className="space-y-5">
                      {ticket.statusHistory
                        .slice()
                        .reverse()
                        .map((activity, index) => (
                          <div
                            key={activity._id || index}
                            className="relative flex gap-3"
                          >
                            {index !== ticket.statusHistory.length - 1 && (
                              <div className="absolute left-[7px] top-5 h-full w-px bg-slate-800" />
                            )}

                            <div className="relative mt-1 h-3.5 w-3.5 shrink-0 rounded-full border-2 border-[#0a1222] bg-blue-500 ring-1 ring-blue-500/30" />

                            <div className="min-w-0">
                              <p className="text-xs font-medium text-slate-300">
                                {activity.note ||
                                  `Status changed to ${
                                    activity.status || "updated"
                                  }`}
                              </p>

                              <p className="mt-1 text-[11px] text-slate-600">
                                {formatDateTime(activity.changedAt)}
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </section>
              )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-5">
            {/* Ticket Information */}
            <section className="border border-slate-800 bg-[#0a1222]">
              <div className="border-b border-slate-800 px-5 py-4">
                <h2 className="text-sm font-semibold text-white">
                  Ticket Information
                </h2>
              </div>

              <div className="px-5">
                <InfoRow label="Ticket">
                  <span className="text-blue-400">
                    {ticket.ticketNumber || "—"}
                  </span>
                </InfoRow>

                <InfoRow label="Status">
                  <StatusBadge status={ticket.status} />
                </InfoRow>

                <InfoRow label="Priority">
                  <span
                    className={
                      priorityConfig[
                        String(ticket.priority || "medium").toLowerCase()
                      ]?.className || "text-slate-300"
                    }
                  >
                    {String(ticket.priority || "medium")
                      .charAt(0)
                      .toUpperCase() +
                      String(ticket.priority || "medium").slice(1)}
                  </span>
                </InfoRow>

                <InfoRow label="Category">
                  {ticket.category || "General"}
                </InfoRow>

                <InfoRow label="Created">
                  {formatDate(ticket.createdAt)}
                </InfoRow>

                {ticket.updatedAt && (
                  <InfoRow label="Last updated">
                    {formatDate(ticket.updatedAt)}
                  </InfoRow>
                )}
              </div>
            </section>

            {/* Customer */}
            <section className="border border-slate-800 bg-[#0a1222]">
              <div className="border-b border-slate-800 px-5 py-4">
                <h2 className="text-sm font-semibold text-white">Customer</h2>
              </div>

              <div className="p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full border border-blue-500/20 bg-blue-500/10 text-xs font-bold text-blue-400">
                    {getInitials(customerName)}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">
                      {customerName}
                    </p>

                    {customerEmail && (
                      <p className="mt-0.5 truncate text-xs text-slate-600">
                        {customerEmail}
                      </p>
                    )}
                  </div>
                </div>

                {customerEmail && (
                  <a
                    href={`mailto:${customerEmail}`}
                    className="mt-4 flex h-9 items-center justify-center gap-2 border border-slate-800 bg-[#07101f] text-xs font-medium text-slate-400 transition hover:border-slate-700 hover:text-white"
                  >
                    <Mail className="h-3.5 w-3.5" />
                    Contact Customer
                  </a>
                )}
              </div>
            </section>

            {/* Assignment */}
            <section className="border border-slate-800 bg-[#0a1222]">
              <div className="border-b border-slate-800 px-5 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-white">
                      Assignment
                    </h2>
                    <p className="mt-0.5 text-xs text-slate-600">
                      Manage ticket ownership
                    </p>
                  </div>

                  <Users className="h-4 w-4 text-slate-600" />
                </div>
              </div>

              <div className="p-5">
                <label className="mb-2 block text-xs font-medium text-slate-500">
                  Assigned Agent
                </label>

                <div className="relative">
                  <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />

                  <select
                    value={selectedAgent}
                    disabled={saving}
                    onChange={(event) => {
                      setSelectedAgent(event.target.value);
                      assignAgent(event.target.value);
                    }}
                    className="h-10 w-full appearance-none border border-slate-800 bg-[#07101f] pl-10 pr-9 text-sm text-slate-300 outline-none focus:border-blue-500/50 disabled:opacity-50"
                  >
                    <option value="">Select agent</option>

                    {agents.map((agent) => (
                      <option key={agent._id} value={agent._id}>
                        {agent.name || agent.email}
                      </option>
                    ))}
                  </select>

                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />
                </div>

                <div className="mt-4 flex items-center gap-3 border-t border-slate-800 pt-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border border-violet-500/20 bg-violet-500/10 text-[10px] font-bold text-violet-400">
                    {agentName === "Unassigned" ? "—" : getInitials(agentName)}
                  </div>

                  <div>
                    <p className="text-xs font-medium text-slate-300">
                      {agentName}
                    </p>

                    <p className="mt-0.5 text-[11px] text-slate-600">
                      {agentName === "Unassigned"
                        ? "Waiting for assignment"
                        : "Current assignee"}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* SLA */}
            <section className="border border-slate-800 bg-[#0a1222]">
              <div className="border-b border-slate-800 px-5 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-white">
                      SLA Tracking
                    </h2>
                    <p className="mt-0.5 text-xs text-slate-600">
                      Service level status
                    </p>
                  </div>

                  <Clock3 className="h-4 w-4 text-slate-600" />
                </div>
              </div>

              <div className="p-5">
                {!sla ? (
                  <div className="flex items-center gap-3 border border-slate-800 bg-[#07101f] p-3">
                    <Clock3 className="h-4 w-4 text-slate-600" />

                    <div>
                      <p className="text-xs font-medium text-slate-400">
                        SLA monitoring
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-600">
                        No SLA information available.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <InfoRow label="First response">
                      {sla.firstRespondedAt
                        ? "Completed"
                        : sla.responseDueAt
                          ? formatDateTime(sla.responseDueAt)
                          : "Pending"}
                    </InfoRow>

                    <InfoRow label="Resolution">
                      {sla.resolvedAt
                        ? "Completed"
                        : sla.resolutionDueAt
                          ? formatDateTime(sla.resolutionDueAt)
                          : "Pending"}
                    </InfoRow>

                    {typeof sla.breached !== "undefined" && (
                      <InfoRow label="SLA status">
                        <span
                          className={
                            sla.breached ? "text-red-400" : "text-emerald-400"
                          }
                        >
                          {sla.breached ? "Breached" : "On track"}
                        </span>
                      </InfoRow>
                    )}
                  </div>
                )}
              </div>
            </section>

            {/* Escalation */}
            {isEscalated && (
              <section className="border border-red-500/20 bg-red-500/5">
                <div className="border-b border-red-500/10 px-5 py-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-400" />
                    <h2 className="text-sm font-semibold text-red-300">
                      Escalated Ticket
                    </h2>
                  </div>
                </div>

                <div className="p-5">
                  {ticket.escalation?.reason && (
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-red-400/70">
                        Reason
                      </p>

                      <p className="mt-2 text-xs leading-5 text-slate-400">
                        {ticket.escalation.reason}
                      </p>
                    </div>
                  )}

                  {ticket.escalation?.note && (
                    <div className="mt-4 border-t border-red-500/10 pt-4">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-red-400/70">
                        Internal Note
                      </p>

                      <p className="mt-2 text-xs leading-5 text-slate-400">
                        {ticket.escalation.note}
                      </p>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Quick Status */}
            <section className="border border-slate-800 bg-[#0a1222]">
              <div className="border-b border-slate-800 px-5 py-4">
                <h2 className="text-sm font-semibold text-white">
                  Quick Actions
                </h2>
              </div>

              <div className="grid grid-cols-2 gap-2 p-4">
                <button
                  disabled={saving}
                  onClick={() => updateStatus("in-progress")}
                  className="flex h-9 items-center justify-center gap-1.5 border border-violet-500/20 bg-violet-500/5 text-[11px] font-medium text-violet-400 transition hover:bg-violet-500/10 disabled:opacity-40"
                >
                  <Zap className="h-3.5 w-3.5" />
                  Start
                </button>

                <button
                  disabled={saving}
                  onClick={() => updateStatus("waiting")}
                  className="flex h-9 items-center justify-center gap-1.5 border border-orange-500/20 bg-orange-500/5 text-[11px] font-medium text-orange-400 transition hover:bg-orange-500/10 disabled:opacity-40"
                >
                  <Clock3 className="h-3.5 w-3.5" />
                  Waiting
                </button>

                <button
                  disabled={saving}
                  onClick={() => updateStatus("resolved")}
                  className="flex h-9 items-center justify-center gap-1.5 border border-emerald-500/20 bg-emerald-500/5 text-[11px] font-medium text-emerald-400 transition hover:bg-emerald-500/10 disabled:opacity-40"
                >
                  <Check className="h-3.5 w-3.5" />
                  Resolve
                </button>

                <button
                  disabled={saving}
                  onClick={() => updateStatus("closed")}
                  className="flex h-9 items-center justify-center gap-1.5 border border-slate-700 bg-slate-900 text-[11px] font-medium text-slate-400 transition hover:text-white disabled:opacity-40"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Close
                </button>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default TicketDetails;
