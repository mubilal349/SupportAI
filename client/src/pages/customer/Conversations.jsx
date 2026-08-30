import { useMemo, useState } from "react";
import {
  Archive,
  Bot,
  CheckCircle2,
  ChevronRight,
  Clock3,
  MessageSquare,
  MoreVertical,
  Search,
  UserRound,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";

const Conversations = () => {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

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

  const filteredConversations = useMemo(() => {
    return conversations.filter((conversation) => {
      const matchesSearch =
        conversation.title.toLowerCase().includes(search.toLowerCase()) ||
        conversation.lastMessage.toLowerCase().includes(search.toLowerCase());

      const matchesStatus = status === "all" || conversation.status === status;

      return matchesSearch && matchesStatus;
    });
  }, [conversations, search, status]);

  const archiveConversation = (id) => {
    setConversations((prev) =>
      prev.filter((conversation) => conversation.id !== id),
    );
  };

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
      {/* Header */}
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
        {/* Heading */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold">Conversations</h2>

          <p className="mt-2 text-slate-500">
            View and continue your previous support conversations.
          </p>
        </div>

        {/* Statistics */}
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

        {/* Main card */}
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

          {/* Conversations */}
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

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/support/chat?conversation=${conversation.id}`}
                        className="hidden items-center gap-1 rounded-lg px-3 py-2 text-xs font-medium text-slate-500 transition hover:bg-slate-800 hover:text-white sm:flex"
                      >
                        Open
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Link>

                      <button
                        type="button"
                        onClick={() => archiveConversation(conversation.id)}
                        className="rounded-lg p-2 text-slate-700 transition hover:bg-slate-800 hover:text-red-400"
                        title="Archive conversation"
                      >
                        <Archive className="h-4 w-4" />
                      </button>

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
