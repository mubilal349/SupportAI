import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
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
  ShieldAlert,
  User,
  UserCheck,
  X,
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
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updatingPriority, setUpdatingPriority] = useState(false);

  const [previewImage, setPreviewImage] = useState(null);

  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState("");

  const [composerMode, setComposerMode] = useState("reply");

  const [internalNote, setInternalNote] = useState("");
  const [isAddingInternalNote, setIsAddingInternalNote] = useState(false);
  const [internalNoteError, setInternalNoteError] = useState("");

  /*
  |--------------------------------------------------------------------------
  | Ticket Escalation
  |--------------------------------------------------------------------------
  */

  const [showEscalateModal, setShowEscalateModal] = useState(false);

  const [escalationReason, setEscalationReason] = useState("");

  const [escalationNote, setEscalationNote] = useState("");

  const [escalating, setEscalating] = useState(false);

  const [escalationError, setEscalationError] = useState("");

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

          /*
           * Keep escalation information available even when
           * the backend doesn't return an escalation object.
           */
          escalation: rawTicket.escalation || {
            isEscalated: false,
            escalatedBy: null,
            escalatedTo: null,
            reason: "",
            note: "",
            escalatedAt: null,
            resolvedAt: null,
          },
        };

        console.log("========================================");
        console.log("AGENT TICKET LOADED");
        console.log("TICKET:", normalizedTicket);
        console.log("DESCRIPTION:", normalizedTicket.description);
        console.log("CONVERSATION:", normalizedTicket.conversation);
        console.log("ATTACHMENTS:", normalizedTicket.attachments);
        console.log("ESCALATION:", normalizedTicket.escalation);
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

        socket.emit("ticket:join", {
          ticketId,
        });
      };

      const handleJoined = (data) => {
        console.log("AGENT JOINED TICKET ROOM:", data);
      };

      const handleCustomerTyping = (data) => {
        if (String(data?.ticketId || "") !== String(ticketId)) {
          return;
        }

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

      if (socket.connected) {
        handleConnect();
      }

      return () => {
        console.log("LEAVING AGENT TICKET SOCKET:", ticketId);

        setCustomerTyping(false);

        if (socket.connected) {
          socket.emit("ticket:leave", {
            ticketId,
          });
        }

        socket.off("connect", handleConnect);

        socket.off("ticket:joined", handleJoined);

        socket.off("ticket:typing", handleCustomerTyping);

        socket.off("ticket:error", handleSocketError);

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

    const description = String(
      ticket.description || ticket.initialMessage || ticket.message || "",
    ).trim();

    console.log("CONVERSATION BUILDER - DESCRIPTION:", description);

    console.log("CONVERSATION BUILDER - EXISTING:", existingConversation);

    if (!description) {
      return existingConversation;
    }

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
  | Assign ticket to current agent
  |--------------------------------------------------------------------------
  */

  const handleAssignToMe = async () => {
    const id = ticket?.id || ticket?._id;

    if (!id) {
      setAssignError("Ticket ID is missing.");
      return;
    }

    if (assigning) {
      return;
    }

    if (isAssignedToCurrentUser) {
      setSuccess("This ticket is already assigned to you.");
      return;
    }

    if (assignedAgent && !isAssignedToCurrentUser) {
      setAssignError("This ticket is already assigned to another agent.");
      return;
    }

    try {
      setAssigning(true);
      setAssignError("");
      setError("");
      setSuccess("");

      console.log("ASSIGNING TICKET:", id);

      const response = await assignTicketToMe(id);

      console.log("ASSIGN TICKET RESPONSE:", response);

      const updatedTicket =
        response?.ticket || response?.data?.ticket || response?.data || null;

      if (updatedTicket) {
        setTicket((previous) => {
          if (!previous) {
            return previous;
          }

          return {
            ...previous,
            ...updatedTicket,

            id: updatedTicket.id || updatedTicket._id || previous.id,

            _id: updatedTicket._id || updatedTicket.id || previous._id,

            assignedAgent:
              updatedTicket.assignedAgent || user || previous.assignedAgent,

            conversation: Array.isArray(updatedTicket.conversation)
              ? updatedTicket.conversation
              : previous.conversation || [],

            attachments: Array.isArray(updatedTicket.attachments)
              ? updatedTicket.attachments
              : previous.attachments || [],

            statusHistory: Array.isArray(updatedTicket.statusHistory)
              ? updatedTicket.statusHistory
              : previous.statusHistory || [],

            escalation: updatedTicket.escalation || previous.escalation,
          };
        });
      } else {
        await loadTicket(false);
      }

      setSuccess("Ticket assigned to you successfully.");

      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (err) {
      console.error("ASSIGN TICKET ERROR:", err);

      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Failed to assign ticket.";

      setAssignError(message);
    } finally {
      setAssigning(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Add Internal Note
  |--------------------------------------------------------------------------
  */

  const handleAddInternalNote = async () => {
    const cleanNote = internalNote.trim();

    if (!ticket?.id && !ticket?._id) {
      setInternalNoteError("Ticket information is missing.");
      return;
    }

    if (!cleanNote) {
      setInternalNoteError("Please enter an internal note.");
      return;
    }

    if (cleanNote.length > 10000) {
      setInternalNoteError("Internal note cannot exceed 10,000 characters.");
      return;
    }

    try {
      setIsAddingInternalNote(true);
      setInternalNoteError("");

      const id = ticket.id || ticket._id;

      const response = await addInternalNote(id, cleanNote);

      const updatedTicket = response?.ticket || response?.data?.ticket || null;

      const newNote = response?.note || response?.data?.note || null;

      if (updatedTicket) {
        setTicket(updatedTicket);
      } else if (newNote) {
        setTicket((previousTicket) => {
          if (!previousTicket) return previousTicket;

          return {
            ...previousTicket,

            conversation: [...(previousTicket.conversation || []), newNote],
          };
        });
      }

      setInternalNote("");
    } catch (error) {
      console.error("ADD INTERNAL NOTE ERROR:", error);

      setInternalNoteError(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to add internal note.",
      );
    } finally {
      setIsAddingInternalNote(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Escalate Ticket
  |--------------------------------------------------------------------------
  */

  const handleEscalateTicket = async () => {
    if (!ticket) {
      return;
    }

    const id = ticket.id || ticket._id;

    if (!id) {
      setEscalationError("Ticket ID is missing.");
      return;
    }

    if (!escalationReason.trim()) {
      setEscalationError("Please select an escalation reason.");
      return;
    }

    if (escalationReason.trim().length > 500) {
      setEscalationError("Escalation reason cannot exceed 500 characters.");
      return;
    }

    if (escalationNote.trim().length > 5000) {
      setEscalationError("Escalation note cannot exceed 5,000 characters.");
      return;
    }

    if (ticket?.escalation?.isEscalated) {
      setEscalationError("This ticket is already escalated.");
      return;
    }

    try {
      setEscalating(true);
      setEscalationError("");
      setError("");
      setSuccess("");

      const response = await escalateAgentTicket(id, {
        /*
         * No target is selected here.
         *
         * Backend can route this to senior support/admin
         * depending on your escalation implementation.
         */
        escalatedTo: null,

        reason: escalationReason.trim(),

        note: escalationNote.trim(),
      });

      console.log("ESCALATE TICKET RESPONSE:", response);

      const updatedTicket =
        response?.ticket || response?.data?.ticket || response?.data || null;

      if (updatedTicket) {
        setTicket((previous) => {
          if (!previous) {
            return previous;
          }

          return {
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

            escalation: updatedTicket.escalation || previous.escalation,
          };
        });
      } else {
        await loadTicket(false);
      }

      setShowEscalateModal(false);

      setEscalationReason("");

      setEscalationNote("");

      setSuccess(
        "Ticket escalated successfully. Senior support has been notified.",
      );

      setTimeout(() => {
        setSuccess("");
      }, 4000);
    } catch (err) {
      console.error("ESCALATE TICKET ERROR:", err);

      setEscalationError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          "Failed to escalate ticket.",
      );
    } finally {
      setEscalating(false);
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

          escalation: updatedTicket.escalation || previous.escalation,
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

          escalation: updatedTicket.escalation || previous.escalation,
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

          escalation: updatedTicket.escalation || previous.escalation,
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

  const assignedAgentId = getId(assignedAgent);

  const currentUserId = getId(user);

  const isAssigned = Boolean(assignedAgentId);

  const isAssignedToCurrentUser =
    Boolean(assignedAgentId) &&
    Boolean(currentUserId) &&
    String(assignedAgentId) === String(currentUserId);

  const isAssignedToAnotherAgent = isAssigned && !isAssignedToCurrentUser;

  const isUnassigned = !isAssigned;

  const isClosed = String(ticket.status || "").toLowerCase() === "closed";

  const isResolved = String(ticket.status || "").toLowerCase() === "resolved";

  const isEscalated = ticket?.escalation?.isEscalated === true;

  const isAdmin = String(user?.role || "").toLowerCase() === "admin";

  /*
   * An agent can escalate:
   *
   * - their own assigned ticket
   * - an unassigned ticket
   * - admin can escalate any ticket
   *
   * Another agent's ticket cannot be escalated by this agent.
   */
  const canEscalate =
    !isClosed &&
    !isEscalated &&
    (isAssignedToCurrentUser || isUnassigned || isAdmin);

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

                {isEscalated && (
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-orange-500/20 bg-orange-500/10 px-2.5 py-1 text-xs font-semibold text-orange-400">
                    <ShieldAlert className="h-3.5 w-3.5" />
                    Escalated
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
                    const isInternalNote = message?.isInternal === true;

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

                    if (isInternalNote) {
                      return (
                        <div
                          key={
                            message?._id || message?.id || `message-${index}`
                          }
                          className="flex justify-start"
                        >
                          <div className="w-full max-w-[90%]">
                            <div className="mb-2 flex items-center gap-2">
                              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10">
                                <span className="text-sm">🔒</span>
                              </div>

                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-xs font-semibold text-amber-300">
                                    Internal Note
                                  </span>

                                  <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-400">
                                    Private
                                  </span>
                                </div>

                                <p className="text-[11px] text-slate-600">
                                  {senderName}
                                </p>
                              </div>
                            </div>

                            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
                              <p className="whitespace-pre-wrap break-words text-sm leading-6 text-amber-100">
                                {message?.message || ""}
                              </p>
                            </div>

                            <div className="mt-1.5 text-[11px] text-slate-600">
                              {formatDate(message?.createdAt)}
                            </div>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={message?._id || message?.id || `message-${index}`}
                        className={`flex gap-3 ${
                          isAgent ? "justify-end" : "justify-start"
                        }`}
                      >
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

                            {attachments.length > 0 && (
                              <div className="mt-4 space-y-2">
                                {attachments.map((file, fileIndex) =>
                                  renderAttachment(file, fileIndex),
                                )}
                              </div>
                            )}
                          </div>

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

              {/* Customer typing */}

              {customerTyping && (
                <div className="mt-4 flex items-center gap-3">
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
              <div className="border-t border-slate-800 p-4 sm:p-6">
                <div className="mb-4 flex rounded-xl border border-slate-800 bg-slate-950 p-1">
                  <button
                    type="button"
                    onClick={() => {
                      setComposerMode("reply");
                      setInternalNoteError("");
                    }}
                    className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition ${
                      composerMode === "reply"
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    Reply to Customer
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setComposerMode("internal");
                      setInternalNoteError("");
                    }}
                    className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition ${
                      composerMode === "internal"
                        ? "bg-amber-500/10 text-amber-300"
                        : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    🔒 Internal Note
                  </button>
                </div>

                {/* Customer Reply */}

                {composerMode === "reply" && (
                  <form onSubmit={handleSendReply}>
                    <div className="mb-3">
                      <h3 className="text-sm font-semibold text-white">
                        Reply to Customer
                      </h3>

                      <p className="mt-0.5 text-xs text-slate-500">
                        Send a message or attach files.
                      </p>
                    </div>

                    <textarea
                      value={reply}
                      onChange={(event) => setReply(event.target.value)}
                      placeholder="Write your reply..."
                      rows={5}
                      disabled={sendingReply}
                      className="w-full resize-none rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                    />

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
                          {selectedFiles.length}/5
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

                {/* Internal Note */}

                {composerMode === "internal" && (
                  <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
                    <div className="mb-4 flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10">
                        <span className="text-lg">🔒</span>
                      </div>

                      <div>
                        <h3 className="text-sm font-semibold text-amber-300">
                          Internal Note
                        </h3>

                        <p className="mt-1 text-xs leading-5 text-amber-400/70">
                          This note is private and can only be seen by agents
                          and administrators.
                        </p>
                      </div>
                    </div>

                    <textarea
                      value={internalNote}
                      onChange={(event) => {
                        setInternalNote(event.target.value);
                        setInternalNoteError("");
                      }}
                      placeholder="Add a private note for your support team..."
                      rows={5}
                      maxLength={10000}
                      disabled={isAddingInternalNote}
                      className="w-full resize-none rounded-xl border border-amber-500/20 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-amber-400/50 focus:ring-2 focus:ring-amber-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                    />

                    {internalNoteError && (
                      <div className="mt-3 rounded-xl border border-red-500/20 bg-red-500/5 p-3">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />

                          <p className="text-xs leading-5 text-red-300">
                            {internalNoteError}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <span className="text-xs text-amber-500/60">
                        {internalNote.length}/10000 characters
                      </span>

                      <button
                        type="button"
                        onClick={handleAddInternalNote}
                        disabled={isAddingInternalNote || !internalNote.trim()}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isAddingInternalNote ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Adding Note...
                          </>
                        ) : (
                          <>
                            <span>🔒</span>
                            Add Internal Note
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

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

              <button
                type="button"
                onClick={() => {
                  const customerId = getId(ticket.customer);

                  if (customerId) {
                    navigate(`/agent/customers/${customerId}`);
                  }
                }}
                className="group flex w-full cursor-pointer items-center gap-3 rounded-xl p-2 text-left transition hover:bg-slate-800/60"
              >
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
                  <p className="truncate font-semibold text-white transition group-hover:text-blue-400">
                    {ticketCustomer.name || "Customer"}
                  </p>

                  {ticketCustomer.email && (
                    <p className="truncate text-sm text-slate-500">
                      {ticketCustomer.email}
                    </p>
                  )}

                  <p className="mt-1 flex items-center gap-1 text-xs text-blue-400 opacity-0 transition group-hover:opacity-100">
                    View customer profile
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </p>
                </div>
              </button>
            </section>

            {/* Assignment */}

            <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-violet-400" />

                  <h2 className="font-semibold text-white">Assignment</h2>
                </div>

                {isAssigned && (
                  <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-400">
                    Assigned
                  </span>
                )}
              </div>

              {/* Unassigned */}

              {isUnassigned && (
                <div>
                  <div className="mb-4 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
                        <UserCheck className="h-4 w-4 text-amber-400" />
                      </div>

                      <div>
                        <p className="text-sm font-medium text-amber-300">
                          Ticket is unassigned
                        </p>

                        <p className="mt-1 text-xs leading-5 text-amber-400/70">
                          Take ownership of this ticket to start working on the
                          customer's request.
                        </p>
                      </div>
                    </div>
                  </div>

                  {assignError && (
                    <div className="mb-3 rounded-xl border border-red-500/20 bg-red-500/5 p-3">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />

                        <p className="text-xs leading-5 text-red-300">
                          {assignError}
                        </p>
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleAssignToMe}
                    disabled={assigning}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-600/10 transition-all duration-200 hover:bg-violet-500 hover:shadow-violet-500/20 disabled:cursor-not-allowed disabled:opacity-50"
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

              {/* Assigned to current agent */}

              {isAssignedToCurrentUser && (
                <div>
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                    <div className="flex items-center gap-3">
                      {assignedAgent?.avatar ? (
                        <img
                          src={getAvatarUrl(assignedAgent.avatar)}
                          alt={assignedAgent.name || "Agent"}
                          className="h-11 w-11 rounded-full object-cover ring-2 ring-emerald-500/20"
                        />
                      ) : (
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500/10">
                          <UserCheck className="h-5 w-5 text-emerald-400" />
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-white">
                          {assignedAgent?.name || user?.name || "You"}
                        </p>

                        <p className="mt-0.5 text-xs text-emerald-400">
                          This ticket is assigned to you
                        </p>
                      </div>

                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/10">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      </div>
                    </div>
                  </div>

                  {assignError && (
                    <div className="mt-3 rounded-xl border border-red-500/20 bg-red-500/5 p-3">
                      <p className="text-xs text-red-300">{assignError}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Assigned to another agent */}

              {isAssignedToAnotherAgent && (
                <div>
                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                    <div className="flex items-center gap-3">
                      {assignedAgent?.avatar ? (
                        <img
                          src={getAvatarUrl(assignedAgent.avatar)}
                          alt={assignedAgent.name || "Agent"}
                          className="h-11 w-11 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-800">
                          <UserCheck className="h-5 w-5 text-slate-400" />
                        </div>
                      )}

                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-white">
                          {assignedAgent?.name || "Another agent"}
                        </p>

                        <p className="mt-0.5 text-xs text-slate-500">
                          This ticket is assigned to another agent
                        </p>
                      </div>
                    </div>
                  </div>

                  {assignError && (
                    <div className="mt-3 rounded-xl border border-red-500/20 bg-red-500/5 p-3">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />

                        <p className="text-xs leading-5 text-red-300">
                          {assignError}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* =====================================================
                ESCALATION
            ===================================================== */}

            <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-orange-400" />

                  <h2 className="font-semibold text-white">Escalation</h2>
                </div>

                {isEscalated && (
                  <span className="rounded-full border border-orange-500/20 bg-orange-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-orange-400">
                    Escalated
                  </span>
                )}
              </div>

              {/* Not escalated */}

              {!isEscalated && (
                <div>
                  <div className="rounded-xl border border-orange-500/10 bg-orange-500/5 p-3">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-500/10">
                        <ShieldAlert className="h-4 w-4 text-orange-400" />
                      </div>

                      <div>
                        <p className="text-sm font-medium text-orange-300">
                          Need senior assistance?
                        </p>

                        <p className="mt-1 text-xs leading-5 text-orange-400/70">
                          Escalate difficult or sensitive tickets to senior
                          support.
                        </p>
                      </div>
                    </div>
                  </div>

                  {canEscalate ? (
                    <button
                      type="button"
                      onClick={() => {
                        setEscalationError("");
                        setEscalationReason("");
                        setEscalationNote("");
                        setShowEscalateModal(true);
                      }}
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-orange-500/20 bg-orange-500/10 px-4 py-2.5 text-sm font-semibold text-orange-400 transition hover:border-orange-500/40 hover:bg-orange-500/15 hover:text-orange-300"
                    >
                      <ShieldAlert className="h-4 w-4" />
                      Escalate Ticket
                    </button>
                  ) : (
                    <p className="mt-4 rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs leading-5 text-slate-500">
                      This ticket cannot be escalated from your current
                      assignment.
                    </p>
                  )}
                </div>
              )}

              {/* Already escalated */}

              {isEscalated && (
                <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/10">
                      <ShieldAlert className="h-5 w-5 text-orange-400" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-orange-300">
                          Ticket Escalated
                        </h3>

                        <span className="rounded-full border border-orange-500/20 bg-orange-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-orange-400">
                          Pending
                        </span>
                      </div>

                      {ticket.escalation?.reason && (
                        <div className="mt-3">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-orange-500/60">
                            Reason
                          </p>

                          <p className="mt-1 text-sm leading-5 text-slate-300">
                            {ticket.escalation.reason}
                          </p>
                        </div>
                      )}

                      {ticket.escalation?.note && (
                        <div className="mt-3">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-orange-500/60">
                            Escalation Note
                          </p>

                          <div className="mt-1 rounded-lg border border-orange-500/10 bg-slate-950/70 p-3">
                            <p className="whitespace-pre-wrap break-words text-xs leading-5 text-slate-400">
                              {ticket.escalation.note}
                            </p>
                          </div>
                        </div>
                      )}

                      {ticket.escalation?.escalatedAt && (
                        <p className="mt-3 text-[11px] text-slate-600">
                          Escalated {formatDate(ticket.escalation.escalatedAt)}
                        </p>
                      )}

                      {ticket.escalation?.escalatedTo && (
                        <div className="mt-3 rounded-lg border border-slate-800 bg-slate-950 p-3">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                            Escalated To
                          </p>

                          <p className="mt-1 text-xs font-medium text-slate-300">
                            {ticket.escalation.escalatedTo?.name ||
                              ticket.escalation.escalatedTo?.email ||
                              "Senior Support"}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
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
          ESCALATION MODAL
      ========================================================= */}

      {showEscalateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => {
            if (!escalating) {
              setShowEscalateModal(false);
            }
          }}
        >
          <div
            className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            {/* Modal Header */}

            <div className="flex items-start justify-between border-b border-slate-800 p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-500/10">
                  <ShieldAlert className="h-5 w-5 text-orange-400" />
                </div>

                <div>
                  <h2 className="text-lg font-semibold text-white">
                    Escalate Ticket
                  </h2>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Send this ticket to senior support for additional
                    assistance.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!escalating) {
                    setShowEscalateModal(false);
                  }
                }}
                disabled={escalating}
                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}

            <div className="space-y-5 p-5">
              {/* Reason */}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Escalation Reason
                </label>

                <div className="relative">
                  <select
                    value={escalationReason}
                    onChange={(event) => {
                      setEscalationReason(event.target.value);
                      setEscalationError("");
                    }}
                    disabled={escalating}
                    className="w-full appearance-none rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 pr-10 text-sm text-slate-200 outline-none transition focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <option value="">Select a reason</option>

                    <option value="Technical issue">Technical issue</option>

                    <option value="Requires senior approval">
                      Requires senior approval
                    </option>

                    <option value="Customer complaint">
                      Customer complaint
                    </option>

                    <option value="Billing issue">Billing issue</option>

                    <option value="Security concern">Security concern</option>

                    <option value="Complex issue">Complex issue</option>

                    <option value="Other">Other</option>
                  </select>

                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                </div>
              </div>

              {/* Note */}

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="block text-sm font-medium text-slate-300">
                    Additional Note
                  </label>

                  <span className="text-[11px] text-slate-600">
                    {escalationNote.length}/5000
                  </span>
                </div>

                <textarea
                  value={escalationNote}
                  onChange={(event) => {
                    setEscalationNote(event.target.value);
                    setEscalationError("");
                  }}
                  placeholder="Explain why this ticket needs senior assistance..."
                  rows={5}
                  maxLength={5000}
                  disabled={escalating}
                  className="w-full resize-none rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm leading-6 text-white outline-none placeholder:text-slate-600 focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>

              {/* Info */}

              <div className="rounded-xl border border-orange-500/10 bg-orange-500/5 p-3">
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-orange-400" />

                  <p className="text-xs leading-5 text-orange-300/80">
                    Escalating this ticket will mark it as escalated and notify
                    the appropriate senior support team. The current ticket
                    assignment will remain unchanged until the escalation is
                    accepted.
                  </p>
                </div>
              </div>

              {/* Error */}

              {escalationError && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />

                    <p className="text-xs leading-5 text-red-300">
                      {escalationError}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}

            <div className="flex flex-col-reverse gap-3 border-t border-slate-800 p-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setShowEscalateModal(false)}
                disabled={escalating}
                className="rounded-xl border border-slate-700 bg-slate-950 px-5 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleEscalateTicket}
                disabled={escalating || !escalationReason.trim()}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {escalating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Escalating...
                  </>
                ) : (
                  <>
                    <ShieldAlert className="h-4 w-4" />
                    Escalate Ticket
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

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
