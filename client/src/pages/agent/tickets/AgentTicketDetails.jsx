import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Bot,
  Check,
  CheckCircle2,
  Clock3,
  FileText,
  Loader2,
  MessageSquare,
  Paperclip,
  Send,
  ShieldCheck,
  UserRound,
  X,
  AlertCircle,
} from "lucide-react";

import { Link, useNavigate, useParams } from "react-router-dom";

import {
  assignTicketToMe,
  getAgentTicketById,
  sendAgentReply,
  updateAgentTicketPriority,
  updateAgentTicketStatus,
} from "../../../services/agentService";

const normalizeTicket = (response, ticketId) => {
  const ticket =
    response?.data?.ticket ||
    response?.ticket ||
    response?.data ||
    response ||
    {};

  return {
    ...ticket,
    id: ticket?._id || ticket?.id || ticketId,
    subject: ticket?.subject || ticket?.title || "Support Request",

    status: ticket?.status || "open",
    priority: ticket?.priority || "medium",

    customer: ticket?.customer || ticket?.user || null,

    messages: ticket?.messages || ticket?.conversation || ticket?.replies || [],
  };
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

const getSenderName = (message) => {
  return (
    message?.sender?.name ||
    message?.sender?.fullName ||
    message?.user?.name ||
    message?.author?.name ||
    message?.senderName ||
    "Customer"
  );
};

const getMessageText = (message) => {
  return message?.message || message?.content || message?.text || "";
};

const isAgentMessage = (message) => {
  const senderRole =
    message?.sender?.role || message?.user?.role || message?.role || "";

  return String(senderRole).toLowerCase() === "agent";
};

const AgentTicketDetails = () => {
  const { ticketId } = useParams();
  const navigate = useNavigate();

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updatingPriority, setUpdatingPriority] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadTicket = async () => {
    if (!ticketId) return;

    try {
      setLoading(true);
      setError("");

      const response = await getAgentTicketById(ticketId);

      setTicket(normalizeTicket(response, ticketId));
    } catch (err) {
      console.error("Agent ticket details error:", err);

      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Unable to load this ticket.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTicket();
  }, [ticketId]);

  const customerName = useMemo(() => {
    return (
      ticket?.customer?.name ||
      ticket?.customer?.fullName ||
      ticket?.customerName ||
      "Customer"
    );
  }, [ticket]);

  const customerEmail = useMemo(() => {
    return (
      ticket?.customer?.email || ticket?.customerEmail || "No email available"
    );
  }, [ticket]);

  const handleAssign = async () => {
    if (!ticket?.id) return;

    try {
      setAssigning(true);
      setError("");
      setSuccess("");

      const response = await assignTicketToMe(ticket.id);

      const updated =
        response?.data?.ticket || response?.ticket || response?.data;

      if (updated) {
        setTicket((current) => ({
          ...current,
          ...updated,
          id: updated?._id || updated?.id || current.id,
        }));
      }

      setSuccess("Ticket assigned to you.");
    } catch (err) {
      console.error("Assign error:", err);

      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Unable to assign this ticket.",
      );
    } finally {
      setAssigning(false);
    }
  };

  const handleStatusChange = async (status) => {
    if (!ticket?.id) return;

    try {
      setUpdatingStatus(true);
      setError("");
      setSuccess("");

      const response = await updateAgentTicketStatus(ticket.id, status);

      const updated =
        response?.data?.ticket || response?.ticket || response?.data;

      setTicket((current) => ({
        ...current,
        ...(updated || {}),
        status: updated?.status || status,
      }));

      setSuccess("Ticket status updated.");
    } catch (err) {
      console.error("Status update error:", err);

      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Unable to update ticket status.",
      );
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handlePriorityChange = async (priority) => {
    if (!ticket?.id) return;

    try {
      setUpdatingPriority(true);
      setError("");
      setSuccess("");

      const response = await updateAgentTicketPriority(ticket.id, priority);

      const updated =
        response?.data?.ticket || response?.ticket || response?.data;

      setTicket((current) => ({
        ...current,
        ...(updated || {}),
        priority: updated?.priority || priority,
      }));

      setSuccess("Ticket priority updated.");
    } catch (err) {
      console.error("Priority update error:", err);

      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Unable to update ticket priority.",
      );
    } finally {
      setUpdatingPriority(false);
    }
  };

  const handleSendReply = async () => {
    const trimmed = message.trim();

    if (!trimmed || !ticket?.id || sending) {
      return;
    }

    try {
      setSending(true);
      setError("");
      setSuccess("");

      const response = await sendAgentReply(ticket.id, trimmed, []);

      const newMessage =
        response?.data?.message ||
        response?.message ||
        response?.data?.reply ||
        null;

      if (newMessage) {
        setTicket((current) => ({
          ...current,
          messages: [...(current?.messages || []), newMessage],
        }));
      } else {
        await loadTicket();
      }

      setMessage("");
      setSuccess("Reply sent successfully.");
    } catch (err) {
      console.error("Send reply error:", err);

      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Unable to send your reply.",
      );
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-110px)] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={32} className="animate-spin text-blue-500" />

          <p className="text-sm text-slate-500">Loading ticket...</p>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-110px)] max-w-3xl items-center justify-center px-6">
        <div className="w-full rounded-3xl border border-slate-800 bg-[#0a1425] p-10 text-center">
          <AlertCircle size={40} className="mx-auto text-red-400" />

          <h2 className="mt-5 text-xl font-semibold text-white">
            Ticket not found
          </h2>

          <p className="mt-2 text-sm text-slate-600">
            We couldn't find the requested support ticket.
          </p>

          <Link
            to="/agent/tickets"
            className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white"
          >
            <ArrowLeft size={17} />
            Back to tickets
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1500px] px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
      {/* =========================================================
          TOP
      ========================================================= */}
      <div className="mb-7">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-5 flex items-center gap-2 text-sm text-slate-500 transition hover:text-white"
        >
          <ArrowLeft size={17} />
          Back
        </button>

        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm text-slate-600">
                #{ticket?.ticketNumber || String(ticket.id).slice(-8)}
              </span>

              <span
                className={`rounded-full border px-3 py-1 text-xs font-medium ${getStatusStyles(
                  ticket.status,
                )}`}
              >
                {ticket.status}
              </span>

              <span
                className={`rounded-full border px-3 py-1 text-xs font-medium ${getPriorityStyles(
                  ticket.priority,
                )}`}
              >
                {ticket.priority}
              </span>
            </div>

            <h1 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              {ticket.subject}
            </h1>

            <p className="mt-2 text-sm text-slate-600">
              Manage this customer support request and respond to the customer.
            </p>
          </div>

          <button
            type="button"
            disabled={assigning}
            onClick={handleAssign}
            className="flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-lg shadow-blue-600/10 transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {assigning ? (
              <Loader2 size={17} className="animate-spin" />
            ) : (
              <UserRound size={17} />
            )}
            Assign to me
          </button>
        </div>
      </div>

      {/* =========================================================
          ALERTS
      ========================================================= */}
      {error && (
        <div className="mb-5 flex items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 px-5 py-4">
          <AlertCircle size={19} className="shrink-0 text-red-400" />

          <p className="text-sm text-red-300">{error}</p>

          <button
            type="button"
            onClick={() => setError("")}
            className="ml-auto text-slate-600 hover:text-white"
          >
            <X size={17} />
          </button>
        </div>
      )}

      {success && (
        <div className="mb-5 flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-5 py-4">
          <CheckCircle2 size={19} className="text-emerald-400" />

          <p className="text-sm text-emerald-300">{success}</p>

          <button
            type="button"
            onClick={() => setSuccess("")}
            className="ml-auto text-slate-600 hover:text-white"
          >
            <X size={17} />
          </button>
        </div>
      )}

      {/* =========================================================
          MAIN GRID
      ========================================================= */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_350px]">
        {/* =======================================================
            CONVERSATION
        ======================================================= */}
        <section className="flex min-h-[650px] flex-col overflow-hidden rounded-3xl border border-slate-800 bg-[#0a1425]">
          <div className="border-b border-slate-800 px-6 py-5 sm:px-7">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                <MessageSquare size={21} />
              </div>

              <div>
                <h2 className="font-semibold text-white">Conversation</h2>

                <p className="text-xs text-slate-600">
                  Customer support conversation
                </p>
              </div>
            </div>
          </div>

          <div className="flex-1 space-y-6 overflow-y-auto p-6 sm:p-7">
            {ticket.messages.length > 0 ? (
              ticket.messages.map((item, index) => {
                const agentMessage = isAgentMessage(item);

                return (
                  <div
                    key={item?._id || item?.id || index}
                    className={`flex gap-3 ${
                      agentMessage ? "justify-end" : "justify-start"
                    }`}
                  >
                    {!agentMessage && (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-800 text-slate-400">
                        <UserRound size={18} />
                      </div>
                    )}

                    <div
                      className={[
                        "max-w-[82%] rounded-2xl px-5 py-4",
                        agentMessage
                          ? "rounded-br-md bg-blue-600 text-white"
                          : "rounded-bl-md border border-slate-800 bg-slate-900/70 text-slate-300",
                      ].join(" ")}
                    >
                      <div className="mb-2 flex items-center gap-2">
                        <span
                          className={`text-xs font-semibold ${
                            agentMessage ? "text-blue-100" : "text-slate-400"
                          }`}
                        >
                          {agentMessage ? "You" : getSenderName(item)}
                        </span>

                        {agentMessage && (
                          <Bot size={13} className="text-blue-200" />
                        )}
                      </div>

                      <p className="whitespace-pre-wrap text-sm leading-6">
                        {getMessageText(item)}
                      </p>

                      <div
                        className={`mt-3 flex items-center gap-2 text-[11px] ${
                          agentMessage ? "text-blue-200" : "text-slate-600"
                        }`}
                      >
                        <Clock3 size={12} />

                        {item?.createdAt
                          ? new Date(item.createdAt).toLocaleString()
                          : "Recently"}

                        {agentMessage && <Check size={13} className="ml-1" />}
                      </div>
                    </div>

                    {agentMessage && (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-blue-400">
                        <Bot size={18} />
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="flex min-h-[380px] flex-col items-center justify-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800/70 text-slate-600">
                  <MessageSquare size={28} />
                </div>

                <p className="mt-5 text-sm font-medium text-slate-400">
                  No messages yet
                </p>

                <p className="mt-2 max-w-sm text-xs text-slate-600">
                  Start the conversation by sending a reply to the customer.
                </p>
              </div>
            )}
          </div>

          {/* =====================================================
              REPLY
          ===================================================== */}
          <div className="border-t border-slate-800 p-5 sm:p-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-3 focus-within:border-blue-500/40">
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    handleSendReply();
                  }
                }}
                rows={4}
                placeholder="Write a reply to the customer..."
                className="w-full resize-none bg-transparent px-2 py-1 text-sm leading-6 text-slate-200 outline-none placeholder:text-slate-600"
              />

              <div className="mt-2 flex items-center justify-between border-t border-slate-800/70 pt-3">
                <button
                  type="button"
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-800 hover:text-slate-200"
                >
                  <Paperclip size={18} />
                </button>

                <div className="flex items-center gap-3">
                  <span className="hidden text-xs text-slate-700 sm:block">
                    Enter to send
                  </span>

                  <button
                    type="button"
                    disabled={sending || !message.trim()}
                    onClick={handleSendReply}
                    className="flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {sending ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Send size={16} />
                    )}
                    Send Reply
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =======================================================
            RIGHT SIDEBAR
        ======================================================= */}
        <aside className="space-y-6">
          {/* CUSTOMER */}
          <section className="rounded-3xl border border-slate-800 bg-[#0a1425] p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400">
                <UserRound size={21} />
              </div>

              <div>
                <h3 className="font-semibold text-white">Customer</h3>

                <p className="text-xs text-slate-600">Request owner</p>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20">
                <UserRound size={24} />
              </div>

              <div className="min-w-0">
                <p className="truncate font-semibold text-white">
                  {customerName}
                </p>

                <p className="truncate text-xs text-slate-600">
                  {customerEmail}
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-2xl bg-slate-900/60 p-4">
              <p className="text-xs text-slate-600">Customer ID</p>

              <p className="mt-1 truncate text-sm text-slate-300">
                {ticket?.customer?._id ||
                  ticket?.customer?.id ||
                  "Not available"}
              </p>
            </div>
          </section>

          {/* TICKET DETAILS */}
          <section className="rounded-3xl border border-slate-800 bg-[#0a1425] p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                <FileText size={21} />
              </div>

              <div>
                <h3 className="font-semibold text-white">Ticket Details</h3>

                <p className="text-xs text-slate-600">
                  Manage ticket properties
                </p>
              </div>
            </div>

            {/* STATUS */}
            <div className="mt-7">
              <label className="mb-2 block text-xs font-medium text-slate-600">
                Status
              </label>

              <select
                value={ticket.status}
                disabled={updatingStatus}
                onChange={(event) => handleStatusChange(event.target.value)}
                className="h-11 w-full rounded-xl border border-slate-800 bg-slate-900/70 px-3 text-sm text-slate-300 outline-none focus:border-blue-500/40"
              >
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="pending">Pending</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            {/* PRIORITY */}
            <div className="mt-5">
              <label className="mb-2 block text-xs font-medium text-slate-600">
                Priority
              </label>

              <select
                value={ticket.priority}
                disabled={updatingPriority}
                onChange={(event) => handlePriorityChange(event.target.value)}
                className="h-11 w-full rounded-xl border border-slate-800 bg-slate-900/70 px-3 text-sm text-slate-300 outline-none focus:border-blue-500/40"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            {/* ASSIGNMENT */}
            <div className="mt-5 rounded-2xl border border-emerald-500/10 bg-emerald-500/5 p-4">
              <div className="flex items-center gap-3">
                <ShieldCheck size={19} className="text-emerald-400" />

                <div>
                  <p className="text-xs text-slate-600">Assignment</p>

                  <p className="mt-0.5 text-sm font-medium text-emerald-400">
                    Assigned to you
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* CREATED */}
          <section className="rounded-3xl border border-slate-800 bg-[#0a1425] p-6">
            <div className="flex items-center gap-3 text-slate-500">
              <Clock3 size={18} />

              <span className="text-sm">Ticket timeline</span>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <p className="text-xs text-slate-600">Created</p>

                <p className="mt-1 text-sm text-slate-300">
                  {ticket?.createdAt
                    ? new Date(ticket.createdAt).toLocaleString()
                    : "Not available"}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-600">Last updated</p>

                <p className="mt-1 text-sm text-slate-300">
                  {ticket?.updatedAt
                    ? new Date(ticket.updatedAt).toLocaleString()
                    : "Not available"}
                </p>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
};

export default AgentTicketDetails;
