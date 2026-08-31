import { useMemo, useState } from "react";
import {
  Archive,
  Bot,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FilePlus2,
  MessageSquare,
  MoreVertical,
  Search,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";

const Conversations = () => {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  // ==========================================
  // CONVERSATIONS
  // ==========================================

  const [conversations, setConversations] = useState([
    {
      id: "CON-1001",
      title: "Unable to reset my password",
      lastMessage: "Your password reset link has been generated.",
      date: "Today, 10:42 AM",
      status: "active",
      supportType: "AI",
      unread: 2,
      messages: 8,
    },
    {
      id: "CON-1002",
      title: "Payment failed during checkout",
      lastMessage: "I've connected you with a support agent.",
      date: "Yesterday, 4:20 PM",
      status: "escalated",
      supportType: "Human",
      unread: 1,
      messages: 15,
    },
    {
      id: "CON-1003",
      title: "How can I update my email?",
      lastMessage: "You can update your email from account settings.",
      date: "Aug 28, 2026",
      status: "resolved",
      supportType: "AI",
      unread: 0,
      messages: 6,
    },
    {
      id: "CON-1004",
      title: "Subscription information",
      lastMessage: "Your current plan is Professional.",
      date: "Aug 27, 2026",
      status: "resolved",
      supportType: "AI",
      unread: 0,
      messages: 5,
    },
    {
      id: "CON-1005",
      title: "Technical issue with dashboard",
      lastMessage: "A support agent has joined the conversation.",
      date: "Aug 26, 2026",
      status: "escalated",
      supportType: "Human",
      unread: 0,
      messages: 21,
    },
  ]);

  // ==========================================
  // AI TICKET STATE
  // ==========================================

  const [ticketModalOpen, setTicketModalOpen] = useState(false);

  const [selectedConversation, setSelectedConversation] = useState(null);

  const [generatingTicket, setGeneratingTicket] = useState(false);

  const [creatingTicket, setCreatingTicket] = useState(false);

  const [ticketCreated, setTicketCreated] = useState(false);

  const [ticket, setTicket] = useState({
    subject: "",
    category: "General",
    priority: "Medium",
    description: "",
    summary: "",
  });

  // ==========================================
  // FILTER CONVERSATIONS
  // ==========================================

  const filteredConversations = useMemo(() => {
    return conversations.filter((conversation) => {
      const matchesSearch =
        conversation.title.toLowerCase().includes(search.toLowerCase()) ||
        conversation.lastMessage.toLowerCase().includes(search.toLowerCase());

      const matchesStatus = status === "all" || conversation.status === status;

      return matchesSearch && matchesStatus;
    });
  }, [conversations, search, status]);

  // ==========================================
  // ARCHIVE CONVERSATION
  // ==========================================

  const archiveConversation = (id) => {
    setConversations((prev) =>
      prev.filter((conversation) => conversation.id !== id),
    );
  };

  // ==========================================
  // OPEN AI TICKET GENERATOR
  // ==========================================

  const openTicketGenerator = async (conversation) => {
    setSelectedConversation(conversation);
    setTicketModalOpen(true);
    setTicketCreated(false);
    setGeneratingTicket(true);

    // Reset previous ticket
    setTicket({
      subject: "",
      category: "General",
      priority: "Medium",
      description: "",
      summary: "",
    });

    try {
      /*
       * ==========================================
       * TEMPORARY MOCK AI RESPONSE
       * ==========================================
       *
       * Later replace this with:
       *
       * POST /api/tickets/ai-generate
       *
       * and send:
       *
       * {
       *   conversationId: conversation.id
       * }
       *
       * Your backend will then call Ollama.
       */

      await new Promise((resolve) => setTimeout(resolve, 1200));

      const generatedTicket = generateMockTicket(conversation);

      setTicket(generatedTicket);
    } catch (error) {
      console.error("Failed to generate AI ticket:", error);
    } finally {
      setGeneratingTicket(false);
    }
  };

  // ==========================================
  // MOCK AI GENERATOR
  // ==========================================

  const generateMockTicket = (conversation) => {
    const title = conversation.title.toLowerCase();

    if (title.includes("payment") || title.includes("checkout")) {
      return {
        subject: "Payment failed during checkout",
        category: "Payment",
        priority: "High",
        description:
          "The customer reported that their payment failed during checkout and requires assistance from the support team.",
        summary:
          "Customer experienced a payment issue during checkout. The issue appears to require further investigation by the support team.",
      };
    }

    if (
      title.includes("password") ||
      title.includes("login") ||
      title.includes("account")
    ) {
      return {
        subject: "Unable to access account",
        category: "Account",
        priority: "High",
        description:
          "The customer is experiencing difficulty accessing their account and requires assistance with account recovery.",
        summary:
          "Customer is unable to access their account despite attempting the available recovery options.",
      };
    }

    if (title.includes("dashboard") || title.includes("technical")) {
      return {
        subject: "Technical issue with dashboard",
        category: "Technical",
        priority: "Medium",
        description:
          "The customer reported a technical issue affecting the dashboard and requires assistance from technical support.",
        summary:
          "Customer encountered a technical problem while using the dashboard.",
      };
    }

    return {
      subject: conversation.title,
      category: "General",
      priority: "Medium",
      description: conversation.lastMessage,
      summary: `Customer contacted SupportAI regarding "${conversation.title}". Further assistance may be required.`,
    };
  };

  // ==========================================
  // UPDATE TICKET FIELD
  // ==========================================

  const updateTicket = (field, value) => {
    setTicket((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // ==========================================
  // CREATE TICKET
  // ==========================================

  const handleCreateTicket = async () => {
    if (!ticket.subject.trim()) {
      return;
    }

    if (!ticket.description.trim()) {
      return;
    }

    setCreatingTicket(true);

    try {
      /*
       * ==========================================
       * CONNECT YOUR BACKEND HERE
       * ==========================================
       *
       * Example:
       *
       * await api.post("/tickets", {
       *   conversationId: selectedConversation.id,
       *   subject: ticket.subject,
       *   description: ticket.description,
       *   category: ticket.category,
       *   priority: ticket.priority,
       *   aiGenerated: true,
       *   aiSummary: ticket.summary,
       * });
       */

      await new Promise((resolve) => setTimeout(resolve, 1000));

      setTicketCreated(true);
    } catch (error) {
      console.error("Failed to create ticket:", error);
    } finally {
      setCreatingTicket(false);
    }
  };

  // ==========================================
  // CLOSE TICKET MODAL
  // ==========================================

  const closeTicketModal = () => {
    if (creatingTicket) return;

    setTicketModalOpen(false);
    setSelectedConversation(null);
    setTicketCreated(false);
  };

  // ==========================================
  // STATUS CONFIG
  // ==========================================

  const statusConfig = {
    active: {
      label: "Active",
      className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      icon: Clock3,
    },

    resolved: {
      label: "Resolved",
      className: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      icon: CheckCircle2,
    },

    escalated: {
      label: "Escalated",
      className: "bg-orange-500/10 text-orange-400 border-orange-500/20",
      icon: UserRound,
    },
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* ==========================================
          HEADER
      ========================================== */}

      <header className="border-b border-slate-800">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <Link
              to="/support"
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600"
            >
              <MessageSquare className="h-5 w-5" />
            </Link>

            <div>
              <h1 className="font-bold">SupportAI</h1>

              <p className="text-xs text-slate-600">Conversations</p>
            </div>
          </div>

          <Link
            to="/support/chat"
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold transition hover:bg-blue-700"
          >
            <MessageSquare className="h-4 w-4" />
            New conversation
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* ==========================================
            HEADING
        ========================================== */}

        <div className="mb-8">
          <h2 className="text-3xl font-bold">Conversations</h2>

          <p className="mt-2 text-slate-500">
            View and continue your previous support conversations.
          </p>
        </div>

        {/* ==========================================
            STATISTICS
        ========================================== */}

        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={MessageSquare}
            label="Total conversations"
            value={conversations.length}
          />

          <StatCard
            icon={Clock3}
            label="Active"
            value={
              conversations.filter((item) => item.status === "active").length
            }
          />

          <StatCard
            icon={UserRound}
            label="Escalated"
            value={
              conversations.filter((item) => item.status === "escalated").length
            }
          />

          <StatCard
            icon={CheckCircle2}
            label="Resolved"
            value={
              conversations.filter((item) => item.status === "resolved").length
            }
          />
        </div>

        {/* ==========================================
            MAIN CARD
        ========================================== */}

        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60">
          {/* Toolbar */}

          <div className="flex flex-col gap-4 border-b border-slate-800 p-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search conversations..."
                className="w-full rounded-xl border border-slate-800 bg-slate-950 py-3 pl-10 pr-4 text-sm text-white outline-none placeholder:text-slate-700 focus:border-blue-500"
              />
            </div>

            <div className="flex gap-2 overflow-x-auto">
              {[
                ["all", "All"],
                ["active", "Active"],
                ["escalated", "Escalated"],
                ["resolved", "Resolved"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setStatus(value)}
                  className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-xs font-medium transition ${
                    status === value
                      ? "bg-blue-600 text-white"
                      : "bg-slate-800 text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* ==========================================
              CONVERSATIONS
          ========================================== */}

          {filteredConversations.length > 0 ? (
            <div className="divide-y divide-slate-800">
              {filteredConversations.map((conversation) => {
                const config = statusConfig[conversation.status];

                const StatusIcon = config.icon;

                return (
                  <div
                    key={conversation.id}
                    className="group flex items-center gap-4 p-5 transition hover:bg-slate-800/30"
                  >
                    {/* Icon */}

                    <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 sm:flex">
                      {conversation.supportType === "AI" ? (
                        <Bot className="h-5 w-5" />
                      ) : (
                        <UserRound className="h-5 w-5" />
                      )}
                    </div>

                    {/* Content */}

                    <Link
                      to={`/support/chat?conversation=${conversation.id}`}
                      className="min-w-0 flex-1"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-sm font-semibold">
                          {conversation.title}
                        </h3>

                        {conversation.unread > 0 && (
                          <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold">
                            {conversation.unread}
                          </span>
                        )}
                      </div>

                      <p className="mt-1 truncate text-xs text-slate-600">
                        {conversation.lastMessage}
                      </p>

                      <div className="mt-3 flex flex-wrap items-center gap-3">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[10px] font-medium ${config.className}`}
                        >
                          <StatusIcon className="h-3 w-3" />

                          {config.label}
                        </span>

                        <span className="text-[10px] text-slate-700">
                          {conversation.supportType} support
                        </span>

                        <span className="text-[10px] text-slate-700">
                          {conversation.messages} messages
                        </span>

                        <span className="text-[10px] text-slate-700">
                          {conversation.date}
                        </span>
                      </div>
                    </Link>

                    {/* ==========================================
                          ACTIONS
                      ========================================== */}

                    <div className="flex items-center gap-2">
                      {/* AI CREATE TICKET */}

                      <button
                        type="button"
                        onClick={() => openTicketGenerator(conversation)}
                        className="hidden items-center gap-1.5 rounded-lg border border-indigo-500/20 bg-indigo-500/10 px-3 py-2 text-xs font-medium text-indigo-400 transition hover:bg-indigo-500/20 hover:text-indigo-300 sm:flex"
                        title="Create AI-generated ticket"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        Create Ticket
                      </button>

                      {/* OPEN */}

                      <Link
                        to={`/support/chat?conversation=${conversation.id}`}
                        className="hidden items-center gap-1 rounded-lg px-3 py-2 text-xs font-medium text-slate-500 transition hover:bg-slate-800 hover:text-white sm:flex"
                      >
                        Open
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Link>

                      {/* ARCHIVE */}

                      <button
                        type="button"
                        onClick={() => archiveConversation(conversation.id)}
                        className="rounded-lg p-2 text-slate-700 transition hover:bg-slate-800 hover:text-red-400"
                        title="Archive conversation"
                      >
                        <Archive className="h-4 w-4" />
                      </button>

                      {/* MORE */}

                      <button
                        type="button"
                        className="rounded-lg p-2 text-slate-700 transition hover:bg-slate-800 hover:text-slate-400"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex min-h-[350px] flex-col items-center justify-center p-8 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800 text-slate-600">
                <MessageSquare className="h-6 w-6" />
              </div>

              <h3 className="mt-5 font-semibold">No conversations found</h3>

              <p className="mt-2 max-w-sm text-sm text-slate-600">
                Try changing your search or start a new conversation with
                SupportAI.
              </p>

              <Link
                to="/support/chat"
                className="mt-5 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold hover:bg-blue-700"
              >
                Start conversation
              </Link>
            </div>
          )}
        </div>
      </main>

      {/* ==========================================
          AI TICKET MODAL
      ========================================== */}

      {ticketModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">
            {/* Modal Header */}

            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
                  <Sparkles className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="font-semibold">AI Ticket Creation</h2>

                  <p className="text-xs text-slate-500">
                    SupportAI generated this ticket from your conversation.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeTicketModal}
                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Loading */}

            {generatingTicket ? (
              <div className="flex min-h-[420px] flex-col items-center justify-center px-6 text-center">
                <div className="flex h-14 w-14 animate-pulse items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400">
                  <Bot className="h-7 w-7" />
                </div>

                <h3 className="mt-5 font-semibold">
                  Analyzing your conversation...
                </h3>

                <p className="mt-2 max-w-sm text-sm text-slate-500">
                  SupportAI is generating a clear ticket summary, category,
                  priority, and description.
                </p>

                <div className="mt-6 flex gap-1">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-indigo-400" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-indigo-400 [animation-delay:150ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-indigo-400 [animation-delay:300ms]" />
                </div>
              </div>
            ) : ticketCreated ? (
              /* ==========================================
                 SUCCESS STATE
              ========================================== */

              <div className="flex min-h-[420px] flex-col items-center justify-center px-6 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                  <CheckCircle2 className="h-8 w-8" />
                </div>

                <h3 className="mt-5 text-xl font-bold">
                  Ticket created successfully
                </h3>

                <p className="mt-2 max-w-md text-sm text-slate-500">
                  Your support ticket has been created and will be reviewed by
                  our support team.
                </p>

                <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950 px-5 py-4">
                  <p className="text-xs text-slate-500">Ticket ID</p>

                  <p className="mt-1 font-semibold text-white">
                    TKT-{Date.now().toString().slice(-6)}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeTicketModal}
                  className="mt-6 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold transition hover:bg-blue-700"
                >
                  Done
                </button>
              </div>
            ) : (
              /* ==========================================
                 TICKET FORM
              ========================================== */

              <div className="max-h-[75vh] overflow-y-auto p-6">
                {/* Conversation */}

                {selectedConversation && (
                  <div className="mb-6 rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-slate-500" />

                      <span className="text-xs font-medium text-slate-500">
                        Based on conversation
                      </span>
                    </div>

                    <p className="mt-2 text-sm font-medium text-slate-200">
                      {selectedConversation.title}
                    </p>

                    <p className="mt-1 text-xs text-slate-600">
                      {selectedConversation.messages} messages
                    </p>
                  </div>
                )}

                {/* AI Notice */}

                <div className="mb-6 flex gap-3 rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4">
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-indigo-400" />

                  <p className="text-xs leading-5 text-slate-400">
                    SupportAI generated the information below from your
                    conversation. Review and edit anything before submitting the
                    ticket.
                  </p>
                </div>

                {/* Subject */}

                <div className="mb-5">
                  <label className="mb-2 block text-xs font-medium text-slate-400">
                    Subject
                  </label>

                  <input
                    type="text"
                    value={ticket.subject}
                    onChange={(e) => updateTicket("subject", e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-700 focus:border-indigo-500"
                    placeholder="Ticket subject"
                  />
                </div>

                {/* Category + Priority */}

                <div className="mb-5 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-xs font-medium text-slate-400">
                      Category
                    </label>

                    <select
                      value={ticket.category}
                      onChange={(e) => updateTicket("category", e.target.value)}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-indigo-500"
                    >
                      <option value="General">General</option>

                      <option value="Account">Account</option>

                      <option value="Payment">Payment</option>

                      <option value="Technical">Technical</option>

                      <option value="Billing">Billing</option>

                      <option value="Security">Security</option>

                      <option value="Subscription">Subscription</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-medium text-slate-400">
                      Priority
                    </label>

                    <select
                      value={ticket.priority}
                      onChange={(e) => updateTicket("priority", e.target.value)}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-indigo-500"
                    >
                      <option value="Low">Low</option>

                      <option value="Medium">Medium</option>

                      <option value="High">High</option>

                      <option value="Urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                {/* Description */}

                <div className="mb-5">
                  <label className="mb-2 block text-xs font-medium text-slate-400">
                    Description
                  </label>

                  <textarea
                    value={ticket.description}
                    onChange={(e) =>
                      updateTicket("description", e.target.value)
                    }
                    rows={5}
                    className="w-full resize-none rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-slate-700 focus:border-indigo-500"
                    placeholder="Describe your issue..."
                  />
                </div>

                {/* AI Summary */}

                <div className="mb-6">
                  <label className="mb-2 flex items-center gap-2 text-xs font-medium text-slate-400">
                    <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                    AI Summary
                  </label>

                  <textarea
                    value={ticket.summary}
                    onChange={(e) => updateTicket("summary", e.target.value)}
                    rows={4}
                    className="w-full resize-none rounded-xl border border-indigo-500/20 bg-indigo-500/5 px-4 py-3 text-sm leading-6 text-slate-300 outline-none transition focus:border-indigo-500"
                    placeholder="AI-generated summary..."
                  />
                </div>

                {/* Actions */}

                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={closeTicketModal}
                    disabled={creatingTicket}
                    className="rounded-xl border border-slate-800 px-5 py-3 text-sm font-medium text-slate-400 transition hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleCreateTicket}
                    disabled={
                      creatingTicket ||
                      !ticket.subject.trim() ||
                      !ticket.description.trim()
                    }
                    className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {creatingTicket ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <FilePlus2 className="h-4 w-4" />
                        Create Support Ticket
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value }) => {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
      <div className="flex items-center justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
          <Icon className="h-4 w-4" />
        </div>

        <span className="text-2xl font-bold">{value}</span>
      </div>

      <p className="mt-4 text-xs text-slate-600">{label}</p>
    </div>
  );
};

export default Conversations;
