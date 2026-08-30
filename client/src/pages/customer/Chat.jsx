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
  MessageSquare,
  Paperclip,
  Plus,
  Send,
  Smile,
  Sparkles,
  User,
  X,
  Zap,
} from "lucide-react";
import { Link } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

const Chat = () => {
  const { user } = useAuth();

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: "ai",
      content: "Hi! I'm SupportAI 👋 How can I help you today?",
      time: "10:32 PM",
      status: "read",
    },
    {
      id: 2,
      sender: "ai",
      content:
        "You can ask me about your account, billing, subscriptions, technical problems, or anything else related to our service.",
      time: "10:32 PM",
      status: "read",
    },
  ]);

  const [isTyping, setIsTyping] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMobileInfo, setShowMobileInfo] = useState(false);
  const [isEscalated, setIsEscalated] = useState(false);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, isTyping]);

  const sendMessage = async (e) => {
    e?.preventDefault();

    const trimmedMessage = message.trim();

    if (!trimmedMessage || isTyping) {
      return;
    }

    const userMessage = {
      id: Date.now(),
      sender: "user",
      content: trimmedMessage,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      status: "sent",
    };

    setMessages((prev) => [...prev, userMessage]);
    setMessage("");
    setShowEmojiPicker(false);
    setShowAttachmentMenu(false);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    /*
     * Temporary AI response.
     *
     * Later this will become:
     *
     * POST /api/conversations/:conversationId/messages
     *
     * and your backend will call your AI service.
     */

    setIsTyping(true);

    setTimeout(() => {
      const aiMessage = {
        id: Date.now() + 1,
        sender: "ai",
        content: generateAIResponse(trimmedMessage),
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        status: "read",
      };

      setMessages((prev) => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1400);
  };

  const generateAIResponse = (text) => {
    const lowerText = text.toLowerCase();

    if (lowerText.includes("password") || lowerText.includes("login")) {
      return 'I can help with that. You can reset your password from the login page by selecting "Forgot password?". If you\'re still unable to access your account, I can connect you with a support agent.';
    }

    if (
      lowerText.includes("payment") ||
      lowerText.includes("billing") ||
      lowerText.includes("invoice")
    ) {
      return "I can help you with billing and payments. Could you tell me whether you're having trouble with a payment, invoice, or payment method?";
    }

    if (lowerText.includes("subscription") || lowerText.includes("cancel")) {
      return "I can help you manage your subscription. If you'd like to cancel, I can guide you through the process or connect you with a support specialist.";
    }

    if (lowerText.includes("agent") || lowerText.includes("human")) {
      return "Absolutely. I can connect you with a human support agent. They will be able to take a closer look at your issue.";
    }

    return "Thanks for explaining that. I'm here to help. Could you provide a little more detail about the problem you're experiencing?";
  };

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

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    const fileMessage = {
      id: Date.now(),
      sender: "user",
      content: `📎 ${file.name}`,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
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

  const handleEscalate = () => {
    setIsEscalated(true);

    const escalationMessage = {
      id: Date.now(),
      sender: "system",
      content:
        "You've requested human support. A support agent will join this conversation shortly.",
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, escalationMessage]);
  };

  const addEmoji = (emoji) => {
    setMessage((prev) => `${prev}${emoji}`);
    setShowEmojiPicker(false);
    textareaRef.current?.focus();
  };

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

              <p className="text-sm font-medium">General Support</p>
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
                  Today
                </div>
              </div>

              {/* Welcome Card */}
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
                          <Bot className="h-4 w-4" />
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
                  disabled={isTyping}
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
                    disabled={!message.trim() || isTyping}
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
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">ID</span>

                  <span className="font-mono text-xs text-slate-400">
                    CON-1005
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Status</span>

                  <span className="flex items-center gap-1.5 text-xs text-blue-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                    Active
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Created</span>

                  <span className="text-xs text-slate-400">Today</span>
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
