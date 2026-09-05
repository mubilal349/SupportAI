import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  AlertCircle,
  ArrowLeft,
  Check,
  ChevronDown,
  Clock,
  Download,
  File,
  FileImage,
  FileText,
  History,
  Image as ImageIcon,
  Loader2,
  Mail,
  MessageCircle,
  Paperclip,
  RefreshCw,
  Send,
  ShieldCheck,
  User,
  UserCheck,
  X,
} from "lucide-react";

import { Link, useNavigate, useParams } from "react-router-dom";

import {
  assignTicketToMe,
  getAgentTicketById,
  sendAgentReply,
  updateAgentTicketPriority,
  updateAgentTicketStatus,
} from "../../../services/agentService";

/*
 * =========================================================
 * CONSTANTS
 * =========================================================
 */

const BACKEND_URL = "http://localhost:8000";

const MAX_FILES = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

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

const getId = (value) => {
  if (!value) return "";

  if (typeof value === "string") {
    return value;
  }

  return (value._id || value.id || value.$oid || "").toString();
};

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatTime = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
};

const formatDateTime = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return `${date.toLocaleDateString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
  })} at ${date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  })}`;
};

const formatFileSize = (bytes) => {
  if (!bytes || bytes <= 0) {
    return "0 KB";
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getInitials = (name = "") => {
  const words = name.trim().split(/\s+/).filter(Boolean);

  if (!words.length) {
    return "CU";
  }

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
};

const getCustomerName = (customer) => {
  return customer?.name || customer?.fullName || customer?.email || "Customer";
};

const getAgentName = (agent) => {
  return agent?.name || agent?.fullName || agent?.email || "Agent";
};

const getStatusLabel = (status) => {
  const option = STATUS_OPTIONS.find((item) => item.value === status);

  return option?.label || status || "Unknown";
};

const getPriorityLabel = (priority) => {
  const option = PRIORITY_OPTIONS.find((item) => item.value === priority);

  return option?.label || priority || "Unknown";
};

const getStatusClasses = (status) => {
  switch (status) {
    case "open":
      return "border-blue-500/20 bg-blue-500/10 text-blue-400";

    case "in-progress":
      return "border-indigo-500/20 bg-indigo-500/10 text-indigo-400";

    case "waiting":
      return "border-amber-500/20 bg-amber-500/10 text-amber-400";

    case "resolved":
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-400";

    case "closed":
      return "border-slate-500/20 bg-slate-500/10 text-slate-400";

    default:
      return "border-slate-700 bg-slate-800 text-slate-300";
  }
};

const getPriorityClasses = (priority) => {
  switch (priority) {
    case "high":
      return "border-red-500/20 bg-red-500/10 text-red-400";

    case "medium":
      return "border-amber-500/20 bg-amber-500/10 text-amber-400";

    case "low":
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-400";

    default:
      return "border-slate-700 bg-slate-800 text-slate-300";
  }
};

const getSenderLabel = (message) => {
  switch (message?.senderRole) {
    case "customer":
      return "Customer";

    case "agent":
      return "Agent";

    case "admin":
      return "Admin";

    case "ai":
      return "AI Assistant";

    case "system":
      return "System";

    default:
      return "Support";
  }
};

/*
 * =========================================================
 * CUSTOMER AVATAR
 * =========================================================
 */

const getCustomerAvatarUrl = (customer) => {
  const avatar = customer?.avatar?.trim();

  if (!avatar) {
    return "";
  }

  if (
    avatar.startsWith("http://") ||
    avatar.startsWith("https://") ||
    avatar.startsWith("data:")
  ) {
    return avatar;
  }

  return `${BACKEND_URL}${avatar.startsWith("/") ? avatar : `/${avatar}`}`;
};

/*
 * =========================================================
 * FILE URL
 * =========================================================
 */

const getAttachmentUrl = (attachment) => {
  if (!attachment) {
    return "";
  }

  const filePath =
    attachment.path || attachment.url || attachment.filename || "";

  if (!filePath) {
    return "";
  }

  if (
    filePath.startsWith("http://") ||
    filePath.startsWith("https://") ||
    filePath.startsWith("data:")
  ) {
    return filePath;
  }

  return `${BACKEND_URL}${
    filePath.startsWith("/") ? filePath : `/${filePath}`
  }`;
};

const isImageAttachment = (attachment) => {
  return Boolean(attachment?.mimetype?.startsWith("image/"));
};

const isPdfAttachment = (attachment) => {
  return (
    attachment?.mimetype === "application/pdf" ||
    attachment?.originalName?.toLowerCase().endsWith(".pdf")
  );
};

const normalizeTicket = (rawTicket, fallbackId = "") => {
  if (!rawTicket) {
    return null;
  }

  return {
    ...rawTicket,

    id: getId(rawTicket) || fallbackId,

    conversation:
      rawTicket.conversation ||
      rawTicket.messages ||
      rawTicket.repliesList ||
      [],

    attachments: rawTicket.attachments || [],

    status: rawTicket.status || "open",

    priority: rawTicket.priority || "medium",
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

  const replyInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const conversationEndRef = useRef(null);

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
   * DERIVED DATA
   * =======================================================
   */

  const customer = ticket?.customer || null;

  const assignedAgent = ticket?.assignedAgent || null;

  const customerName = getCustomerName(customer);

  const customerAvatarUrl = getCustomerAvatarUrl(customer);

  const conversation = ticket?.conversation || [];

  const statusHistory = ticket?.statusHistory || [];

  const ticketAttachments = ticket?.attachments || [];

  const isClosed = ticket?.status === "closed";

  const isResolved = ticket?.status === "resolved";

  const isAssignedToCurrentAgent = Boolean(ticket?.assignedAgent);

  const canReply = !isClosed;

  /*
   * =======================================================
   * LOAD TICKET
   * =======================================================
   */

  const loadTicket = useCallback(
    async (showRefresh = false) => {
      if (!ticketId) {
        return;
      }

      try {
        if (showRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const response = await getAgentTicketById(ticketId);

        const rawTicket =
          response?.ticket ||
          response?.data?.ticket ||
          response?.data ||
          response;

        const normalized = normalizeTicket(rawTicket, ticketId);

        setTicket(normalized);
      } catch (err) {
        console.error("LOAD AGENT TICKET ERROR:", err);

        setError(err?.response?.data?.message || "Failed to load ticket.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [ticketId],
  );

  /*
   * =======================================================
   * INITIAL LOAD
   * =======================================================
   */

  useEffect(() => {
    loadTicket();
  }, [loadTicket]);

  /*
   * =======================================================
   * AUTO CLEAR SUCCESS
   * =======================================================
   */

  useEffect(() => {
    if (!success) {
      return;
    }

    const timer = setTimeout(() => {
      setSuccess("");
    }, 3500);

    return () => clearTimeout(timer);
  }, [success]);

  /*
   * =======================================================
   * AUTO SCROLL
   * =======================================================
   */

  useEffect(() => {
    if (!conversation.length) {
      return;
    }

    conversationEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [conversation.length]);

  /*
   * =======================================================
   * ASSIGN TICKET
   * =======================================================
   */

  const handleAssignTicket = async () => {
    if (!ticket?.id) {
      return;
    }

    try {
      setAssigning(true);
      setError("");
      setSuccess("");

      const response = await assignTicketToMe(ticket.id);

      const updatedTicket =
        response?.ticket || response?.data?.ticket || response?.data || null;

      if (updatedTicket) {
        setTicket(normalizeTicket(updatedTicket, ticket.id));
      } else {
        await loadTicket(true);
      }

      setSuccess("Ticket assigned to you successfully.");
    } catch (err) {
      console.error("ASSIGN TICKET ERROR:", err);

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

  const handleStatusChange = async (event) => {
    const newStatus = event.target.value;

    if (!ticket?.id || !newStatus) {
      return;
    }

    try {
      setUpdatingStatus(true);
      setError("");
      setSuccess("");

      const response = await updateAgentTicketStatus(ticket.id, newStatus);

      const updatedTicket =
        response?.ticket || response?.data?.ticket || response?.data || null;

      if (updatedTicket) {
        setTicket(normalizeTicket(updatedTicket, ticket.id));
      } else {
        setTicket((prev) =>
          prev
            ? {
                ...prev,
                status: newStatus,
              }
            : prev,
        );
      }

      setSuccess(`Ticket status changed to ${getStatusLabel(newStatus)}.`);
    } catch (err) {
      console.error("UPDATE STATUS ERROR:", err);

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

  const handlePriorityChange = async (event) => {
    const newPriority = event.target.value;

    if (!ticket?.id || !newPriority) {
      return;
    }

    try {
      setUpdatingPriority(true);
      setError("");
      setSuccess("");

      const response = await updateAgentTicketPriority(ticket.id, newPriority);

      const updatedTicket =
        response?.ticket || response?.data?.ticket || response?.data || null;

      if (updatedTicket) {
        setTicket(normalizeTicket(updatedTicket, ticket.id));
      } else {
        setTicket((prev) =>
          prev
            ? {
                ...prev,
                priority: newPriority,
              }
            : prev,
        );
      }

      setSuccess(`Priority changed to ${getPriorityLabel(newPriority)}.`);
    } catch (err) {
      console.error("UPDATE PRIORITY ERROR:", err);

      setError(err?.response?.data?.message || "Failed to update priority.");
    } finally {
      setUpdatingPriority(false);
    }
  };

  /*
   * =======================================================
   * FILE SELECTION
   * =======================================================
   */

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files || []);

    if (!files.length) {
      return;
    }

    setError("");

    const availableSlots = MAX_FILES - selectedFiles.length;

    if (availableSlots <= 0) {
      setError(`You can attach a maximum of ${MAX_FILES} files.`);

      event.target.value = "";
      return;
    }

    const filesToAdd = files.slice(0, availableSlots);

    const validFiles = [];

    for (const file of filesToAdd) {
      if (file.size > MAX_FILE_SIZE) {
        setError(`${file.name} is larger than 10 MB.`);

        continue;
      }

      validFiles.push(file);
    }

    if (validFiles.length > 0) {
      setSelectedFiles((prev) => [...prev, ...validFiles]);
    }

    if (files.length > availableSlots) {
      setError(`Only ${MAX_FILES} attachments are allowed.`);
    }

    event.target.value = "";
  };

  /*
   * =======================================================
   * REMOVE SELECTED FILE
   * =======================================================
   */

  const removeSelectedFile = (index) => {
    setSelectedFiles((prev) =>
      prev.filter((_, fileIndex) => fileIndex !== index),
    );
  };

  /*
   * =======================================================
   * SEND REPLY
   * =======================================================
   */

  const handleSendReply = async () => {
    const message = reply.trim();

    if (!message && selectedFiles.length === 0) {
      return;
    }

    if (!ticket?.id) {
      return;
    }

    if (!canReply) {
      setError("This ticket is closed and cannot receive replies.");

      return;
    }

    try {
      setSending(true);
      setError("");
      setSuccess("");

      const response = await sendAgentReply(ticket.id, message, selectedFiles);

      const updatedTicket =
        response?.ticket || response?.data?.ticket || response?.data || null;

      if (updatedTicket) {
        setTicket(normalizeTicket(updatedTicket, ticket.id));
      } else {
        await loadTicket(true);
      }

      setReply("");
      setSelectedFiles([]);

      setSuccess("Reply sent successfully.");

      setTimeout(() => {
        replyInputRef.current?.focus();
      }, 100);
    } catch (err) {
      console.error("SEND AGENT REPLY ERROR:", err);

      setError(err?.response?.data?.message || "Failed to send reply.");
    } finally {
      setSending(false);
    }
  };

  /*
   * =======================================================
   * ENTER TO SEND
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
   * MESSAGE AVATAR
   * =======================================================
   */

  const getMessageAvatar = (message) => {
    const sender = message?.sender;

    if (message?.senderRole === "customer") {
      return {
        name: getCustomerName(customer),
        avatar: getCustomerAvatarUrl(customer),
      };
    }

    if (sender) {
      return {
        name: sender?.name || sender?.email || getSenderLabel(message),

        avatar: sender?.avatar ? getCustomerAvatarUrl(sender) : "",
      };
    }

    return {
      name: getSenderLabel(message),

      avatar: "",
    };
  };

  /*
   * =======================================================
   * ATTACHMENT RENDERER
   * =======================================================
   */

  const renderAttachment = (attachment, index) => {
    const url = getAttachmentUrl(attachment);

    if (!url) {
      return null;
    }

    const image = isImageAttachment(attachment);

    const pdf = isPdfAttachment(attachment);

    const fileName =
      attachment?.originalName || attachment?.filename || "Attachment";

    if (image) {
      return (
        <a
          key={attachment?._id || `${fileName}-${index}`}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="group block overflow-hidden rounded-xl border border-slate-700 bg-slate-950"
        >
          <img
            src={url}
            alt={fileName}
            className="max-h-96 w-auto max-w-full object-contain transition group-hover:opacity-90"
            loading="lazy"
          />

          <div className="flex items-center justify-between border-t border-slate-800 px-3 py-2">
            <span className="truncate text-xs text-slate-400">{fileName}</span>

            <Download className="h-4 w-4 shrink-0 text-slate-500" />
          </div>
        </a>
      );
    }

    return (
      <a
        key={attachment?._id || `${fileName}-${index}`}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-950/70 p-3 transition hover:border-indigo-500/40 hover:bg-slate-800"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10">
          {pdf ? (
            <FileText className="h-5 w-5 text-red-400" />
          ) : (
            <File className="h-5 w-5 text-indigo-400" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-white">{fileName}</p>

          <p className="mt-0.5 text-xs text-slate-500">
            {pdf ? "PDF Document" : attachment?.mimetype || "File"}

            {attachment?.size ? ` • ${formatFileSize(attachment.size)}` : ""}
          </p>
        </div>

        <Download className="h-4 w-4 shrink-0 text-slate-500" />
      </a>
    );
  };

  /*
   * =======================================================
   * LOADING
   * =======================================================
   */

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />

          <p className="text-sm text-slate-400">Loading ticket...</p>
        </div>
      </div>
    );
  }

  /*
   * =======================================================
   * ERROR / NOT FOUND
   * =======================================================
   */

  if (!ticket) {
    return (
      <div className="min-h-screen bg-slate-950 px-4 py-10 text-white">
        <div className="mx-auto max-w-2xl">
          <Link
            to="/agent/tickets"
            className="mb-6 inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to My Tickets
          </Link>

          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center">
            <AlertCircle className="mx-auto mb-4 h-10 w-10 text-red-400" />

            <h2 className="text-lg font-semibold text-white">
              Unable to load ticket
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              {error || "The requested ticket could not be found."}
            </p>

            <button
              type="button"
              onClick={() => loadTicket(true)}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-500"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  /*
   * =======================================================
   * MAIN PAGE
   * =======================================================
   */

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* ===================================================
          TOP HEADER
      =================================================== */}

      <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/agent/tickets")}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-400 transition hover:bg-slate-800 hover:text-white"
              title="Back"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-semibold text-white sm:text-base">
                  {ticket.ticketNumber
                    ? `#${ticket.ticketNumber}`
                    : `Ticket #${ticket.id?.slice(-6)}`}
                </span>

                <span
                  className={`hidden rounded-full border px-2.5 py-1 text-xs font-medium sm:inline-flex ${getStatusClasses(
                    ticket.status,
                  )}`}
                >
                  {getStatusLabel(ticket.status)}
                </span>
              </div>

              <p className="mt-0.5 truncate text-xs text-slate-500 sm:text-sm">
                {ticket.subject || "Untitled Ticket"}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => loadTicket(true)}
              disabled={refreshing}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-400 transition hover:bg-slate-800 hover:text-white disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw
                className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
              />
            </button>

            {!isAssignedToCurrentAgent && !isClosed && (
              <button
                type="button"
                onClick={handleAssignTicket}
                disabled={assigning}
                className="hidden items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50 sm:flex"
              >
                {assigning ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserCheck className="h-4 w-4" />
                )}

                {assigning ? "Assigning..." : "Assign to Me"}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ===================================================
          CONTENT
      =================================================== */}

      <main className="mx-auto max-w-[1600px] px-4 py-5 sm:px-6 lg:px-8">
        {/* =================================================
            ALERTS
        ================================================= */}

        {error && (
          <div className="mb-4 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />

            <p className="flex-1 text-sm text-red-300">{error}</p>

            <button
              type="button"
              onClick={() => setError("")}
              className="text-red-400 hover:text-red-300"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {success && (
          <div className="mb-4 flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/10">
              <Check className="h-4 w-4 text-emerald-400" />
            </div>

            <p className="text-sm text-emerald-300">{success}</p>
          </div>
        )}

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
          {/* =================================================
              LEFT
          ================================================= */}

          <div className="min-w-0 space-y-5">
            {/* ===============================================
                TICKET CONTROLS
            =============================================== */}

            <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClasses(
                        ticket.status,
                      )}`}
                    >
                      {getStatusLabel(ticket.status)}
                    </span>

                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-semibold ${getPriorityClasses(
                        ticket.priority,
                      )}`}
                    >
                      {getPriorityLabel(ticket.priority)} Priority
                    </span>
                  </div>

                  <h1 className="mt-3 text-xl font-bold tracking-tight text-white sm:text-2xl">
                    {ticket.subject || "Untitled Ticket"}
                  </h1>

                  <p className="mt-1 text-sm text-slate-500">
                    Created {formatDateTime(ticket.createdAt)}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:flex">
                  {/* STATUS */}

                  <div className="relative">
                    <select
                      value={ticket.status || "open"}
                      onChange={handleStatusChange}
                      disabled={updatingStatus}
                      className="h-10 appearance-none rounded-xl border border-slate-700 bg-slate-950 py-0 pl-3 pr-9 text-sm font-medium text-white outline-none transition focus:border-indigo-500 disabled:opacity-60"
                    >
                      {STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>

                    {updatingStatus ? (
                      <Loader2 className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-500" />
                    ) : (
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    )}
                  </div>

                  {/* PRIORITY */}

                  <div className="relative">
                    <select
                      value={ticket.priority || "medium"}
                      onChange={handlePriorityChange}
                      disabled={updatingPriority}
                      className="h-10 appearance-none rounded-xl border border-slate-700 bg-slate-950 py-0 pl-3 pr-9 text-sm font-medium text-white outline-none transition focus:border-indigo-500 disabled:opacity-60"
                    >
                      {PRIORITY_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>

                    {updatingPriority ? (
                      <Loader2 className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-500" />
                    ) : (
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    )}
                  </div>
                </div>
              </div>

              {/* MOBILE ASSIGN */}

              {!isAssignedToCurrentAgent && !isClosed && (
                <button
                  type="button"
                  onClick={handleAssignTicket}
                  disabled={assigning}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50 sm:hidden"
                >
                  {assigning ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <UserCheck className="h-4 w-4" />
                  )}

                  {assigning ? "Assigning..." : "Assign to Me"}
                </button>
              )}
            </section>

            {/* ===============================================
                ORIGINAL REQUEST
            =============================================== */}

            <section className="rounded-2xl border border-slate-800 bg-slate-900/70">
              <div className="border-b border-slate-800 px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10">
                    <FileText className="h-5 w-5 text-indigo-400" />
                  </div>

                  <div>
                    <h2 className="text-sm font-semibold text-white">
                      Original Request
                    </h2>

                    <p className="text-xs text-slate-500">Customer issue</p>
                  </div>
                </div>
              </div>

              <div className="p-5">
                <p className="whitespace-pre-wrap text-sm leading-7 text-slate-300">
                  {ticket.description || "No description provided."}
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  {ticket.category && (
                    <span className="rounded-lg border border-slate-700 bg-slate-800/70 px-3 py-1.5 text-xs text-slate-400">
                      Category:{" "}
                      <span className="font-medium text-slate-200">
                        {ticket.category}
                      </span>
                    </span>
                  )}

                  {ticket.ticketNumber && (
                    <span className="rounded-lg border border-slate-700 bg-slate-800/70 px-3 py-1.5 text-xs text-slate-400">
                      Ticket:{" "}
                      <span className="font-medium text-slate-200">
                        #{ticket.ticketNumber}
                      </span>
                    </span>
                  )}
                </div>
              </div>
            </section>

            {/* ===============================================
                CONVERSATION
            =============================================== */}

            <section className="rounded-2xl border border-slate-800 bg-slate-900/70">
              <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10">
                    <MessageCircle className="h-5 w-5 text-indigo-400" />
                  </div>

                  <div>
                    <h2 className="text-sm font-semibold text-white">
                      Conversation
                    </h2>

                    <p className="text-xs text-slate-500">
                      {conversation.length}{" "}
                      {conversation.length === 1 ? "message" : "messages"}
                    </p>
                  </div>
                </div>

                {conversation.length > 0 && (
                  <span className="hidden text-xs text-slate-500 sm:block">
                    Latest{" "}
                    {formatDateTime(
                      conversation[conversation.length - 1]?.createdAt,
                    )}
                  </span>
                )}
              </div>

              <div className="max-h-[700px] space-y-5 overflow-y-auto p-5">
                {conversation.length === 0 ? (
                  <div className="py-12 text-center">
                    <MessageCircle className="mx-auto h-10 w-10 text-slate-700" />

                    <p className="mt-3 text-sm font-medium text-slate-400">
                      No conversation yet
                    </p>

                    <p className="mt-1 text-xs text-slate-600">
                      Send the first reply to this ticket.
                    </p>
                  </div>
                ) : (
                  conversation.map((message, index) => {
                    const senderInfo = getMessageAvatar(message);

                    const isCustomer = message?.senderRole === "customer";

                    const isAI = message?.senderRole === "ai";

                    const isSystem = message?.senderRole === "system";

                    const isAgent =
                      message?.senderRole === "agent" ||
                      message?.senderRole === "admin";

                    return (
                      <div
                        key={message?._id || `${index}-${message?.createdAt}`}
                        className={`flex gap-3 ${
                          isAgent ? "flex-row-reverse" : ""
                        }`}
                      >
                        {/* AVATAR */}

                        <div className="shrink-0">
                          {senderInfo.avatar ? (
                            <img
                              src={senderInfo.avatar}
                              alt={senderInfo.name}
                              className="h-10 w-10 rounded-full object-cover ring-2 ring-slate-800"
                              onError={(event) => {
                                event.currentTarget.style.display = "none";

                                const fallback =
                                  event.currentTarget.nextElementSibling;

                                if (fallback) {
                                  fallback.classList.remove("hidden");
                                  fallback.classList.add("flex");
                                }
                              }}
                            />
                          ) : null}

                          <div
                            className={`h-10 w-10 items-center justify-center rounded-full text-xs font-bold ${
                              senderInfo.avatar ? "hidden" : "flex"
                            } ${
                              isCustomer
                                ? "bg-slate-800 text-slate-300"
                                : isAI
                                  ? "bg-violet-500/10 text-violet-400"
                                  : "bg-indigo-600 text-white"
                            }`}
                          >
                            {isAI ? "AI" : getInitials(senderInfo.name)}
                          </div>
                        </div>

                        {/* MESSAGE */}

                        <div
                          className={`min-w-0 max-w-[85%] ${
                            isAgent ? "items-end" : "items-start"
                          }`}
                        >
                          <div
                            className={`mb-1 flex items-center gap-2 ${
                              isAgent ? "justify-end" : ""
                            }`}
                          >
                            <span className="text-xs font-semibold text-slate-300">
                              {senderInfo.name}
                            </span>

                            <span className="text-[11px] text-slate-600">
                              {formatDate(message?.createdAt)}{" "}
                              {formatTime(message?.createdAt)}
                            </span>
                          </div>

                          <div
                            className={`rounded-2xl border p-4 ${
                              isCustomer
                                ? "rounded-tl-md border-slate-700 bg-slate-800/80"
                                : isAI
                                  ? "rounded-tl-md border-violet-500/20 bg-violet-500/5"
                                  : isSystem
                                    ? "border-amber-500/20 bg-amber-500/5"
                                    : "rounded-tr-md border-indigo-500/20 bg-indigo-600/10"
                            }`}
                          >
                            {message?.message && (
                              <p className="whitespace-pre-wrap text-sm leading-6 text-slate-200">
                                {message.message}
                              </p>
                            )}

                            {/* MESSAGE ATTACHMENTS */}

                            {message?.attachments?.length > 0 && (
                              <div className="mt-3 space-y-2">
                                {message.attachments.map(
                                  (attachment, attachmentIndex) =>
                                    renderAttachment(
                                      attachment,
                                      attachmentIndex,
                                    ),
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}

                <div ref={conversationEndRef} />
              </div>
            </section>

            {/* ===============================================
                REPLY COMPOSER
            =============================================== */}

            <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 sm:p-5">
              {isClosed ? (
                <div className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-950/70 p-4">
                  <ShieldCheck className="h-5 w-5 text-slate-500" />

                  <div>
                    <p className="text-sm font-medium text-slate-300">
                      This ticket is closed
                    </p>

                    <p className="mt-0.5 text-xs text-slate-500">
                      Closed tickets cannot receive new replies.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {/* SELECTED FILES */}

                  {selectedFiles.length > 0 && (
                    <div className="mb-4">
                      <div className="mb-2 flex items-center justify-between">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Attachments ({selectedFiles.length}/{MAX_FILES})
                        </p>

                        <button
                          type="button"
                          onClick={() => setSelectedFiles([])}
                          className="text-xs text-slate-500 transition hover:text-red-400"
                        >
                          Remove all
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {selectedFiles.map((file, index) => {
                          const isImage = file.type?.startsWith("image/");

                          return (
                            <div
                              key={`${file.name}-${index}`}
                              className="flex min-w-0 max-w-full items-center gap-2 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2"
                            >
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10">
                                {isImage ? (
                                  <ImageIcon className="h-4 w-4 text-indigo-400" />
                                ) : (
                                  <FileText className="h-4 w-4 text-indigo-400" />
                                )}
                              </div>

                              <div className="min-w-0">
                                <p className="max-w-[180px] truncate text-xs font-medium text-white">
                                  {file.name}
                                </p>

                                <p className="text-[11px] text-slate-600">
                                  {formatFileSize(file.size)}
                                </p>
                              </div>

                              <button
                                type="button"
                                onClick={() => removeSelectedFile(index)}
                                className="ml-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-800 hover:text-red-400"
                                title="Remove attachment"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* INPUT */}

                  <textarea
                    ref={replyInputRef}
                    value={reply}
                    onChange={(event) => setReply(event.target.value)}
                    onKeyDown={handleReplyKeyDown}
                    disabled={sending}
                    rows={4}
                    placeholder="Write a reply to the customer..."
                    className="w-full resize-none rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                  />

                  <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        className="hidden"
                        accept="
                          image/*,
                          application/pdf,
                          .doc,
                          .docx,
                          .xls,
                          .xlsx,
                          .txt,
                          .csv
                        "
                        onChange={handleFileSelect}
                      />

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={sending || selectedFiles.length >= MAX_FILES}
                        className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm font-medium text-slate-400 transition hover:border-slate-600 hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Paperclip className="h-4 w-4" />

                        <span className="hidden sm:inline">Attach</span>
                      </button>

                      <span className="text-[11px] text-slate-600">
                        Max 5 files • 10 MB each
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleSendReply}
                      disabled={
                        sending || (!reply.trim() && selectedFiles.length === 0)
                      }
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {sending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          Send Reply
                        </>
                      )}
                    </button>
                  </div>

                  <p className="mt-3 text-[11px] text-slate-600">
                    Press Enter to send • Shift + Enter for a new line
                  </p>
                </>
              )}
            </section>
          </div>

          {/* =================================================
              RIGHT SIDEBAR
          ================================================= */}

          <aside className="space-y-5">
            {/* ===============================================
                CUSTOMER
            =============================================== */}

            <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70">
              <button
                type="button"
                onClick={() => setShowCustomerDetails((prev) => !prev)}
                className="flex w-full items-center justify-between border-b border-slate-800 px-5 py-4 text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10">
                    <User className="h-5 w-5 text-indigo-400" />
                  </div>

                  <div>
                    <h2 className="text-sm font-semibold text-white">
                      Customer
                    </h2>

                    <p className="text-xs text-slate-500">
                      Customer information
                    </p>
                  </div>
                </div>

                <ChevronDown
                  className={`h-4 w-4 text-slate-500 transition ${
                    showCustomerDetails ? "rotate-180" : ""
                  }`}
                />
              </button>

              {showCustomerDetails && (
                <div className="p-5">
                  <div className="flex items-center gap-3">
                    {/* CUSTOMER AVATAR */}

                    {customerAvatarUrl ? (
                      <img
                        src={customerAvatarUrl}
                        alt={customerName}
                        className="h-12 w-12 shrink-0 rounded-full object-cover ring-2 ring-slate-800"
                        onError={(event) => {
                          event.currentTarget.style.display = "none";

                          const fallback =
                            event.currentTarget.nextElementSibling;

                          if (fallback) {
                            fallback.classList.remove("hidden");
                            fallback.classList.add("flex");
                          }
                        }}
                      />
                    ) : null}

                    <div
                      className={`h-12 w-12 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white ${
                        customerAvatarUrl ? "hidden" : "flex"
                      }`}
                    >
                      {getInitials(customerName)}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">
                        {customerName}
                      </p>

                      <p className="mt-0.5 truncate text-xs text-slate-500">
                        {customer?.email || "No email"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 space-y-3">
                    {customer?.email && (
                      <div className="flex items-start gap-3">
                        <Mail className="mt-0.5 h-4 w-4 shrink-0 text-slate-600" />

                        <div className="min-w-0">
                          <p className="text-[11px] uppercase tracking-wider text-slate-600">
                            Email
                          </p>

                          <p className="mt-1 break-all text-sm text-slate-300">
                            {customer.email}
                          </p>
                        </div>
                      </div>
                    )}

                    {customer?.phone && (
                      <div className="flex items-start gap-3">
                        <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-slate-600" />

                        <div>
                          <p className="text-[11px] uppercase tracking-wider text-slate-600">
                            Phone
                          </p>

                          <p className="mt-1 text-sm text-slate-300">
                            {customer.phone}
                          </p>
                        </div>
                      </div>
                    )}

                    {customer?.company && (
                      <div className="flex items-start gap-3">
                        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-slate-600" />

                        <div>
                          <p className="text-[11px] uppercase tracking-wider text-slate-600">
                            Company
                          </p>

                          <p className="mt-1 text-sm text-slate-300">
                            {customer.company}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </section>

            {/* ===============================================
                TICKET INFORMATION
            =============================================== */}

            <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800">
                  <Clock className="h-5 w-5 text-slate-400" />
                </div>

                <div>
                  <h2 className="text-sm font-semibold text-white">
                    Ticket Information
                  </h2>

                  <p className="text-xs text-slate-500">Details & timestamps</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-slate-600">
                    Ticket ID
                  </p>

                  <p className="mt-1 break-all font-mono text-xs text-slate-400">
                    {ticket.id}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] uppercase tracking-wider text-slate-600">
                    Created
                  </p>

                  <p className="mt-1 text-sm text-slate-300">
                    {formatDateTime(ticket.createdAt)}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] uppercase tracking-wider text-slate-600">
                    Last Updated
                  </p>

                  <p className="mt-1 text-sm text-slate-300">
                    {formatDateTime(ticket.updatedAt)}
                  </p>
                </div>

                {ticket.lastReplyAt && (
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-slate-600">
                      Last Reply
                    </p>

                    <p className="mt-1 text-sm text-slate-300">
                      {formatDateTime(ticket.lastReplyAt)}
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* ===============================================
                ASSIGNED AGENT
            =============================================== */}

            <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10">
                  <UserCheck className="h-5 w-5 text-indigo-400" />
                </div>

                <div>
                  <h2 className="text-sm font-semibold text-white">
                    Assigned Agent
                  </h2>

                  <p className="text-xs text-slate-500">Ticket ownership</p>
                </div>
              </div>

              {assignedAgent ? (
                <div className="flex items-center gap-3">
                  {assignedAgent.avatar ? (
                    <img
                      src={getCustomerAvatarUrl(assignedAgent)}
                      alt={getAgentName(assignedAgent)}
                      className="h-10 w-10 rounded-full object-cover ring-2 ring-slate-800"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                      {getInitials(getAgentName(assignedAgent))}
                    </div>
                  )}

                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">
                      {getAgentName(assignedAgent)}
                    </p>

                    <p className="truncate text-xs text-slate-500">
                      {assignedAgent.email || "Support Agent"}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950/50 p-4 text-center">
                  <User className="mx-auto h-6 w-6 text-slate-700" />

                  <p className="mt-2 text-sm text-slate-500">
                    No agent assigned
                  </p>

                  {!isClosed && (
                    <button
                      type="button"
                      onClick={handleAssignTicket}
                      disabled={assigning}
                      className="mt-3 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50"
                    >
                      {assigning ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <UserCheck className="h-3.5 w-3.5" />
                      )}
                      Assign to Me
                    </button>
                  )}
                </div>
              )}
            </section>

            {/* ===============================================
                TICKET ATTACHMENTS
            =============================================== */}

            {ticketAttachments.length > 0 && (
              <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800">
                    <Paperclip className="h-5 w-5 text-slate-400" />
                  </div>

                  <div>
                    <h2 className="text-sm font-semibold text-white">
                      Ticket Attachments
                    </h2>

                    <p className="text-xs text-slate-500">
                      {ticketAttachments.length}{" "}
                      {ticketAttachments.length === 1 ? "file" : "files"}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  {ticketAttachments.map((attachment, index) =>
                    renderAttachment(attachment, index),
                  )}
                </div>
              </section>
            )}

            {/* ===============================================
                STATUS HISTORY
            =============================================== */}

            <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70">
              <button
                type="button"
                onClick={() => setShowHistory((prev) => !prev)}
                className="flex w-full items-center justify-between px-5 py-4 text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800">
                    <History className="h-5 w-5 text-slate-400" />
                  </div>

                  <div>
                    <h2 className="text-sm font-semibold text-white">
                      Status History
                    </h2>

                    <p className="text-xs text-slate-500">
                      {statusHistory.length} events
                    </p>
                  </div>
                </div>

                <ChevronDown
                  className={`h-4 w-4 text-slate-500 transition ${
                    showHistory ? "rotate-180" : ""
                  }`}
                />
              </button>

              {showHistory && (
                <div className="border-t border-slate-800 p-5">
                  {statusHistory.length === 0 ? (
                    <p className="text-sm text-slate-500">
                      No status history available.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {[...statusHistory].reverse().map((item, index) => (
                        <div key={item?._id || index} className="relative pl-6">
                          <div className="absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full bg-indigo-500 ring-4 ring-indigo-500/10" />

                          {index < statusHistory.length - 1 && (
                            <div className="absolute bottom-[-18px] left-[5px] top-4 w-px bg-slate-800" />
                          )}

                          <p className="text-sm font-medium text-slate-300">
                            {getStatusLabel(item?.status)}
                          </p>

                          <p className="mt-1 text-xs text-slate-600">
                            {formatDateTime(item?.createdAt)}
                          </p>

                          {item?.note && (
                            <p className="mt-2 text-xs leading-5 text-slate-500">
                              {item.note}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* ===============================================
                RESOLUTION
            =============================================== */}

            {(isResolved || ticket.resolvedAt) && (
              <section className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10">
                    <Check className="h-5 w-5 text-emerald-400" />
                  </div>

                  <div>
                    <h2 className="text-sm font-semibold text-emerald-300">
                      Ticket Resolved
                    </h2>

                    <p className="mt-1 text-xs text-emerald-400/70">
                      {ticket.resolvedAt
                        ? `Resolved ${formatDateTime(ticket.resolvedAt)}`
                        : "This ticket has been resolved."}
                    </p>
                  </div>
                </div>
              </section>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
};

export default AgentTicketDetails;
