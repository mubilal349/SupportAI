import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Bot,
  Check,
  CheckCheck,
  Clock3,
  FileText,
  Headphones,
  Image as ImageIcon,
  Menu,
  Paperclip,
  Send,
  Smile,
  Sparkles,
  User,
  X,
  Zap,
} from "lucide-react";
import { Link } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

const Chat = () => {
  const { user } = useAuth();

  // ==========================================
  // STATE
  // ==========================================

  const [conversationId, setConversationId] = useState(null);

  const [conversation, setConversation] = useState(null);

  const [message, setMessage] = useState("");

  const [messages, setMessages] = useState([]);

  const [isLoadingConversation, setIsLoadingConversation] = useState(true);

  const [isTyping, setIsTyping] = useState(false);

  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const [showMobileInfo, setShowMobileInfo] = useState(false);

  const [isEscalated, setIsEscalated] = useState(false);

  const [error, setError] = useState("");

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  // ==========================================
  // HELPERS
  // ==========================================

  const formatTime = (date) => {
    if (!date) {
      return "";
    }

    try {
      return new Date(date).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  const formatDate = (date) => {
    if (!date) {
      return "Today";
    }

    try {
      const target = new Date(date);
      const today = new Date();

      const isToday = target.toDateString() === today.toDateString();

      if (isToday) {
        return "Today";
      }

      return target.toLocaleDateString([], {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "Today";
    }
  };

  const normalizeMessage = (item) => {
    if (!item) {
      return null;
    }

    const senderType = item.senderType || item.sender || "system";

    let sender = "ai";

    if (senderType === "customer") {
      sender = "user";
    } else if (senderType === "ai" || senderType === "agent") {
      sender = "ai";
    } else if (senderType === "system") {
      sender = "system";
    }

    return {
      id: item._id || item.id || `message-${Date.now()}-${Math.random()}`,

      sender,

      senderType,

      content: item.content || "",

      time: formatTime(item.createdAt || item.updatedAt),

      status: item.isRead || sender !== "user" ? "read" : "sent",

      attachment: item.attachments?.length > 0 ? item.attachments[0] : null,
    };
  };

  // ==========================================
  // SCROLL TO BOTTOM
  // ==========================================

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, isTyping]);

  // ==========================================
  // LOAD OR CREATE CONVERSATION
  // ==========================================

  useEffect(() => {
    if (!user) {
      return;
    }

    initializeConversation();
  }, [user]);

  const initializeConversation = async () => {
    try {
      setIsLoadingConversation(true);
      setError("");

      console.log("=================================");
      console.log("INITIALIZING SUPPORT CONVERSATION");
      console.log("=================================");

      // ----------------------------------------
      // GET EXISTING CONVERSATIONS
      // ----------------------------------------

      const response = await api.get("/conversations");

      console.log("CUSTOMER CONVERSATIONS:");
      console.log(response.data);

      const conversations = response.data?.conversations || [];

      // ----------------------------------------
      // FIND ACTIVE AI CONVERSATION
      // ----------------------------------------

      let activeConversation = conversations.find(
        (item) => item.status === "active" && item.supportType === "AI",
      );

      // If there isn't an AI conversation,
      // use any active conversation.
      if (!activeConversation) {
        activeConversation = conversations.find(
          (item) => item.status === "active",
        );
      }

      // ----------------------------------------
      // CREATE NEW CONVERSATION
      // ----------------------------------------

      if (!activeConversation) {
        console.log("No active conversation found. Creating one...");

        const createResponse = await api.post("/conversations");

        activeConversation = createResponse.data?.conversation;

        if (!activeConversation?._id) {
          throw new Error("Conversation was created but no ID was returned.");
        }
      }

      // ----------------------------------------
      // SET CONVERSATION
      // ----------------------------------------

      setConversation(activeConversation);

      setConversationId(activeConversation._id);

      // ----------------------------------------
      // LOAD MESSAGES
      // ----------------------------------------

      await loadMessages(activeConversation._id);

      console.log("Conversation initialized:", activeConversation._id);
    } catch (error) {
      console.error("INITIALIZE CONVERSATION ERROR:", error);

      const serverMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Unable to load SupportAI conversation.";

      setError(serverMessage);
    } finally {
      setIsLoadingConversation(false);
    }
  };

  // ==========================================
  // LOAD MESSAGES
  // ==========================================

  const loadMessages = async (id) => {
    try {
      const response = await api.get(`/conversations/${id}/messages`);

      console.log("CONVERSATION MESSAGES:");
      console.log(response.data);

      const backendMessages = response.data?.messages || [];

      const normalizedMessages = backendMessages
        .map(normalizeMessage)
        .filter(Boolean);

      setMessages(normalizedMessages);
    } catch (error) {
      console.error("LOAD MESSAGES ERROR:", error);

      throw error;
    }
  };

  // ==========================================
  // SEND MESSAGE
  // ==========================================

  const sendMessage = async (e) => {
    e?.preventDefault();

    const trimmedMessage = message.trim();

    if (!trimmedMessage || isTyping) {
      return;
    }

    if (!conversationId) {
      setError("No active conversation is available. Please refresh the page.");
      return;
    }

    setError("");

    // ----------------------------------------
    // OPTIMISTIC CUSTOMER MESSAGE
    // ----------------------------------------

    const temporaryId = `user-${Date.now()}`;

    const userMessage = {
      id: temporaryId,
      sender: "user",
      senderType: "customer",
      content: trimmedMessage,
      time: formatTime(new Date()),
      status: "sent",
    };

    setMessages((prev) => [...prev, userMessage]);

    // ----------------------------------------
    // CLEAR INPUT
    // ----------------------------------------

    setMessage("");

    setShowEmojiPicker(false);
    setShowAttachmentMenu(false);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    // ----------------------------------------
    // AI TYPING
    // ----------------------------------------

    setIsTyping(true);

    try {
      console.log("=================================");
      console.log("SENDING MESSAGE TO SUPPORTAI");
      console.log("CONVERSATION ID:", conversationId);
      console.log("MESSAGE:", trimmedMessage);
      console.log("=================================");

      // --------------------------------------
      // REAL BACKEND ENDPOINT
      //
      // POST /api/conversations/:id/messages
      // --------------------------------------

      const response = await api.post(
        `/conversations/${conversationId}/messages`,
        {
          message: trimmedMessage,

          // Send recent frontend history as
          // additional context.
          history: messages.slice(-20).map((item) => ({
            sender: item.sender,
            content: item.content,
          })),
        },
      );

      console.log("=================================");
      console.log("SUPPORTAI RESPONSE");
      console.log(response.data);
      console.log("=================================");

      // ----------------------------------------
      // CUSTOMER MESSAGE FROM SERVER
      // ----------------------------------------

      const serverUserMessage = normalizeMessage(response.data?.userMessage);

      // ----------------------------------------
      // AI MESSAGE FROM SERVER
      // ----------------------------------------

      const aiMessage = normalizeMessage(response.data?.aiMessage);

      // ----------------------------------------
      // REPLACE TEMPORARY USER MESSAGE
      // ----------------------------------------

      setMessages((prev) => {
        const withoutTemporary = prev.filter((item) => item.id !== temporaryId);

        const nextMessages = [...withoutTemporary];

        if (serverUserMessage) {
          nextMessages.push(serverUserMessage);
        } else {
          nextMessages.push(userMessage);
        }

        if (aiMessage) {
          nextMessages.push(aiMessage);
        }

        return nextMessages;
      });

      // ----------------------------------------
      // UPDATE CONVERSATION INFO
      // ----------------------------------------

      if (response.data?.conversation) {
        setConversation((prev) => ({
          ...(prev || {}),
          ...response.data.conversation,
        }));
      }
    } catch (error) {
      console.error("CHAT AI ERROR:", error);

      const serverMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Unable to get a response from SupportAI.";

      setError(serverMessage);

      // ----------------------------------------
      // IF BACKEND SAVED THE CUSTOMER MESSAGE
      // BUT OLLAMA FAILED, USE SERVER MESSAGE
      // ----------------------------------------

      const savedUserMessage = normalizeMessage(
        error?.response?.data?.userMessage,
      );

      if (savedUserMessage) {
        setMessages((prev) => {
          const withoutTemporary = prev.filter(
            (item) => item.id !== temporaryId,
          );

          return [...withoutTemporary, savedUserMessage];
        });
      }

      // ----------------------------------------
      // SHOW SYSTEM ERROR
      // ----------------------------------------

      const errorMessage = {
        id: `error-${Date.now()}`,
        sender: "system",
        senderType: "system",
        content:
          "Sorry, I couldn't process your message right now. Please try again.",
        time: formatTime(new Date()),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  // ==========================================
  // TEXTAREA
  // ==========================================

  const handleTextareaChange = (e) => {
    setMessage(e.target.value);

    e.target.style.height = "auto";

    e.target.style.height = `${Math.min(e.target.scrollHeight, 140)}px`;
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();

      sendMessage();
    }
  };

  // ==========================================
  // FILE HANDLING
  // ==========================================

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    const fileMessage = {
      id: `file-${Date.now()}`,
      sender: "user",
      senderType: "customer",
      content: `📎 ${file.name}`,
      time: formatTime(new Date()),
      status: "sent",
      attachment: {
        name: file.name,
        size: formatFileSize(file.size),
        type: file.type,
      },
    };

    setMessages((prev) => [...prev, fileMessage]);

    setShowAttachmentMenu(false);

    e.target.value = "";
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) {
      return "0 Bytes";
    }

    const sizes = ["Bytes", "KB", "MB", "GB"];

    const index = Math.floor(Math.log(bytes) / Math.log(1024));

    return `${parseFloat(
      (bytes / Math.pow(1024, index)).toFixed(1),
    )} ${sizes[index]}`;
  };

  // ==========================================
  // ESCALATE
  // ==========================================

  const handleEscalate = () => {
    setIsEscalated(true);

    const escalationMessage = {
      id: `system-${Date.now()}`,
      sender: "system",
      senderType: "system",
      content:
        "You've requested human support. A support agent will join this conversation shortly.",
      time: formatTime(new Date()),
    };

    setMessages((prev) => [...prev, escalationMessage]);
  };

  // ==========================================
  // EMOJI
  // ==========================================

  const addEmoji = (emoji) => {
    setMessage((prev) => `${prev}${emoji}`);

    setShowEmojiPicker(false);

    textareaRef.current?.focus();
  };

  // ==========================================
  // LOADING SCREEN
  // ==========================================

  if (isLoadingConversation) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950 text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600">
            <Bot className="h-6 w-6 animate-pulse" />
          </div>

          <div className="text-center">
            <p className="text-sm font-medium">Connecting to SupportAI</p>

            <p className="mt-1 text-xs text-slate-500">
              Preparing your conversation...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-950 text-white">
      {/* Header */}
      <header className="shrink-0 border-b border-slate-800 bg-slate-950">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              to="/support"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-900 hover:text-white"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>

            <div className="hidden h-7 w-px bg-slate-800 sm:block" />

            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600">
                  <Bot className="h-5 w-5" />
                </div>

                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-slate-950 bg-emerald-500" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-sm font-semibold">SupportAI</h1>

                  <span className="hidden rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-medium text-blue-400 sm:inline">
                    AI Assistant
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Online
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isEscalated && (
              <button
                type="button"
                onClick={handleEscalate}
                className="hidden items-center gap-2 rounded-lg border border-slate-800 px-3 py-2 text-xs font-medium text-slate-400 transition hover:border-blue-500/30 hover:bg-blue-500/5 hover:text-blue-400 sm:flex"
              >
                <Headphones className="h-4 w-4" />
                Talk to a human
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowMobileInfo((prev) => !prev)}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-900 hover:text-white lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>

            <Link
              to="/support/profile"
              className="hidden h-9 w-9 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 sm:flex"
            >
              <User className="h-4 w-4 text-slate-400" />
            </Link>
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* Chat Area */}
        <section className="flex min-w-0 flex-1 flex-col">
          {/* Conversation Info */}
          <div className="flex shrink-0 items-center justify-between border-b border-slate-800/70 px-4 py-3 sm:px-6">
            <div>
              <p className="text-xs text-slate-600">Conversation</p>

              <p className="text-sm font-medium">
                {conversation?.title || "General Support"}
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-600">
              <Clock3 className="h-3.5 w-3.5" />
              Average response: &lt; 2 sec
            </div>
          </div>

          {/* Messages */}
          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
              {/* Date */}
              <div className="mb-8 flex items-center justify-center">
                <div className="rounded-full border border-slate-800 bg-slate-900 px-3 py-1 text-[11px] text-slate-600">
                  {formatDate(messages[0]?.time || conversation?.createdAt)}
                </div>
              </div>

              {/* Welcome Card */}
              {messages.length === 0 && (
                <div className="mb-8 rounded-2xl border border-blue-500/10 bg-blue-500/5 p-5">
                  <div className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                      <Sparkles className="h-5 w-5" />
                    </div>

                    <div>
                      <h2 className="text-sm font-semibold">
                        Welcome to SupportAI
                      </h2>

                      <p className="mt-1 text-sm leading-6 text-slate-400">
                        I'm an AI-powered support assistant. I can help answer
                        questions, troubleshoot problems, and connect you with a
                        human agent when necessary.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* API Error */}
              {error && (
                <div className="mb-5 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-xs text-red-400">
                  {error}
                </div>
              )}

              {/* Message List */}
              <div className="space-y-5">
                {messages.map((item) => {
                  if (item.sender === "system") {
                    return (
                      <div key={item.id} className="flex justify-center py-2">
                        <div className="max-w-md rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-center text-xs leading-5 text-amber-400">
                          {item.content}
                        </div>
                      </div>
                    );
                  }

                  const isUser = item.sender === "user";

                  return (
                    <div
                      key={item.id}
                      className={`flex gap-3 ${
                        isUser ? "justify-end" : "justify-start"
                      }`}
                    >
                      {!isUser && (
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600">
                          {item.senderType === "agent" ? (
                            <Headphones className="h-4 w-4" />
                          ) : (
                            <Bot className="h-4 w-4" />
                          )}
                        </div>
                      )}

                      <div
                        className={`max-w-[85%] sm:max-w-[70%] ${
                          isUser ? "items-end" : "items-start"
                        }`}
                      >
                        <div
                          className={`rounded-2xl px-4 py-3 text-sm leading-6 ${
                            isUser
                              ? "rounded-br-md bg-blue-600 text-white"
                              : "rounded-bl-md border border-slate-800 bg-slate-900 text-slate-300"
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{item.content}</p>

                          {item.attachment && (
                            <div className="mt-3 flex items-center gap-3 rounded-xl border border-white/10 bg-black/10 p-3">
                              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
                                <FileText className="h-4 w-4" />
                              </div>

                              <div className="min-w-0">
                                <p className="truncate text-xs font-medium">
                                  {item.attachment.name}
                                </p>

                                <p className="text-[10px] opacity-60">
                                  {item.attachment.size}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>

                        <div
                          className={`mt-1.5 flex items-center gap-1.5 text-[10px] text-slate-700 ${
                            isUser ? "justify-end" : "justify-start"
                          }`}
                        >
                          <span>{item.time}</span>

                          {isUser && item.status === "sent" && (
                            <Check className="h-3 w-3" />
                          )}

                          {isUser && item.status === "read" && (
                            <CheckCheck className="h-3 w-3 text-blue-500" />
                          )}
                        </div>
                      </div>

                      {isUser && (
                        <div className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-800 sm:flex">
                          <User className="h-4 w-4 text-slate-400" />
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Typing Indicator */}
                {isTyping && (
                  <div className="flex gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600">
                      <Bot className="h-4 w-4" />
                    </div>

                    <div className="rounded-2xl rounded-bl-md border border-slate-800 bg-slate-900 px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-500 [animation-delay:-0.3s]" />
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-500 [animation-delay:-0.15s]" />
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-500" />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </div>
          </div>

          {/* Input Area */}
          <div className="shrink-0 border-t border-slate-800 bg-slate-950 px-4 py-4 sm:px-6">
            <div className="mx-auto max-w-4xl">
              {/* Escalation */}
              {!isEscalated && (
                <div className="mb-3 flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-blue-400" />

                    <p className="text-xs text-slate-500">
                      Need personal assistance?
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleEscalate}
                    className="text-xs font-medium text-blue-400 hover:text-blue-300"
                  >
                    Talk to a human
                  </button>
                </div>
              )}

              <form
                onSubmit={sendMessage}
                className="relative rounded-2xl border border-slate-800 bg-slate-900 focus-within:border-blue-500/50"
              >
                <textarea
                  ref={textareaRef}
                  value={message}
                  onChange={handleTextareaChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Message SupportAI..."
                  rows={1}
                  disabled={isTyping || !conversationId}
                  className="block max-h-36 min-h-[52px] w-full resize-none bg-transparent px-4 pb-2 pt-4 pr-14 text-sm text-white outline-none placeholder:text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
                />

                <div className="flex items-center justify-between px-3 pb-3">
                  <div className="flex items-center gap-1">
                    {/* Attachment */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowAttachmentMenu((prev) => !prev)}
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-800 hover:text-slate-300"
                        title="Attach file"
                      >
                        <Paperclip className="h-4 w-4" />
                      </button>

                      {showAttachmentMenu && (
                        <div className="absolute bottom-11 left-0 z-20 w-44 overflow-hidden rounded-xl border border-slate-800 bg-slate-900 p-1 shadow-2xl">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-xs text-slate-400 hover:bg-slate-800 hover:text-white"
                          >
                            <FileText className="h-4 w-4" />
                            Upload document
                          </button>

                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-xs text-slate-400 hover:bg-slate-800 hover:text-white"
                          >
                            <ImageIcon className="h-4 w-4" />
                            Upload image
                          </button>
                        </div>
                      )}

                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        onChange={handleFileChange}
                        accept="image/*,.pdf,.doc,.docx,.txt,.csv,.xlsx"
                      />
                    </div>

                    {/* Emoji */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowEmojiPicker((prev) => !prev)}
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-800 hover:text-slate-300"
                        title="Add emoji"
                      >
                        <Smile className="h-4 w-4" />
                      </button>

                      {showEmojiPicker && (
                        <div className="absolute bottom-11 left-0 z-20 flex gap-1 rounded-xl border border-slate-800 bg-slate-900 p-2 shadow-2xl">
                          {["👍", "😊", "❤️", "🎉", "🙏"].map((emoji) => (
                            <button
                              type="button"
                              key={emoji}
                              onClick={() => addEmoji(emoji)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-lg hover:bg-slate-800"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <span className="hidden pl-2 text-[10px] text-slate-700 sm:block">
                      Enter to send · Shift + Enter for new line
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={!message.trim() || isTyping || !conversationId}
                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-30"
                    title="Send message"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </form>

              <p className="mt-2 text-center text-[10px] text-slate-700">
                SupportAI can make mistakes. Please verify important
                information.
              </p>
            </div>
          </div>
        </section>

        {/* Conversation Info Sidebar */}
        <aside
          className={`${
            showMobileInfo ? "flex" : "hidden"
          } fixed inset-y-0 right-0 z-30 w-80 flex-col border-l border-slate-800 bg-slate-950 lg:relative lg:flex`}
        >
          <div className="flex h-16 items-center justify-between border-b border-slate-800 px-5">
            <h2 className="text-sm font-semibold">Conversation details</h2>

            <button
              type="button"
              onClick={() => setShowMobileInfo(false)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-900 hover:text-white lg:hidden"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            {/* AI Card */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600">
                  <Bot className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-sm font-semibold">SupportAI</p>

                  <p className="text-xs text-emerald-400">
                    AI Assistant · Online
                  </p>
                </div>
              </div>

              <p className="mt-4 text-xs leading-5 text-slate-500">
                SupportAI can answer questions and help solve common problems
                instantly.
              </p>
            </div>

            {/* Conversation */}
            <div className="mt-6">
              <p className="mb-3 text-xs font-medium uppercase tracking-wider text-slate-600">
                Conversation
              </p>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs text-slate-500">ID</span>

                  <span className="max-w-[170px] truncate font-mono text-xs text-slate-400">
                    {conversationId || "Creating..."}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Status</span>

                  <span className="flex items-center gap-1.5 text-xs text-blue-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />

                    {conversation?.status || "Active"}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Type</span>

                  <span className="text-xs text-slate-400">
                    {conversation?.supportType || "AI"}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Messages</span>

                  <span className="text-xs text-slate-400">
                    {conversation?.messageCount ?? messages.length}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Created</span>

                  <span className="text-xs text-slate-400">
                    {formatDate(conversation?.createdAt)}
                  </span>
                </div>
              </div>
            </div>

            {/* User */}
            <div className="mt-7">
              <p className="mb-3 text-xs font-medium uppercase tracking-wider text-slate-600">
                Customer
              </p>

              <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900 p-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800">
                  <User className="h-4 w-4 text-slate-400" />
                </div>

                <div className="min-w-0">
                  <p className="truncate text-xs font-medium">
                    {user?.name || "Customer"}
                  </p>

                  <p className="truncate text-[10px] text-slate-600">
                    {user?.email || "customer@example.com"}
                  </p>
                </div>
              </div>
            </div>

            {/* Suggested Topics */}
            <div className="mt-7">
              <p className="mb-3 text-xs font-medium uppercase tracking-wider text-slate-600">
                Suggested topics
              </p>

              <div className="space-y-2">
                {[
                  "Account & login",
                  "Billing & payments",
                  "Subscriptions",
                  "Technical support",
                ].map((topic) => (
                  <button
                    type="button"
                    key={topic}
                    onClick={() => {
                      setMessage(`I need help with ${topic.toLowerCase()}.`);

                      textareaRef.current?.focus();
                    }}
                    className="flex w-full items-center justify-between rounded-lg border border-slate-800 px-3 py-2.5 text-left text-xs text-slate-500 transition hover:bg-slate-900 hover:text-slate-300"
                  >
                    <span>{topic}</span>

                    <ArrowLeft className="h-3.5 w-3.5 rotate-180" />
                  </button>
                ))}
              </div>
            </div>

            {/* Human Support */}
            <div className="mt-7 rounded-xl border border-slate-800 bg-slate-900/50 p-4">
              <div className="flex gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                  <Headphones className="h-4 w-4" />
                </div>

                <div>
                  <p className="text-xs font-medium">Human support</p>

                  <p className="mt-1 text-[10px] leading-4 text-slate-600">
                    Our support team can take over this conversation when
                    needed.
                  </p>

                  {!isEscalated && (
                    <button
                      type="button"
                      onClick={handleEscalate}
                      className="mt-2 text-[10px] font-semibold text-emerald-400 hover:text-emerald-300"
                    >
                      Request an agent →
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Chat;
