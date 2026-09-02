import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  AlertCircle,
  ArrowLeft,
  Bot,
  CheckCircle2,
  Clock3,
  FileText,
  Loader2,
  MessageSquare,
  RefreshCw,
  Send,
  UserRound,
  UserRoundCheck,
  X,
  XCircle,
  Star,
  ShieldCheck,
  AlertTriangle,
  Paperclip,
  Wifi,
  WifiOff,
  History,
} from "lucide-react";

import { Link, useParams } from "react-router-dom";

import {
  getTicketById,
  getTicketStatusHistory,
  generateTicketSummary,
  uploadTicketAttachments,
  replyToTicket,
} from "../../../services/ticketService";

import socket from "../../../socket/socket";

const API_BASE_URL = "http://localhost:8000";

/*
 * =========================================================
 * STATUS CONFIGURATION
 * =========================================================
 */

const STATUS_CONFIG = {
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
    label: "In Progress",
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

/*
 * =========================================================
 * STATUS DESCRIPTIONS
 * =========================================================
 */

const STATUS_DESCRIPTIONS = {
  open: "Your ticket has been received and is waiting to be handled.",

  waiting: "The support team is waiting for additional information from you.",

  pending: "Your ticket is waiting for the next support action.",

  "in-progress": "A support team member is currently working on your ticket.",

  resolved:
    "The support team has resolved the issue. You can still reply if you need more help.",

  closed: "This ticket has been closed and can no longer receive new replies.",
};

/*
 * =========================================================
 * PRIORITY CONFIGURATION
 * =========================================================
 */

const PRIORITY_CONFIG = {
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

/*
 * =========================================================
 * NORMALIZE MESSAGE
 * =========================================================
 */

const normalizeReply = (message, index = 0) => {
  const sender = message?.sender;

  const senderRole =
    message?.senderRole || sender?.role || message?.user?.role || "agent";

  let senderName =
    sender?.name ||
    sender?.username ||
    message?.user?.name ||
    message?.senderName;

  if (!senderName) {
    if (senderRole === "customer" || senderRole === "user") {
      senderName = "You";
    } else if (senderRole === "ai") {
      senderName = "SupportAI";
    } else if (senderRole === "system") {
      senderName = "System";
    } else if (senderRole === "admin") {
      senderName = "Support Admin";
    } else {
      senderName = "Support Agent";
    }
  }

  return {
    id: message?.id || message?._id || `reply-${index}-${Date.now()}`,

    message: message?.message || message?.content || message?.text || "",

    sender,

    senderName,

    senderRole,

    createdAt: message?.createdAt || message?.timestamp || null,

    attachments: Array.isArray(message?.attachments) ? message.attachments : [],

    isRead: message?.isRead ?? false,
  };
};

/*
 * =========================================================
 * NORMALIZE TICKET
 * =========================================================
 */

const normalizeTicket = (data, fallbackId = "") => {
  if (!data) {
    return null;
  }

  const conversation = Array.isArray(data.conversation)
    ? data.conversation
    : [];

  const normalizedConversation =
    conversation.length > 0
      ? conversation.map(normalizeReply)
      : data.description
        ? [
            {
              id: `initial-${data._id || data.id || fallbackId}`,
              message: data.description,
              sender: data.customer || null,
              senderName:
                data.customer?.name || data.customer?.username || "You",
              senderRole: "customer",
              createdAt: data.createdAt || data.created || null,
              attachments: [],
              isRead: true,
            },
          ]
        : [];

  return {
    ...data,

    id: data.id || data._id || fallbackId,

    ticketNumber: data.ticketNumber || data.id || data._id || "—",

    subject: data.subject || "Untitled ticket",

    description: data.description || "No description provided.",

    category: data.category || "General",

    status: String(data.status || "open").toLowerCase(),

    priority: String(data.priority || "medium").toLowerCase(),

    agent:
      data.assignedAgent?.name ||
      data.assignedAgent?.username ||
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

    reopenedAt: data.reopenedAt || null,

    resolvedAt: data.resolvedAt || null,

    closedAt: data.closedAt || null,

    attachments: Array.isArray(data.attachments) ? data.attachments : [],

    conversation: normalizedConversation,

    replyCount:
      typeof data.replies === "number"
        ? data.replies
        : normalizedConversation.length,

    customerRating: data.customerRating || null,

    customerFeedback: data.customerFeedback || "",

    statusHistory: Array.isArray(data.statusHistory) ? data.statusHistory : [],
  };
};

/*
 * =========================================================
 * TICKET DETAILS
 * =========================================================
 */

const TicketDetails = () => {
  const { id } = useParams();

  /*
   * =======================================================
   * TICKET STATE
   * =======================================================
   */

  const [ticket, setTicket] = useState(null);

  /*
   * IMPORTANT:
   *
   * Ticket loading and status-history loading are now
   * completely independent.
   *
   * The ticket can render even if status-history is still
   * loading or its endpoint is temporarily unavailable.
   */

  const [ticketLoading, setTicketLoading] = useState(true);

  const [statusHistory, setStatusHistory] = useState([]);

  const [statusHistoryLoading, setStatusHistoryLoading] = useState(true);

  const [statusHistoryError, setStatusHistoryError] = useState("");

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  /*
   * =======================================================
   * REPLY
   * =======================================================
   */

  const [reply, setReply] = useState("");

  const [sending, setSending] = useState(false);

  /*
   * =======================================================
   * RATING
   * =======================================================
   */

  const [rating, setRating] = useState(0);

  const [feedback, setFeedback] = useState("");

  const [submittingRating, setSubmittingRating] = useState(false);

  /*
   * =======================================================
   * AI SUMMARY
   * =======================================================
   */

  const [aiSummary, setAiSummary] = useState(null);

  const [generatingSummary, setGeneratingSummary] = useState(false);

  const [summaryError, setSummaryError] = useState("");

  /*
   * =======================================================
   * ATTACHMENTS
   * =======================================================
   */

  const [selectedFiles, setSelectedFiles] = useState([]);

  const [uploadingFiles, setUploadingFiles] = useState(false);

  /*
   * =======================================================
   * SOCKET
   * =======================================================
   */

  const [socketConnected, setSocketConnected] = useState(socket.connected);

  const [typingUser, setTypingUser] = useState(null);

  const [onlineUsers, setOnlineUsers] = useState([]);

  /*
   * =======================================================
   * REFS
   * =======================================================
   */

  const conversationEndRef = useRef(null);

  const typingTimeoutRef = useRef(null);

  const currentTicketIdRef = useRef(id);

  /*
   * =======================================================
   * LOAD TICKET
   *
   * ONLY loads the ticket.
   *
   * It does NOT wait for status history.
   * =======================================================
   */

  const loadTicket = useCallback(async () => {
    if (!id) {
      return null;
    }

    try {
      setTicketLoading(true);
      setError("");

      const response = await getTicketById(id);

      console.log("CUSTOMER TICKET DETAILS:", response);

      const ticketData =
        response?.ticket ||
        response?.data?.ticket ||
        response?.data ||
        response;

      if (!ticketData) {
        setError("Ticket not found.");
        setTicket(null);

        return null;
      }

      const normalized = normalizeTicket(ticketData, id);

      setTicket(normalized);

      return normalized;
    } catch (err) {
      console.error("LOAD TICKET ERROR:", err);

      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Failed to load ticket.",
      );

      setTicket(null);

      return null;
    } finally {
      setTicketLoading(false);
    }
  }, [id]);

  /*
   * =======================================================
   * LOAD STATUS HISTORY
   *
   * COMPLETELY INDEPENDENT FROM TICKET LOADING.
   *
   * A failure here does NOT hide the ticket page.
   * =======================================================
   */

  const loadStatusHistory = useCallback(async () => {
    if (!id) {
      return;
    }

    try {
      setStatusHistoryLoading(true);
      setStatusHistoryError("");

      const response = await getTicketStatusHistory(id);

      console.log("TICKET STATUS HISTORY:", response);

      const history =
        response?.statusHistory || response?.data?.statusHistory || [];

      setStatusHistory(Array.isArray(history) ? history : []);

      /*
       * Also update the current ticket status if the
       * history endpoint gives us newer information.
       */

      if (response?.currentStatus || response?.status) {
        setTicket((previous) => {
          if (!previous) {
            return previous;
          }

          return {
            ...previous,

            status: String(
              response.currentStatus || response.status || previous.status,
            ).toLowerCase(),

            resolvedAt: response.resolvedAt ?? previous.resolvedAt,

            reopenedAt: response.reopenedAt ?? previous.reopenedAt,

            closedAt: response.closedAt ?? previous.closedAt,
          };
        });
      }
    } catch (err) {
      console.error("LOAD STATUS HISTORY ERROR:", err);

      /*
       * IMPORTANT:
       *
       * Do not set the main page error here.
       *
       * The ticket itself may have loaded successfully.
       */

      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Status history could not be loaded.";

      setStatusHistoryError(message);

      /*
       * Keep existing status history if there is any.
       */

      setStatusHistory((previous) => (Array.isArray(previous) ? previous : []));
    } finally {
      setStatusHistoryLoading(false);
    }
  }, [id]);

  /*
   * =======================================================
   * INITIAL DATA LOADING
   *
   * Both requests start at the SAME TIME.
   *
   * Promise.allSettled means one request does not block
   * the other.
   * =======================================================
   */

  useEffect(() => {
    if (!id) {
      return;
    }

    currentTicketIdRef.current = id;

    loadTicket();

    loadStatusHistory();
  }, [id, loadTicket, loadStatusHistory]);

  /*
   * =======================================================
   * REAL-TIME SOCKET CONNECTION
   * =======================================================
   */

  useEffect(() => {
    if (!id) {
      return;
    }

    const token = localStorage.getItem("supportai_token");

    if (!token) {
      console.warn("No authentication token found for Socket.IO.");

      return;
    }

    currentTicketIdRef.current = id;

    const joinTicket = () => {
      console.log(`Joining real-time ticket room: ticket:${id}`);

      socket.emit("ticket:join", {
        ticketId: id,
      });
    };

    const handleConnect = () => {
      console.log("Ticket Socket.IO connected:", socket.id);

      setSocketConnected(true);

      joinTicket();
    };

    const handleDisconnect = (reason) => {
      console.log("Ticket Socket.IO disconnected:", reason);

      setSocketConnected(false);
    };

    const handleConnectError = (socketError) => {
      console.error(
        "Ticket Socket.IO connection error:",
        socketError?.message || socketError,
      );

      setSocketConnected(false);
    };

    const handleJoined = (data) => {
      console.log("Joined ticket room successfully:", data);

      setSocketConnected(true);
    };

    const handleSocketError = (data) => {
      console.error("Ticket Socket.IO error:", data);

      /*
       * Socket errors should not destroy an already
       * loaded ticket.
       */

      if (data?.message && !ticket) {
        setError(data.message);
      }
    };

    /*
     * =====================================================
     * NEW MESSAGE
     * =====================================================
     */

    const handleNewMessage = (data) => {
      if (!data) {
        return;
      }

      const incomingTicketId = String(data.ticketId || "");

      const currentTicketId = String(id);

      if (incomingTicketId && incomingTicketId !== currentTicketId) {
        return;
      }

      const incomingMessage = data.message || data.conversationMessage;

      if (!incomingMessage) {
        return;
      }

      const normalizedMessage = normalizeReply(incomingMessage, Date.now());

      console.log("REAL-TIME TICKET MESSAGE:", normalizedMessage);

      setTicket((previous) => {
        if (!previous) {
          return previous;
        }

        const existingConversation = Array.isArray(previous.conversation)
          ? previous.conversation
          : [];

        const messageExists = existingConversation.some(
          (message) =>
            String(message.id) === String(normalizedMessage.id) ||
            (message.message === normalizedMessage.message &&
              message.senderRole === normalizedMessage.senderRole &&
              message.createdAt &&
              normalizedMessage.createdAt &&
              Math.abs(
                new Date(message.createdAt).getTime() -
                  new Date(normalizedMessage.createdAt).getTime(),
              ) < 5000),
        );

        if (messageExists) {
          return previous;
        }

        return {
          ...previous,

          conversation: [...existingConversation, normalizedMessage],

          replyCount: existingConversation.length + 1,

          lastReplyAt: normalizedMessage.createdAt || new Date().toISOString(),

          updatedAt: normalizedMessage.createdAt || new Date().toISOString(),
        };
      });

      if (normalizedMessage.senderRole !== "customer" && normalizedMessage.id) {
        socket.emit("ticket:message:read", {
          ticketId: id,
          messageId: normalizedMessage.id,
        });
      }
    };

    /*
     * =====================================================
     * TICKET UPDATED
     * =====================================================
     */

    const handleTicketUpdate = (data) => {
      if (!data) {
        return;
      }

      if (data.ticketId && String(data.ticketId) !== String(id)) {
        return;
      }

      console.log("REAL-TIME TICKET UPDATE:", data);

      setTicket((previous) => {
        if (!previous) {
          return previous;
        }

        return {
          ...previous,

          status:
            data.status !== undefined
              ? String(data.status).toLowerCase()
              : previous.status,

          replyCount:
            typeof data.replies === "number"
              ? data.replies
              : previous.replyCount,

          lastReplyAt: data.lastReplyAt || previous.lastReplyAt,

          updatedAt: data.updatedAt || data.lastReplyAt || previous.updatedAt,

          reopenedAt: data.reopenedAt ?? previous.reopenedAt,

          resolvedAt:
            data.resolvedAt !== undefined
              ? data.resolvedAt
              : previous.resolvedAt,

          closedAt:
            data.closedAt !== undefined ? data.closedAt : previous.closedAt,

          statusHistory: Array.isArray(data.statusHistory)
            ? data.statusHistory
            : previous.statusHistory,
        };
      });

      /*
       * If backend includes status history in the
       * ticket update, synchronize it.
       */

      if (Array.isArray(data.statusHistory)) {
        setStatusHistory(data.statusHistory);
      }
    };

    /*
     * =====================================================
     * REAL-TIME STATUS CHANGED
     * =====================================================
     */

    const handleStatusChanged = (data) => {
      if (!data) {
        return;
      }

      if (data.ticketId && String(data.ticketId) !== String(id)) {
        return;
      }

      console.log("REAL-TIME STATUS CHANGED:", data);

      setTicket((previous) => {
        if (!previous) {
          return previous;
        }

        return {
          ...previous,

          status:
            data.status !== undefined
              ? String(data.status).toLowerCase()
              : previous.status,

          resolvedAt:
            data.resolvedAt !== undefined
              ? data.resolvedAt
              : previous.resolvedAt,

          reopenedAt:
            data.reopenedAt !== undefined
              ? data.reopenedAt
              : previous.reopenedAt,

          closedAt:
            data.closedAt !== undefined ? data.closedAt : previous.closedAt,

          statusHistory: Array.isArray(data.statusHistory)
            ? data.statusHistory
            : previous.statusHistory,
        };
      });

      if (Array.isArray(data.statusHistory)) {
        setStatusHistory(data.statusHistory);
      } else {
        /*
         * Reload history in the background.
         *
         * This does not block the page.
         */

        loadStatusHistory();
      }
    };

    /*
     * =====================================================
     * TYPING
     * =====================================================
     */

    const handleTyping = (data) => {
      if (!data) {
        return;
      }

      if (data.ticketId && String(data.ticketId) !== String(id)) {
        return;
      }

      if (data.isTyping) {
        setTypingUser({
          userId: data.userId,
          role: data.role,
        });
      } else {
        setTypingUser(null);
      }
    };

    /*
     * =====================================================
     * USER ONLINE
     * =====================================================
     */

    const handleUserOnline = (data) => {
      if (!data) {
        return;
      }

      if (data.ticketId && String(data.ticketId) !== String(id)) {
        return;
      }

      setOnlineUsers((previous) => {
        const userExists = previous.some(
          (user) => String(user.userId) === String(data.userId),
        );

        if (userExists) {
          return previous;
        }

        return [
          ...previous,
          {
            userId: data.userId,
            role: data.role,
          },
        ];
      });
    };

    /*
     * =====================================================
     * USER OFFLINE
     * =====================================================
     */

    const handleUserOffline = (data) => {
      if (!data) {
        return;
      }

      if (data.ticketId && String(data.ticketId) !== String(id)) {
        return;
      }

      setOnlineUsers((previous) =>
        previous.filter((user) => String(user.userId) !== String(data.userId)),
      );
    };

    /*
     * =====================================================
     * REGISTER SOCKET LISTENERS
     * =====================================================
     */

    socket.on("connect", handleConnect);

    socket.on("disconnect", handleDisconnect);

    socket.on("connect_error", handleConnectError);

    socket.on("ticket:joined", handleJoined);

    socket.on("ticket:error", handleSocketError);

    socket.on("ticket:new-message", handleNewMessage);

    socket.on("ticket:updated", handleTicketUpdate);

    socket.on("ticket:status-changed", handleStatusChanged);

    socket.on("ticket:typing", handleTyping);

    socket.on("ticket:user-online", handleUserOnline);

    socket.on("ticket:user-offline", handleUserOffline);

    /*
     * =====================================================
     * AUTHENTICATE SOCKET
     * =====================================================
     */

    socket.auth = {
      token,
    };

    if (socket.connected) {
      joinTicket();
    } else {
      socket.connect();
    }

    /*
     * =====================================================
     * CLEANUP
     * =====================================================
     */

    return () => {
      console.log(`Leaving real-time ticket room: ticket:${id}`);

      socket.emit("ticket:leave", {
        ticketId: id,
      });

      socket.off("connect", handleConnect);

      socket.off("disconnect", handleDisconnect);

      socket.off("connect_error", handleConnectError);

      socket.off("ticket:joined", handleJoined);

      socket.off("ticket:error", handleSocketError);

      socket.off("ticket:new-message", handleNewMessage);

      socket.off("ticket:updated", handleTicketUpdate);

      socket.off("ticket:status-changed", handleStatusChanged);

      socket.off("ticket:typing", handleTyping);

      socket.off("ticket:user-online", handleUserOnline);

      socket.off("ticket:user-offline", handleUserOffline);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);

        typingTimeoutRef.current = null;
      }

      setTypingUser(null);
      setOnlineUsers([]);
    };
  }, [id, loadStatusHistory]);

  /*
   * =========================================================
   * AUTO SCROLL
   * =========================================================
   */

  useEffect(() => {
    if (!conversationEndRef.current) {
      return;
    }

    conversationEndRef.current.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [ticket?.conversation?.length, typingUser]);

  /*
   * =========================================================
   * REFRESH
   * =========================================================
   */

  const handleRefresh = async () => {
    try {
      setRefreshing(true);

      /*
       * Refresh both independently.
       */

      await Promise.allSettled([loadTicket(), loadStatusHistory()]);
    } finally {
      setRefreshing(false);
    }
  };

  /*
   * =========================================================
   * FORMAT DATE
   * =========================================================
   */

  const formatDate = (date) => {
    if (!date) {
      return "—";
    }

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

  /*
   * =========================================================
   * FORMAT RELATIVE DATE
   * =========================================================
   */

  const formatRelativeDate = (date) => {
    if (!date) {
      return "";
    }

    try {
      const parsed = new Date(date);

      if (Number.isNaN(parsed.getTime())) {
        return "";
      }

      const diff = Date.now() - parsed.getTime();

      const minutes = Math.floor(diff / 60000);

      if (minutes < 1) {
        return "Just now";
      }

      if (minutes < 60) {
        return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
      }

      const hours = Math.floor(minutes / 60);

      if (hours < 24) {
        return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
      }

      const days = Math.floor(hours / 24);

      if (days < 7) {
        return `${days} ${days === 1 ? "day" : "days"} ago`;
      }

      return parsed.toLocaleDateString();
    } catch {
      return "";
    }
  };

  /*
   * =========================================================
   * FILE SIZE
   * =========================================================
   */

  const formatFileSize = (bytes) => {
    if (!bytes) {
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

  /*
   * =========================================================
   * AI SUMMARY
   * =========================================================
   */

  const handleGenerateSummary = async () => {
    if (!ticket?.id) {
      return;
    }

    try {
      setGeneratingSummary(true);

      setSummaryError("");

      const response = await generateTicketSummary(ticket.id);

      console.log("AI TICKET SUMMARY RAW RESPONSE:", response);

      const rawSummary =
        response?.summary ||
        response?.data?.summary ||
        response?.aiSummary ||
        response?.data?.aiSummary ||
        response?.result ||
        response?.data?.result ||
        null;

      if (!rawSummary) {
        throw new Error("AI summary was not returned.");
      }

      let normalizedSummary;

      if (typeof rawSummary === "string") {
        normalizedSummary = {
          summary: rawSummary,
          keyPoints: [],
          suggestedResolution: "",
          recommendation: "",
        };
      } else {
        normalizedSummary = {
          summary:
            rawSummary.summary ||
            rawSummary.mainIssue ||
            rawSummary.overview ||
            rawSummary.description ||
            "",

          keyPoints: Array.isArray(rawSummary.keyPoints)
            ? rawSummary.keyPoints
            : Array.isArray(rawSummary.importantDetails)
              ? rawSummary.importantDetails
              : Array.isArray(rawSummary.details)
                ? rawSummary.details
                : [],

          suggestedResolution:
            rawSummary.suggestedResolution ||
            rawSummary.suggested_solution ||
            rawSummary.solution ||
            rawSummary.nextSteps ||
            "",

          recommendation:
            rawSummary.recommendation ||
            rawSummary.aiRecommendation ||
            rawSummary.recommendedAction ||
            "",
        };
      }

      if (
        !normalizedSummary.summary &&
        normalizedSummary.keyPoints.length === 0 &&
        !normalizedSummary.suggestedResolution &&
        !normalizedSummary.recommendation
      ) {
        throw new Error("AI returned an empty summary.");
      }

      setAiSummary(normalizedSummary);
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

  /*
   * =========================================================
   * FILE SELECT
   * =========================================================
   */

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);

    if (!files.length) {
      return;
    }

    setError("");

    const maxSize = 10 * 1024 * 1024;

    const validFiles = files.filter((file) => {
      if (file.size > maxSize) {
        setError(`${file.name} is larger than the 10 MB limit.`);

        return false;
      }

      return true;
    });

    if (validFiles.length > 5) {
      setError("You can upload a maximum of 5 files at a time.");

      setSelectedFiles(validFiles.slice(0, 5));
    } else {
      setSelectedFiles(validFiles);
    }

    e.target.value = "";
  };

  /*
   * =========================================================
   * REMOVE FILE
   * =========================================================
   */

  const removeSelectedFile = (index) => {
    setSelectedFiles((previous) =>
      previous.filter((_, fileIndex) => fileIndex !== index),
    );
  };

  /*
   * =========================================================
   * UPLOAD ATTACHMENTS
   * =========================================================
   */

  const handleUploadAttachments = async () => {
    if (!selectedFiles.length || !ticket?.id) {
      return;
    }

    try {
      setUploadingFiles(true);

      setError("");

      const response = await uploadTicketAttachments(ticket.id, selectedFiles);

      const uploadedAttachments = response?.attachments || [];

      setTicket((previous) => ({
        ...previous,

        attachments: response?.ticket?.attachments || [
          ...(previous?.attachments || []),
          ...uploadedAttachments,
        ],
      }));

      setSelectedFiles([]);
    } catch (err) {
      console.error("UPLOAD ATTACHMENTS ERROR:", err);

      setError(err?.response?.data?.message || "Failed to upload attachments.");
    } finally {
      setUploadingFiles(false);
    }
  };

  /*
   * =========================================================
   * TYPING START
   * =========================================================
   */

  const handleTypingStart = () => {
    if (!id || !socket.connected || ticket?.status === "closed") {
      return;
    }

    socket.emit("ticket:typing:start", {
      ticketId: id,
    });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("ticket:typing:stop", {
        ticketId: id,
      });
    }, 1500);
  };

  /*
   * =========================================================
   * TYPING STOP
   * =========================================================
   */

  const handleTypingStop = () => {
    if (!id || !socket.connected) {
      return;
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);

      typingTimeoutRef.current = null;
    }

    socket.emit("ticket:typing:stop", {
      ticketId: id,
    });
  };

  /*
   * =========================================================
   * SEND REPLY
   * =========================================================
   */

  const handleSendReply = async (e) => {
    e.preventDefault();

    const message = reply.trim();

    if (!message) {
      return;
    }

    if (!ticket?.id) {
      setError("Ticket ID is missing.");

      return;
    }

    if (ticket.status === "closed") {
      setError("This ticket is closed. Please create a new ticket.");

      return;
    }

    try {
      setSending(true);

      setError("");

      handleTypingStop();

      const response = await replyToTicket(ticket.id, message);

      console.log("REPLY RESPONSE:", response);

      /*
       * If socket is unavailable, use REST response.
       */

      if (!socket.connected) {
        const updatedTicket = response?.ticket;

        if (updatedTicket) {
          setTicket(normalizeTicket(updatedTicket, ticket.id));
        } else if (response?.conversation) {
          setTicket((previous) => ({
            ...previous,

            conversation: response.conversation.map(normalizeReply),

            replyCount: response.conversation.length,
          }));
        }
      }

      /*
       * Refresh status history in background because
       * sending a reply can reopen a resolved/waiting
       * ticket.
       */

      loadStatusHistory();

      setReply("");
    } catch (err) {
      console.error("SEND REPLY ERROR:", err);

      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Failed to send reply.",
      );
    } finally {
      setSending(false);
    }
  };

  /*
   * =========================================================
   * ENTER / SHIFT+ENTER
   * =========================================================
   */

  const handleReplyKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();

      if (!sending && reply.trim()) {
        e.currentTarget.form?.requestSubmit();
      }
    }
  };

  /*
   * =========================================================
   * REOPEN
   *
   * There is currently no dedicated backend reopen
   * endpoint.
   *
   * Resolved tickets are reopened when the customer
   * sends a reply.
   * =========================================================
   */

  const handleReopenTicket = () => {
    if (!ticket) {
      return;
    }

    setError(
      "This ticket will reopen automatically when you send a new reply.",
    );

    setTicket((previous) => ({
      ...previous,

      status: "open",

      resolvedAt: null,

      reopenedAt: new Date().toISOString(),
    }));

    setTimeout(() => {
      setError("");
    }, 4000);
  };

  /*
   * =========================================================
   * ESCALATE
   *
   * Currently UI-only.
   * =========================================================
   */

  const handleEscalate = async () => {
    setTicket((previous) => ({
      ...previous,

      status: "in-progress",
    }));
  };

  /*
   * =========================================================
   * RATING
   *
   * Currently UI-only.
   * =========================================================
   */

  const handleSubmitRating = async (e) => {
    e.preventDefault();

    if (!rating) {
      return;
    }

    try {
      setSubmittingRating(true);

      setError("");

      setTicket((previous) => ({
        ...previous,

        customerRating: rating,

        customerFeedback: feedback.trim(),
      }));
    } catch (err) {
      console.error("RATING ERROR:", err);

      setError(err?.response?.data?.message || "Failed to submit rating.");
    } finally {
      setSubmittingRating(false);
    }
  };

  /*
   * =========================================================
   * ATTACHMENT URL
   * =========================================================
   */

  const getAttachmentUrl = (file) => {
    const path = file?.path || file?.fileUrl || file?.url;

    if (!path) {
      return "#";
    }

    if (path.startsWith("http://") || path.startsWith("https://")) {
      return path;
    }

    return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
  };

  /*
   * =========================================================
   * MESSAGE ATTACHMENT URL
   * =========================================================
   */

  const getMessageAttachmentUrl = (file) => getAttachmentUrl(file);

  /*
   * =========================================================
   * MESSAGE ROLE CONFIG
   * =========================================================
   */

  const getMessageConfig = (senderRole) => {
    switch (senderRole) {
      case "customer":
      case "user":
        return {
          label: "Customer",
          icon: UserRound,
          wrapper: "bg-blue-500/10 text-blue-400",
          bubble: "bg-blue-500/5 border border-blue-500/10",
        };

      case "ai":
        return {
          label: "SupportAI",
          icon: Bot,
          wrapper: "bg-purple-500/10 text-purple-400",
          bubble: "bg-purple-500/5 border border-purple-500/10",
        };

      case "admin":
        return {
          label: "Support Admin",
          icon: ShieldCheck,
          wrapper: "bg-orange-500/10 text-orange-400",
          bubble: "bg-orange-500/5 border border-orange-500/10",
        };

      case "system":
        return {
          label: "System",
          icon: ShieldCheck,
          wrapper: "bg-slate-500/10 text-slate-400",
          bubble: "bg-slate-500/5 border border-slate-700",
        };

      case "agent":
      default:
        return {
          label: "Support Agent",
          icon: UserRoundCheck,
          wrapper: "bg-emerald-500/10 text-emerald-400",
          bubble: "bg-emerald-500/5 border border-emerald-500/10",
        };
    }
  };

  /*
   * =========================================================
   * STATUS HISTORY CONFIG
   * =========================================================
   */

  const getHistoryStatus = (status) => {
    const normalized = String(status || "open").toLowerCase();

    return STATUS_CONFIG[normalized] || STATUS_CONFIG.open;
  };

  /*
   * =========================================================
   * DERIVED VALUES
   * =========================================================
   */

  const currentStatus = useMemo(() => {
    return STATUS_CONFIG[ticket?.status] || STATUS_CONFIG.open;
  }, [ticket?.status]);

  const currentPriority = useMemo(() => {
    return PRIORITY_CONFIG[ticket?.priority] || PRIORITY_CONFIG.medium;
  }, [ticket?.priority]);

  const StatusIcon = currentStatus.icon;

  const isClosed = ticket?.status === "closed";

  const isResolved = ticket?.status === "resolved";

  const isAssigned = ticket?.agent && ticket.agent !== "Unassigned";

  const conversation = Array.isArray(ticket?.conversation)
    ? ticket.conversation
    : [];

  /*
   * =========================================================
   * MAIN LOADING
   *
   * ONLY the ticket request controls this.
   *
   * Status history does NOT block the page.
   * =========================================================
   */

  if (ticketLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-500" />

          <p className="mt-4 text-sm text-slate-500">Loading ticket...</p>

          <p className="mt-2 text-[10px] text-slate-700">
            Loading your support conversation
          </p>
        </div>
      </div>
    );
  }

  /*
   * =========================================================
   * NOT FOUND
   * =========================================================
   */

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
                onClick={loadTicket}
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

  /*
   * =========================================================
   * MAIN RENDER
   * =========================================================
   */

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* =====================================================
          HEADER
      ====================================================== */}

      <header className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-4">
            <Link
              to="/support/tickets"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-400 transition hover:bg-slate-800 hover:text-white"
              title="Back to tickets"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>

            <div>
              <p className="text-xs text-slate-600">Support Ticket</p>

              <h1 className="text-sm font-semibold">{ticket.ticketNumber}</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div
              className={`hidden items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] sm:flex ${
                socketConnected
                  ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                  : "border-slate-800 bg-slate-900 text-slate-600"
              }`}
            >
              {socketConnected ? (
                <>
                  <Wifi className="h-3 w-3" />
                  Live
                </>
              ) : (
                <>
                  <WifiOff className="h-3 w-3" />
                  Offline
                </>
              )}
            </div>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-400 transition hover:bg-slate-800 hover:text-white disabled:opacity-50"
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
        {/* ERROR */}

        {error && (
          <div className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-4 w-4 text-red-400" />

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
            TICKET HEADER
        ================================================== */}

        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium ${currentStatus.className}`}
                >
                  <StatusIcon className="h-3.5 w-3.5" />

                  {currentStatus.label}
                </span>

                <span
                  className={`rounded-full border px-2.5 py-1 text-[10px] font-medium ${currentPriority.className}`}
                >
                  {currentPriority.label} priority
                </span>

                <span className="rounded-full border border-slate-800 bg-slate-950 px-2.5 py-1 text-[10px] text-slate-500">
                  {ticket.category}
                </span>

                {socketConnected && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] text-emerald-400">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                    Real-time
                  </span>
                )}
              </div>

              <h2 className="mt-4 text-xl font-semibold tracking-tight text-white">
                {ticket.subject}
              </h2>

              <p className="mt-2 text-xs text-slate-600">
                {ticket.ticketNumber}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:min-w-[420px]">
              <TicketMeta
                icon={Clock3}
                label="Status"
                value={currentStatus.label}
              />

              <TicketMeta
                icon={MessageSquare}
                label="Messages"
                value={conversation.length}
              />

              <TicketMeta
                icon={UserRound}
                label="Support"
                value={ticket.agent}
              />

              <TicketMeta
                icon={FileText}
                label="Created"
                value={formatDate(ticket.createdAt)}
              />
            </div>
          </div>

          {/* CURRENT STATUS EXPLANATION */}

          <div className="mt-6 border-t border-slate-800 pt-5">
            <div className="flex items-start gap-3">
              <div
                className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${currentStatus.className}`}
              >
                <StatusIcon className="h-4 w-4" />
              </div>

              <div>
                <p className="text-xs font-medium text-slate-300">
                  {currentStatus.label}
                </p>

                <p className="mt-1 text-[11px] leading-5 text-slate-600">
                  {STATUS_DESCRIPTIONS[ticket.status] ||
                    "Your ticket is being handled by the support team."}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* =================================================
            STATUS HISTORY
        ================================================== */}

        <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/60">
          <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-blue-400" />

              <div>
                <h3 className="text-sm font-semibold">Ticket status history</h3>

                <p className="mt-1 text-[10px] text-slate-600">
                  See how your ticket has progressed.
                </p>
              </div>
            </div>

            {statusHistoryLoading && (
              <div className="flex items-center gap-2 text-[10px] text-slate-600">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Updating
              </div>
            )}
          </div>

          <div className="p-6">
            {statusHistoryError && statusHistory.length === 0 && (
              <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-yellow-400" />

                  <div className="min-w-0">
                    <p className="text-xs font-medium text-yellow-400">
                      Status history is temporarily unavailable
                    </p>

                    <p className="mt-1 text-[10px] leading-5 text-slate-600">
                      Your ticket and conversation are still available. The
                      status timeline will appear when the history service is
                      available.
                    </p>

                    <button
                      type="button"
                      onClick={loadStatusHistory}
                      disabled={statusHistoryLoading}
                      className="mt-3 inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-[10px] font-medium text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-50"
                    >
                      <RefreshCw
                        className={`h-3.5 w-3.5 ${
                          statusHistoryLoading ? "animate-spin" : ""
                        }`}
                      />
                      Try again
                    </button>
                  </div>
                </div>
              </div>
            )}

            {statusHistoryLoading && statusHistory.length === 0 && (
              <div className="space-y-5">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="flex animate-pulse gap-4">
                    <div className="h-9 w-9 rounded-full bg-slate-800" />

                    <div className="flex-1">
                      <div className="h-3 w-32 rounded bg-slate-800" />

                      <div className="mt-2 h-2 w-56 rounded bg-slate-900" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!statusHistoryLoading &&
              !statusHistoryError &&
              statusHistory.length === 0 && (
                <div className="rounded-xl border border-dashed border-slate-800 bg-slate-950/40 p-6 text-center">
                  <History className="mx-auto h-6 w-6 text-slate-700" />

                  <p className="mt-3 text-xs text-slate-500">
                    No status history recorded yet.
                  </p>

                  <p className="mt-1 text-[10px] leading-5 text-slate-700">
                    Future status changes will appear here.
                  </p>
                </div>
              )}

            {statusHistory.length > 0 && (
              <div className="relative">
                <div className="absolute left-[17px] top-5 bottom-5 w-px bg-slate-800" />

                <div className="space-y-6">
                  {statusHistory.map((history, index) => {
                    const historyStatus = getHistoryStatus(history?.status);

                    const HistoryIcon = historyStatus.icon;

                    const changedBy = history?.changedBy;

                    const changedByName =
                      changedBy?.name ||
                      changedBy?.username ||
                      history?.changedByName ||
                      (history?.changedByRole === "customer"
                        ? "You"
                        : history?.changedByRole === "ai"
                          ? "SupportAI"
                          : history?.changedByRole === "admin"
                            ? "Support Admin"
                            : history?.changedByRole === "agent"
                              ? "Support Agent"
                              : "System");

                    return (
                      <div
                        key={
                          history?._id ||
                          history?.id ||
                          `${history?.status}-${history?.createdAt}-${index}`
                        }
                        className="relative flex gap-4"
                      >
                        <div
                          className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border ${historyStatus.className}`}
                        >
                          <HistoryIcon className="h-4 w-4" />
                        </div>

                        <div className="min-w-0 flex-1 rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span
                                  className={`rounded-full border px-2 py-1 text-[10px] font-medium ${historyStatus.className}`}
                                >
                                  {historyStatus.label}
                                </span>

                                {index === statusHistory.length - 1 && (
                                  <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-2 py-1 text-[9px] text-blue-400">
                                    Current
                                  </span>
                                )}
                              </div>

                              <p className="mt-3 text-xs font-medium text-slate-300">
                                {STATUS_DESCRIPTIONS[
                                  String(
                                    history?.status || "open",
                                  ).toLowerCase()
                                ] || "Ticket status was updated."}
                              </p>
                            </div>

                            <div className="shrink-0 text-left sm:text-right">
                              <p className="text-[10px] text-slate-600">
                                {formatDate(history?.createdAt)}
                              </p>

                              <p className="mt-1 text-[9px] text-slate-700">
                                {formatRelativeDate(history?.createdAt)}
                              </p>
                            </div>
                          </div>

                          {history?.note && (
                            <p className="mt-3 rounded-lg border border-slate-800 bg-slate-900/60 p-3 text-[11px] leading-5 text-slate-500">
                              {history.note}
                            </p>
                          )}

                          <p className="mt-3 text-[9px] text-slate-700">
                            Updated by{" "}
                            <span className="text-slate-600">
                              {changedByName}
                            </span>
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* =================================================
            AI SUPPORT SUMMARY
        ================================================== */}

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
              className="mt-5 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 py-2.5 text-[11px] font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
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
            <div className="mt-5 space-y-6">
              {aiSummary.summary && (
                <section>
                  <h3 className="text-xs font-semibold text-white">
                    AI Summary
                  </h3>

                  <p className="mt-2 text-[12px] leading-6 text-slate-400">
                    {aiSummary.summary}
                  </p>
                </section>
              )}

              {Array.isArray(aiSummary.keyPoints) &&
                aiSummary.keyPoints.length > 0 && (
                  <section>
                    <h3 className="text-xs font-semibold text-white">
                      Important information
                    </h3>

                    <ul className="mt-2 space-y-2 pl-5">
                      {aiSummary.keyPoints.map((point, index) => (
                        <li
                          key={index}
                          className="list-disc pl-1 text-[12px] leading-6 text-slate-400 marker:text-slate-500"
                        >
                          {point}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

              {aiSummary.suggestedResolution && (
                <section>
                  <h3 className="text-xs font-semibold text-white">
                    What you can do
                  </h3>

                  <p className="mt-2 text-[12px] leading-6 text-slate-400">
                    {aiSummary.suggestedResolution}
                  </p>
                </section>
              )}

              {aiSummary.recommendation && (
                <section>
                  <h3 className="text-xs font-semibold text-white">
                    Next step
                  </h3>

                  <p className="mt-2 text-[12px] leading-6 text-slate-400">
                    {aiSummary.recommendation}
                  </p>
                </section>
              )}

              <div className="flex flex-wrap gap-2 border-t border-slate-800 pt-4">
                <button
                  type="button"
                  onClick={handleGenerateSummary}
                  disabled={generatingSummary}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-[10px] font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white disabled:opacity-50"
                >
                  {generatingSummary ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3.5 w-3.5" />
                  )}

                  {generatingSummary ? "Analyzing..." : "Regenerate"}
                </button>

                {!isClosed && (
                  <button
                    type="button"
                    onClick={handleEscalate}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-[10px] font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
                  >
                    <UserRoundCheck className="h-3.5 w-3.5" />
                    Talk to a person
                  </button>
                )}
              </div>

              <p className="text-[9px] leading-4 text-slate-600">
                AI-generated information may not always be accurate. If you're
                unsure, a support agent can help.
              </p>
            </div>
          )}

          {!aiSummary && !generatingSummary && (
            <div className="py-6">
              <p className="text-xs font-medium text-slate-300">
                Need help with this ticket?
              </p>

              <p className="mt-2 text-[10px] leading-5 text-slate-500">
                Ask SupportAI to explain your issue and suggest what you can do
                next.
              </p>

              <button
                type="button"
                onClick={handleGenerateSummary}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-500/10 px-3 py-2 text-[10px] font-semibold text-blue-400 hover:bg-blue-500/20"
              >
                <Bot className="h-3.5 w-3.5" />
                Get AI help
              </button>
            </div>
          )}

          {generatingSummary && !aiSummary && (
            <div className="py-6">
              <div className="flex items-center gap-3">
                <Loader2 className="h-4 w-4 animate-spin text-blue-400" />

                <div>
                  <p className="text-xs font-medium text-slate-300">
                    Understanding your issue...
                  </p>

                  <p className="mt-1 text-[10px] text-slate-500">
                    We're preparing a simple explanation for you.
                  </p>
                </div>
              </div>
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
                CONVERSATION
            ================================================== */}

            <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60">
              <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-blue-400" />

                  <h3 className="text-sm font-semibold">Conversation</h3>
                </div>

                <span className="text-[10px] text-slate-600">
                  {conversation.length}{" "}
                  {conversation.length === 1 ? "message" : "messages"}
                </span>
              </div>

              {typingUser && (
                <div className="border-b border-slate-800 bg-slate-950/50 px-6 py-3">
                  <div className="flex items-center gap-2 text-[10px] text-slate-500">
                    <span className="flex gap-1">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-400 [animation-delay:-0.3s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-400 [animation-delay:-0.15s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-400" />
                    </span>

                    {typingUser.role === "ai"
                      ? "SupportAI is typing..."
                      : typingUser.role === "admin"
                        ? "Support Admin is typing..."
                        : "Support Agent is typing..."}
                  </div>
                </div>
              )}

              <div className="divide-y divide-slate-800">
                {conversation.length > 0 ? (
                  conversation.map((message) => {
                    const config = getMessageConfig(message.senderRole);

                    const MessageIcon = config.icon;

                    const isCustomer =
                      message.senderRole === "customer" ||
                      message.senderRole === "user";

                    return (
                      <div key={message.id} className="p-6">
                        <div className="flex gap-4">
                          <div
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${config.wrapper}`}
                          >
                            <MessageIcon className="h-4 w-4" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="text-xs font-semibold">
                                    {message.senderName}
                                  </p>

                                  {isCustomer && socketConnected && (
                                    <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                                  )}
                                </div>

                                <p className="mt-0.5 text-[10px] text-slate-700">
                                  {config.label}
                                </p>
                              </div>

                              <div className="text-right">
                                <span className="text-[10px] text-slate-700">
                                  {formatDate(message.createdAt)}
                                </span>

                                {!isCustomer && message.isRead && (
                                  <p className="mt-0.5 text-[9px] text-emerald-500/70">
                                    Read
                                  </p>
                                )}
                              </div>
                            </div>

                            <div
                              className={`mt-4 rounded-xl p-4 ${config.bubble}`}
                            >
                              <p className="whitespace-pre-wrap text-sm leading-6 text-slate-400">
                                {message.message}
                              </p>

                              {message.attachments?.length > 0 && (
                                <div className="mt-4 space-y-2 border-t border-slate-800/70 pt-3">
                                  {message.attachments.map(
                                    (file, fileIndex) => (
                                      <a
                                        key={file._id || file.id || fileIndex}
                                        href={getMessageAttachmentUrl(file)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-950/60 p-3 transition hover:border-blue-500/30"
                                      >
                                        <Paperclip className="h-4 w-4 text-blue-400" />

                                        <span className="truncate text-xs text-slate-400">
                                          {file.originalName ||
                                            file.filename ||
                                            "Attachment"}
                                        </span>

                                        <span className="ml-auto text-[10px] text-slate-600">
                                          {formatFileSize(file.size)}
                                        </span>
                                      </a>
                                    ),
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-8 text-center">
                    <MessageSquare className="mx-auto h-6 w-6 text-slate-700" />

                    <p className="mt-3 text-sm text-slate-500">
                      No messages yet.
                    </p>

                    <p className="mt-1 text-xs text-slate-700">
                      Our support team will respond here.
                    </p>
                  </div>
                )}

                <div ref={conversationEndRef} />
              </div>

              {/* =================================================
                  REPLY
              ================================================== */}

              {!isClosed && (
                <div className="border-t border-slate-800 p-6">
                  {isResolved && (
                    <div className="mb-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />

                        <div>
                          <p className="text-xs font-medium text-emerald-400">
                            This ticket is resolved
                          </p>

                          <p className="mt-1 text-[10px] leading-5 text-slate-500">
                            You can still send a reply. Sending a new message
                            will reopen the ticket.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleSendReply} className="space-y-3">
                    <label className="block text-xs font-medium text-slate-400">
                      Add a reply
                    </label>

                    <textarea
                      value={reply}
                      onChange={(e) => {
                        setReply(e.target.value);

                        handleTypingStart();
                      }}
                      onKeyDown={handleReplyKeyDown}
                      onBlur={handleTypingStop}
                      rows={4}
                      placeholder="Write a message to the support team..."
                      disabled={sending}
                      className="w-full resize-none rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-700 focus:border-blue-500 disabled:opacity-50"
                    />

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="space-y-1">
                        <p className="text-[10px] text-slate-700">
                          Press Enter to send. Use Shift + Enter for a new line.
                        </p>

                        <p
                          className={`text-[10px] ${
                            socketConnected
                              ? "text-emerald-500/60"
                              : "text-yellow-500/60"
                          }`}
                        >
                          {socketConnected
                            ? "● Real-time messaging active"
                            : "● Sending through standard connection"}
                        </p>
                      </div>

                      <button
                        type="submit"
                        disabled={sending || !reply.trim()}
                        className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
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

              {isClosed && (
                <div className="border-t border-slate-800 bg-slate-950/40 p-6">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-400" />

                    <div>
                      <p className="text-xs font-semibold">
                        This ticket is closed.
                      </p>

                      <p className="mt-1 text-[11px] leading-5 text-slate-600">
                        If you still need help, you can create a new ticket.
                      </p>

                      <button
                        type="button"
                        onClick={handleReopenTicket}
                        className="mt-4 rounded-xl border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-xs font-semibold text-blue-400 transition hover:bg-blue-500/20"
                      >
                        Continue conversation
                      </button>
                    </div>
                  </div>
                </div>
              )}
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
                    {ticket.attachments?.length || 0} files
                  </span>
                </div>
              </div>

              <div className="p-6">
                {ticket.attachments?.length > 0 ? (
                  <div className="space-y-3">
                    {ticket.attachments.map((file, index) => {
                      const fileUrl = getAttachmentUrl(file);

                      return (
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
                                {formatFileSize(file.size)}
                              </p>
                            </div>
                          </div>

                          <span className="shrink-0 text-[10px] font-medium text-blue-400">
                            View
                          </span>
                        </a>
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

                {!isClosed && (
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
                      Maximum 5 files, 10 MB each.
                    </p>

                    {selectedFiles.length > 0 && (
                      <div className="mt-4 space-y-2">
                        {selectedFiles.map((file, index) => (
                          <div
                            key={`${file.name}-${file.lastModified}`}
                            className="flex items-center justify-between rounded-lg bg-slate-950 px-3 py-2"
                          >
                            <div className="flex min-w-0 items-center gap-2">
                              <Paperclip className="h-3.5 w-3.5 shrink-0 text-blue-400" />

                              <span className="truncate text-xs text-slate-400">
                                {file.name}
                              </span>
                            </div>

                            <div className="ml-3 flex shrink-0 items-center gap-3">
                              <span className="text-[10px] text-slate-600">
                                {formatFileSize(file.size)}
                              </span>

                              <button
                                type="button"
                                onClick={() => removeSelectedFile(index)}
                                className="text-slate-600 transition hover:text-red-400"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
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
                              <Paperclip className="h-4 w-4" />
                              Upload attachments
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>

            {/* =================================================
                CUSTOMER SATISFACTION
            ================================================== */}

            {isClosed && (
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

                {ticket.customerRating ? (
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
                      <p className="mt-3 text-xs leading-5 text-slate-500">
                        {ticket.customerFeedback}
                      </p>
                    )}
                  </div>
                ) : (
                  <form onSubmit={handleSubmitRating} className="mt-6">
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className="transition hover:scale-110"
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
                      onChange={(e) => setFeedback(e.target.value)}
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
            {/* SUPPORT */}

            <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
              <div className="flex items-center gap-2">
                <UserRound className="h-4 w-4 text-blue-400" />

                <h3 className="text-sm font-semibold">Support</h3>
              </div>

              <div className="mt-5 flex items-center gap-3">
                <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-slate-800">
                  {isAssigned ? (
                    <UserRound className="h-4 w-4 text-slate-400" />
                  ) : (
                    <Bot className="h-4 w-4 text-blue-400" />
                  )}

                  {isAssigned && socketConnected && (
                    <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-slate-900 bg-emerald-400" />
                  )}
                </div>

                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold">
                    {ticket.agent}
                  </p>

                  <p className="mt-1 text-[10px] text-slate-600">
                    {isAssigned
                      ? socketConnected
                        ? "Support agent • Online"
                        : "Support agent"
                      : "Waiting for assignment"}
                  </p>
                </div>
              </div>

              {ticket.agentEmail && (
                <p className="mt-4 truncate text-[10px] text-slate-600">
                  {ticket.agentEmail}
                </p>
              )}
            </section>

            {/* AI SUPPORT */}

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
                    AI can help summarize your issue and suggest solutions while
                    you wait for a support agent.
                  </p>
                </div>
              </div>

              {!isClosed && (
                <button
                  type="button"
                  onClick={handleGenerateSummary}
                  disabled={generatingSummary}
                  className="mt-4 w-full rounded-xl border border-blue-500/20 bg-blue-500/10 px-3 py-2.5 text-[11px] font-semibold text-blue-400 transition hover:bg-blue-500/20 disabled:opacity-50"
                >
                  {generatingSummary ? "Analyzing..." : "Ask SupportAI"}
                </button>
              )}
            </section>

            {/* TICKET INFORMATION */}

            <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />

                <h3 className="text-sm font-semibold">Ticket information</h3>
              </div>

              <div className="mt-5 space-y-4">
                <InfoRow label="Ticket number" value={ticket.ticketNumber} />

                <InfoRow label="Category" value={ticket.category} />

                <InfoRow label="Priority" value={currentPriority.label} />

                <InfoRow label="Status" value={currentStatus.label} />

                <InfoRow label="Messages" value={conversation.length} />

                <InfoRow label="Created" value={formatDate(ticket.createdAt)} />

                <InfoRow label="Updated" value={formatDate(ticket.updatedAt)} />
              </div>
            </section>

            {/* LIVE CONNECTION */}

            <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
              <div className="flex items-center gap-2">
                {socketConnected ? (
                  <Wifi className="h-4 w-4 text-emerald-400" />
                ) : (
                  <WifiOff className="h-4 w-4 text-slate-600" />
                )}

                <h3 className="text-sm font-semibold">Live connection</h3>
              </div>

              <div className="mt-4">
                <div
                  className={`rounded-xl border p-3 ${
                    socketConnected
                      ? "border-emerald-500/20 bg-emerald-500/5"
                      : "border-slate-800 bg-slate-950/50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        socketConnected
                          ? "animate-pulse bg-emerald-400"
                          : "bg-slate-700"
                      }`}
                    />

                    <p
                      className={`text-xs font-medium ${
                        socketConnected ? "text-emerald-400" : "text-slate-500"
                      }`}
                    >
                      {socketConnected ? "Connected" : "Disconnected"}
                    </p>
                  </div>

                  <p className="mt-2 text-[10px] leading-5 text-slate-600">
                    {socketConnected
                      ? "New replies and ticket updates appear automatically."
                      : "The page will continue using standard API requests."}
                  </p>
                </div>
              </div>
            </section>

            {/* STATUS HISTORY QUICK INFO */}

            <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-blue-400" />

                <h3 className="text-sm font-semibold">Status tracking</h3>
              </div>

              <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/50 p-3">
                {statusHistoryLoading ? (
                  <div className="flex items-center gap-2 text-[10px] text-slate-600">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Loading status updates...
                  </div>
                ) : statusHistory.length > 0 ? (
                  <>
                    <p className="text-xs font-medium text-slate-300">
                      {statusHistory.length} status{" "}
                      {statusHistory.length === 1 ? "update" : "updates"}
                    </p>

                    <p className="mt-1 text-[10px] leading-5 text-slate-600">
                      Your ticket status changes are tracked automatically.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-xs font-medium text-slate-500">
                      No history yet
                    </p>

                    <p className="mt-1 text-[10px] leading-5 text-slate-700">
                      Status changes will appear here.
                    </p>
                  </>
                )}
              </div>
            </section>

            {/* NEED MORE HELP */}

            <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 text-slate-400">
                <MessageSquare className="h-4 w-4" />
              </div>

              <h3 className="mt-4 text-sm font-semibold">Need more help?</h3>

              <p className="mt-2 text-xs leading-5 text-slate-600">
                Continue the conversation or contact a human support agent if
                your issue requires additional assistance.
              </p>

              {!isClosed && (
                <button
                  type="button"
                  onClick={handleEscalate}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-800 px-3 py-2.5 text-xs font-medium text-slate-400 transition hover:bg-slate-700 hover:text-white"
                >
                  <UserRoundCheck className="h-4 w-4" />
                  Contact support
                </button>
              )}
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
};

/*
 * ===========================================================
 * TICKET META
 * ===========================================================
 */

const TicketMeta = ({ icon: Icon, label, value }) => {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-slate-500">
        <Icon className="h-4 w-4" />
      </div>

      <div className="min-w-0">
        <p className="text-[10px] text-slate-700">{label}</p>

        <p className="mt-1 truncate text-xs font-medium text-slate-400">
          {value}
        </p>
      </div>
    </div>
  );
};

/*
 * ===========================================================
 * INFO ROW
 * ===========================================================
 */

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
