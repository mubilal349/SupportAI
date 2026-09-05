import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock3,
  Download,
  File,
  FileText,
  Image as ImageIcon,
  Loader2,
  MessageSquare,
  Paperclip,
  RefreshCw,
  Send,
  User,
  UserCheck,
  X,
  ChevronDown,
} from "lucide-react";

import { io } from "socket.io-client";

import { useNavigate, useParams } from "react-router-dom";

import {
  assignTicketToMe,
  getAgentTicketById,
  sendAgentReply,
  updateAgentTicketPriority,
  updateAgentTicketStatus,
} from "../../../services/agentService";

import { useAuth } from "../../../context/AuthContext";

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000/api";

const SERVER_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, "");

const SOCKET_BASE_URL = SERVER_BASE_URL;

const getId = (value) => {
  if (!value) return null;

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "object") {
    return value._id || value.id || value.userId || null;
  }

  return null;
};

const getAvatarUrl = (avatar) => {
  if (!avatar) return "";

  if (/^(https?:\/\/|data:|blob:)/i.test(avatar)) {
    return avatar;
  }

  return `${SERVER_BASE_URL}/${String(avatar).replace(/^\/+/, "")}`;
};

const getFileUrl = (file) => {
  if (!file) return "";

  const filePath =
    file.path || file.url || file.filePath || file.filename || "";

  if (!filePath) return "";

  if (/^(https?:\/\/|blob:|data:)/i.test(filePath)) {
    return filePath;
  }

  return `${SERVER_BASE_URL}/${String(filePath).replace(/^\/+/, "")}`;
};

const formatDate = (date) => {
  if (!date) return "";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return parsed.toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const formatFileSize = (bytes) => {
  if (!bytes || Number(bytes) <= 0) {
    return "";
  }

  const size = Number(bytes);

  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const getPriorityClasses = (priority) => {
  switch (String(priority || "").toLowerCase()) {
    case "high":
      return "border-red-500/30 bg-red-500/10 text-red-400";

    case "low":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-400";

    default:
      return "border-amber-500/30 bg-amber-500/10 text-amber-400";
  }
};

const getStatusClasses = (status) => {
  switch (String(status || "").toLowerCase()) {
    case "open":
      return "border-blue-500/30 bg-blue-500/10 text-blue-400";

    case "in-progress":
      return "border-violet-500/30 bg-violet-500/10 text-violet-400";

    case "waiting":
      return "border-amber-500/30 bg-amber-500/10 text-amber-400";

    case "resolved":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-400";

    case "closed":
      return "border-slate-600/80 bg-slate-800/80 text-slate-300";

    default:
      return "border-slate-700 bg-slate-800 text-slate-300";
  }
};

const formatStatus = (status) => {
  if (!status) return "Unknown";

  return String(status)
    .replace(/-/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const getSenderName = (message, ticket) => {
  if (message?.sender?.name) {
    return message.sender.name;
  }

  if (message?.senderName) {
    return message.senderName;
  }

  if (String(message?.senderRole || "").toLowerCase() === "customer") {
    return ticket?.customer?.name || "Customer";
  }

  if (String(message?.senderRole || "").toLowerCase() === "agent") {
    return "Agent";
  }

  if (String(message?.senderRole || "").toLowerCase() === "admin") {
    return "Admin";
  }

  if (String(message?.senderRole || "").toLowerCase() === "ai") {
    return "AI Assistant";
  }

  return "Support";
};

const isImageFile = (file) => {
  const mime = String(file?.mimetype || "").toLowerCase();

  if (mime.startsWith("image/")) {
    return true;
  }

  const name = String(
    file?.originalName || file?.filename || file?.name || "",
  ).toLowerCase();

  return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(name);
};

const isPdfFile = (file) => {
  const mime = String(file?.mimetype || "").toLowerCase();

  if (mime === "application/pdf") {
    return true;
  }

  const name = String(
    file?.originalName || file?.filename || file?.name || "",
  ).toLowerCase();

  return name.endsWith(".pdf");
};

/*
|--------------------------------------------------------------------------
| Component
|--------------------------------------------------------------------------
*/

const AgentTicketDetails = () => {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [ticket, setTicket] = useState(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [reply, setReply] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);

  const [sendingReply, setSendingReply] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updatingPriority, setUpdatingPriority] = useState(false);

  const [previewImage, setPreviewImage] = useState(null);

  /*
  |--------------------------------------------------------------------------
  | Customer Typing Indicator
  |--------------------------------------------------------------------------
  */

  const [customerTyping, setCustomerTyping] = useState(false);

  const socketRef = useRef(null);

  const fileInputRef = useRef(null);
  const conversationEndRef = useRef(null);

  /*
  |--------------------------------------------------------------------------
  | Load ticket
  |--------------------------------------------------------------------------
  */

  const loadTicket = useCallback(
    async (showLoader = true) => {
      if (!ticketId) {
        setError("Ticket ID is missing.");
        setLoading(false);
        return;
      }

      try {
        if (showLoader) {
          setLoading(true);
        } else {
          setRefreshing(true);
        }

        setError("");

        const response = await getAgentTicketById(ticketId);

        /*
         * Support all common API response structures:
         *
         * { ticket: {...} }
         * { data: {...} }
         * { data: { ticket: {...} } }
         * direct ticket object
         */

        const rawTicket =
          response?.ticket ||
          response?.data?.ticket ||
          response?.data ||
          response;

        if (!rawTicket) {
          throw new Error("Ticket data was not returned by the server.");
        }

        const normalizedTicket = {
          ...rawTicket,

          id: rawTicket.id || rawTicket._id || ticketId,

          _id: rawTicket._id || rawTicket.id || ticketId,

          conversation: Array.isArray(rawTicket.conversation)
            ? rawTicket.conversation
            : [],

          attachments: Array.isArray(rawTicket.attachments)
            ? rawTicket.attachments
            : [],

          statusHistory: Array.isArray(rawTicket.statusHistory)
            ? rawTicket.statusHistory
            : [],
        };

        console.log("========================================");
        console.log("AGENT TICKET LOADED");
        console.log("TICKET:", normalizedTicket);
        console.log("DESCRIPTION:", normalizedTicket.description);
        console.log("CONVERSATION:", normalizedTicket.conversation);
        console.log("ATTACHMENTS:", normalizedTicket.attachments);
        console.log("========================================");

        setTicket(normalizedTicket);
      } catch (err) {
        console.error("LOAD AGENT TICKET ERROR:", err);

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
  |--------------------------------------------------------------------------
  | Customer Typing Socket
  |--------------------------------------------------------------------------
  |
  | Agent joins the current ticket room and listens for:
  |
  | ticket:typing
  |
  | Backend sends:
  |
  | {
  |   ticketId,
  |   userId,
  |   role: "customer",
  |   isTyping: true/false
  | }
  |
  */

  useEffect(() => {
    if (!ticketId) {
      return;
    }

    const token = localStorage.getItem("supportai_token");

    if (!token) {
      console.warn("AGENT TYPING SOCKET: No supportai_token found.");
      return;
    }

    let socket;

    try {
      socket = io(SOCKET_BASE_URL, {
        auth: {
          token,
        },
        transports: ["websocket", "polling"],
      });

      socketRef.current = socket;

      const handleConnect = () => {
        console.log("AGENT TYPING SOCKET CONNECTED:", socket.id);

        /*
         * Join this ticket's room.
         *
         * Backend:
         * ticket:join
         */
        socket.emit("ticket:join", {
          ticketId,
        });
      };

      const handleJoined = (data) => {
        console.log("AGENT JOINED TICKET ROOM:", data);
      };

      const handleCustomerTyping = (data) => {
        /*
         * Make sure the event belongs to this ticket.
         */
        if (String(data?.ticketId || "") !== String(ticketId)) {
          return;
        }

        /*
         * We only want the CUSTOMER typing indicator.
         *
         * Ignore agent/admin typing events.
         */
        const role = String(data?.role || "").toLowerCase();

        if (role !== "customer") {
          return;
        }

        console.log("CUSTOMER TYPING:", data?.isTyping);

        setCustomerTyping(Boolean(data?.isTyping));
      };

      const handleSocketError = (data) => {
        console.warn("AGENT TYPING SOCKET ERROR:", data);
      };

      socket.on("connect", handleConnect);

      socket.on("ticket:joined", handleJoined);

      socket.on("ticket:typing", handleCustomerTyping);

      socket.on("ticket:error", handleSocketError);

      /*
       * If the socket connects immediately,
       * join the ticket room.
       */
      if (socket.connected) {
        handleConnect();
      }

      return () => {
        console.log("LEAVING AGENT TICKET SOCKET:", ticketId);

        /*
         * Stop showing typing indicator.
         */
        setCustomerTyping(false);

        /*
         * Leave ticket room.
         */
        if (socket.connected) {
          socket.emit("ticket:leave", {
            ticketId,
          });
        }

        /*
         * Remove listeners.
         */
        socket.off("connect", handleConnect);

        socket.off("ticket:joined", handleJoined);

        socket.off("ticket:typing", handleCustomerTyping);

        socket.off("ticket:error", handleSocketError);

        /*
         * Disconnect this page's socket.
         */
        socket.disconnect();

        if (socketRef.current === socket) {
          socketRef.current = null;
        }
      };
    } catch (socketError) {
      console.error("AGENT TYPING SOCKET INITIALIZATION ERROR:", socketError);

      setCustomerTyping(false);
    }
  }, [ticketId]);

  /*
  |--------------------------------------------------------------------------
  | Build conversation with original customer ticket message
  |--------------------------------------------------------------------------
  */

  const conversation = useMemo(() => {
    if (!ticket) {
      return [];
    }

    const existingConversation = Array.isArray(ticket.conversation)
      ? ticket.conversation
      : [];

    /*
     * The original customer issue is normally stored in:
     *
     * ticket.description
     *
     * It may NOT exist inside:
     *
     * ticket.conversation
     *
     * Therefore we create a frontend-only initial message.
     */

    const description = String(
      ticket.description || ticket.initialMessage || ticket.message || "",
    ).trim();

    console.log("CONVERSATION BUILDER - DESCRIPTION:", description);

    console.log("CONVERSATION BUILDER - EXISTING:", existingConversation);

    /*
     * If there is no description, simply use the existing
     * conversation.
     */

    if (!description) {
      return existingConversation;
    }

    /*
     * Check whether backend already saved the original
     * description as a customer message.
     *
     * This prevents duplicate messages.
     */

    const originalAlreadyExists = existingConversation.some((message) => {
      const messageText = String(message?.message || "").trim();

      const senderRole = String(
        message?.senderRole || message?.sender?.role || "",
      ).toLowerCase();

      return messageText === description && senderRole === "customer";
    });

    if (originalAlreadyExists) {
      return existingConversation;
    }

    /*
     * Create the original customer message.
     */

    const originalTicketMessage = {
      _id: `initial-ticket-${ticket.id || ticket._id}`,

      id: `initial-ticket-${ticket.id || ticket._id}`,

      sender: ticket.customer || {
        name: "Customer",
      },

      senderRole: "customer",

      message: description,

      attachments: Array.isArray(ticket.attachments) ? ticket.attachments : [],

      createdAt:
        ticket.createdAt || ticket.updatedAt || new Date().toISOString(),

      isRead: true,

      isInitialTicketMessage: true,
    };

    /*
     * IMPORTANT:
     * Original ticket message goes FIRST.
     */

    return [originalTicketMessage, ...existingConversation];
  }, [ticket]);

  /*
  |--------------------------------------------------------------------------
  | Scroll to latest message
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!conversation.length) {
      return;
    }

    const timer = setTimeout(() => {
      conversationEndRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }, 100);

    return () => clearTimeout(timer);
  }, [conversation.length]);

  /*
  |--------------------------------------------------------------------------
  | File selection
  |--------------------------------------------------------------------------
  */

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files || []);

    if (!files.length) {
      return;
    }

    const availableSlots = Math.max(0, 5 - selectedFiles.length);

    const filesToAdd = files.slice(0, availableSlots);

    setSelectedFiles((previous) => [...previous, ...filesToAdd]);

    event.target.value = "";
  };

  const removeSelectedFile = (index) => {
    setSelectedFiles((previous) =>
      previous.filter((_, fileIndex) => fileIndex !== index),
    );
  };

  /*
  |--------------------------------------------------------------------------
  | Assign ticket
  |--------------------------------------------------------------------------
  */

  const handleAssignToMe = async () => {
    if (!ticket?.id && !ticket?._id) {
      return;
    }

    try {
      setAssigning(true);
      setError("");
      setSuccess("");

      const id = ticket.id || ticket._id;

      const response = await assignTicketToMe(id);

      const updatedTicket =
        response?.ticket || response?.data?.ticket || response?.data || null;

      if (updatedTicket) {
        setTicket((previous) => ({
          ...previous,
          ...updatedTicket,

          id: updatedTicket.id || updatedTicket._id || previous.id,

          _id: updatedTicket._id || updatedTicket.id || previous._id,

          conversation: Array.isArray(updatedTicket.conversation)
            ? updatedTicket.conversation
            : previous.conversation || [],

          attachments: Array.isArray(updatedTicket.attachments)
            ? updatedTicket.attachments
            : previous.attachments || [],

          statusHistory: Array.isArray(updatedTicket.statusHistory)
            ? updatedTicket.statusHistory
            : previous.statusHistory || [],
        }));
      } else {
        await loadTicket(false);
      }

      setSuccess("Ticket assigned to you successfully.");
    } catch (err) {
      console.error("ASSIGN TICKET ERROR:", err);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to assign ticket.",
      );
    } finally {
      setAssigning(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Status
  |--------------------------------------------------------------------------
  */

  const handleStatusChange = async (event) => {
    const newStatus = event.target.value;

    if (!newStatus || !ticket) {
      return;
    }

    const id = ticket.id || ticket._id;

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

          conversation: Array.isArray(updatedTicket.conversation)
            ? updatedTicket.conversation
            : previous.conversation || [],

          attachments: Array.isArray(updatedTicket.attachments)
            ? updatedTicket.attachments
            : previous.attachments || [],

          statusHistory: Array.isArray(updatedTicket.statusHistory)
            ? updatedTicket.statusHistory
            : previous.statusHistory || [],
        }));
      } else {
        setTicket((previous) => ({
          ...previous,
          status: newStatus,
        }));
      }

      setSuccess("Ticket status updated.");
    } catch (err) {
      console.error("UPDATE STATUS ERROR:", err);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to update ticket status.",
      );
    } finally {
      setUpdatingStatus(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Priority
  |--------------------------------------------------------------------------
  */

  const handlePriorityChange = async (event) => {
    const newPriority = event.target.value;

    if (!newPriority || !ticket) {
      return;
    }

    const id = ticket.id || ticket._id;

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

          conversation: Array.isArray(updatedTicket.conversation)
            ? updatedTicket.conversation
            : previous.conversation || [],

          attachments: Array.isArray(updatedTicket.attachments)
            ? updatedTicket.attachments
            : previous.attachments || [],

          statusHistory: Array.isArray(updatedTicket.statusHistory)
            ? updatedTicket.statusHistory
            : previous.statusHistory || [],
        }));
      } else {
        setTicket((previous) => ({
          ...previous,
          priority: newPriority,
        }));
      }

      setSuccess("Ticket priority updated.");
    } catch (err) {
      console.error("UPDATE PRIORITY ERROR:", err);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to update ticket priority.",
      );
    } finally {
      setUpdatingPriority(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Send reply
  |--------------------------------------------------------------------------
  */

  const handleSendReply = async (event) => {
    event?.preventDefault();

    const message = reply.trim();

    if (!message && selectedFiles.length === 0) {
      setError("Please enter a message or attach a file.");
      return;
    }

    if (!ticket) {
      return;
    }

    const id = ticket.id || ticket._id;

    try {
      setSendingReply(true);
      setError("");
      setSuccess("");

      const response = await sendAgentReply(id, message, selectedFiles);

      const updatedTicket =
        response?.ticket || response?.data?.ticket || response?.data || null;

      if (updatedTicket) {
        setTicket((previous) => ({
          ...previous,
          ...updatedTicket,

          id: updatedTicket.id || updatedTicket._id || previous.id,

          _id: updatedTicket._id || updatedTicket.id || previous._id,

          conversation: Array.isArray(updatedTicket.conversation)
            ? updatedTicket.conversation
            : previous.conversation || [],

          attachments: Array.isArray(updatedTicket.attachments)
            ? updatedTicket.attachments
            : previous.attachments || [],

          statusHistory: Array.isArray(updatedTicket.statusHistory)
            ? updatedTicket.statusHistory
            : previous.statusHistory || [],
        }));
      } else {
        /*
         * If backend doesn't return the complete ticket,
         * refresh it.
         */

        await loadTicket(false);
      }

      setReply("");
      setSelectedFiles([]);

      setSuccess("Reply sent successfully.");

      setTimeout(() => {
        conversationEndRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "end",
        });
      }, 150);
    } catch (err) {
      console.error("SEND AGENT REPLY ERROR:", err);

      setError(
        err?.response?.data?.message || err?.message || "Failed to send reply.",
      );
    } finally {
      setSendingReply(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Refresh
  |--------------------------------------------------------------------------
  */

  const handleRefresh = async () => {
    await loadTicket(false);
  };

  /*
  |--------------------------------------------------------------------------
  | Attachment renderer
  |--------------------------------------------------------------------------
  */

  const renderAttachment = (file, index) => {
    const url = getFileUrl(file);

    const filename =
      file?.originalName ||
      file?.filename ||
      file?.name ||
      `Attachment ${index + 1}`;

    const size = formatFileSize(file?.size);

    if (!url) {
      return (
        <div
          key={`${filename}-${index}`}
          className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-800/70 p-3"
        >
          <File className="h-5 w-5 text-slate-400" />

          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-200">
              {filename}
            </p>

            {size && <p className="text-xs text-slate-500">{size}</p>}
          </div>
        </div>
      );
    }

    if (isImageFile(file)) {
      return (
        <div
          key={`${filename}-${index}`}
          className="overflow-hidden rounded-xl border border-slate-700 bg-slate-950"
        >
          <button
            type="button"
            onClick={() =>
              setPreviewImage({
                url,
                name: filename,
              })
            }
            className="block w-full text-left"
          >
            <img
              src={url}
              alt={filename}
              className="max-h-80 w-full object-contain"
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
            />
          </button>

          <div className="flex items-center justify-between gap-3 border-t border-slate-800 p-3">
            <div className="flex min-w-0 items-center gap-2">
              <ImageIcon className="h-4 w-4 shrink-0 text-blue-400" />

              <span className="truncate text-xs text-slate-300">
                {filename}
              </span>
            </div>

            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="shrink-0 text-xs font-medium text-blue-400 hover:text-blue-300"
            >
              Open
            </a>
          </div>
        </div>
      );
    }

    return (
      <a
        key={`${filename}-${index}`}
        href={url}
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-800/70 p-3 transition hover:border-slate-600 hover:bg-slate-800"
      >
        {isPdfFile(file) ? (
          <FileText className="h-5 w-5 shrink-0 text-red-400" />
        ) : (
          <File className="h-5 w-5 shrink-0 text-blue-400" />
        )}

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-slate-200">
            {filename}
          </p>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            {isPdfFile(file) && <span>PDF</span>}

            {size && <span>{size}</span>}
          </div>
        </div>

        <Download className="h-4 w-4 shrink-0 text-slate-500" />
      </a>
    );
  };

  /*
  |--------------------------------------------------------------------------
  | Loading
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="flex items-center gap-3 text-slate-400">
          <Loader2 className="h-6 w-6 animate-spin" />

          <span>Loading ticket...</span>
        </div>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Error / no ticket
  |--------------------------------------------------------------------------
  */

  if (!ticket) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />

            <div>
              <h2 className="font-semibold text-red-300">
                Unable to load ticket
              </h2>

              <p className="mt-1 text-sm text-red-400">
                {error || "Ticket not found."}
              </p>
            </div>
          </div>

          <div className="mt-5 flex gap-3">
            <button
              type="button"
              onClick={() => loadTicket(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </button>

            <button
              type="button"
              onClick={() => navigate(-1)}
              className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Derived data
  |--------------------------------------------------------------------------
  */

  const ticketCustomer = ticket.customer || {};

  const assignedAgent = ticket.assignedAgent || null;

  const isAssignedToCurrentUser =
    getId(assignedAgent) &&
    getId(user) &&
    String(getId(assignedAgent)) === String(getId(user));

  const isClosed = String(ticket.status || "").toLowerCase() === "closed";

  const isResolved = String(ticket.status || "").toLowerCase() === "resolved";

  const canReply = !isClosed;

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* =========================================================
            HEADER
        ========================================================= */}

        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-300 transition hover:border-slate-700 hover:bg-slate-800 hover:text-white"
              title="Go back"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                  {ticket.subject || "Untitled Ticket"}
                </h1>

                {ticket.ticketNumber && (
                  <span className="rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1 text-xs font-medium text-slate-400">
                    #{ticket.ticketNumber}
                  </span>
                )}
              </div>

              <p className="mt-1 text-sm text-slate-500">
                Created {formatDate(ticket.createdAt)}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:border-slate-700 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>

        {/* =========================================================
            ALERTS
        ========================================================= */}

        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
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
          <div className="mb-5 flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />

            <p className="flex-1 text-sm text-emerald-300">{success}</p>

            <button
              type="button"
              onClick={() => setSuccess("")}
              className="text-emerald-400 hover:text-emerald-300"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* =========================================================
            TICKET INFO
        ========================================================= */}

        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {/* Status */}

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Status
              </span>

              <CheckCircle2 className="h-4 w-4 text-slate-500" />
            </div>

            <div className="relative">
              <select
                value={ticket.status || "open"}
                onChange={handleStatusChange}
                disabled={updatingStatus}
                className="w-full appearance-none rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 pr-10 text-sm font-medium text-slate-200 outline-none transition focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="open" className="bg-slate-900 text-blue-400">
                  Open
                </option>

                <option
                  value="in-progress"
                  className="bg-slate-900 text-violet-400"
                >
                  In Progress
                </option>

                <option value="waiting" className="bg-slate-900 text-amber-400">
                  Waiting
                </option>

                <option
                  value="resolved"
                  className="bg-slate-900 text-emerald-400"
                >
                  Resolved
                </option>

                <option value="closed" className="bg-slate-900 text-slate-300">
                  Closed
                </option>
              </select>

              <ChevronDown
                size={16}
                strokeWidth={2}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
            </div>
          </div>

          {/* Priority */}

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Priority
              </span>
            </div>

            <div className="relative">
              <select
                value={ticket.priority || "medium"}
                onChange={handlePriorityChange}
                disabled={updatingPriority}
                className="w-full appearance-none rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 pr-10 text-sm font-medium text-slate-200 outline-none transition focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="low" className="bg-slate-900 text-emerald-400">
                  Low
                </option>

                <option value="medium" className="bg-slate-900 text-amber-400">
                  Medium
                </option>

                <option value="high" className="bg-slate-900 text-red-400">
                  High
                </option>
              </select>

              <ChevronDown
                size={16}
                strokeWidth={2}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
            </div>
          </div>

          {/* Category */}

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Category
            </span>

            <p className="mt-2 text-sm font-semibold text-white">
              {ticket.category || "General"}
            </p>
          </div>

          {/* Assignment */}

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Assigned Agent
            </span>

            {assignedAgent ? (
              <div className="mt-2 flex items-center gap-2">
                {assignedAgent.avatar ? (
                  <img
                    src={getAvatarUrl(assignedAgent.avatar)}
                    alt={assignedAgent.name || "Agent"}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800">
                    <User className="h-4 w-4 text-slate-400" />
                  </div>
                )}

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">
                    {assignedAgent.name || "Agent"}
                  </p>

                  {assignedAgent.email && (
                    <p className="truncate text-xs text-slate-500">
                      {assignedAgent.email}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <p className="mt-2 text-sm text-slate-500">Unassigned</p>
            )}
          </div>
        </div>

        {/* =========================================================
            MAIN CONTENT
        ========================================================= */}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          {/* =======================================================
              CONVERSATION
          ======================================================= */}

          <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60">
            {/* Conversation header */}

            <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4 sm:px-6">
              <div>
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-blue-400" />

                  <h2 className="font-semibold text-white">Conversation</h2>
                </div>

                <p className="mt-1 text-xs text-slate-500">
                  {conversation.length}{" "}
                  {conversation.length === 1 ? "message" : "messages"}
                </p>
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-xs text-slate-500">
                Ticket #{ticket.ticketNumber || ticket.id}
              </div>
            </div>

            {/* Messages */}

            <div className="max-h-[650px] overflow-y-auto p-4 sm:p-6">
              {conversation.length === 0 ? (
                <div className="flex min-h-[300px] flex-col items-center justify-center text-center">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800">
                    <MessageSquare className="h-6 w-6 text-slate-500" />
                  </div>

                  <h3 className="font-medium text-slate-300">
                    No messages yet
                  </h3>

                  <p className="mt-1 max-w-sm text-sm text-slate-500">
                    There are no conversation messages for this ticket.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {conversation.map((message, index) => {
                    const senderRole = String(
                      message?.senderRole || message?.sender?.role || "",
                    ).toLowerCase();

                    const isCustomer = senderRole === "customer";

                    const isAgent =
                      senderRole === "agent" || senderRole === "admin";

                    const senderName = getSenderName(message, ticket);

                    const senderAvatar =
                      message?.sender?.avatar ||
                      (isCustomer ? ticketCustomer.avatar : null);

                    const attachments = Array.isArray(message?.attachments)
                      ? message.attachments
                      : [];

                    return (
                      <div
                        key={message?._id || message?.id || `message-${index}`}
                        className={`flex gap-3 ${
                          isAgent ? "justify-end" : "justify-start"
                        }`}
                      >
                        {/* Customer avatar */}

                        {!isAgent && (
                          <div className="shrink-0">
                            {senderAvatar ? (
                              <img
                                src={getAvatarUrl(senderAvatar)}
                                alt={senderName}
                                className="h-9 w-9 rounded-full object-cover"
                              />
                            ) : (
                              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800">
                                <User className="h-4 w-4 text-slate-400" />
                              </div>
                            )}
                          </div>
                        )}

                        <div
                          className={`max-w-[85%] ${
                            isAgent ? "items-end" : "items-start"
                          }`}
                        >
                          {/* Name / badge */}

                          <div
                            className={`mb-1.5 flex flex-wrap items-center gap-2 ${
                              isAgent ? "justify-end" : "justify-start"
                            }`}
                          >
                            <span className="text-xs font-semibold text-slate-300">
                              {senderName}
                            </span>

                            {message?.isInitialTicketMessage && (
                              <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-400">
                                Original Ticket
                              </span>
                            )}

                            {senderRole === "ai" && (
                              <span className="rounded-full border border-violet-500/20 bg-violet-500/10 px-2 py-0.5 text-[10px] font-semibold text-violet-400">
                                AI
                              </span>
                            )}
                          </div>

                          {/* Message */}

                          <div
                            className={`rounded-2xl border p-4 ${
                              isAgent
                                ? "border-blue-500/20 bg-blue-500/10"
                                : "border-slate-800 bg-slate-950"
                            }`}
                          >
                            <p className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-200">
                              {message?.message || ""}
                            </p>

                            {/* Attachments */}

                            {attachments.length > 0 && (
                              <div className="mt-4 space-y-2">
                                {attachments.map((file, fileIndex) =>
                                  renderAttachment(file, fileIndex),
                                )}
                              </div>
                            )}
                          </div>

                          {/* Date */}

                          <div
                            className={`mt-1.5 flex items-center gap-2 ${
                              isAgent ? "justify-end" : "justify-start"
                            }`}
                          >
                            <span className="text-[11px] text-slate-600">
                              {formatDate(message?.createdAt)}
                            </span>

                            {isAgent && (
                              <Check className="h-3 w-3 text-slate-600" />
                            )}
                          </div>
                        </div>

                        {/* Agent avatar */}

                        {isAgent && (
                          <div className="shrink-0">
                            {message?.sender?.avatar ? (
                              <img
                                src={getAvatarUrl(message.sender.avatar)}
                                alt={senderName}
                                className="h-9 w-9 rounded-full object-cover"
                              />
                            ) : (
                              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-500/10">
                                <UserCheck className="h-4 w-4 text-blue-400" />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  <div ref={conversationEndRef} />
                </div>
              )}

              {/* =====================================================
                  CUSTOMER TYPING INDICATOR
              ===================================================== */}

              {customerTyping && (
                <div className="mt-4 flex items-center gap-3">
                  {/* Customer avatar */}

                  <div className="shrink-0">
                    {ticketCustomer.avatar ? (
                      <img
                        src={getAvatarUrl(ticketCustomer.avatar)}
                        alt={ticketCustomer.name || "Customer"}
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800">
                        <User className="h-4 w-4 text-slate-400" />
                      </div>
                    )}
                  </div>

                  {/* Typing bubble */}

                  <div className="flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-950 px-4 py-2.5">
                    <span className="text-xs font-medium text-slate-400">
                      Customer is typing
                    </span>

                    <span className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-500 [animation-delay:-0.3s]" />

                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-500 [animation-delay:-0.15s]" />

                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-500" />
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* =====================================================
                REPLY
            ===================================================== */}

            {canReply && (
              <form
                onSubmit={handleSendReply}
                className="border-t border-slate-800 p-4 sm:p-6"
              >
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-white">
                      Reply to Customer
                    </h3>

                    <p className="mt-0.5 text-xs text-slate-500">
                      Send a message or attach files.
                    </p>
                  </div>
                </div>

                <textarea
                  value={reply}
                  onChange={(event) => setReply(event.target.value)}
                  placeholder="Write your reply..."
                  rows={5}
                  disabled={sendingReply}
                  className="w-full resize-none rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                />

                {/* Selected files */}

                {selectedFiles.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {selectedFiles.map((file, index) => (
                      <div
                        key={`${file.name}-${index}`}
                        className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950 p-3"
                      >
                        {isImageFile({
                          name: file.name,
                          mimetype: file.type,
                        }) ? (
                          <ImageIcon className="h-5 w-5 text-blue-400" />
                        ) : (
                          <FileText className="h-5 w-5 text-slate-400" />
                        )}

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm text-slate-300">
                            {file.name}
                          </p>

                          <p className="text-xs text-slate-600">
                            {formatFileSize(file.size)}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeSelectedFile(index)}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-800 hover:text-red-400"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      hidden
                      onChange={handleFileChange}
                      accept=".jpg,.jpeg,.png,.webp,.gif,.pdf,.txt,.csv,.doc,.docx,.xls,.xlsx"
                    />

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={sendingReply || selectedFiles.length >= 5}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:border-slate-700 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Paperclip className="h-4 w-4" />
                      Attach File
                    </button>

                    <span className="ml-3 text-xs text-slate-600">
                      {selectedFiles.length}
                      /5
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={
                      sendingReply ||
                      (!reply.trim() && selectedFiles.length === 0)
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {sendingReply ? (
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
              </form>
            )}

            {/* Closed notice */}

            {!canReply && (
              <div className="border-t border-slate-800 p-5">
                <div className="flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm text-slate-500">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  This ticket is closed and cannot receive new replies.
                </div>
              </div>
            )}
          </section>

          {/* =======================================================
              RIGHT SIDEBAR
          ======================================================= */}

          <aside className="space-y-5">
            {/* Customer */}

            <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
              <div className="mb-4 flex items-center gap-2">
                <User className="h-5 w-5 text-blue-400" />

                <h2 className="font-semibold text-white">Customer</h2>
              </div>

              <div className="flex items-center gap-3">
                {ticketCustomer.avatar ? (
                  <img
                    src={getAvatarUrl(ticketCustomer.avatar)}
                    alt={ticketCustomer.name || "Customer"}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-800">
                    <User className="h-5 w-5 text-slate-400" />
                  </div>
                )}

                <div className="min-w-0">
                  <p className="truncate font-semibold text-white">
                    {ticketCustomer.name || "Customer"}
                  </p>

                  {ticketCustomer.email && (
                    <p className="truncate text-xs text-slate-500">
                      {ticketCustomer.email}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {ticketCustomer.phone && (
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-slate-600">
                      Phone
                    </p>

                    <p className="mt-1 text-sm text-slate-300">
                      {ticketCustomer.phone}
                    </p>
                  </div>
                )}

                {ticketCustomer.company && (
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-slate-600">
                      Company
                    </p>

                    <p className="mt-1 text-sm text-slate-300">
                      {ticketCustomer.company}
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* Assignment */}

            <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
              <div className="mb-4 flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-violet-400" />

                <h2 className="font-semibold text-white">Assignment</h2>
              </div>

              {assignedAgent ? (
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                  <div className="flex items-center gap-3">
                    {assignedAgent.avatar ? (
                      <img
                        src={getAvatarUrl(assignedAgent.avatar)}
                        alt={assignedAgent.name || "Agent"}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800">
                        <UserCheck className="h-5 w-5 text-slate-400" />
                      </div>
                    )}

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">
                        {assignedAgent.name}
                      </p>

                      <p className="text-xs text-slate-500">
                        {isAssignedToCurrentUser
                          ? "Assigned to you"
                          : "Assigned agent"}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="mb-3 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3">
                    <p className="text-xs text-amber-400">
                      This ticket is currently unassigned.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleAssignToMe}
                    disabled={assigning}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {assigning ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Assigning...
                      </>
                    ) : (
                      <>
                        <UserCheck className="h-4 w-4" />
                        Assign to Me
                      </>
                    )}
                  </button>
                </div>
              )}
            </section>

            {/* Original ticket */}

            <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
              <div className="mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-400" />

                <h2 className="font-semibold text-white">Original Request</h2>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                <p className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-300">
                  {ticket.description || "No description provided."}
                </p>
              </div>

              {/* Ticket attachments */}

              {Array.isArray(ticket.attachments) &&
                ticket.attachments.length > 0 && (
                  <div className="mt-4">
                    <p className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-600">
                      Attachments
                    </p>

                    <div className="space-y-2">
                      {ticket.attachments.map((file, index) =>
                        renderAttachment(file, index),
                      )}
                    </div>
                  </div>
                )}
            </section>

            {/* Status history */}

            <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
              <div className="mb-4 flex items-center gap-2">
                <Clock3 className="h-5 w-5 text-amber-400" />

                <h2 className="font-semibold text-white">Status History</h2>
              </div>

              {Array.isArray(ticket.statusHistory) &&
              ticket.statusHistory.length > 0 ? (
                <div className="space-y-4">
                  {ticket.statusHistory
                    .slice()
                    .reverse()
                    .map((history, index) => (
                      <div
                        key={history?._id || `history-${index}`}
                        className="relative pl-6"
                      >
                        {index !== ticket.statusHistory.length - 1 && (
                          <div className="absolute left-[5px] top-3 h-full w-px bg-slate-800" />
                        )}

                        <div className="absolute left-0 top-1.5 h-3 w-3 rounded-full border-2 border-slate-700 bg-slate-950" />

                        <p className="text-sm font-medium text-slate-300">
                          {formatStatus(history.status)}
                        </p>

                        {history.note && (
                          <p className="mt-1 text-xs leading-5 text-slate-500">
                            {history.note}
                          </p>
                        )}

                        <p className="mt-1 text-[11px] text-slate-600">
                          {formatDate(history.createdAt)}
                        </p>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">
                  No status history available.
                </p>
              )}
            </section>

            {/* Resolution */}

            {(isResolved || isClosed) && (
              <section className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />

                  <div>
                    <h2 className="font-semibold text-emerald-300">
                      Ticket {isClosed ? "Closed" : "Resolved"}
                    </h2>

                    {ticket.resolvedAt && (
                      <p className="mt-1 text-xs text-emerald-500/70">
                        Resolved {formatDate(ticket.resolvedAt)}
                      </p>
                    )}

                    {ticket.closedAt && (
                      <p className="mt-1 text-xs text-slate-500">
                        Closed {formatDate(ticket.closedAt)}
                      </p>
                    )}
                  </div>
                </div>
              </section>
            )}
          </aside>
        </div>
      </div>

      {/* =========================================================
          IMAGE PREVIEW
      ========================================================= */}

      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-h-[90vh] max-w-5xl overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 p-2"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/70 text-white hover:bg-black"
            >
              <X className="h-5 w-5" />
            </button>

            <img
              src={previewImage.url}
              alt={previewImage.name}
              className="max-h-[85vh] max-w-full rounded-xl object-contain"
            />

            <div className="px-2 pb-1 pt-2 text-center text-xs text-slate-400">
              {previewImage.name}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentTicketDetails;
