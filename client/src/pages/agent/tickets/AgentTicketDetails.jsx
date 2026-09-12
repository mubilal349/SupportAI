import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock3,
  Download,
  File,
  FileText,
  Image as ImageIcon,
  Loader2,
  MessageSquare,
  Paperclip,
  RefreshCw,
  Search,
  Send,
  ShieldAlert,
  User,
  UserCheck,
  X,
  BookOpen,
  ExternalLink,
  Sparkles,
  Copy,
} from "lucide-react";
import { io } from "socket.io-client";
import { useNavigate, useParams } from "react-router-dom";

import {
  assignTicketToMe,
  getAgentTicketById,
  sendAgentReply,
  updateAgentTicketPriority,
  updateAgentTicketStatus,
  addInternalNote,
  escalateAgentTicket,
} from "../../../services/agentService";

import { useAuth } from "../../../context/AuthContext";

// ============================================================
// CONFIG
// ============================================================

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000/api";

const SERVER_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, "");
const SOCKET_BASE_URL = SERVER_BASE_URL;

// ============================================================
// LOCAL KNOWLEDGE BASE
// ============================================================
//
// This is intentionally local for now because you currently
// only have AgentTicketDetails.jsx.
//
// Later these articles can come from:
// GET /api/knowledge-base/search?q=...
//
// ============================================================

const KNOWLEDGE_BASE_ARTICLES = [
  {
    id: "kb-001",
    title: "How to reset your password",
    category: "Account & Security",
    tags: ["password", "reset", "login", "account", "security"],
    content:
      "Customers can reset their password from the login screen by selecting 'Forgot Password'. They should enter the email associated with their account and follow the password reset link sent to their inbox.",
    solution:
      "You can reset your password by selecting “Forgot Password” on the login screen. Enter the email associated with your account and follow the password reset link sent to your inbox. If you do not receive the email, please check your spam or junk folder.",
  },
  {
    id: "kb-002",
    title: "Troubleshooting login problems",
    category: "Account & Security",
    tags: ["login", "signin", "authentication", "password", "account"],
    content:
      "If a customer cannot sign in, first verify that they are using the correct email and password. Ask them to clear browser cache, try another browser, and confirm that their account is active.",
    solution:
      "Let's troubleshoot your login issue. Please verify that you are using the correct email and password. If the issue continues, clear your browser cache and try signing in from another browser. Also make sure your account is active.",
  },
  {
    id: "kb-003",
    title: "How to update account information",
    category: "Account Management",
    tags: ["profile", "account", "email", "name", "update"],
    content:
      "Customers can update supported profile information from their account settings. Changes should be saved before leaving the page.",
    solution:
      "You can update your account information from your account settings. Open your profile, make the required changes, and select Save. If the information cannot be changed from your account settings, let us know which field you need to update and we can assist you.",
  },
  {
    id: "kb-004",
    title: "Troubleshooting email notifications",
    category: "Notifications",
    tags: ["email", "notification", "notifications", "alerts", "messages"],
    content:
      "If customers are not receiving email notifications, verify their email address, check spam/junk folders, and confirm that notifications are enabled.",
    solution:
      "Please first check that the email address on your account is correct. Also check your spam or junk folder for our messages. If you still do not receive notifications, please confirm that email notifications are enabled in your account settings.",
  },
  {
    id: "kb-005",
    title: "How to create a support ticket",
    category: "Support",
    tags: ["ticket", "support", "request", "help"],
    content:
      "Customers can create a support ticket from the Support section. They should provide a clear subject, detailed description, category, and priority.",
    solution:
      "You can create a support ticket from the Support section of your account. Please provide a clear subject and detailed description of the issue. Selecting the appropriate category and priority will help our support team resolve your request faster.",
  },
  {
    id: "kb-006",
    title: "Understanding ticket statuses",
    category: "Support",
    tags: ["ticket", "status", "open", "pending", "resolved", "closed"],
    content:
      "Open means the request is awaiting support action. Pending means additional information may be required. In Progress means an agent is actively working on the request. Resolved means the issue has been addressed. Closed means the ticket is no longer active.",
    solution:
      "Your ticket status indicates where your request currently stands. Open means it is awaiting support action, In Progress means an agent is actively working on it, Pending may mean additional information is required, Resolved means the issue has been addressed, and Closed means the ticket is no longer active.",
  },
  {
    id: "kb-007",
    title: "How to attach files to a ticket",
    category: "Tickets",
    tags: ["attachment", "file", "upload", "image", "document"],
    content:
      "Customers can attach screenshots, documents, and other supported files to their support requests. Attachments should be relevant to the reported issue.",
    solution:
      "You can attach relevant screenshots or documents directly to your support ticket. Please make sure the files clearly show the issue you are experiencing and that they are in a supported format.",
  },
  {
    id: "kb-008",
    title: "When should a ticket be escalated?",
    category: "Support Operations",
    tags: ["escalation", "escalate", "urgent", "priority", "manager"],
    content:
      "Escalate a ticket when it requires a higher level of technical expertise, involves a serious service impact, or cannot be resolved within the normal support workflow.",
    solution:
      "I understand the importance of this issue. I am escalating your ticket to the appropriate support team so it can receive further investigation and assistance.",
  },
  {
    id: "kb-009",
    title: "Common browser troubleshooting steps",
    category: "Troubleshooting",
    tags: ["browser", "cache", "cookies", "chrome", "firefox", "edge"],
    content:
      "Common browser troubleshooting includes refreshing the page, clearing cache and cookies, disabling problematic extensions, trying an incognito/private window, and testing another browser.",
    solution:
      "Please try refreshing the page first. If the issue continues, clear your browser cache and cookies and try again. You can also test the issue in an incognito/private window or another browser to determine whether the problem is browser-specific.",
  },
  {
    id: "kb-010",
    title: "How to report a technical issue",
    category: "Technical Support",
    tags: ["bug", "technical", "issue", "error", "problem"],
    content:
      "A useful technical issue report should include the affected feature, steps to reproduce the problem, expected behavior, actual behavior, error messages, and relevant screenshots.",
    solution:
      "To help us investigate this technical issue, please provide the steps that led to the problem, what you expected to happen, what actually happened, and any error message you received. Screenshots are also helpful if available.",
  },
];

// ============================================================
// HELPERS
// ============================================================

const getId = (value) => {
  if (!value) return "";

  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  if (value._id) return String(value._id);
  if (value.id) return String(value.id);
  if (value.userId) return String(value.userId);

  return "";
};

const getAvatarUrl = (avatar) => {
  if (!avatar) return "";

  if (avatar.startsWith("http")) return avatar;

  if (avatar.startsWith("/")) {
    return `${SERVER_BASE_URL}${avatar}`;
  }

  return `${SERVER_BASE_URL}/${avatar}`;
};

const getFileUrl = (file) => {
  if (!file) return "";

  const rawUrl =
    typeof file === "string"
      ? file
      : file.url || file.path || file.fileUrl || file.location || "";

  if (!rawUrl) return "";

  if (rawUrl.startsWith("http")) return rawUrl;

  if (rawUrl.startsWith("/")) {
    return `${SERVER_BASE_URL}${rawUrl}`;
  }

  return `${SERVER_BASE_URL}/${rawUrl}`;
};

const formatDate = (date) => {
  if (!date) return "Unknown date";

  try {
    return new Date(date).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "Unknown date";
  }
};

const formatFileSize = (bytes) => {
  if (!bytes || Number.isNaN(Number(bytes))) return "";

  const size = Number(bytes);

  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const formatStatus = (status = "") => {
  return String(status)
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const getSenderName = (message, fallback = "User") => {
  if (!message) return fallback;

  return (
    message.senderName ||
    message.sender?.name ||
    message.sender?.username ||
    message.user?.name ||
    message.user?.username ||
    fallback
  );
};

const isImageFile = (file) => {
  const type = file?.mimeType || file?.type || "";
  const name = file?.name || file?.filename || file?.originalName || "";

  return (
    type.startsWith("image/") || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(name)
  );
};

const isPdfFile = (file) => {
  const type = file?.mimeType || file?.type || "";
  const name = file?.name || file?.filename || file?.originalName || "";

  return type === "application/pdf" || /\.pdf$/i.test(name);
};

const getPriorityClasses = (priority = "") => {
  const value = String(priority).toLowerCase();

  if (value === "urgent") {
    return "border-red-500/30 bg-red-500/10 text-red-300";
  }

  if (value === "high") {
    return "border-orange-500/30 bg-orange-500/10 text-orange-300";
  }

  if (value === "medium") {
    return "border-yellow-500/30 bg-yellow-500/10 text-yellow-300";
  }

  return "border-slate-700 bg-slate-900 text-slate-300";
};

const getStatusClasses = (status = "") => {
  const value = String(status).toLowerCase();

  if (value === "resolved" || value === "closed") {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
  }

  if (value === "in-progress") {
    return "border-blue-500/30 bg-blue-500/10 text-blue-300";
  }

  if (value === "pending" || value === "waiting") {
    return "border-yellow-500/30 bg-yellow-500/10 text-yellow-300";
  }

  return "border-slate-700 bg-slate-900 text-slate-300";
};

// ============================================================
// SLA HELPERS
// ============================================================

const getSlaStatusClasses = (status = "") => {
  const value = String(status).toLowerCase();

  if (value === "met") {
    return {
      badge: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
      dot: "bg-emerald-400",
    };
  }

  if (value === "breached") {
    return {
      badge: "border-red-500/30 bg-red-500/10 text-red-300",
      dot: "bg-red-400",
    };
  }

  return {
    badge: "border-yellow-500/30 bg-yellow-500/10 text-yellow-300",
    dot: "bg-yellow-400",
  };
};

const formatSlaStatus = (status = "") => {
  if (!status) return "Pending";

  return String(status)
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const getRemainingTime = (dueAt, completedAt = null) => {
  if (!dueAt) return null;

  if (completedAt) {
    return null;
  }

  const now = Date.now();
  const due = new Date(dueAt).getTime();

  if (Number.isNaN(due)) return null;

  const difference = due - now;

  const absoluteDifference = Math.abs(difference);

  const minutes = Math.floor(absoluteDifference / (1000 * 60));

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  let formatted = "";

  if (hours > 0) {
    formatted = `${hours}h ${remainingMinutes}m`;
  } else {
    formatted = `${remainingMinutes}m`;
  }

  if (difference < 0) {
    return `${formatted} overdue`;
  }

  return `${formatted} remaining`;
};

// ============================================================
// COMPONENT
// ============================================================

const AgentTicketDetails = () => {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // ==========================================================
  // TICKET STATE
  // ==========================================================

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [previewImage, setPreviewImage] = useState(null);

  // ==========================================================
  // REPLY STATE
  // ==========================================================

  const [reply, setReply] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [sendingReply, setSendingReply] = useState(false);

  // ==========================================================
  // TICKET UPDATE STATE
  // ==========================================================

  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updatingPriority, setUpdatingPriority] = useState(false);

  // ==========================================================
  // ASSIGNMENT
  // ==========================================================

  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState("");

  // ==========================================================
  // COMPOSER
  // ==========================================================

  const [composerMode, setComposerMode] = useState("reply");

  // ==========================================================
  // INTERNAL NOTE
  // ==========================================================

  const [internalNote, setInternalNote] = useState("");
  const [isAddingInternalNote, setIsAddingInternalNote] = useState(false);
  const [internalNoteError, setInternalNoteError] = useState("");

  // ==========================================================
  // ESCALATION
  // ==========================================================

  const [showEscalateModal, setShowEscalateModal] = useState(false);
  const [escalationReason, setEscalationReason] = useState("");
  const [escalationNote, setEscalationNote] = useState("");
  const [escalating, setEscalating] = useState(false);
  const [escalationError, setEscalationError] = useState("");

  // ==========================================================
  // SOCKET
  // ==========================================================

  const [customerTyping, setCustomerTyping] = useState(false);

  const socketRef = useRef(null);
  const fileInputRef = useRef(null);
  const conversationEndRef = useRef(null);

  // ==========================================================
  // KNOWLEDGE BASE STATE
  // ==========================================================

  const [knowledgeBaseOpen, setKnowledgeBaseOpen] = useState(false);
  const [knowledgeSearch, setKnowledgeSearch] = useState("");
  const [expandedArticle, setExpandedArticle] = useState(null);

  // ==========================================================
  // LOAD TICKET
  // ==========================================================

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

        const rawTicket =
          response?.ticket ||
          response?.data?.ticket ||
          response?.data ||
          response;

        if (!rawTicket) {
          throw new Error("Ticket not found.");
        }

        const normalizedTicket = {
          ...rawTicket,

          id: getId(rawTicket) || ticketId,

          // SLA
          slaStatus:
            rawTicket.slaStatus || response?.sla || rawTicket.sla || null,

          conversation: Array.isArray(rawTicket.conversation)
            ? rawTicket.conversation
            : [],

          attachments: Array.isArray(rawTicket.attachments)
            ? rawTicket.attachments
            : [],

          statusHistory: Array.isArray(rawTicket.statusHistory)
            ? rawTicket.statusHistory
            : [],

          escalation: rawTicket.escalation || {
            isEscalated: false,
          },
        };

        setTicket(normalizedTicket);

        console.log("Agent Ticket:", normalizedTicket);
        console.log("Description:", normalizedTicket.description);
        console.log("Conversation:", normalizedTicket.conversation);
        console.log("Attachments:", normalizedTicket.attachments);
        console.log("Escalation:", normalizedTicket.escalation);
      } catch (err) {
        console.error("Failed to load ticket:", err);

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

  // ==========================================================
  // SOCKET.IO
  // ==========================================================

  useEffect(() => {
    if (!ticketId) return;

    const token = localStorage.getItem("supportai_token");

    if (!token) {
      return;
    }

    const socket = io(SOCKET_BASE_URL, {
      auth: {
        token,
      },
      transports: ["websocket", "polling"],
      withCredentials: true,
      autoConnect: true,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Agent socket connected:", socket.id);

      socket.emit("ticket:join", {
        ticketId,
      });
    });

    socket.on("ticket:joined", (payload) => {
      console.log("Joined ticket room:", payload);
    });

    socket.on("ticket:typing", (payload) => {
      if (!payload) return;

      const payloadTicketId =
        payload.ticketId || payload.id || payload.ticket?._id;

      if (payloadTicketId && String(payloadTicketId) !== String(ticketId)) {
        return;
      }

      const role =
        payload.senderRole || payload.role || payload.user?.role || "";

      if (String(role).toLowerCase() !== "customer") {
        return;
      }

      setCustomerTyping(Boolean(payload.isTyping));
    });

    socket.on("ticket:error", (payload) => {
      console.error("Ticket socket error:", payload);
    });

    return () => {
      try {
        socket.emit("ticket:leave", {
          ticketId,
        });
      } catch {
        // Ignore cleanup errors.
      }

      socket.removeAllListeners();
      socket.disconnect();

      socketRef.current = null;
    };
  }, [ticketId]);

  // ==========================================================
  // CONVERSATION
  // ==========================================================

  const conversation = useMemo(() => {
    if (!ticket) return [];

    const existing = Array.isArray(ticket.conversation)
      ? ticket.conversation
      : [];

    const description = String(ticket.description || "").trim();

    if (!description) {
      return existing;
    }

    const hasOriginalMessage = existing.some((message) => {
      const messageText = String(
        message?.message || message?.content || "",
      ).trim();

      return messageText === description;
    });

    if (hasOriginalMessage) {
      return existing;
    }

    const syntheticMessage = {
      id: `initial-ticket-${ticket.id || ticket._id}`,
      _id: `initial-ticket-${ticket.id || ticket._id}`,
      senderRole: "customer",
      sender: ticket.customer,
      senderName:
        ticket.customer?.name || ticket.customer?.username || "Customer",
      message: description,
      content: description,
      attachments: ticket.attachments || [],
      createdAt:
        ticket.createdAt || ticket.updatedAt || new Date().toISOString(),
      isOriginalTicket: true,
    };

    return [syntheticMessage, ...existing];
  }, [ticket]);

  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [conversation.length]);

  // ==========================================================
  // FILE HANDLING
  // ==========================================================

  const handleFileSelection = (event) => {
    const files = Array.from(event.target.files || []);

    if (!files.length) return;

    setSelectedFiles((previous) => {
      const combined = [...previous, ...files];

      const uniqueFiles = combined.filter(
        (file, index, array) =>
          index ===
          array.findIndex(
            (item) =>
              item.name === file.name &&
              item.size === file.size &&
              item.lastModified === file.lastModified,
          ),
      );

      return uniqueFiles.slice(0, 5);
    });

    event.target.value = "";
  };

  const removeSelectedFile = (index) => {
    setSelectedFiles((previous) =>
      previous.filter((_, fileIndex) => fileIndex !== index),
    );
  };

  // ==========================================================
  // ASSIGN TICKET
  // ==========================================================

  const handleAssignToMe = async () => {
    const id = ticket?.id || ticket?._id;

    if (!id || assigning) return;

    if (isAssignedToCurrentUser) {
      return;
    }

    if (isAssignedToAnotherAgent) {
      setAssignError("This ticket is assigned to another agent.");
      return;
    }

    try {
      setAssigning(true);
      setAssignError("");
      setError("");
      setSuccess("");

      const response = await assignTicketToMe(id);

      const updatedTicket =
        response?.ticket || response?.data?.ticket || response?.data || null;

      setTicket((previous) => {
        if (!previous) return previous;

        if (updatedTicket) {
          return {
            ...previous,
            ...updatedTicket,
            conversation:
              updatedTicket.conversation || previous.conversation || [],
            attachments:
              updatedTicket.attachments || previous.attachments || [],
            statusHistory:
              updatedTicket.statusHistory || previous.statusHistory || [],
            escalation: updatedTicket.escalation ||
              previous.escalation || {
                isEscalated: false,
              },
          };
        }

        return {
          ...previous,
          assignedAgent: user,
        };
      });

      setSuccess("Ticket assigned to you.");
    } catch (err) {
      console.error("Assign ticket error:", err);

      setAssignError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to assign ticket.",
      );
    } finally {
      setAssigning(false);
    }
  };

  // ==========================================================
  // INTERNAL NOTE
  // ==========================================================

  const handleAddInternalNote = async () => {
    const id = ticket?.id || ticket?._id;
    const cleanNote = internalNote.trim();

    if (!id) return;

    if (!cleanNote) {
      setInternalNoteError("Please write an internal note.");
      return;
    }

    if (cleanNote.length > 10000) {
      setInternalNoteError("Internal note cannot exceed 10,000 characters.");
      return;
    }

    try {
      setIsAddingInternalNote(true);
      setInternalNoteError("");
      setError("");
      setSuccess("");

      const response = await addInternalNote(id, cleanNote);

      const updatedTicket =
        response?.ticket || response?.data?.ticket || response?.data || null;

      if (updatedTicket && typeof updatedTicket === "object") {
        setTicket((previous) => ({
          ...previous,
          ...updatedTicket,
          conversation:
            updatedTicket.conversation || previous?.conversation || [],
          attachments: updatedTicket.attachments || previous?.attachments || [],
          statusHistory:
            updatedTicket.statusHistory || previous?.statusHistory || [],
          escalation: updatedTicket.escalation ||
            previous?.escalation || {
              isEscalated: false,
            },
        }));
      } else if (response?.note) {
        setTicket((previous) => ({
          ...previous,
          conversation: [...(previous?.conversation || []), response.note],
        }));
      } else {
        await loadTicket(false);
      }

      setInternalNote("");
      setSuccess("Internal note added.");
    } catch (err) {
      console.error("Add internal note error:", err);

      setInternalNoteError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to add internal note.",
      );
    } finally {
      setIsAddingInternalNote(false);
    }
  };

  // ==========================================================
  // ESCALATION
  // ==========================================================

  const handleEscalate = async () => {
    const id = ticket?.id || ticket?._id;

    const cleanReason = escalationReason.trim();
    const cleanNote = escalationNote.trim();

    if (!id) return;

    if (!cleanReason) {
      setEscalationError("Please select an escalation reason.");
      return;
    }

    if (cleanReason.length > 500) {
      setEscalationError("Escalation reason cannot exceed 500 characters.");
      return;
    }

    if (cleanNote.length > 5000) {
      setEscalationError("Escalation note cannot exceed 5,000 characters.");
      return;
    }

    if (isEscalated) {
      setEscalationError("This ticket is already escalated.");
      return;
    }

    try {
      setEscalating(true);
      setEscalationError("");
      setError("");

      const response = await escalateAgentTicket(id, {
        escalatedTo: null,
        reason: cleanReason,
        note: cleanNote,
      });

      const updatedTicket =
        response?.ticket || response?.data?.ticket || response?.data || null;

      if (updatedTicket) {
        setTicket((previous) => ({
          ...previous,
          ...updatedTicket,
          conversation:
            updatedTicket.conversation || previous?.conversation || [],
          attachments: updatedTicket.attachments || previous?.attachments || [],
          statusHistory:
            updatedTicket.statusHistory || previous?.statusHistory || [],
          escalation: updatedTicket.escalation || previous?.escalation || {},
        }));
      } else {
        await loadTicket(false);
      }

      setShowEscalateModal(false);
      setEscalationReason("");
      setEscalationNote("");

      setSuccess("Ticket escalated successfully.");
    } catch (err) {
      console.error("Escalation error:", err);

      setEscalationError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to escalate ticket.",
      );
    } finally {
      setEscalating(false);
    }
  };

  // ==========================================================
  // STATUS
  // ==========================================================

  const handleStatusChange = async (newStatus) => {
    const id = ticket?.id || ticket?._id;

    if (!id || updatingStatus) return;

    try {
      setUpdatingStatus(true);
      setError("");
      setSuccess("");

      const response = await updateAgentTicketStatus(id, newStatus);

      const updatedTicket =
        response?.ticket || response?.data?.ticket || response?.data || null;

      if (updatedTicket) {
        setTicket((previous) => ({
          ...previous,
          ...updatedTicket,
          conversation:
            updatedTicket.conversation || previous?.conversation || [],
          attachments: updatedTicket.attachments || previous?.attachments || [],
          statusHistory:
            updatedTicket.statusHistory || previous?.statusHistory || [],
          escalation: updatedTicket.escalation ||
            previous?.escalation || {
              isEscalated: false,
            },
        }));
      } else {
        setTicket((previous) => ({
          ...previous,
          status: newStatus,
        }));
      }

      setSuccess(`Ticket status updated to ${formatStatus(newStatus)}.`);
    } catch (err) {
      console.error("Status update error:", err);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to update ticket status.",
      );
    } finally {
      setUpdatingStatus(false);
    }
  };

  // ==========================================================
  // PRIORITY
  // ==========================================================

  const handlePriorityChange = async (newPriority) => {
    const id = ticket?.id || ticket?._id;

    if (!id || updatingPriority) return;

    try {
      setUpdatingPriority(true);
      setError("");
      setSuccess("");

      const response = await updateAgentTicketPriority(id, newPriority);

      const updatedTicket =
        response?.ticket || response?.data?.ticket || response?.data || null;

      if (updatedTicket) {
        setTicket((previous) => ({
          ...previous,
          ...updatedTicket,
          conversation:
            updatedTicket.conversation || previous?.conversation || [],
          attachments: updatedTicket.attachments || previous?.attachments || [],
          statusHistory:
            updatedTicket.statusHistory || previous?.statusHistory || [],
          escalation: updatedTicket.escalation ||
            previous?.escalation || {
              isEscalated: false,
            },
        }));
      } else {
        setTicket((previous) => ({
          ...previous,
          priority: newPriority,
        }));
      }

      setSuccess(`Ticket priority updated to ${formatStatus(newPriority)}.`);
    } catch (err) {
      console.error("Priority update error:", err);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to update ticket priority.",
      );
    } finally {
      setUpdatingPriority(false);
    }
  };

  // ==========================================================
  // SEND REPLY
  // ==========================================================

  const handleSendReply = async () => {
    const id = ticket?.id || ticket?._id;
    const cleanReply = reply.trim();

    if (!id || sendingReply) return;

    if (!cleanReply && selectedFiles.length === 0) {
      setError("Please write a reply or attach a file.");
      return;
    }

    try {
      setSendingReply(true);
      setError("");
      setSuccess("");

      const response = await sendAgentReply(id, cleanReply, selectedFiles);

      const updatedTicket =
        response?.ticket || response?.data?.ticket || response?.data || null;

      if (updatedTicket) {
        setTicket((previous) => ({
          ...previous,
          ...updatedTicket,
          conversation:
            updatedTicket.conversation || previous?.conversation || [],
          attachments: updatedTicket.attachments || previous?.attachments || [],
          statusHistory:
            updatedTicket.statusHistory || previous?.statusHistory || [],
          escalation: updatedTicket.escalation ||
            previous?.escalation || {
              isEscalated: false,
            },
        }));
      } else {
        await loadTicket(false);
      }

      setReply("");
      setSelectedFiles([]);

      setSuccess("Reply sent successfully.");

      setTimeout(() => {
        conversationEndRef.current?.scrollIntoView({
          behavior: "smooth",
        });
      }, 100);
    } catch (err) {
      console.error("Send reply error:", err);

      setError(
        err?.response?.data?.message || err?.message || "Failed to send reply.",
      );
    } finally {
      setSendingReply(false);
    }
  };

  // ==========================================================
  // KNOWLEDGE BASE SEARCH
  // ==========================================================

  const knowledgeResults = useMemo(() => {
    const query = knowledgeSearch.trim().toLowerCase();

    if (!query) {
      return KNOWLEDGE_BASE_ARTICLES;
    }

    const words = query
      .split(/\s+/)
      .map((word) => word.trim())
      .filter(Boolean);

    return KNOWLEDGE_BASE_ARTICLES.map((article) => {
      const searchableText = [
        article.title,
        article.category,
        article.content,
        article.solution,
        ...(article.tags || []),
      ]
        .join(" ")
        .toLowerCase();

      let score = 0;

      words.forEach((word) => {
        if (article.title.toLowerCase().includes(word)) {
          score += 10;
        }

        if (article.category.toLowerCase().includes(word)) {
          score += 6;
        }

        if (article.tags?.some((tag) => tag.includes(word))) {
          score += 5;
        }

        if (article.content.toLowerCase().includes(word)) {
          score += 3;
        }

        if (article.solution.toLowerCase().includes(word)) {
          score += 2;
        }
      });

      return {
        article,
        score,
        searchableText,
      };
    })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((item) => item.article);
  }, [knowledgeSearch]);

  // ==========================================================
  // KNOWLEDGE BASE - INSERT SOLUTION
  // ==========================================================

  const insertKnowledgeSolution = (article) => {
    if (!article?.solution) return;

    setComposerMode("reply");

    setReply((previous) => {
      const current = previous.trim();

      if (!current) {
        return article.solution;
      }

      return `${current}\n\n${article.solution}`;
    });

    setSuccess(`"${article.title}" solution inserted into your reply.`);

    setTimeout(() => {
      setSuccess("");
    }, 3000);
  };

  // ==========================================================
  // KNOWLEDGE BASE - COPY SOLUTION
  // ==========================================================

  const copyKnowledgeSolution = async (article) => {
    if (!article?.solution) return;

    try {
      await navigator.clipboard.writeText(article.solution);

      setSuccess("Solution copied to clipboard.");

      setTimeout(() => {
        setSuccess("");
      }, 2500);
    } catch (err) {
      console.error("Copy solution error:", err);
      setError("Unable to copy the solution.");
    }
  };

  // ==========================================================
  // DERIVED VALUES
  // ==========================================================

  if (!ticket && !loading) {
    return (
      <div className="min-h-screen bg-[#050b18] px-4 py-8 text-white">
        <div className="mx-auto max-w-5xl">
          <button
            type="button"
            onClick={() => navigate("/agent/queue")}
            className="mb-6 inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:border-blue-500/30 hover:text-white"
          >
            <ArrowLeft size={17} />
            Back to Queue
          </button>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-8 text-center">
            <AlertCircle className="mx-auto mb-4 text-red-400" size={42} />
            <h2 className="text-xl font-semibold text-white">
              Ticket unavailable
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              {error || "The requested ticket could not be loaded."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050b18]">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Loader2 size={34} className="animate-spin text-blue-400" />

          <p className="text-sm">Loading ticket...</p>
        </div>
      </div>
    );
  }

  const ticketCustomer = ticket?.customer || {};
  const assignedAgent = ticket?.assignedAgent || null;

  const assignedAgentId = getId(assignedAgent);
  const currentUserId = getId(user);

  const isAssigned = Boolean(assignedAgentId);

  const isAssignedToCurrentUser =
    Boolean(assignedAgentId) &&
    Boolean(currentUserId) &&
    String(assignedAgentId) === String(currentUserId);

  const isAssignedToAnotherAgent = isAssigned && !isAssignedToCurrentUser;

  const isUnassigned = !isAssigned;

  const isClosed = String(ticket?.status || "").toLowerCase() === "closed";

  const isResolved = String(ticket?.status || "").toLowerCase() === "resolved";

  // ==========================================================
  // SLA
  // ==========================================================

  const slaStatus = ticket?.slaStatus || ticket?.sla || null;

  const responseSlaStatus = slaStatus?.responseStatus || "pending";

  const resolutionSlaStatus = slaStatus?.resolutionStatus || "pending";

  const responseDueAt = slaStatus?.responseDueAt || null;

  const resolutionDueAt = slaStatus?.resolutionDueAt || null;

  const firstRespondedAt = slaStatus?.firstRespondedAt || null;

  const resolvedAt = slaStatus?.resolvedAt || null;

  const responseRemaining = getRemainingTime(responseDueAt, firstRespondedAt);

  const resolutionRemaining = getRemainingTime(resolutionDueAt, resolvedAt);

  const isEscalated = ticket?.escalation?.isEscalated === true;

  const isAdmin = String(user?.role || "").toLowerCase() === "admin";

  const canEscalate =
    !isClosed &&
    !isEscalated &&
    (isAssignedToCurrentUser || isUnassigned || isAdmin);

  const canReply = !isClosed;

  // ==========================================================
  // RENDER ATTACHMENT
  // ==========================================================

  const renderAttachment = (file, index, compact = false) => {
    const fileUrl = getFileUrl(file);

    const fileName =
      file?.name ||
      file?.filename ||
      file?.originalName ||
      `Attachment ${index + 1}`;

    const fileSize = formatFileSize(
      file?.size || file?.fileSize || file?.bytes,
    );

    if (!fileUrl) {
      return (
        <div
          key={`${fileName}-${index}`}
          className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/50 p-3"
        >
          <FileText size={18} className="text-slate-400" />

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-slate-300">{fileName}</p>

            {fileSize && <p className="text-xs text-slate-500">{fileSize}</p>}
          </div>
        </div>
      );
    }

    if (isImageFile(file)) {
      return (
        <button
          type="button"
          key={`${fileUrl}-${index}`}
          onClick={() => setPreviewImage(fileUrl)}
          className={`group relative overflow-hidden rounded-xl border border-slate-800 bg-slate-950 ${
            compact ? "h-20 w-20" : "h-40 w-40"
          }`}
        >
          <img
            src={fileUrl}
            alt={fileName}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />

          <span className="absolute inset-0 flex items-center justify-center bg-black/0 text-white opacity-0 transition group-hover:bg-black/40 group-hover:opacity-100">
            <ImageIcon size={22} />
          </span>
        </button>
      );
    }

    return (
      <a
        key={`${fileUrl}-${index}`}
        href={fileUrl}
        target="_blank"
        rel="noreferrer"
        download={!isPdfFile(file)}
        className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/50 p-3 transition hover:border-blue-500/30 hover:bg-slate-900"
      >
        {isPdfFile(file) ? (
          <FileText size={20} className="text-red-400" />
        ) : (
          <File size={20} className="text-blue-400" />
        )}

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-slate-300">{fileName}</p>

          {fileSize && <p className="text-xs text-slate-500">{fileSize}</p>}
        </div>

        <Download size={16} className="shrink-0 text-slate-500" />
      </a>
    );
  };

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="min-h-screen bg-[#050b18] text-white">
      <div className="mx-auto max-w-[1800px] px-4 py-5 sm:px-6 lg:px-8">
        {/* ================================================== */}
        {/* HEADER */}
        {/* ================================================== */}

        <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/70 text-slate-400 transition hover:border-blue-500/30 hover:text-white"
              title="Go back"
            >
              <ArrowLeft size={18} />
            </button>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-xl font-semibold text-white sm:text-2xl">
                  {ticket.subject || "Support Ticket"}
                </h1>

                {isEscalated && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-300">
                    <ShieldAlert size={13} />
                    Escalated
                  </span>
                )}
              </div>

              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                <span>#{ticket.ticketNumber || ticket._id || ticket.id}</span>

                <span className="hidden text-slate-700 sm:inline">•</span>

                <span className="inline-flex items-center gap-1">
                  <Clock3 size={13} />
                  {formatDate(ticket.createdAt)}
                </span>

                {ticket.category && (
                  <>
                    <span className="hidden text-slate-700 sm:inline">•</span>

                    <span>{ticket.category}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => loadTicket(false)}
              disabled={refreshing}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/70 px-3 text-sm font-medium text-slate-300 transition hover:border-blue-500/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={refreshing ? "animate-spin" : ""}
              />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* ================================================== */}
        {/* ALERTS */}
        {/* ================================================== */}

        {error && (
          <div className="mb-4 flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />

            <p className="flex-1">{error}</p>

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
          <div className="mb-4 flex items-start gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            <CheckCircle2 size={18} className="mt-0.5 shrink-0" />

            <p>{success}</p>
          </div>
        )}

        {/* ================================================== */}
        {/* TICKET INFO */}
        {/* ================================================== */}

        <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {/* STATUS */}

          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Status
              </span>

              <span
                className={`rounded-full border px-2 py-1 text-[11px] font-medium ${getStatusClasses(
                  ticket.status,
                )}`}
              >
                {formatStatus(ticket.status)}
              </span>
            </div>

            <select
              value={ticket.status || "open"}
              onChange={(event) => handleStatusChange(event.target.value)}
              disabled={updatingStatus}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm text-slate-200 outline-none transition focus:border-blue-500/50 disabled:opacity-50"
            >
              <option value="open">Open</option>
              <option value="waiting">Waiting</option>
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          {/* PRIORITY */}

          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Priority
              </span>

              <span
                className={`rounded-full border px-2 py-1 text-[11px] font-medium ${getPriorityClasses(
                  ticket.priority,
                )}`}
              >
                {formatStatus(ticket.priority)}
              </span>
            </div>

            <select
              value={ticket.priority || "medium"}
              onChange={(event) => handlePriorityChange(event.target.value)}
              disabled={updatingPriority}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm text-slate-200 outline-none transition focus:border-blue-500/50 disabled:opacity-50"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          {/* CATEGORY */}

          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Category
            </span>

            <p className="mt-3 truncate text-sm font-medium text-slate-200">
              {ticket.category || "General"}
            </p>

            <p className="mt-1 text-xs text-slate-500">Ticket classification</p>
          </div>

          {/* ASSIGNED AGENT */}

          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Assigned Agent
            </span>

            <div className="mt-2 flex items-center gap-3">
              {assignedAgent?.avatar ? (
                <img
                  src={getAvatarUrl(assignedAgent.avatar)}
                  alt={getSenderName(
                    {
                      sender: assignedAgent,
                    },
                    "Agent",
                  )}
                  className="h-9 w-9 rounded-xl object-cover"
                />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                  <UserCheck size={17} />
                </div>
              )}

              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-200">
                  {assignedAgent
                    ? getSenderName(
                        {
                          sender: assignedAgent,
                        },
                        "Agent",
                      )
                    : "Unassigned"}
                </p>

                <p className="text-xs text-slate-500">
                  {isAssignedToCurrentUser
                    ? "Assigned to you"
                    : isAssignedToAnotherAgent
                      ? "Assigned to another agent"
                      : "Available in queue"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ================================================== */}
        {/* MAIN GRID */}
        {/* ================================================== */}

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          {/* ================================================= */}
          {/* LEFT - CONVERSATION */}
          {/* ================================================= */}

          <section className="min-w-0 rounded-3xl border border-slate-800 bg-slate-900/40">
            {/* CONVERSATION HEADER */}

            <div className="flex items-center justify-between border-b border-slate-800 px-4 py-4 sm:px-6">
              <div>
                <h2 className="flex items-center gap-2 text-base font-semibold text-white">
                  <MessageSquare size={18} className="text-blue-400" />
                  Conversation
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Customer and support communication
                </p>
              </div>

              {customerTyping && (
                <span className="flex items-center gap-2 text-xs text-blue-400">
                  <span className="flex gap-1">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-400" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-400 [animation-delay:120ms]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-400 [animation-delay:240ms]" />
                  </span>
                  Customer typing...
                </span>
              )}
            </div>

            {/* MESSAGES */}

            <div className="max-h-[650px] min-h-[450px] overflow-y-auto p-4 sm:p-6">
              {conversation.length === 0 ? (
                <div className="flex min-h-[350px] items-center justify-center text-center">
                  <div>
                    <MessageSquare
                      size={38}
                      className="mx-auto mb-3 text-slate-700"
                    />

                    <p className="text-sm text-slate-400">
                      No conversation messages yet.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  {conversation.map((message, index) => {
                    const role = String(
                      message?.senderRole ||
                        message?.role ||
                        message?.sender?.role ||
                        "",
                    ).toLowerCase();

                    const isInternal =
                      message?.isInternalNote === true ||
                      role === "internal" ||
                      role === "internal_note";

                    const isCustomer = role === "customer";

                    const isAgent = role === "agent" || role === "admin";

                    const messageText =
                      message?.message || message?.content || "";

                    const messageAttachments = Array.isArray(
                      message?.attachments,
                    )
                      ? message.attachments
                      : [];

                    const senderName = getSenderName(
                      message,
                      isCustomer ? "Customer" : isAgent ? "Agent" : "Support",
                    );

                    return (
                      <div
                        key={message?._id || message?.id || `message-${index}`}
                        className={`flex ${
                          isInternal
                            ? "justify-center"
                            : isCustomer
                              ? "justify-start"
                              : "justify-end"
                        }`}
                      >
                        <div
                          className={`max-w-[90%] sm:max-w-[80%] ${
                            isInternal ? "w-full" : ""
                          }`}
                        >
                          {isInternal ? (
                            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
                              <div className="mb-2 flex items-center gap-2">
                                <ShieldAlert
                                  size={15}
                                  className="text-amber-400"
                                />

                                <span className="text-xs font-semibold uppercase tracking-wide text-amber-300">
                                  Internal Note
                                </span>

                                <span className="ml-auto text-[11px] text-slate-500">
                                  {formatDate(message.createdAt)}
                                </span>
                              </div>

                              <p className="whitespace-pre-wrap text-sm leading-6 text-slate-300">
                                {messageText}
                              </p>
                            </div>
                          ) : (
                            <div
                              className={`rounded-2xl border p-4 ${
                                isCustomer
                                  ? "border-slate-800 bg-slate-950/60"
                                  : "border-blue-500/20 bg-blue-500/5"
                              }`}
                            >
                              <div className="mb-3 flex items-center gap-2">
                                <div
                                  className={`flex h-8 w-8 items-center justify-center overflow-hidden rounded-xl ${
                                    isCustomer
                                      ? "bg-slate-800 text-slate-300"
                                      : "bg-blue-500/10 text-blue-400"
                                  }`}
                                >
                                  {message?.sender?.avatar ? (
                                    <img
                                      src={getAvatarUrl(message.sender.avatar)}
                                      alt={senderName}
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    <User size={15} />
                                  )}
                                </div>

                                <div className="min-w-0">
                                  <p className="text-xs font-semibold text-slate-200">
                                    {senderName}
                                  </p>

                                  <p className="text-[11px] text-slate-500">
                                    {formatDate(message.createdAt)}
                                  </p>
                                </div>

                                {message?.isAiGenerated && (
                                  <span className="ml-auto inline-flex items-center gap-1 rounded-full border border-purple-500/20 bg-purple-500/10 px-2 py-1 text-[10px] font-medium text-purple-300">
                                    <Sparkles size={11} />
                                    AI
                                  </span>
                                )}

                                {message?.isOriginalTicket && (
                                  <span className="ml-auto inline-flex items-center gap-1 rounded-full border border-blue-500/20 bg-blue-500/10 px-2 py-1 text-[10px] font-medium text-blue-300">
                                    Original Ticket
                                  </span>
                                )}
                              </div>

                              <p className="whitespace-pre-wrap text-sm leading-6 text-slate-300">
                                {messageText}
                              </p>

                              {messageAttachments.length > 0 && (
                                <div className="mt-4 flex flex-wrap gap-2">
                                  {messageAttachments.map((file, fileIndex) =>
                                    renderAttachment(file, fileIndex, true),
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {customerTyping && (
                    <div className="flex justify-start">
                      <div className="rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="h-2 w-2 animate-bounce rounded-full bg-slate-500" />
                          <span className="h-2 w-2 animate-bounce rounded-full bg-slate-500 [animation-delay:120ms]" />
                          <span className="h-2 w-2 animate-bounce rounded-full bg-slate-500 [animation-delay:240ms]" />
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={conversationEndRef} />
                </div>
              )}
            </div>

            {/* ================================================= */}
            {/* COMPOSER */}
            {/* ================================================= */}

            <div className="border-t border-slate-800 p-4 sm:p-6">
              {/* COMPOSER TABS */}

              <div className="mb-4 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setComposerMode("reply")}
                  className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition ${
                    composerMode === "reply"
                      ? "bg-blue-500/10 text-blue-300 ring-1 ring-blue-500/20"
                      : "text-slate-500 hover:bg-slate-800/60 hover:text-slate-300"
                  }`}
                >
                  <Send size={15} />
                  Reply to Customer
                </button>

                <button
                  type="button"
                  onClick={() => setComposerMode("internal")}
                  className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition ${
                    composerMode === "internal"
                      ? "bg-amber-500/10 text-amber-300 ring-1 ring-amber-500/20"
                      : "text-slate-500 hover:bg-slate-800/60 hover:text-slate-300"
                  }`}
                >
                  <ShieldAlert size={15} />
                  Internal Note
                </button>

                {/* KNOWLEDGE BASE BUTTON */}

                <button
                  type="button"
                  onClick={() => setKnowledgeBaseOpen((previous) => !previous)}
                  className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition ${
                    knowledgeBaseOpen
                      ? "bg-purple-500/10 text-purple-300 ring-1 ring-purple-500/20"
                      : "text-slate-500 hover:bg-slate-800/60 hover:text-slate-300"
                  }`}
                >
                  <BookOpen size={15} />
                  Knowledge Base
                  {knowledgeBaseOpen ? (
                    <ChevronUp size={14} />
                  ) : (
                    <ChevronDown size={14} />
                  )}
                </button>
              </div>

              {/* ================================================= */}
              {/* KNOWLEDGE BASE PANEL */}
              {/* ================================================= */}

              {knowledgeBaseOpen && (
                <div className="mb-5 overflow-hidden rounded-2xl border border-purple-500/20 bg-[#080d1c]">
                  {/* KB HEADER */}

                  <div className="border-b border-slate-800 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400">
                            <BookOpen size={16} />
                          </div>

                          <div>
                            <h3 className="text-sm font-semibold text-white">
                              Knowledge Base
                            </h3>

                            <p className="text-[11px] text-slate-500">
                              Find solutions while replying
                            </p>
                          </div>
                        </div>
                      </div>

                      <span className="text-xs text-slate-500">
                        {knowledgeResults.length}{" "}
                        {knowledgeResults.length === 1 ? "article" : "articles"}
                      </span>
                    </div>

                    {/* SEARCH */}

                    <div className="relative mt-4">
                      <Search
                        size={17}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                      />

                      <input
                        type="text"
                        value={knowledgeSearch}
                        onChange={(event) =>
                          setKnowledgeSearch(event.target.value)
                        }
                        placeholder="Search solutions, passwords, login, tickets..."
                        className="h-11 w-full rounded-xl border border-slate-800 bg-slate-950 pl-10 pr-10 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-purple-500/40"
                      />

                      {knowledgeSearch && (
                        <button
                          type="button"
                          onClick={() => setKnowledgeSearch("")}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 transition hover:text-slate-300"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* KB RESULTS */}

                  <div className="max-h-[420px] overflow-y-auto p-3">
                    {knowledgeResults.length === 0 ? (
                      <div className="px-4 py-10 text-center">
                        <Search
                          size={30}
                          className="mx-auto mb-3 text-slate-700"
                        />

                        <p className="text-sm font-medium text-slate-400">
                          No solutions found
                        </p>

                        <p className="mt-1 text-xs text-slate-600">
                          Try searching with different keywords.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {knowledgeResults.map((article) => {
                          const isExpanded = expandedArticle === article.id;

                          return (
                            <div
                              key={article.id}
                              className={`overflow-hidden rounded-xl border transition ${
                                isExpanded
                                  ? "border-purple-500/30 bg-purple-500/[0.03]"
                                  : "border-slate-800 bg-slate-950/40 hover:border-slate-700"
                              }`}
                            >
                              {/* ARTICLE HEADER */}

                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedArticle(
                                    isExpanded ? null : article.id,
                                  )
                                }
                                className="flex w-full items-start gap-3 p-4 text-left"
                              >
                                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400">
                                  <FileText size={15} />
                                </div>

                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <h4 className="text-sm font-medium text-slate-200">
                                      {article.title}
                                    </h4>

                                    <span className="rounded-full border border-slate-800 bg-slate-900 px-2 py-0.5 text-[10px] text-slate-500">
                                      {article.category}
                                    </span>
                                  </div>

                                  {!isExpanded && (
                                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                                      {article.content}
                                    </p>
                                  )}
                                </div>

                                {isExpanded ? (
                                  <ChevronUp
                                    size={16}
                                    className="mt-1 shrink-0 text-slate-500"
                                  />
                                ) : (
                                  <ChevronDown
                                    size={16}
                                    className="mt-1 shrink-0 text-slate-500"
                                  />
                                )}
                              </button>

                              {/* ARTICLE DETAILS */}

                              {isExpanded && (
                                <div className="border-t border-slate-800 px-4 pb-4">
                                  <div className="rounded-xl bg-slate-950/70 p-3">
                                    <p className="text-xs font-medium uppercase tracking-wide text-slate-600">
                                      Article
                                    </p>

                                    <p className="mt-2 text-sm leading-6 text-slate-400">
                                      {article.content}
                                    </p>
                                  </div>

                                  <div className="mt-3 rounded-xl border border-purple-500/10 bg-purple-500/[0.04] p-3">
                                    <div className="flex items-center gap-2">
                                      <Sparkles
                                        size={14}
                                        className="text-purple-400"
                                      />

                                      <p className="text-xs font-medium uppercase tracking-wide text-purple-300">
                                        Suggested Solution
                                      </p>
                                    </div>

                                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-300">
                                      {article.solution}
                                    </p>
                                  </div>

                                  {/* ACTIONS */}

                                  <div className="mt-3 flex flex-wrap gap-2">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        insertKnowledgeSolution(article)
                                      }
                                      disabled={!canReply}
                                      className="inline-flex items-center gap-2 rounded-xl bg-purple-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-purple-400 disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                      <ArrowRight size={14} />
                                      Insert Solution
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        copyKnowledgeSolution(article)
                                      }
                                      className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-slate-700 hover:text-white"
                                    >
                                      <Copy size={14} />
                                      Copy
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ================================================= */}
              {/* REPLY MODE */}
              {/* ================================================= */}

              {composerMode === "reply" && (
                <div>
                  {!canReply ? (
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 text-center">
                      <CheckCircle2
                        size={30}
                        className="mx-auto mb-2 text-emerald-400"
                      />

                      <p className="text-sm font-medium text-slate-300">
                        This ticket is closed.
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Reopen the ticket before sending a new reply.
                      </p>
                    </div>
                  ) : (
                    <>
                      <textarea
                        value={reply}
                        onChange={(event) => setReply(event.target.value)}
                        placeholder="Write your reply to the customer..."
                        rows={6}
                        className="w-full resize-y rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-sm leading-6 text-slate-200 outline-none placeholder:text-slate-600 focus:border-blue-500/40"
                      />

                      {/* SELECTED FILES */}

                      {selectedFiles.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {selectedFiles.map((file, index) => (
                            <div
                              key={`${file.name}-${file.lastModified}-${index}`}
                              className="flex max-w-full items-center gap-2 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2"
                            >
                              <Paperclip
                                size={14}
                                className="shrink-0 text-slate-500"
                              />

                              <span className="max-w-[180px] truncate text-xs text-slate-300">
                                {file.name}
                              </span>

                              <button
                                type="button"
                                onClick={() => removeSelectedFile(index)}
                                className="text-slate-600 transition hover:text-red-400"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* COMPOSER FOOTER */}

                      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-2">
                          <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept="image/*,.pdf,.doc,.docx,.txt"
                            onChange={handleFileSelection}
                            className="hidden"
                          />

                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={selectedFiles.length >= 5}
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2.5 text-xs font-medium text-slate-400 transition hover:border-slate-700 hover:text-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Paperclip size={15} />
                            Attach
                          </button>

                          <span className="text-[11px] text-slate-600">
                            {selectedFiles.length}/5 files
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={handleSendReply}
                          disabled={
                            sendingReply ||
                            (!reply.trim() && selectedFiles.length === 0)
                          }
                          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {sendingReply ? (
                            <>
                              <Loader2 size={16} className="animate-spin" />
                              Sending...
                            </>
                          ) : (
                            <>
                              <Send size={16} />
                              Send Reply
                            </>
                          )}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* ================================================= */}
              {/* INTERNAL NOTE MODE */}
              {/* ================================================= */}

              {composerMode === "internal" && (
                <div>
                  <div className="mb-3 rounded-xl border border-amber-500/10 bg-amber-500/[0.03] px-3 py-2.5">
                    <div className="flex items-center gap-2 text-xs text-amber-300">
                      <ShieldAlert size={14} />
                      Internal notes are visible to support staff only.
                    </div>
                  </div>

                  <textarea
                    value={internalNote}
                    onChange={(event) => {
                      setInternalNote(event.target.value);
                      setInternalNoteError("");
                    }}
                    placeholder="Write an internal note for other agents..."
                    rows={6}
                    maxLength={10000}
                    className="w-full resize-y rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-sm leading-6 text-slate-200 outline-none placeholder:text-slate-600 focus:border-amber-500/40"
                  />

                  {internalNoteError && (
                    <p className="mt-2 flex items-center gap-1.5 text-xs text-red-400">
                      <AlertCircle size={13} />
                      {internalNoteError}
                    </p>
                  )}

                  <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-[11px] text-slate-600">
                      {internalNote.length}/10,000 characters
                    </span>

                    <button
                      type="button"
                      onClick={handleAddInternalNote}
                      disabled={isAddingInternalNote || !internalNote.trim()}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {isAddingInternalNote ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Adding...
                        </>
                      ) : (
                        <>
                          <ShieldAlert size={16} />
                          Add Internal Note
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* ================================================= */}
          {/* RIGHT SIDEBAR */}
          {/* ================================================= */}

          <aside className="space-y-5">
            {/* CUSTOMER */}

            <section className="rounded-3xl border border-slate-800 bg-slate-900/40 p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">Customer</h3>

                <User size={16} className="text-slate-600" />
              </div>

              <button
                type="button"
                onClick={() => {
                  const customerId = getId(ticketCustomer);

                  if (customerId) {
                    navigate(`/agent/customers/${customerId}`);
                  }
                }}
                className="flex w-full items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950/40 p-3 text-left transition hover:border-blue-500/30"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-blue-500/10 text-blue-400">
                  {ticketCustomer.avatar ? (
                    <img
                      src={getAvatarUrl(ticketCustomer.avatar)}
                      alt={ticketCustomer.name || "Customer"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User size={20} />
                  )}
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-200">
                    {ticketCustomer.name ||
                      ticketCustomer.username ||
                      "Customer"}
                  </p>

                  <p className="truncate text-xs text-slate-500">
                    {ticketCustomer.email || "No email available"}
                  </p>
                </div>
              </button>

              {ticketCustomer.phone && (
                <div className="mt-3 text-xs text-slate-500">
                  <span className="text-slate-600">Phone:</span>{" "}
                  {ticketCustomer.phone}
                </div>
              )}
            </section>

            {/* ASSIGNMENT */}

            <section className="rounded-3xl border border-slate-800 bg-slate-900/40 p-5">
              <div className="mb-4 flex items-center gap-2">
                <UserCheck size={17} className="text-blue-400" />

                <h3 className="text-sm font-semibold text-white">Assignment</h3>
              </div>

              {isUnassigned ? (
                <>
                  <div className="rounded-2xl border border-blue-500/10 bg-blue-500/[0.03] p-3">
                    <p className="text-sm font-medium text-slate-300">
                      Ticket is unassigned
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Opening this ticket does not assign it. Claim it only when
                      you are ready to work on it.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleAssignToMe}
                    disabled={assigning}
                    className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {assigning ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Assigning...
                      </>
                    ) : (
                      <>
                        <UserCheck size={16} />
                        Assign to Me
                      </>
                    )}
                  </button>
                </>
              ) : isAssignedToCurrentUser ? (
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={17} className="text-emerald-400" />

                    <p className="text-sm font-medium text-emerald-300">
                      Assigned to you
                    </p>
                  </div>

                  <p className="mt-1 text-xs text-slate-500">
                    You are currently responsible for this ticket.
                  </p>
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-3">
                  <p className="text-sm font-medium text-slate-300">
                    {getSenderName(
                      {
                        sender: assignedAgent,
                      },
                      "Another agent",
                    )}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    This ticket is assigned to another agent.
                  </p>
                </div>
              )}

              {assignError && (
                <p className="mt-2 text-xs text-red-400">{assignError}</p>
              )}
            </section>

            {/* SLA TRACKING */}

            <section className="rounded-3xl border border-slate-800 bg-slate-900/40 p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock3 size={17} className="text-blue-400" />

                  <h3 className="text-sm font-semibold text-white">
                    SLA Tracking
                  </h3>
                </div>

                <span className="text-[10px] uppercase tracking-wider text-slate-600">
                  Service Level
                </span>
              </div>

              <div className="space-y-3">
                {/* RESPONSE SLA */}

                <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-medium text-slate-400">
                        First Response
                      </p>

                      <p className="mt-1 text-[11px] text-slate-600">
                        Human agent response
                      </p>
                    </div>

                    {(() => {
                      const classes = getSlaStatusClasses(responseSlaStatus);

                      return (
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[10px] font-medium ${classes.badge}`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${classes.dot}`}
                          />

                          {formatSlaStatus(responseSlaStatus)}
                        </span>
                      );
                    })()}
                  </div>

                  {/* Due */}

                  {responseDueAt && (
                    <div className="mt-3 border-t border-slate-800 pt-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-slate-600">Due</span>

                        <span className="text-[11px] text-slate-400">
                          {formatDate(responseDueAt)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Remaining */}

                  {!firstRespondedAt && responseRemaining && (
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[11px] text-slate-600">Time</span>

                      <span
                        className={`text-[11px] font-medium ${
                          responseSlaStatus === "breached"
                            ? "text-red-400"
                            : "text-yellow-300"
                        }`}
                      >
                        {responseRemaining}
                      </span>
                    </div>
                  )}

                  {/* Responded */}

                  {firstRespondedAt && (
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[11px] text-slate-600">
                        Responded
                      </span>

                      <span className="text-[11px] text-emerald-400">
                        {formatDate(firstRespondedAt)}
                      </span>
                    </div>
                  )}
                </div>

                {/* RESOLUTION SLA */}

                <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-medium text-slate-400">
                        Resolution
                      </p>

                      <p className="mt-1 text-[11px] text-slate-600">
                        Ticket resolution target
                      </p>
                    </div>

                    {(() => {
                      const classes = getSlaStatusClasses(resolutionSlaStatus);

                      return (
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[10px] font-medium ${classes.badge}`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${classes.dot}`}
                          />

                          {formatSlaStatus(resolutionSlaStatus)}
                        </span>
                      );
                    })()}
                  </div>

                  {/* Due */}

                  {resolutionDueAt && (
                    <div className="mt-3 border-t border-slate-800 pt-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-slate-600">Due</span>

                        <span className="text-[11px] text-slate-400">
                          {formatDate(resolutionDueAt)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Remaining */}

                  {!resolvedAt && resolutionRemaining && (
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[11px] text-slate-600">Time</span>

                      <span
                        className={`text-[11px] font-medium ${
                          resolutionSlaStatus === "breached"
                            ? "text-red-400"
                            : "text-yellow-300"
                        }`}
                      >
                        {resolutionRemaining}
                      </span>
                    </div>
                  )}

                  {/* Resolved */}

                  {resolvedAt && (
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[11px] text-slate-600">
                        Resolved
                      </span>

                      <span className="text-[11px] text-emerald-400">
                        {formatDate(resolvedAt)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* ESCALATION */}

            <section className="rounded-3xl border border-slate-800 bg-slate-900/40 p-5">
              <div className="mb-4 flex items-center gap-2">
                <ShieldAlert size={17} className="text-red-400" />

                <h3 className="text-sm font-semibold text-white">Escalation</h3>
              </div>

              {isEscalated ? (
                <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-3">
                  <div className="flex items-center gap-2">
                    <ShieldAlert size={16} className="text-red-400" />

                    <p className="text-sm font-medium text-red-300">
                      Escalated
                    </p>
                  </div>

                  {ticket.escalation.reason && (
                    <p className="mt-2 text-xs leading-5 text-slate-400">
                      <span className="text-slate-600">Reason:</span>{" "}
                      {ticket.escalation.reason}
                    </p>
                  )}

                  {ticket.escalation.note && (
                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      {ticket.escalation.note}
                    </p>
                  )}
                </div>
              ) : canEscalate ? (
                <>
                  <p className="text-xs leading-5 text-slate-500">
                    Escalate this ticket when it requires additional expertise
                    or higher-level support.
                  </p>

                  <button
                    type="button"
                    onClick={() => setShowEscalateModal(true)}
                    className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-2.5 text-sm font-medium text-red-300 transition hover:bg-red-500/10"
                  >
                    <ShieldAlert size={16} />
                    Escalate Ticket
                  </button>
                </>
              ) : (
                <p className="text-xs leading-5 text-slate-600">
                  This ticket cannot currently be escalated.
                </p>
              )}
            </section>

            {/* ORIGINAL REQUEST */}

            <section className="rounded-3xl border border-slate-800 bg-slate-900/40 p-5">
              <div className="mb-4 flex items-center gap-2">
                <FileText size={17} className="text-blue-400" />

                <h3 className="text-sm font-semibold text-white">
                  Original Request
                </h3>
              </div>

              <p className="whitespace-pre-wrap text-sm leading-6 text-slate-400">
                {ticket.description || "No description provided."}
              </p>

              {ticket.attachments?.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-600">
                    Attachments
                  </p>

                  {ticket.attachments.map((file, index) =>
                    renderAttachment(file, index, true),
                  )}
                </div>
              )}
            </section>

            {/* STATUS HISTORY */}

            <section className="rounded-3xl border border-slate-800 bg-slate-900/40 p-5">
              <div className="mb-4 flex items-center gap-2">
                <Clock3 size={17} className="text-slate-400" />

                <h3 className="text-sm font-semibold text-white">
                  Status History
                </h3>
              </div>

              {ticket.statusHistory?.length ? (
                <div className="space-y-4">
                  {ticket.statusHistory
                    .slice()
                    .reverse()
                    .map((item, index) => (
                      <div
                        key={item?._id || item?.id || `history-${index}`}
                        className="relative pl-5"
                      >
                        {index !== ticket.statusHistory.length - 1 && (
                          <span className="absolute left-[5px] top-3 h-full w-px bg-slate-800" />
                        )}

                        <span className="absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full bg-slate-700 ring-4 ring-slate-900" />

                        <p className="text-xs font-medium text-slate-300">
                          {formatStatus(
                            item.status || item.newStatus || item.toStatus,
                          )}
                        </p>

                        <p className="mt-1 text-[11px] text-slate-600">
                          {formatDate(item.createdAt || item.timestamp)}
                        </p>

                        {item.changedBy && (
                          <p className="mt-1 text-[11px] text-slate-500">
                            by{" "}
                            {getSenderName(
                              {
                                sender: item.changedBy,
                              },
                              "Support",
                            )}
                          </p>
                        )}
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-xs text-slate-600">
                  No status history available.
                </p>
              )}
            </section>

            {/* RESOLUTION */}

            {(isResolved || isClosed) &&
              (ticket.resolution || ticket.resolutionNote) && (
                <section className="rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <CheckCircle2 size={17} className="text-emerald-400" />

                    <h3 className="text-sm font-semibold text-emerald-300">
                      Resolution
                    </h3>
                  </div>

                  <p className="whitespace-pre-wrap text-sm leading-6 text-slate-400">
                    {ticket.resolution || ticket.resolutionNote}
                  </p>
                </section>
              )}
          </aside>
        </div>
      </div>

      {/* ==================================================== */}
      {/* IMAGE PREVIEW MODAL */}
      {/* ==================================================== */}

      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-h-[90vh] max-w-[95vw]"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              className="absolute -right-3 -top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-slate-300 shadow-xl transition hover:text-white"
            >
              <X size={17} />
            </button>

            <img
              src={previewImage}
              alt="Attachment preview"
              className="max-h-[90vh] max-w-[95vw] rounded-2xl object-contain shadow-2xl"
            />
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* ESCALATION MODAL */}
      {/* ==================================================== */}

      {showEscalateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-[#080d1c] shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 p-5">
              <div>
                <h3 className="text-lg font-semibold text-white">
                  Escalate Ticket
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  Send this ticket for additional support.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!escalating) {
                    setShowEscalateModal(false);
                    setEscalationError("");
                  }
                }}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-800 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 p-5">
              {escalationError && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-xs text-red-300">
                  {escalationError}
                </div>
              )}

              <div>
                <label className="mb-2 block text-xs font-medium text-slate-400">
                  Escalation Reason
                </label>

                <select
                  value={escalationReason}
                  onChange={(event) => {
                    setEscalationReason(event.target.value);
                    setEscalationError("");
                  }}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-3 text-sm text-slate-200 outline-none focus:border-red-500/40"
                >
                  <option value="">Select a reason</option>

                  <option value="Requires technical expertise">
                    Requires technical expertise
                  </option>

                  <option value="High customer impact">
                    High customer impact
                  </option>

                  <option value="Unable to resolve">Unable to resolve</option>

                  <option value="Service outage">Service outage</option>

                  <option value="Management review required">
                    Management review required
                  </option>

                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium text-slate-400">
                  Additional Note
                </label>

                <textarea
                  value={escalationNote}
                  onChange={(event) => {
                    setEscalationNote(event.target.value);
                    setEscalationError("");
                  }}
                  rows={5}
                  maxLength={5000}
                  placeholder="Explain why this ticket needs escalation..."
                  className="w-full resize-none rounded-xl border border-slate-800 bg-slate-950 px-3 py-3 text-sm leading-6 text-slate-200 outline-none placeholder:text-slate-600 focus:border-red-500/40"
                />

                <div className="mt-1 text-right text-[11px] text-slate-600">
                  {escalationNote.length}/5,000
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-slate-800 p-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  if (!escalating) {
                    setShowEscalateModal(false);
                    setEscalationError("");
                  }
                }}
                disabled={escalating}
                className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:border-slate-700 hover:text-white disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleEscalate}
                disabled={escalating}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {escalating ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Escalating...
                  </>
                ) : (
                  <>
                    <ShieldAlert size={16} />
                    Escalate Ticket
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentTicketDetails;
