import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  AlertCircle,
  ArrowLeft,
  Bot,
  CheckCircle2,
  ChevronDown,
  Clock3,
  File,
  FileText,
  Image as ImageIcon,
  Loader2,
  MessageCircle,
  Paperclip,
  RefreshCw,
  Send,
  User,
  UserRound,
  X,
  Zap,
} from "lucide-react";

import { Link, useNavigate, useParams } from "react-router-dom";

import {
  assignTicketToMe,
  getAgentTicketById,
  sendAgentReply,
  updateAgentTicketPriority,
  updateAgentTicketStatus,
} from "../../../services/agentService.js";

/*
 * =========================================================
 * CONSTANTS
 * =========================================================
 */

const STATUS_OPTIONS = [
  {
    value: "open",
    label: "Open",
  },
  {
    value: "in-progress",
    label: "In Progress",
  },
  {
    value: "waiting",
    label: "Waiting",
  },
  {
    value: "resolved",
    label: "Resolved",
  },
  {
    value: "closed",
    label: "Closed",
  },
];

const PRIORITY_OPTIONS = [
  {
    value: "low",
    label: "Low",
  },
  {
    value: "medium",
    label: "Medium",
  },
  {
    value: "high",
    label: "High",
  },
];

/*
 * =========================================================
 * HELPERS
 * =========================================================
 */

const getCustomerAvatarUrl = (customer) => {
  if (!customer?.avatar) {
    return "";
  }

  const avatar = customer.avatar.trim();

  if (!avatar) {
    return "";
  }

  // Already a complete URL
  if (
    avatar.startsWith("http://") ||
    avatar.startsWith("https://") ||
    avatar.startsWith("data:")
  ) {
    return avatar;
  }

  // Relative backend upload path
  return `http://localhost:8000${
    avatar.startsWith("/") ? avatar : `/${avatar}`
  }`;
};

const getId = (value) => {
  if (!value) return "";

  if (typeof value === "string") {
    return value;
  }

  if (value?._id) {
    return String(value._id);
  }

  if (value?.id) {
    return String(value.id);
  }

  return String(value);
};

const formatDate = (date) => {
  if (!date) return "—";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "—";
  }

  return parsed.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatTime = (date) => {
  if (!date) return "";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return parsed.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatDateTime = (date) => {
  if (!date) return "—";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "—";
  }

  return parsed.toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const formatFileSize = (bytes) => {
  const size = Number(bytes || 0);

  if (!size) return "0 KB";

  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const getInitials = (name = "") => {
  const value = String(name).trim();

  if (!value) return "U";

  const parts = value.split(/\s+/);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

const getCustomerName = (customer) => {
  if (!customer) return "Customer";

  return (
    customer.name ||
    customer.fullName ||
    customer.username ||
    customer.email ||
    "Customer"
  );
};

const getStatusLabel = (status) => {
  const found = STATUS_OPTIONS.find((item) => item.value === status);

  return found?.label || status || "Unknown";
};

const getPriorityLabel = (priority) => {
  const found = PRIORITY_OPTIONS.find((item) => item.value === priority);

  return found?.label || priority || "Unknown";
};

const getStatusClasses = (status) => {
  switch (status) {
    case "open":
      return "border-sky-500/20 bg-sky-500/10 text-sky-300";

    case "in-progress":
      return "border-violet-500/20 bg-violet-500/10 text-violet-300";

    case "waiting":
      return "border-amber-500/20 bg-amber-500/10 text-amber-300";

    case "resolved":
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-300";

    case "closed":
      return "border-slate-600 bg-slate-800 text-slate-300";

    default:
      return "border-slate-700 bg-slate-800 text-slate-300";
  }
};

const getPriorityClasses = (priority) => {
  switch (priority) {
    case "high":
      return "border-red-500/20 bg-red-500/10 text-red-300";

    case "medium":
      return "border-amber-500/20 bg-amber-500/10 text-amber-300";

    case "low":
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-300";

    default:
      return "border-slate-700 bg-slate-800 text-slate-300";
  }
};

const getSenderLabel = (message) => {
  if (!message) return "Unknown";

  switch (message.senderRole) {
    case "customer":
      return "Customer";

    case "agent":
      return "You";

    case "admin":
      return "Admin";

    case "ai":
      return "SupportAI";

    case "system":
      return "System";

    default:
      return "User";
  }
};

const getAttachmentUrl = (attachment) => {
  if (!attachment) return "";

  return (
    attachment.url ||
    attachment.path ||
    attachment.fileUrl ||
    attachment.location ||
    ""
  );
};

const isImageAttachment = (attachment) => {
  const type = String(
    attachment?.mimetype || attachment?.type || "",
  ).toLowerCase();

  return type.startsWith("image/");
};

const isPdfAttachment = (attachment) => {
  const type = String(
    attachment?.mimetype || attachment?.type || "",
  ).toLowerCase();

  const name = String(
    attachment?.originalName || attachment?.filename || "",
  ).toLowerCase();

  return type === "application/pdf" || name.endsWith(".pdf");
};

const normalizeTicket = (rawTicket) => {
  if (!rawTicket) return null;

  const ticket = rawTicket.ticket || rawTicket.data || rawTicket;

  return {
    ...ticket,

    conversation: Array.isArray(ticket.conversation)
      ? ticket.conversation
      : Array.isArray(ticket.messages)
        ? ticket.messages
        : Array.isArray(ticket.replies)
          ? ticket.replies
          : [],

    attachments: Array.isArray(ticket.attachments) ? ticket.attachments : [],

    statusHistory: Array.isArray(ticket.statusHistory)
      ? ticket.statusHistory
      : [],
  };
};

/*
 * =========================================================
 * COMPONENT
 * =========================================================
 */

const AgentTicketDetails = () => {
  const { ticketId } = useParams();
  const navigate = useNavigate();

  const conversationEndRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  const [ticket, setTicket] = useState(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [reply, setReply] = useState("");

  const [selectedFiles, setSelectedFiles] = useState([]);

  const [sending, setSending] = useState(false);
  const [assigning, setAssigning] = useState(false);

  const [updatingStatus, setUpdatingStatus] = useState(false);

  const [updatingPriority, setUpdatingPriority] = useState(false);

  const [showCustomerDetails, setShowCustomerDetails] = useState(true);

  const [showHistory, setShowHistory] = useState(false);

  /*
   * =======================================================
   * LOAD TICKET
   * =======================================================
   */

  const loadTicket = useCallback(
    async (showLoader = true) => {
      if (!ticketId) return;

      try {
        if (showLoader) {
          setLoading(true);
        } else {
          setRefreshing(true);
        }

        setError("");

        const response = await getAgentTicketById(ticketId);

        const normalized = normalizeTicket(response);

        if (!normalized) {
          throw new Error("Ticket data was not returned by the server.");
        }

        setTicket(normalized);
      } catch (err) {
        console.error("Failed to load agent ticket:", err);

        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Failed to load ticket.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [ticketId],
  );

  useEffect(() => {
    loadTicket(true);
  }, [loadTicket]);

  /*
   * =======================================================
   * AUTO CLEAR SUCCESS MESSAGE
   * =======================================================
   */

  useEffect(() => {
    if (!success) return;

    const timer = setTimeout(() => {
      setSuccess("");
    }, 3500);

    return () => clearTimeout(timer);
  }, [success]);

  /*
   * =======================================================
   * AUTO SCROLL CONVERSATION
   * =======================================================
   */

  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [ticket?.conversation?.length]);

  /*
   * =======================================================
   * DERIVED VALUES
   * =======================================================
   */

  const customer = ticket?.customer;

  const customerName = getCustomerName(customer);

  const assignedAgent = ticket?.assignedAgent;

  const assignedAgentName =
    assignedAgent?.name ||
    assignedAgent?.fullName ||
    assignedAgent?.email ||
    "Unassigned";

  const conversation = ticket?.conversation || [];

  const attachments = ticket?.attachments || [];

  const isClosed = ticket?.status === "closed";

  const isResolved = ticket?.status === "resolved";

  const isAssignedToSomeoneElse = Boolean(
    assignedAgent && ticket?.assignedAgent?._id,
  );

  const ticketCanBeClaimed = !assignedAgent || !isAssignedToSomeoneElse;

  const canReply = !isClosed;

  /*
   * =======================================================
   * ASSIGN TICKET
   * =======================================================
   */

  const handleAssignToMe = async () => {
    if (!ticketId || assigning) return;

    try {
      setAssigning(true);
      setError("");
      setSuccess("");

      const response = await assignTicketToMe(ticketId);

      const updatedTicket = normalizeTicket(response);

      if (updatedTicket) {
        setTicket(updatedTicket);
      } else {
        await loadTicket(false);
      }

      setSuccess("Ticket assigned to you successfully.");
    } catch (err) {
      console.error("Failed to assign ticket:", err);

      setError(err?.response?.data?.message || "Failed to assign ticket.");
    } finally {
      setAssigning(false);
    }
  };

  /*
   * =======================================================
   * UPDATE STATUS
   * =======================================================
   */

  const handleStatusChange = async (newStatus) => {
    if (
      !ticketId ||
      !newStatus ||
      updatingStatus ||
      newStatus === ticket?.status
    ) {
      return;
    }

    try {
      setUpdatingStatus(true);
      setError("");
      setSuccess("");

      const response = await updateAgentTicketStatus(ticketId, newStatus);

      const updatedTicket = normalizeTicket(response);

      if (updatedTicket) {
        setTicket(updatedTicket);
      } else {
        await loadTicket(false);
      }

      setSuccess(`Ticket status changed to ${getStatusLabel(newStatus)}.`);
    } catch (err) {
      console.error("Failed to update status:", err);

      setError(
        err?.response?.data?.message || "Failed to update ticket status.",
      );
    } finally {
      setUpdatingStatus(false);
    }
  };

  /*
   * =======================================================
   * UPDATE PRIORITY
   * =======================================================
   */

  const handlePriorityChange = async (newPriority) => {
    if (
      !ticketId ||
      !newPriority ||
      updatingPriority ||
      newPriority === ticket?.priority
    ) {
      return;
    }

    try {
      setUpdatingPriority(true);
      setError("");
      setSuccess("");

      const response = await updateAgentTicketPriority(ticketId, newPriority);

      const updatedTicket = normalizeTicket(response);

      if (updatedTicket) {
        setTicket(updatedTicket);
      } else {
        await loadTicket(false);
      }

      setSuccess(`Priority changed to ${getPriorityLabel(newPriority)}.`);
    } catch (err) {
      console.error("Failed to update priority:", err);

      setError(
        err?.response?.data?.message || "Failed to update ticket priority.",
      );
    } finally {
      setUpdatingPriority(false);
    }
  };

  /*
   * =======================================================
   * FILE SELECTION
   * =======================================================
   */

  const handleFileSelection = (event) => {
    const files = Array.from(event.target.files || []);

    if (!files.length) return;

    /*
     * The backend currently expects attachment
     * objects in the reply payload.
     *
     * Keep the selected files in the UI for now.
     * Actual multipart upload can be connected to
     * the existing ticket attachment middleware.
     */
    setSelectedFiles((previous) => [...previous, ...files]);

    event.target.value = "";
  };

  /*
   * =======================================================
   * REMOVE SELECTED FILE
   * =======================================================
   */

  const removeSelectedFile = (index) => {
    setSelectedFiles((previous) =>
      previous.filter((_, fileIndex) => fileIndex !== index),
    );
  };

  /*
   * =======================================================
   * SEND REPLY
   * =======================================================
   */

  const handleSendReply = async () => {
    const cleanMessage = reply.trim();

    /*
     * Current backend expects attachment metadata,
     * not File objects.
     *
     * Until a multipart agent attachment endpoint
     * is added, we prevent silently sending unusable
     * File objects.
     */
    if (!cleanMessage && !selectedFiles.length) {
      return;
    }

    if (!ticketId || sending) return;

    if (selectedFiles.length > 0) {
      setError(
        "File upload is selected, but the agent attachment upload endpoint is not connected yet. Send the message without files or connect the upload endpoint.",
      );
      return;
    }

    try {
      setSending(true);
      setError("");
      setSuccess("");

      const response = await sendAgentReply(ticketId, cleanMessage, []);

      const updatedTicket = normalizeTicket(response);

      if (updatedTicket) {
        setTicket(updatedTicket);
      } else {
        await loadTicket(false);
      }

      setReply("");
      setSelectedFiles([]);

      setSuccess("Reply sent successfully.");

      requestAnimationFrame(() => {
        textareaRef.current?.focus();
      });
    } catch (err) {
      console.error("Failed to send agent reply:", err);

      setError(err?.response?.data?.message || "Failed to send reply.");
    } finally {
      setSending(false);
    }
  };

  /*
   * =======================================================
   * KEYBOARD SEND
   * =======================================================
   */

  const handleReplyKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSendReply();
    }
  };

  /*
   * =======================================================
   * RENDER ATTACHMENT
   * =======================================================
   */

  const renderAttachment = (attachment, index) => {
    const url = getAttachmentUrl(attachment);

    const name =
      attachment?.originalName ||
      attachment?.filename ||
      `Attachment ${index + 1}`;

    const image = isImageAttachment(attachment);

    const pdf = isPdfAttachment(attachment);

    if (image && url) {
      return (
        <a
          key={`${name}-${index}`}
          href={url}
          target="_blank"
          rel="noreferrer"
          className="group block overflow-hidden rounded-xl border border-slate-700 bg-slate-950"
        >
          <img
            src={url}
            alt={name}
            className="max-h-64 w-full object-contain transition group-hover:scale-[1.01]"
          />

          <div className="flex items-center justify-between gap-3 border-t border-slate-800 px-3 py-2">
            <span className="truncate text-xs text-slate-300">{name}</span>

            <span className="text-[11px] text-slate-500">
              {formatFileSize(attachment?.size)}
            </span>
          </div>
        </a>
      );
    }

    return (
      <a
        key={`${name}-${index}`}
        href={url || "#"}
        target={url ? "_blank" : undefined}
        rel={url ? "noreferrer" : undefined}
        onClick={(event) => {
          if (!url) {
            event.preventDefault();
          }
        }}
        className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-950/70 p-3 transition hover:border-slate-600 hover:bg-slate-900"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-800">
          {pdf ? (
            <FileText size={19} className="text-red-400" />
          ) : (
            <File size={19} className="text-slate-300" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-slate-200">{name}</p>

          <p className="mt-0.5 text-xs text-slate-500">
            {formatFileSize(attachment?.size)}
          </p>
        </div>
      </a>
    );
  };

  /*
   * =======================================================
   * MESSAGE AVATAR
   * =======================================================
   */

  const renderMessageAvatar = (message) => {
    if (message?.senderRole === "ai") {
      return (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-500/15 text-violet-300 ring-1 ring-violet-500/20">
          <Bot size={17} />
        </div>
      );
    }

    if (message?.senderRole === "system") {
      return (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-800 text-slate-400 ring-1 ring-slate-700">
          <Zap size={16} />
        </div>
      );
    }

    if (message?.senderRole === "agent" || message?.senderRole === "admin") {
      const senderName =
        message?.sender?.name || message?.sender?.email || "Agent";

      return (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/20">
          {getInitials(senderName)}
        </div>
      );
    }

    return (
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/20">
        <UserRound size={17} />
      </div>
    );
  };

  /*
   * =======================================================
   * LOADING STATE
   * =======================================================
   */

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Loader2 size={28} className="animate-spin" />

          <p className="text-sm">Loading ticket...</p>
        </div>
      </div>
    );
  }

  /*
   * =======================================================
   * ERROR / NO TICKET
   * =======================================================
   */

  if (!ticket) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-400">
            <AlertCircle size={24} />
          </div>

          <h2 className="mt-4 text-lg font-semibold text-white">
            Unable to load ticket
          </h2>

          <p className="mt-2 text-sm text-slate-400">
            {error || "The requested ticket could not be found."}
          </p>

          <div className="mt-6 flex justify-center gap-3">
            <button
              type="button"
              onClick={() => loadTicket(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-slate-800"
            >
              <RefreshCw size={16} />
              Try Again
            </button>

            <button
              type="button"
              onClick={() => navigate("/agent/tickets")}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
            >
              <ArrowLeft size={16} />
              Back to My Tickets
            </button>
          </div>
        </div>
      </div>
    );
  }

  /*
   * =======================================================
   * MAIN UI
   * =======================================================
   */

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 py-5 sm:px-6 lg:px-8">
      {/* ===================================================
          TOP BAR
      =================================================== */}

      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            to="/agent/tickets"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-400 transition hover:border-slate-700 hover:bg-slate-800 hover:text-white"
          >
            <ArrowLeft size={18} />
          </Link>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs text-slate-500">
                #{ticket.ticketNumber || ticket._id}
              </span>

              <span
                className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getStatusClasses(
                  ticket.status,
                )}`}
              >
                {getStatusLabel(ticket.status)}
              </span>

              <span
                className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getPriorityClasses(
                  ticket.priority,
                )}`}
              >
                {getPriorityLabel(ticket.priority)}
              </span>
            </div>

            <h1 className="mt-1 truncate text-xl font-bold text-white sm:text-2xl">
              {ticket.subject || "Untitled Ticket"}
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => loadTicket(false)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2.5 text-sm font-medium text-slate-300 transition hover:border-slate-700 hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>

          {!ticket.assignedAgent && (
            <button
              type="button"
              onClick={handleAssignToMe}
              disabled={assigning}
              className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {assigning ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <UserRound size={16} />
              )}

              {assigning ? "Assigning..." : "Assign to Me"}
            </button>
          )}
        </div>
      </div>

      {/* ===================================================
          ALERTS
      =================================================== */}

      {error && (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-300">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />

          <div className="min-w-0 flex-1">{error}</div>

          <button
            type="button"
            onClick={() => setError("")}
            className="text-red-400 transition hover:text-red-200"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {success && (
        <div className="mb-5 flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-300">
          <CheckCircle2 size={18} />

          <span>{success}</span>
        </div>
      )}

      {/* ===================================================
          MAIN GRID
      =================================================== */}

      <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        {/* =================================================
            LEFT / CONVERSATION
        ================================================= */}

        <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70 shadow-xl shadow-black/10">
          {/* Conversation Header */}

          <div className="flex flex-col gap-4 border-b border-slate-800 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400 ring-1 ring-sky-500/20">
                <MessageCircle size={19} />
              </div>

              <div>
                <h2 className="font-semibold text-white">Conversation</h2>

                <p className="text-xs text-slate-500">
                  {conversation.length}{" "}
                  {conversation.length === 1 ? "message" : "messages"}
                </p>
              </div>
            </div>

            {/* Status / Priority Controls */}

            <div className="flex flex-wrap items-center gap-2">
              {/* Status */}

              <div className="relative">
                <select
                  value={ticket.status || "open"}
                  onChange={(event) => handleStatusChange(event.target.value)}
                  disabled={updatingStatus}
                  className="appearance-none rounded-xl border border-slate-700 bg-slate-950 py-2 pl-3 pr-9 text-xs font-medium text-slate-200 outline-none transition focus:border-sky-500/50 disabled:opacity-50"
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>

                <ChevronDown
                  size={14}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                />
              </div>

              {/* Priority */}

              <div className="relative">
                <select
                  value={ticket.priority || "medium"}
                  onChange={(event) => handlePriorityChange(event.target.value)}
                  disabled={updatingPriority}
                  className="appearance-none rounded-xl border border-slate-700 bg-slate-950 py-2 pl-3 pr-9 text-xs font-medium text-slate-200 outline-none transition focus:border-sky-500/50 disabled:opacity-50"
                >
                  {PRIORITY_OPTIONS.map((priority) => (
                    <option key={priority.value} value={priority.value}>
                      {priority.label}
                    </option>
                  ))}
                </select>

                <ChevronDown
                  size={14}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                />
              </div>
            </div>
          </div>

          {/* Ticket Description */}

          <div className="border-b border-slate-800 bg-slate-950/30 px-5 py-5">
            <div className="mb-2 flex items-center gap-2">
              <FileText size={15} className="text-slate-500" />

              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Original Request
              </span>
            </div>

            <div className="whitespace-pre-wrap text-sm leading-6 text-slate-300">
              {ticket.description || "No description provided."}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500">
              <span>Created {formatDateTime(ticket.createdAt)}</span>

              {ticket.updatedAt && (
                <span>Updated {formatDateTime(ticket.updatedAt)}</span>
              )}

              {ticket.category && (
                <span>
                  Category:{" "}
                  <span className="text-slate-300">{ticket.category}</span>
                </span>
              )}
            </div>
          </div>

          {/* Conversation */}

          <div className="max-h-[650px] min-h-[400px] space-y-5 overflow-y-auto px-5 py-6">
            {conversation.length === 0 ? (
              <div className="flex min-h-[300px] flex-col items-center justify-center text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800 text-slate-500">
                  <MessageCircle size={24} />
                </div>

                <h3 className="mt-4 text-sm font-semibold text-slate-300">
                  No messages yet
                </h3>

                <p className="mt-1 max-w-xs text-xs leading-5 text-slate-500">
                  Start the conversation by sending a reply to the customer.
                </p>
              </div>
            ) : (
              conversation.map((message, index) => {
                const isAgent =
                  message?.senderRole === "agent" ||
                  message?.senderRole === "admin";

                const isAI = message?.senderRole === "ai";

                const isSystem = message?.senderRole === "system";

                return (
                  <div
                    key={message?._id || `${message?.createdAt}-${index}`}
                    className={`flex gap-3 ${
                      isAgent ? "justify-end" : "justify-start"
                    }`}
                  >
                    {!isAgent && (
                      <div className="pt-1">{renderMessageAvatar(message)}</div>
                    )}

                    <div
                      className={`min-w-0 max-w-[88%] sm:max-w-[78%] ${
                        isAgent ? "items-end" : "items-start"
                      }`}
                    >
                      <div
                        className={`mb-1.5 flex items-center gap-2 ${
                          isAgent ? "justify-end" : "justify-start"
                        }`}
                      >
                        <span className="text-xs font-medium text-slate-400">
                          {getSenderLabel(message)}
                        </span>

                        <span className="text-[11px] text-slate-600">
                          {formatDate(message?.createdAt)}{" "}
                          {formatTime(message?.createdAt)}
                        </span>
                      </div>

                      <div
                        className={`rounded-2xl border px-4 py-3 ${
                          isAgent
                            ? "rounded-tr-md border-sky-500/20 bg-sky-500/10 text-slate-200"
                            : isAI
                              ? "border-violet-500/20 bg-violet-500/5 text-slate-300"
                              : isSystem
                                ? "border-slate-700 bg-slate-800/60 text-slate-400"
                                : "rounded-tl-md border-slate-800 bg-slate-950 text-slate-300"
                        }`}
                      >
                        {message?.message && (
                          <p className="whitespace-pre-wrap break-words text-sm leading-6">
                            {message.message}
                          </p>
                        )}

                        {Array.isArray(message?.attachments) &&
                          message.attachments.length > 0 && (
                            <div
                              className={`mt-3 grid gap-2 ${
                                message.attachments.length > 1
                                  ? "sm:grid-cols-2"
                                  : "grid-cols-1"
                              }`}
                            >
                              {message.attachments.map(
                                (attachment, attachmentIndex) =>
                                  renderAttachment(attachment, attachmentIndex),
                              )}
                            </div>
                          )}
                      </div>
                    </div>

                    {isAgent && (
                      <div className="pt-1">{renderMessageAvatar(message)}</div>
                    )}
                  </div>
                );
              })
            )}

            <div ref={conversationEndRef} />
          </div>

          {/* Reply Composer */}

          <div className="border-t border-slate-800 bg-slate-950/40 p-4">
            {isClosed && (
              <div className="mb-3 flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-xs text-slate-400">
                <Clock3 size={15} />
                This ticket is closed. Change the status to reopen it before
                replying.
              </div>
            )}

            {/* Selected Files */}

            {selectedFiles.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {selectedFiles.map((file, index) => (
                  <div
                    key={`${file.name}-${index}`}
                    className="flex max-w-full items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2"
                  >
                    {file.type?.startsWith("image/") ? (
                      <ImageIcon size={15} className="shrink-0 text-sky-400" />
                    ) : (
                      <File size={15} className="shrink-0 text-slate-400" />
                    )}

                    <span className="max-w-[180px] truncate text-xs text-slate-300">
                      {file.name}
                    </span>

                    <button
                      type="button"
                      onClick={() => removeSelectedFile(index)}
                      className="text-slate-500 transition hover:text-red-400"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="rounded-2xl border border-slate-700 bg-slate-900 transition focus-within:border-sky-500/40 focus-within:ring-1 focus-within:ring-sky-500/10">
              <textarea
                ref={textareaRef}
                value={reply}
                onChange={(event) => setReply(event.target.value)}
                onKeyDown={handleReplyKeyDown}
                disabled={sending || !canReply}
                rows={4}
                placeholder={
                  isClosed
                    ? "Reopen the ticket to reply..."
                    : "Write your reply to the customer..."
                }
                className="w-full resize-none border-0 bg-transparent px-4 py-3 text-sm leading-6 text-slate-200 outline-none placeholder:text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
              />

              <div className="flex items-center justify-between border-t border-slate-800 px-3 py-2.5">
                <div className="flex items-center gap-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFileSelection}
                  />

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={sending || !canReply}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-800 hover:text-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
                    title="Attach files"
                  >
                    <Paperclip size={18} />
                  </button>

                  <span className="hidden text-[11px] text-slate-600 sm:block">
                    Press Enter to send · Shift + Enter for new line
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleSendReply}
                  disabled={
                    sending ||
                    !canReply ||
                    (!reply.trim() && !selectedFiles.length)
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {sending ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Send size={16} />
                  )}

                  {sending ? "Sending..." : "Send Reply"}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* =================================================
            RIGHT SIDEBAR
        ================================================= */}

        <aside className="min-w-0 space-y-5">
          {/* Customer */}

          <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70">
            <button
              type="button"
              onClick={() => setShowCustomerDetails((value) => !value)}
              className="flex w-full items-center justify-between border-b border-slate-800 px-5 py-4 text-left"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                  <User size={17} />
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-white">Customer</h3>

                  <p className="text-[11px] text-slate-500">
                    Customer information
                  </p>
                </div>
              </div>

              <ChevronDown
                size={16}
                className={`text-slate-500 transition ${
                  showCustomerDetails ? "rotate-180" : ""
                }`}
              />
            </button>

            {showCustomerDetails && (
              <div className="p-5">
                <div className="flex items-center gap-3">
                  {getCustomerAvatarUrl(customer) ? (
                    <img
                      src={getCustomerAvatarUrl(customer)}
                      alt={customerName}
                      className="h-12 w-12 rounded-full object-cover ring-2 ring-slate-800"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                        e.currentTarget.nextElementSibling?.classList.remove(
                          "hidden",
                        );
                      }}
                    />
                  ) : null}

                  <div
                    className={`h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white ${
                      getCustomerAvatarUrl(customer) ? "hidden" : "flex"
                    }`}
                  >
                    {getInitials(customerName)}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate font-semibold text-white">
                      {customerName}
                    </p>

                    {customer?.email && (
                      <p className="truncate text-xs text-slate-500">
                        {customer.email}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  {customer?.email && (
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                        Email
                      </p>

                      <p className="mt-1 break-all text-sm text-slate-300">
                        {customer.email}
                      </p>
                    </div>
                  )}

                  {customer?.phone && (
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                        Phone
                      </p>

                      <p className="mt-1 text-sm text-slate-300">
                        {customer.phone}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>

          {/* Ticket Information */}

          <section className="rounded-2xl border border-slate-800 bg-slate-900/70">
            <div className="border-b border-slate-800 px-5 py-4">
              <h3 className="text-sm font-semibold text-white">
                Ticket Information
              </h3>
            </div>

            <div className="space-y-4 p-5">
              <InfoRow
                label="Ticket ID"
                value={ticket.ticketNumber || ticket._id}
                mono
              />

              <InfoRow label="Category" value={ticket.category || "General"} />

              <InfoRow
                label="Priority"
                value={
                  <span
                    className={`rounded-full border px-2 py-1 text-[10px] font-semibold ${getPriorityClasses(
                      ticket.priority,
                    )}`}
                  >
                    {getPriorityLabel(ticket.priority)}
                  </span>
                }
              />

              <InfoRow
                label="Status"
                value={
                  <span
                    className={`rounded-full border px-2 py-1 text-[10px] font-semibold ${getStatusClasses(
                      ticket.status,
                    )}`}
                  >
                    {getStatusLabel(ticket.status)}
                  </span>
                }
              />

              <InfoRow label="Created" value={formatDate(ticket.createdAt)} />

              <InfoRow
                label="Last Reply"
                value={formatDateTime(ticket.lastReplyAt)}
              />

              <InfoRow label="Replies" value={ticket.replies || 0} />
            </div>
          </section>

          {/* Assigned Agent */}

          <section className="rounded-2xl border border-slate-800 bg-slate-900/70">
            <div className="border-b border-slate-800 px-5 py-4">
              <h3 className="text-sm font-semibold text-white">
                Assigned Agent
              </h3>
            </div>

            <div className="p-5">
              {assignedAgent ? (
                <div className="flex items-center gap-3">
                  {assignedAgent?.avatar || assignedAgent?.profileImage ? (
                    <img
                      src={assignedAgent.avatar || assignedAgent.profileImage}
                      alt={assignedAgentName}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-500/10 text-xs font-semibold text-sky-300 ring-1 ring-sky-500/20">
                      {getInitials(assignedAgentName)}
                    </div>
                  )}

                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-200">
                      {assignedAgentName}
                    </p>

                    {assignedAgent?.email && (
                      <p className="truncate text-xs text-slate-500">
                        {assignedAgent.email}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950/40 p-4 text-center">
                  <UserRound size={20} className="mx-auto text-slate-600" />

                  <p className="mt-2 text-xs text-slate-500">
                    This ticket is currently unassigned.
                  </p>

                  <button
                    type="button"
                    onClick={handleAssignToMe}
                    disabled={assigning}
                    className="mt-3 inline-flex items-center gap-2 rounded-lg bg-sky-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-sky-400 disabled:opacity-50"
                  >
                    <UserRound size={14} />
                    Assign to Me
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* Ticket Attachments */}

          <section className="rounded-2xl border border-slate-800 bg-slate-900/70">
            <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
              <div>
                <h3 className="text-sm font-semibold text-white">
                  Attachments
                </h3>

                <p className="text-[11px] text-slate-500">
                  {attachments.length}{" "}
                  {attachments.length === 1 ? "file" : "files"}
                </p>
              </div>

              <Paperclip size={16} className="text-slate-500" />
            </div>

            <div className="space-y-2 p-4">
              {attachments.length === 0 ? (
                <div className="py-5 text-center">
                  <File size={21} className="mx-auto text-slate-700" />

                  <p className="mt-2 text-xs text-slate-600">
                    No ticket attachments
                  </p>
                </div>
              ) : (
                attachments.map((attachment, index) =>
                  renderAttachment(attachment, index),
                )
              )}
            </div>
          </section>

          {/* Status History */}

          <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70">
            <button
              type="button"
              onClick={() => setShowHistory((value) => !value)}
              className="flex w-full items-center justify-between border-b border-slate-800 px-5 py-4 text-left"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400">
                  <Clock3 size={16} />
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-white">
                    Status History
                  </h3>

                  <p className="text-[11px] text-slate-500">
                    {ticket.statusHistory?.length} changes
                  </p>
                </div>
              </div>

              <ChevronDown
                size={16}
                className={`text-slate-500 transition ${
                  showHistory ? "rotate-180" : ""
                }`}
              />
            </button>

            {showHistory && (
              <div className="max-h-72 overflow-y-auto p-5">
                {ticket.statusHistory?.length ? (
                  <div className="space-y-4">
                    {[...ticket.statusHistory]
                      .reverse()
                      .map((history, index) => (
                        <div
                          key={history?._id || index}
                          className="relative pl-6"
                        >
                          <div className="absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full bg-sky-400 ring-4 ring-sky-400/10" />

                          {index < ticket.statusHistory.length - 1 && (
                            <div className="absolute left-[4px] top-4 h-full w-px bg-slate-800" />
                          )}

                          <p className="text-xs font-medium text-slate-300">
                            {getStatusLabel(history.status)}
                          </p>

                          <p className="mt-1 text-[11px] leading-5 text-slate-500">
                            {history.note || "Status updated"}
                          </p>

                          <p className="mt-1 text-[10px] text-slate-600">
                            {formatDateTime(history.createdAt)}
                          </p>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-center text-xs text-slate-600">
                    No status history available.
                  </p>
                )}
              </div>
            )}
          </section>

          {/* Resolution Information */}

          {(ticket.resolvedAt || ticket.closedAt || ticket.customerRating) && (
            <section className="rounded-2xl border border-slate-800 bg-slate-900/70">
              <div className="border-b border-slate-800 px-5 py-4">
                <h3 className="text-sm font-semibold text-white">Resolution</h3>
              </div>

              <div className="space-y-4 p-5">
                {ticket.resolvedAt && (
                  <InfoRow
                    label="Resolved"
                    value={formatDateTime(ticket.resolvedAt)}
                  />
                )}

                {ticket.closedAt && (
                  <InfoRow
                    label="Closed"
                    value={formatDateTime(ticket.closedAt)}
                  />
                )}

                {ticket.customerRating && (
                  <InfoRow
                    label="Customer Rating"
                    value={
                      <span className="font-semibold text-amber-300">
                        {"★".repeat(ticket.customerRating)}
                      </span>
                    }
                  />
                )}

                {ticket.customerFeedback && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                      Customer Feedback
                    </p>

                    <p className="mt-1 text-sm leading-5 text-slate-400">
                      {ticket.customerFeedback}
                    </p>
                  </div>
                )}
              </div>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
};

/*
 * =========================================================
 * INFO ROW
 * =========================================================
 */

const InfoRow = ({ label, value, mono = false }) => {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="shrink-0 text-xs text-slate-500">{label}</span>

      <span
        className={`text-right text-xs text-slate-300 ${
          mono ? "font-mono" : ""
        }`}
      >
        {value}
      </span>
    </div>
  );
};

export default AgentTicketDetails;
