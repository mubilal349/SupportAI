import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  Bot,
  Check,
  CheckCircle2,
  Clock3,
  Copy,
  ExternalLink,
  FileText,
  Loader2,
  MessageSquare,
  RefreshCw,
  Send,
  ShieldCheck,
  Star,
  UserRound,
  UserRoundCheck,
  X,
  XCircle,
  AlertTriangle,
} from "lucide-react";

import { Link, useParams } from "react-router-dom";

import {
  getTicketById,
  generateTicketSummary,
  uploadTicketAttachments,
  replyToTicket,
  reopenTicket,
  closeTicket,
  escalateTicket,
  submitTicketRating,
} from "../../../services/ticketService";

const API_BASE_URL = "http://localhost:8000";

const TicketDetails = () => {
  const { id } = useParams();

  // =========================================================
  // STATE
  // =========================================================

  const [ticket, setTicket] = useState(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);

  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [submittingRating, setSubmittingRating] = useState(false);

  const [aiSummary, setAiSummary] = useState(null);
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState("");

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);

  const [processingAction, setProcessingAction] = useState(false);

  const [copiedTicketId, setCopiedTicketId] = useState(false);

  // =========================================================
  // STATUS CONFIG
  // =========================================================

  const statusConfig = {
    open: {
      label: "Open",
      icon: AlertCircle,
      className: "border-blue-500/20 bg-blue-500/10 text-blue-400",
    },

    waiting: {
      label: "Waiting",
      icon: Clock3,
      className: "border-yellow-500/20 bg-yellow-500/10 text-yellow-400",
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
      className: "border-red-500/20 bg-red-500/10 text-red-400",
    },

    medium: {
      label: "Medium",
      className: "border-orange-500/20 bg-orange-500/10 text-orange-400",
    },

    low: {
      label: "Low",
      className: "border-slate-700 bg-slate-800 text-slate-400",
    },
  };

  // =========================================================
  // LOAD TICKET
  // =========================================================

  useEffect(() => {
    if (id) {
      loadTicket();
    }
  }, [id]);

  const loadTicket = async (showLoader = true) => {
    try {
      if (showLoader) {
        setLoading(true);
      }

      setError("");

      const response = await getTicketById(id);

      console.log("CUSTOMER TICKET DETAILS:", response);

      const ticketData = response?.ticket || response?.data || response;

      if (!ticketData) {
        setError("Ticket not found.");
        setTicket(null);
        return;
      }

      const normalizedTicket = normalizeTicket(ticketData);

      setTicket(normalizedTicket);

      // Use persisted AI summary if the backend returns one.
      if (normalizedTicket.aiSummary) {
        setAiSummary(
          typeof normalizedTicket.aiSummary === "string"
            ? {
                summary: normalizedTicket.aiSummary,
              }
            : normalizedTicket.aiSummary,
        );
      }
    } catch (err) {
      console.error("LOAD TICKET ERROR:", err);

      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Failed to load ticket.",
      );

      setTicket(null);
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  };

  // =========================================================
  // NORMALIZE TICKET
  // =========================================================

  const normalizeTicket = (data) => {
    if (!data) return null;

    const rawConversation = Array.isArray(data.conversation)
      ? data.conversation
      : Array.isArray(data.messages)
        ? data.messages
        : Array.isArray(data.comments)
          ? data.comments
          : [];

    return {
      ...data,

      id: data.id || data._id || id,

      ticketNumber: data.ticketNumber || data.id || data._id || id,

      subject: data.subject || "Untitled ticket",

      description: data.description || "No description provided.",

      category: data.category || "General",

      status: String(data.status || "open").toLowerCase(),

      priority: String(data.priority || "medium").toLowerCase(),

      agent:
        data.assignedAgent?.name ||
        data.agent?.name ||
        data.assignedTo?.name ||
        data.agentName ||
        "Unassigned",

      agentEmail:
        data.assignedAgent?.email ||
        data.agent?.email ||
        data.assignedTo?.email ||
        data.agentEmail ||
        "",

      createdAt: data.createdAt || data.created || null,

      updatedAt: data.updatedAt || data.updated || null,

      resolvedAt: data.resolvedAt || null,

      closedAt: data.closedAt || null,

      reopenedAt: data.reopenedAt || null,

      lastReplyAt: data.lastReplyAt || null,

      attachments: Array.isArray(data.attachments) ? data.attachments : [],

      replies: rawConversation.map(normalizeReply),

      replyCount:
        typeof data.replies === "number"
          ? data.replies
          : rawConversation.length,

      customerRating: data.customerRating ?? null,

      customerFeedback: data.customerFeedback || "",

      ratedAt: data.ratedAt || null,

      isEscalated: Boolean(data.isEscalated),

      escalatedAt: data.escalatedAt || null,

      escalationReason: data.escalationReason || "",

      aiSummary: data.aiSummary || "",
    };
  };

  // =========================================================
  // NORMALIZE REPLY
  // =========================================================

  const normalizeReply = (message, index) => {
    return {
      id: message?.id || message?._id || `reply-${index}`,

      message: message?.message || message?.content || message?.text || "",

      sender:
        message?.sender?._id ||
        message?.sender ||
        message?.user?._id ||
        message?.user ||
        null,

      senderName:
        message?.sender?.name ||
        message?.user?.name ||
        message?.senderName ||
        message?.author?.name ||
        "Support",

      senderRole:
        message?.senderRole ||
        message?.sender?.role ||
        message?.user?.role ||
        "agent",

      createdAt: message?.createdAt || message?.timestamp || null,

      attachments: Array.isArray(message?.attachments)
        ? message.attachments
        : [],
    };
  };

  // =========================================================
  // REFRESH
  // =========================================================

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await loadTicket(false);
    } catch (err) {
      console.error("REFRESH ERROR:", err);
    } finally {
      setRefreshing(false);
    }
  };

  // =========================================================
  // FORMAT DATE
  // =========================================================

  const formatDate = (date) => {
    if (!date) return "—";

    try {
      const parsedDate = new Date(date);

      if (Number.isNaN(parsedDate.getTime())) {
        return "—";
      }

      return parsedDate.toLocaleString();
    } catch {
      return "—";
    }
  };

  const formatShortDate = (date) => {
    if (!date) return "—";

    try {
      const parsedDate = new Date(date);

      if (Number.isNaN(parsedDate.getTime())) {
        return "—";
      }

      return parsedDate.toLocaleDateString();
    } catch {
      return "—";
    }
  };

  // =========================================================
  // COPY TICKET ID
  // =========================================================

  const handleCopyTicketId = async () => {
    if (!ticket?.ticketNumber) {
      return;
    }

    try {
      await navigator.clipboard.writeText(ticket.ticketNumber);

      setCopiedTicketId(true);

      setTimeout(() => {
        setCopiedTicketId(false);
      }, 2000);
    } catch (err) {
      console.error("COPY TICKET ID ERROR:", err);
    }
  };

  // =========================================================
  // AI TICKET SUMMARY
  // =========================================================

  const handleGenerateSummary = async () => {
    if (!ticket?.id || generatingSummary) {
      return;
    }

    try {
      setGeneratingSummary(true);
      setSummaryError("");

      const response = await generateTicketSummary(ticket.id);

      console.log("AI TICKET SUMMARY:", response);

      const summary =
        response?.summary ||
        response?.data?.summary ||
        response?.aiSummary ||
        response?.data?.aiSummary ||
        null;

      if (!summary) {
        throw new Error("AI summary was not returned.");
      }

      setAiSummary(
        typeof summary === "string"
          ? {
              summary,
            }
          : summary,
      );
    } catch (err) {
      console.error("AI SUMMARY ERROR:", err);

      setSummaryError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          "Failed to generate AI summary.",
      );
    } finally {
      setGeneratingSummary(false);
    }
  };

  // =========================================================
  // FILE SELECT
  // =========================================================

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);

    if (!files.length) {
      return;
    }

    setError("");

    const MAX_FILE_SIZE = 10 * 1024 * 1024;

    const existingCount = ticket?.attachments?.length || 0;

    const availableSlots = 5 - existingCount;

    if (availableSlots <= 0) {
      setError("This ticket already has the maximum of 5 attachments.");

      e.target.value = "";
      return;
    }

    if (files.length > availableSlots) {
      setError(
        `You can add only ${availableSlots} more file${
          availableSlots === 1 ? "" : "s"
        }. Maximum 5 attachments per ticket.`,
      );
    }

    const filesToProcess = files.slice(0, availableSlots);

    const validFiles = filesToProcess.filter((file) => {
      if (file.size > MAX_FILE_SIZE) {
        setError(`${file.name} is larger than the 10 MB limit.`);

        return false;
      }

      return true;
    });

    setSelectedFiles(validFiles);

    // Allow selecting the same file again later.
    e.target.value = "";
  };

  // =========================================================
  // REMOVE SELECTED FILE
  // =========================================================

  const handleRemoveSelectedFile = (index) => {
    setSelectedFiles((previous) =>
      previous.filter((_, fileIndex) => fileIndex !== index),
    );
  };

  // =========================================================
  // UPLOAD ATTACHMENTS
  // =========================================================

  const handleUploadAttachments = async () => {
    if (!selectedFiles.length || !ticket?.id || uploadingFiles) {
      return;
    }

    try {
      setUploadingFiles(true);
      setError("");

      await uploadTicketAttachments(ticket.id, selectedFiles);

      setSelectedFiles([]);

      await loadTicket(false);
    } catch (err) {
      console.error("UPLOAD ATTACHMENTS ERROR:", err);

      setError(err?.response?.data?.message || "Failed to upload attachments.");
    } finally {
      setUploadingFiles(false);
    }
  };

  // =========================================================
  // SEND REPLY
  // =========================================================

  const handleSendReply = async (e) => {
    e.preventDefault();

    const trimmedReply = reply.trim();

    if (!trimmedReply || sending || !ticket?.id) {
      return;
    }

    if (trimmedReply.length > 5000) {
      setError("Reply cannot exceed 5000 characters.");
      return;
    }

    try {
      setSending(true);
      setError("");

      await replyToTicket(ticket.id, trimmedReply);

      setReply("");

      await loadTicket(false);
    } catch (err) {
      console.error("SEND REPLY ERROR:", err);

      setError(err?.response?.data?.message || "Failed to send reply.");
    } finally {
      setSending(false);
    }
  };

  // =========================================================
  // REOPEN TICKET
  // =========================================================

  const handleReopenTicket = async () => {
    if (!ticket?.id || processingAction) {
      return;
    }

    try {
      setProcessingAction(true);
      setError("");

      await reopenTicket(ticket.id);

      await loadTicket(false);
    } catch (err) {
      console.error("REOPEN TICKET ERROR:", err);

      setError(err?.response?.data?.message || "Failed to reopen ticket.");
    } finally {
      setProcessingAction(false);
    }
  };

  // =========================================================
  // CLOSE TICKET
  // =========================================================

  const handleCloseTicket = async () => {
    if (!ticket?.id || processingAction) {
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to close this ticket? You can reopen it later if you still need help.",
    );

    if (!confirmed) {
      return;
    }

    try {
      setProcessingAction(true);
      setError("");

      await closeTicket(ticket.id);

      await loadTicket(false);
    } catch (err) {
      console.error("CLOSE TICKET ERROR:", err);

      setError(err?.response?.data?.message || "Failed to close ticket.");
    } finally {
      setProcessingAction(false);
    }
  };

  // =========================================================
  // ESCALATE TO HUMAN
  // =========================================================

  const handleEscalate = async () => {
    if (!ticket?.id || processingAction) {
      return;
    }

    if (ticket.isEscalated) {
      setError("This ticket has already been escalated.");
      return;
    }

    const reason = window.prompt("Why would you like to escalate this ticket?");

    if (reason === null) {
      return;
    }

    try {
      setProcessingAction(true);
      setError("");

      await escalateTicket(ticket.id, reason.trim());

      await loadTicket(false);
    } catch (err) {
      console.error("ESCALATE TICKET ERROR:", err);

      setError(err?.response?.data?.message || "Failed to escalate ticket.");
    } finally {
      setProcessingAction(false);
    }
  };

  // =========================================================
  // SUBMIT RATING
  // =========================================================

  const handleSubmitRating = async (e) => {
    e.preventDefault();

    if (!rating || submittingRating || !ticket?.id) {
      return;
    }

    try {
      setSubmittingRating(true);
      setError("");

      await submitTicketRating(ticket.id, rating, feedback.trim());

      setRating(0);
      setFeedback("");

      await loadTicket(false);
    } catch (err) {
      console.error("RATING ERROR:", err);

      setError(err?.response?.data?.message || "Failed to submit rating.");
    } finally {
      setSubmittingRating(false);
    }
  };

  // =========================================================
  // DERIVED VALUES
  // =========================================================

  const currentStatus = useMemo(() => {
    return statusConfig[ticket?.status] || statusConfig.open;
  }, [ticket?.status]);

  const currentPriority = useMemo(() => {
    return priorityConfig[ticket?.priority] || priorityConfig.medium;
  }, [ticket?.priority]);

  const StatusIcon = currentStatus.icon;

  const isResolved = ticket?.status === "resolved";

  const isClosed = ticket?.status === "closed";

  const canReply = !isClosed;

  const canReopen = isResolved || isClosed;

  const isAssigned = ticket?.agent && ticket.agent !== "Unassigned";

  const hasRating = Boolean(ticket?.customerRating);

  const totalAttachments = ticket?.attachments?.length || 0;

  const canUploadMore = !isClosed && totalAttachments < 5;

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-500" />

          <p className="mt-4 text-sm text-slate-500">Loading ticket...</p>
        </div>
      </div>
    );
  }

  // =========================================================
  // ERROR / NOT FOUND
  // =========================================================

  if (!ticket) {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <header className="border-b border-slate-800">
          <div className="mx-auto flex max-w-7xl items-center px-6 py-5">
            <Link
              to="/support/tickets"
              className="flex items-center gap-2 text-sm text-slate-500 transition hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to tickets
            </Link>
          </div>
        </header>

        <main className="mx-auto flex min-h-[70vh] max-w-7xl items-center justify-center px-6">
          <div className="max-w-md text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 text-red-400">
              <XCircle className="h-7 w-7" />
            </div>

            <h2 className="mt-5 text-xl font-semibold">
              Unable to load ticket
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              {error || "This ticket could not be found."}
            </p>

            <div className="mt-6 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => loadTicket()}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold transition hover:bg-blue-700"
              >
                <RefreshCw className="h-4 w-4" />
                Try again
              </button>

              <Link
                to="/support/tickets"
                className="rounded-xl border border-slate-800 px-4 py-2.5 text-sm text-slate-400 transition hover:bg-slate-800 hover:text-white"
              >
                Back to tickets
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // =========================================================
  // MAIN RENDER
  // =========================================================

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* =====================================================
          HEADER
      ====================================================== */}

      <header className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-5">
          <div className="flex min-w-0 items-center gap-4">
            <Link
              to="/support/tickets"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-400 transition hover:bg-slate-800 hover:text-white"
              title="Back to tickets"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>

            <div className="min-w-0">
              <p className="text-xs text-slate-600">Support Ticket</p>

              <div className="mt-1 flex items-center gap-2">
                <h1 className="truncate text-sm font-semibold">
                  {ticket.ticketNumber}
                </h1>

                <button
                  type="button"
                  onClick={handleCopyTicketId}
                  className="rounded-md p-1 text-slate-600 transition hover:bg-slate-800 hover:text-slate-300"
                  title="Copy ticket ID"
                >
                  {copiedTicketId ? (
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-400 transition hover:bg-slate-800 hover:text-white disabled:opacity-50"
              title="Refresh ticket"
            >
              <RefreshCw
                className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
              />
            </button>

            <Link
              to="/support/tickets"
              className="hidden rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-medium text-slate-400 transition hover:bg-slate-800 hover:text-white sm:block"
            >
              All tickets
            </Link>
          </div>
        </div>
      </header>

      {/* =====================================================
          MAIN
      ====================================================== */}

      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* ===================================================
            ERROR
        ==================================================== */}

        {error && (
          <div className="mb-6 flex items-start justify-between gap-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />

              <p className="text-sm leading-5 text-red-400">{error}</p>
            </div>

            <button
              type="button"
              onClick={() => setError("")}
              className="shrink-0 text-red-400 hover:text-red-300"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* ===================================================
            TICKET HEADER
        ==================================================== */}

        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium ${currentStatus.className}`}
                >
                  <StatusIcon className="h-3 w-3" />
                  {currentStatus.label}
                </span>

                <span
                  className={`rounded-full border px-2.5 py-1 text-[10px] font-medium ${currentPriority.className}`}
                >
                  {currentPriority.label} priority
                </span>

                {ticket.isEscalated && (
                  <span className="rounded-full border border-orange-500/20 bg-orange-500/10 px-2.5 py-1 text-[10px] font-medium text-orange-400">
                    Escalated
                  </span>
                )}
              </div>

              <h2 className="mt-4 text-xl font-semibold tracking-tight">
                {ticket.subject}
              </h2>

              <p className="mt-2 text-xs text-slate-600">
                Created {formatDate(ticket.createdAt)}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {canReopen && (
                <button
                  type="button"
                  onClick={handleReopenTicket}
                  disabled={processingAction}
                  className="flex items-center gap-2 rounded-xl border border-blue-500/20 bg-blue-500/10 px-4 py-2.5 text-xs font-semibold text-blue-400 transition hover:bg-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {processingAction ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  Reopen ticket
                </button>
              )}

              {!isClosed && !isResolved && (
                <button
                  type="button"
                  onClick={handleCloseTicket}
                  disabled={processingAction}
                  className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-300 transition hover:bg-slate-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {processingAction ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  Close ticket
                </button>
              )}
            </div>
          </div>
        </section>

        {/* ===================================================
            AI SUPPORT SUMMARY
        ==================================================== */}

        <section className="mt-6 rounded-2xl border border-blue-500/20 bg-blue-500/5 p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
              <Bot className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold">SupportAI Summary</h3>

                <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-2 py-0.5 text-[9px] font-medium text-blue-400">
                  AI
                </span>
              </div>

              <p className="mt-2 text-[11px] leading-5 text-slate-600">
                Get an AI-powered summary of your ticket, including the main
                issue, important details, and suggested next steps.
              </p>
            </div>
          </div>

          {!aiSummary && (
            <button
              type="button"
              onClick={handleGenerateSummary}
              disabled={generatingSummary}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 py-2.5 text-[11px] font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {generatingSummary ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing ticket...
                </>
              ) : (
                <>
                  <Bot className="h-4 w-4" />
                  Generate AI summary
                </>
              )}
            </button>
          )}

          {summaryError && (
            <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />

                <p className="text-[11px] leading-5 text-red-400">
                  {summaryError}
                </p>
              </div>

              <button
                type="button"
                onClick={handleGenerateSummary}
                disabled={generatingSummary}
                className="mt-3 text-[10px] font-semibold text-red-300 hover:text-white"
              >
                Try again
              </button>
            </div>
          )}

          {aiSummary && (
            <div className="mt-5 space-y-4">
              {aiSummary.summary && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                    Summary
                  </p>

                  <p className="mt-2 text-xs leading-5 text-slate-400">
                    {aiSummary.summary}
                  </p>
                </div>
              )}

              {Array.isArray(aiSummary.keyPoints) &&
                aiSummary.keyPoints.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                      Key points
                    </p>

                    <ul className="mt-2 space-y-2">
                      {aiSummary.keyPoints.map((point, index) => (
                        <li
                          key={index}
                          className="flex gap-2 text-[11px] leading-5 text-slate-400"
                        >
                          <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-blue-400" />

                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

              {aiSummary.suggestedResolution && (
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />

                    <div>
                      <p className="text-[10px] font-semibold text-emerald-400">
                        Suggested resolution
                      </p>

                      <p className="mt-2 text-[11px] leading-5 text-slate-400">
                        {aiSummary.suggestedResolution}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {aiSummary.recommendation && (
                <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-3">
                  <p className="text-[10px] font-semibold text-orange-400">
                    AI recommendation
                  </p>

                  <p className="mt-2 text-[11px] leading-5 text-slate-400">
                    {aiSummary.recommendation}
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleGenerateSummary}
                  disabled={generatingSummary}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-blue-500/20 bg-blue-500/10 px-3 py-2.5 text-[10px] font-semibold text-blue-400 transition hover:bg-blue-500/20 disabled:opacity-50"
                >
                  {generatingSummary ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3.5 w-3.5" />
                  )}
                  Regenerate
                </button>

                {!isClosed && !ticket.isEscalated && (
                  <button
                    type="button"
                    onClick={handleEscalate}
                    disabled={processingAction}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-[10px] font-semibold text-slate-400 transition hover:bg-slate-800 hover:text-white disabled:opacity-50"
                  >
                    <UserRoundCheck className="h-3.5 w-3.5" />
                    Human support
                  </button>
                )}
              </div>

              <p className="text-[9px] leading-4 text-slate-700">
                AI-generated information may be inaccurate. Verify important
                information with a support agent.
              </p>
            </div>
          )}
        </section>

        {/* ===================================================
            CONTENT GRID
        ==================================================== */}

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
          {/* =================================================
              LEFT
          ================================================== */}

          <div className="space-y-6">
            {/* =================================================
                DESCRIPTION
            ================================================== */}

            <section className="rounded-2xl border border-slate-800 bg-slate-900/60">
              <div className="border-b border-slate-800 px-6 py-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-400" />

                  <h3 className="text-sm font-semibold">Issue description</h3>
                </div>
              </div>

              <div className="p-6">
                <p className="whitespace-pre-wrap text-sm leading-7 text-slate-400">
                  {ticket.description}
                </p>
              </div>
            </section>

            {/* =================================================
                ATTACHMENTS
            ================================================== */}

            <section className="rounded-2xl border border-slate-800 bg-slate-900/60">
              <div className="border-b border-slate-800 px-6 py-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-400" />

                    <h3 className="text-sm font-semibold">Attachments</h3>
                  </div>

                  <span className="text-[10px] text-slate-600">
                    {totalAttachments} / 5 files
                  </span>
                </div>
              </div>

              <div className="p-6">
                {ticket.attachments?.length > 0 ? (
                  <div className="space-y-3">
                    {ticket.attachments.map((file, index) => {
                      const rawPath = file.path || file.fileUrl || file.url;

                      const fileUrl = rawPath?.startsWith("http")
                        ? rawPath
                        : rawPath
                          ? `${API_BASE_URL}${rawPath}`
                          : null;

                      const sizeInKb = Math.max(
                        1,
                        Math.round((file.size || 0) / 1024),
                      );

                      return fileUrl ? (
                        <a
                          key={file._id || file.id || index}
                          href={fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-950/60 p-4 transition hover:border-blue-500/30 hover:bg-slate-950"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                              <FileText className="h-4 w-4" />
                            </div>

                            <div className="min-w-0">
                              <p className="truncate text-xs font-medium text-slate-300">
                                {file.originalName ||
                                  file.filename ||
                                  "Attachment"}
                              </p>

                              <p className="mt-1 text-[10px] text-slate-600">
                                {sizeInKb} KB
                                {file.mimetype ? ` • ${file.mimetype}` : ""}
                              </p>
                            </div>
                          </div>

                          <span className="flex shrink-0 items-center gap-1 text-[10px] font-medium text-blue-400">
                            View
                            <ExternalLink className="h-3 w-3" />
                          </span>
                        </a>
                      ) : (
                        <div
                          key={file._id || file.id || index}
                          className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-4"
                        >
                          <FileText className="h-4 w-4 text-slate-500" />

                          <p className="truncate text-xs text-slate-400">
                            {file.originalName || file.filename || "Attachment"}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-800 bg-slate-950/40 p-6 text-center">
                    <FileText className="mx-auto h-6 w-6 text-slate-700" />

                    <p className="mt-3 text-xs text-slate-500">
                      No attachments
                    </p>
                  </div>
                )}

                {canUploadMore && (
                  <div className="mt-5 border-t border-slate-800 pt-5">
                    <label className="block text-xs font-medium text-slate-400">
                      Add attachments
                    </label>

                    <input
                      type="file"
                      multiple
                      onChange={handleFileSelect}
                      className="mt-3 block w-full cursor-pointer rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-600 file:px-3 file:py-2 file:text-xs file:font-medium file:text-white"
                    />

                    <p className="mt-2 text-[10px] text-slate-700">
                      Maximum 5 files total, 10 MB each.
                    </p>

                    {selectedFiles.length > 0 && (
                      <div className="mt-4 space-y-2">
                        {selectedFiles.map((file, index) => (
                          <div
                            key={`${file.name}-${file.lastModified}`}
                            className="flex items-center justify-between gap-3 rounded-lg bg-slate-950 px-3 py-2"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-xs text-slate-400">
                                {file.name}
                              </p>

                              <p className="mt-0.5 text-[9px] text-slate-700">
                                {(file.size / 1024).toFixed(0)} KB
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemoveSelectedFile(index)}
                              className="shrink-0 rounded-lg p-1.5 text-slate-600 transition hover:bg-red-500/10 hover:text-red-400"
                              title="Remove file"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}

                        <button
                          type="button"
                          onClick={handleUploadAttachments}
                          disabled={uploadingFiles}
                          className="mt-3 flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {uploadingFiles ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Send className="h-4 w-4" />
                              Upload attachments
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {!canUploadMore && !isClosed && (
                  <p className="mt-4 text-[10px] text-slate-700">
                    Maximum attachment limit reached.
                  </p>
                )}
              </div>
            </section>

            {/* =================================================
                CONVERSATION
            ================================================== */}

            <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60">
              <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-blue-400" />

                  <h3 className="text-sm font-semibold">Conversation</h3>
                </div>

                <span className="text-[10px] text-slate-600">
                  {ticket.replyCount || 0}{" "}
                  {ticket.replyCount === 1 ? "reply" : "replies"}
                </span>
              </div>

              <div className="divide-y divide-slate-800">
                {/* Original ticket */}

                <div className="p-6">
                  <div className="flex gap-4">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-blue-400">
                      <UserRound className="h-4 w-4" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-xs font-semibold">You</p>

                          <p className="mt-0.5 text-[10px] text-slate-700">
                            Customer
                          </p>
                        </div>

                        <span className="text-[10px] text-slate-700">
                          {formatDate(ticket.createdAt)}
                        </span>
                      </div>

                      <div className="mt-4 rounded-xl bg-slate-950/70 p-4">
                        <p className="whitespace-pre-wrap text-sm leading-6 text-slate-400">
                          {ticket.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Replies */}

                {ticket.replies.map((message) => {
                  const isCustomer =
                    message.senderRole === "customer" ||
                    message.senderRole === "user";

                  const isSystem = message.senderRole === "system";

                  return (
                    <div key={message.id} className="p-6">
                      <div className="flex gap-4">
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                            isCustomer
                              ? "bg-blue-500/10 text-blue-400"
                              : isSystem
                                ? "bg-purple-500/10 text-purple-400"
                                : "bg-emerald-500/10 text-emerald-400"
                          }`}
                        >
                          {isCustomer ? (
                            <UserRound className="h-4 w-4" />
                          ) : isSystem ? (
                            <ShieldCheck className="h-4 w-4" />
                          ) : (
                            <Bot className="h-4 w-4" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <p className="text-xs font-semibold">
                                {message.senderName}
                              </p>

                              <p className="mt-0.5 text-[10px] text-slate-700">
                                {isCustomer
                                  ? "Customer"
                                  : isSystem
                                    ? "System"
                                    : "Support"}
                              </p>
                            </div>

                            <span className="text-[10px] text-slate-700">
                              {formatDate(message.createdAt)}
                            </span>
                          </div>

                          <div className="mt-4 rounded-xl bg-slate-950/70 p-4">
                            <p className="whitespace-pre-wrap text-sm leading-6 text-slate-400">
                              {message.message}
                            </p>
                          </div>

                          {message.attachments?.length > 0 && (
                            <div className="mt-3 space-y-2">
                              {message.attachments.map((file, fileIndex) => {
                                const rawPath = file.path || file.fileUrl;

                                const fileUrl = rawPath?.startsWith("http")
                                  ? rawPath
                                  : rawPath
                                    ? `${API_BASE_URL}${rawPath}`
                                    : null;

                                return (
                                  <a
                                    key={file._id || file.id || fileIndex}
                                    href={fileUrl || "#"}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-[10px] text-slate-500 hover:text-blue-400"
                                  >
                                    <FileText className="h-3.5 w-3.5" />

                                    <span className="truncate">
                                      {file.originalName ||
                                        file.filename ||
                                        "Attachment"}
                                    </span>

                                    <ExternalLink className="ml-auto h-3 w-3 shrink-0" />
                                  </a>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Empty conversation */}

                {ticket.replies.length === 0 && (
                  <div className="p-8 text-center">
                    <MessageSquare className="mx-auto h-6 w-6 text-slate-700" />

                    <p className="mt-3 text-sm text-slate-500">
                      No replies yet.
                    </p>

                    <p className="mt-1 text-xs text-slate-700">
                      Our support team will respond here.
                    </p>
                  </div>
                )}
              </div>

              {/* =================================================
                  REPLY BOX
              ================================================== */}

              {canReply && (
                <div className="border-t border-slate-800 p-6">
                  <form onSubmit={handleSendReply} className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <label className="block text-xs font-medium text-slate-400">
                        Add a reply
                      </label>

                      <span className="text-[9px] text-slate-700">
                        {reply.length} / 5000
                      </span>
                    </div>

                    <textarea
                      value={reply}
                      onChange={(e) => setReply(e.target.value.slice(0, 5000))}
                      rows={4}
                      placeholder="Write a message to the support team..."
                      disabled={sending}
                      className="w-full resize-none rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-700 focus:border-blue-500 disabled:opacity-50"
                    />

                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[10px] text-slate-700">
                        Your message will be visible to the support team.
                      </p>

                      <button
                        type="submit"
                        disabled={sending || !reply.trim()}
                        className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {sending ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4" />
                            Send reply
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Closed/resolved state */}

              {!canReply && (
                <div className="border-t border-slate-800 bg-slate-950/40 p-6">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-400" />

                    <div className="min-w-0">
                      <p className="text-xs font-semibold">
                        This ticket is {ticket.status}.
                      </p>

                      <p className="mt-1 text-[11px] leading-5 text-slate-600">
                        If you still need help, reopen the ticket to continue
                        the conversation.
                      </p>

                      <button
                        type="button"
                        onClick={handleReopenTicket}
                        disabled={processingAction}
                        className="mt-4 flex items-center gap-2 rounded-xl border border-blue-500/20 bg-blue-500/10 px-3 py-2 text-[10px] font-semibold text-blue-400 transition hover:bg-blue-500/20 disabled:opacity-50"
                      >
                        {processingAction ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <RefreshCw className="h-3.5 w-3.5" />
                        )}
                        Reopen ticket
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* =================================================
                CUSTOMER SATISFACTION
            ================================================== */}

            {(isResolved || isClosed) && (
              <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-yellow-500/10 text-yellow-400">
                    <Star className="h-5 w-5" />
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold">How did we do?</h3>

                    <p className="mt-1 text-xs text-slate-600">
                      Your feedback helps us improve SupportAI.
                    </p>
                  </div>
                </div>

                {hasRating ? (
                  <div className="mt-6 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                    <p className="text-xs font-medium text-emerald-400">
                      Thanks for your feedback!
                    </p>

                    <div className="mt-2 flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-4 w-4 ${
                            star <= ticket.customerRating
                              ? "fill-current text-yellow-400"
                              : "text-slate-700"
                          }`}
                        />
                      ))}
                    </div>

                    {ticket.customerFeedback && (
                      <p className="mt-3 text-xs leading-5 text-slate-400">
                        “{ticket.customerFeedback}”
                      </p>
                    )}

                    {ticket.ratedAt && (
                      <p className="mt-2 text-[9px] text-slate-700">
                        Submitted {formatDate(ticket.ratedAt)}
                      </p>
                    )}
                  </div>
                ) : (
                  <form onSubmit={handleSubmitRating} className="mt-6">
                    <p className="text-[10px] font-medium text-slate-500">
                      Rate your support experience
                    </p>

                    <div className="mt-3 flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className="rounded-lg p-1 transition hover:scale-110"
                          title={`${star} star`}
                        >
                          <Star
                            className={`h-6 w-6 ${
                              star <= rating
                                ? "fill-current text-yellow-400"
                                : "text-slate-700 hover:text-yellow-400"
                            }`}
                          />
                        </button>
                      ))}
                    </div>

                    <textarea
                      value={feedback}
                      onChange={(e) =>
                        setFeedback(e.target.value.slice(0, 2000))
                      }
                      rows={3}
                      placeholder="Optional feedback..."
                      className="mt-4 w-full resize-none rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-700 focus:border-blue-500"
                    />

                    <button
                      type="submit"
                      disabled={!rating || submittingRating}
                      className="mt-3 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {submittingRating ? "Submitting..." : "Submit feedback"}
                    </button>
                  </form>
                )}
              </section>
            )}
          </div>

          {/* =================================================
              RIGHT SIDEBAR
          ================================================== */}

          <aside className="space-y-6">
            {/* =================================================
                ASSIGNMENT
            ================================================== */}

            <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
              <div className="flex items-center gap-2">
                <UserRound className="h-4 w-4 text-blue-400" />

                <h3 className="text-sm font-semibold">Support</h3>
              </div>

              <div className="mt-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800">
                  {isAssigned ? (
                    <UserRound className="h-4 w-4 text-slate-400" />
                  ) : (
                    <Bot className="h-4 w-4 text-blue-400" />
                  )}
                </div>

                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold">
                    {ticket.agent}
                  </p>

                  <p className="mt-1 text-[10px] text-slate-600">
                    {isAssigned ? "Support agent" : "Waiting for assignment"}
                  </p>
                </div>
              </div>

              {ticket.agentEmail && (
                <p className="mt-4 truncate text-[10px] text-slate-600">
                  {ticket.agentEmail}
                </p>
              )}
            </section>

            {/* =================================================
                ESCALATION
            ================================================== */}

            <section className="rounded-2xl border border-orange-500/20 bg-orange-500/5 p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400">
                  <UserRoundCheck className="h-4 w-4" />
                </div>

                <div>
                  <h3 className="text-xs font-semibold">Human support</h3>

                  <p className="mt-2 text-[11px] leading-5 text-slate-600">
                    Need additional assistance? You can escalate this ticket to
                    a support agent.
                  </p>
                </div>
              </div>

              {ticket.isEscalated ? (
                <div className="mt-4 rounded-xl border border-orange-500/20 bg-orange-500/10 p-3">
                  <p className="text-[10px] font-semibold text-orange-400">
                    Ticket escalated
                  </p>

                  {ticket.escalationReason && (
                    <p className="mt-2 text-[10px] leading-5 text-slate-500">
                      {ticket.escalationReason}
                    </p>
                  )}

                  {ticket.escalatedAt && (
                    <p className="mt-2 text-[9px] text-slate-700">
                      {formatDate(ticket.escalatedAt)}
                    </p>
                  )}
                </div>
              ) : (
                !isClosed && (
                  <button
                    type="button"
                    onClick={handleEscalate}
                    disabled={processingAction}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500/10 px-3 py-2.5 text-[11px] font-semibold text-orange-400 transition hover:bg-orange-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {processingAction ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <UserRoundCheck className="h-4 w-4" />
                    )}
                    Escalate to support
                  </button>
                )
              )}
            </section>

            {/* =================================================
                AI SUPPORT
            ================================================== */}

            <section className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                  <Bot className="h-4 w-4" />
                </div>

                <div>
                  <h3 className="text-xs font-semibold">
                    SupportAI assistance
                  </h3>

                  <p className="mt-2 text-[11px] leading-5 text-slate-600">
                    AI can summarize your issue and suggest solutions while you
                    wait for a support agent.
                  </p>
                </div>
              </div>

              {!isClosed && (
                <button
                  type="button"
                  onClick={handleGenerateSummary}
                  disabled={generatingSummary}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-blue-500/20 bg-blue-500/10 px-3 py-2.5 text-[11px] font-semibold text-blue-400 transition hover:bg-blue-500/20 disabled:opacity-50"
                >
                  {generatingSummary ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Thinking...
                    </>
                  ) : (
                    <>
                      <Bot className="h-4 w-4" />
                      Ask SupportAI
                    </>
                  )}
                </button>
              )}

              <p className="mt-3 text-[9px] leading-4 text-slate-700">
                AI suggestions should be verified with official support
                information.
              </p>
            </section>

            {/* =================================================
                TICKET INFORMATION
            ================================================== */}

            <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />

                <h3 className="text-sm font-semibold">Ticket information</h3>
              </div>

              <div className="mt-5 space-y-4">
                <InfoRow label="Ticket ID" value={ticket.ticketNumber} />

                <InfoRow label="Category" value={ticket.category} />

                <InfoRow label="Priority" value={currentPriority.label} />

                <InfoRow label="Status" value={currentStatus.label} />

                <InfoRow label="Replies" value={ticket.replyCount || 0} />

                <InfoRow label="Created" value={formatDate(ticket.createdAt)} />

                <InfoRow label="Updated" value={formatDate(ticket.updatedAt)} />

                {ticket.resolvedAt && (
                  <InfoRow
                    label="Resolved"
                    value={formatDate(ticket.resolvedAt)}
                  />
                )}

                {ticket.closedAt && (
                  <InfoRow label="Closed" value={formatDate(ticket.closedAt)} />
                )}
              </div>
            </section>

            {/* =================================================
                NEED MORE HELP
            ================================================== */}

            <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 text-slate-400">
                <MessageSquare className="h-4 w-4" />
              </div>

              <h3 className="mt-4 text-sm font-semibold">Need more help?</h3>

              <p className="mt-2 text-xs leading-5 text-slate-600">
                Continue the conversation or contact a human support agent if
                your issue requires additional assistance.
              </p>

              {!isClosed && !ticket.isEscalated && (
                <button
                  type="button"
                  onClick={handleEscalate}
                  disabled={processingAction}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-800 px-3 py-2.5 text-xs font-medium text-slate-400 transition hover:bg-slate-700 hover:text-white disabled:opacity-50"
                >
                  <UserRoundCheck className="h-4 w-4" />
                  Contact support
                </button>
              )}

              {ticket.isEscalated && (
                <div className="mt-4 flex items-center gap-2 rounded-xl border border-orange-500/20 bg-orange-500/10 px-3 py-2.5 text-[10px] text-orange-400">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Support escalation requested
                </div>
              )}
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
};

// ===========================================================
// INFO ROW
// ===========================================================

const InfoRow = ({ label, value }) => {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-[10px] text-slate-700">{label}</span>

      <span className="truncate text-right text-[10px] font-medium text-slate-400">
        {value}
      </span>
    </div>
  );
};

export default TicketDetails;
