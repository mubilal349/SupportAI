import React from "react";
import {
  Activity,
  ArrowUpRight,
  Bot,
  CheckCircle2,
  Headphones,
  MessageSquare,
  MoreHorizontal,
  ShieldCheck,
  Ticket,
  TrendingUp,
  Users,
  X,
  Zap,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";

const Dashboard = () => {
  const { user, logout } = useAuth();

  // ============================================================
  // DEMO STATS
  // ============================================================

  const stats = [
    {
      title: "Total Conversations",
      value: "1,284",
      change: "+12.5%",
      description: "from last month",
      icon: MessageSquare,
    },
    {
      title: "AI Resolved",
      value: "842",
      change: "+18.2%",
      description: "from last month",
      icon: Bot,
    },
    {
      title: "Open Tickets",
      value: "126",
      change: "-8.4%",
      description: "from last month",
      icon: Ticket,
    },
    {
      title: "Active Agents",
      value: "24",
      change: "+4.5%",
      description: "from last month",
      icon: Users,
    },
  ];

  // ============================================================
  // RECENT CONVERSATIONS
  // ============================================================

  const recentConversations = [
    {
      id: "#CON-1024",
      customer: "Sarah Johnson",
      subject: "Unable to update payment method",
      status: "Open",
      priority: "High",
      time: "2 min ago",
    },
    {
      id: "#CON-1023",
      customer: "Michael Smith",
      subject: "How can I reset my password?",
      status: "AI Resolved",
      priority: "Low",
      time: "8 min ago",
    },
    {
      id: "#CON-1022",
      customer: "Emma Wilson",
      subject: "Subscription cancellation request",
      status: "Assigned",
      priority: "Medium",
      time: "15 min ago",
    },
    {
      id: "#CON-1021",
      customer: "David Brown",
      subject: "Invoice not received",
      status: "Resolved",
      priority: "Medium",
      time: "32 min ago",
    },
    {
      id: "#CON-1020",
      customer: "Olivia Davis",
      subject: "Account verification problem",
      status: "Open",
      priority: "High",
      time: "45 min ago",
    },
  ];

  // ============================================================
  // AGENTS
  // ============================================================

  const agents = [
    {
      name: "James Anderson",
      initials: "JA",
      status: "Online",
      conversations: 18,
      resolved: 14,
    },
    {
      name: "Sophia Williams",
      initials: "SW",
      status: "Online",
      conversations: 12,
      resolved: 10,
    },
    {
      name: "Daniel Miller",
      initials: "DM",
      status: "Away",
      conversations: 9,
      resolved: 7,
    },
    {
      name: "Emily Taylor",
      initials: "ET",
      status: "Online",
      conversations: 15,
      resolved: 12,
    },
  ];

  // ============================================================
  // ACTIVITY
  // ============================================================

  const activity = [
    {
      icon: Bot,
      title: "AI resolved a conversation",
      description: "Password reset request",
      time: "3 min ago",
    },
    {
      icon: Headphones,
      title: "Agent joined a conversation",
      description: "James joined #CON-1024",
      time: "7 min ago",
    },
    {
      icon: Ticket,
      title: "New ticket created",
      description: "Subscription cancellation",
      time: "14 min ago",
    },
    {
      icon: CheckCircle2,
      title: "Conversation resolved",
      description: "Invoice delivery issue",
      time: "28 min ago",
    },
  ];

  // ============================================================
  // STATUS STYLES
  // ============================================================

  const getStatusStyles = (status) => {
    switch (status) {
      case "Open":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";

      case "AI Resolved":
        return "bg-purple-500/10 text-purple-400 border-purple-500/20";

      case "Assigned":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";

      case "Resolved":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";

      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    }
  };

  // ============================================================
  // PRIORITY STYLES
  // ============================================================

  const getPriorityStyles = (priority) => {
    switch (priority) {
      case "High":
        return "text-red-400";

      case "Medium":
        return "text-amber-400";

      case "Low":
        return "text-emerald-400";

      default:
        return "text-slate-400";
    }
  };

  // ============================================================
  // DASHBOARD
  // ============================================================

  return (
    <div className="min-h-full bg-slate-950 text-white">
      <main className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {/* ====================================================
            PAGE HEADING
        ==================================================== */}

        <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div>
            <p className="mb-2 text-sm text-slate-500">
              Sunday, August 30, 2026
            </p>

            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Good evening, {user?.name?.split(" ")[0] || "Admin"}
            </h2>

            <p className="mt-2 max-w-2xl text-sm text-slate-400 sm:text-base">
              Here's what's happening with your support team today.
            </p>
          </div>

          <button
            type="button"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold transition hover:bg-blue-700 md:w-auto"
          >
            <Zap className="h-4 w-4" />
            View live support
          </button>
        </div>

        {/* ====================================================
            STATS
        ==================================================== */}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <div
                key={stat.title}
                className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 transition hover:border-slate-700"
              >
                <div className="mb-5 flex items-start justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                    <Icon className="h-5 w-5" />
                  </div>

                  <button
                    type="button"
                    className="text-slate-600 transition hover:text-slate-300"
                    aria-label={`More options for ${stat.title}`}
                  >
                    <MoreHorizontal className="h-5 w-5" />
                  </button>
                </div>

                <p className="text-sm text-slate-500">{stat.title}</p>

                <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
                  <p className="text-3xl font-bold tracking-tight">
                    {stat.value}
                  </p>

                  <span className="mb-1 inline-flex items-center gap-1 text-xs font-semibold text-emerald-400">
                    <TrendingUp className="h-3.5 w-3.5" />
                    {stat.change}
                  </span>
                </div>

                <p className="mt-1 text-xs text-slate-600">
                  {stat.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* ====================================================
            ANALYTICS
        ==================================================== */}

        <div className="mt-6 grid gap-6 xl:grid-cols-3">
          {/* Conversation Analytics */}

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6 xl:col-span-2">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-semibold">Conversation Overview</h3>

                <p className="mt-1 text-sm text-slate-500">
                  Support activity over the last 7 days
                </p>
              </div>

              <select
                defaultValue="7"
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-400 outline-none focus:border-blue-500 sm:w-auto"
              >
                <option value="7">Last 7 days</option>

                <option value="30">Last 30 days</option>

                <option value="90">Last 90 days</option>
              </select>
            </div>

            {/* Chart */}

            <div className="flex h-56 items-end gap-2 border-b border-slate-800 px-1 sm:h-64 sm:gap-3 sm:px-2">
              {[42, 55, 48, 72, 64, 88, 76].map((height, index) => (
                <div
                  key={index}
                  className="group flex h-full flex-1 flex-col justify-end"
                >
                  <div
                    className="relative w-full rounded-t-lg bg-blue-500/30 transition group-hover:bg-blue-500/50"
                    style={{
                      height: `${height}%`,
                    }}
                  >
                    <div
                      className="absolute bottom-0 left-0 right-0 rounded-t-lg bg-blue-500"
                      style={{
                        height: `${Math.max(35, height - 15)}%`,
                      }}
                    />
                  </div>

                  <span className="mt-3 text-center text-[10px] text-slate-600 sm:text-xs">
                    {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][index]}
                  </span>
                </div>
              ))}
            </div>

            {/* Analytics numbers */}

            <div className="mt-6 grid grid-cols-3 gap-3 sm:gap-4">
              <div>
                <p className="text-xs text-slate-500">Conversations</p>

                <p className="mt-1 text-lg font-bold sm:text-xl">1,284</p>
              </div>

              <div>
                <p className="text-xs text-slate-500">AI Resolution</p>

                <p className="mt-1 text-lg font-bold text-purple-400 sm:text-xl">
                  65.6%
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-500">Satisfaction</p>

                <p className="mt-1 text-lg font-bold text-emerald-400 sm:text-xl">
                  94.2%
                </p>
              </div>
            </div>
          </div>

          {/* AI Performance */}

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h3 className="font-semibold">AI Performance</h3>

                <p className="mt-1 text-sm text-slate-500">
                  AI support effectiveness
                </p>
              </div>

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
                <Bot className="h-5 w-5" />
              </div>
            </div>

            <div className="flex items-center justify-center py-4">
              <div className="relative flex h-36 w-36 items-center justify-center rounded-full border-[14px] border-purple-500/20 sm:h-40 sm:w-40">
                <div className="absolute inset-[-14px] rounded-full border-[14px] border-transparent border-t-purple-500 border-r-purple-500" />

                <div className="text-center">
                  <p className="text-3xl font-bold">65.6%</p>

                  <p className="text-xs text-slate-500">AI resolved</p>
                </div>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-slate-400">Resolved by AI</span>

                <span className="font-semibold">842</span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-slate-400">
                  Escalated to agents
                </span>

                <span className="font-semibold">442</span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-slate-400">Avg. response</span>

                <span className="font-semibold">1.8s</span>
              </div>
            </div>
          </div>
        </div>

        {/* ====================================================
            RECENT CONVERSATIONS + AGENTS
        ==================================================== */}

        <div className="mt-6 grid gap-6 xl:grid-cols-3">
          {/* Recent Conversations */}

          <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 xl:col-span-2">
            <div className="flex flex-col gap-3 border-b border-slate-800 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div>
                <h3 className="font-semibold">Recent Conversations</h3>

                <p className="mt-1 text-sm text-slate-500">
                  Latest customer support activity
                </p>
              </div>

              <button
                type="button"
                className="inline-flex w-fit items-center gap-1 text-sm font-medium text-blue-400 transition hover:text-blue-300"
              >
                View all
                <ArrowUpRight className="h-4 w-4" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="border-b border-slate-800 text-left text-xs uppercase tracking-wider text-slate-600">
                    <th className="px-6 py-4 font-medium">Customer</th>

                    <th className="px-6 py-4 font-medium">Subject</th>

                    <th className="px-6 py-4 font-medium">Priority</th>

                    <th className="px-6 py-4 font-medium">Status</th>

                    <th className="px-6 py-4 font-medium">Time</th>
                  </tr>
                </thead>

                <tbody>
                  {recentConversations.map((conversation) => (
                    <tr
                      key={conversation.id}
                      className="border-b border-slate-800/70 transition last:border-0 hover:bg-slate-800/20"
                    >
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium">
                            {conversation.customer}
                          </p>

                          <p className="mt-0.5 text-xs text-slate-600">
                            {conversation.id}
                          </p>
                        </div>
                      </td>

                      <td className="max-w-xs px-6 py-4">
                        <p className="truncate text-sm text-slate-400">
                          {conversation.subject}
                        </p>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`text-xs font-semibold ${getPriorityStyles(
                            conversation.priority,
                          )}`}
                        >
                          {conversation.priority}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusStyles(
                            conversation.status,
                          )}`}
                        >
                          {conversation.status}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-6 py-4 text-xs text-slate-600">
                        {conversation.time}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Agent Performance */}

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60">
            <div className="border-b border-slate-800 px-5 py-5 sm:px-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Agent Performance</h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Today's team activity
                  </p>
                </div>

                <Users className="h-5 w-5 text-slate-600" />
              </div>
            </div>

            <div className="divide-y divide-slate-800">
              {agents.map((agent) => (
                <div key={agent.name} className="px-5 py-4 sm:px-6">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 text-xs font-semibold">
                        {agent.initials}
                      </div>

                      <span
                        className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-slate-900 ${
                          agent.status === "Online"
                            ? "bg-emerald-500"
                            : "bg-amber-500"
                        }`}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {agent.name}
                      </p>

                      <p className="text-xs text-slate-600">{agent.status}</p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-semibold">{agent.resolved}</p>

                      <p className="text-xs text-slate-600">resolved</p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs text-slate-600">
                    <span>{agent.conversations} conversations</span>

                    <span>
                      {Math.round((agent.resolved / agent.conversations) * 100)}
                      % resolution
                    </span>
                  </div>

                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full bg-blue-500"
                      style={{
                        width: `${
                          (agent.resolved / agent.conversations) * 100
                        }%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ====================================================
            ACTIVITY + SYSTEM HEALTH
        ==================================================== */}

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {/* Activity */}

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60">
            <div className="border-b border-slate-800 px-5 py-5 sm:px-6">
              <h3 className="font-semibold">Recent Activity</h3>

              <p className="mt-1 text-sm text-slate-500">
                Latest events across your workspace
              </p>
            </div>

            <div className="divide-y divide-slate-800">
              {activity.map((item, index) => {
                const Icon = item.icon;

                return (
                  <div
                    key={index}
                    className="flex items-center gap-4 px-5 py-4 sm:px-6"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-slate-400">
                      <Icon className="h-5 w-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{item.title}</p>

                      <p className="mt-0.5 truncate text-xs text-slate-600">
                        {item.description}
                      </p>
                    </div>

                    <span className="whitespace-nowrap text-xs text-slate-600">
                      {item.time}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* System Health */}

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60">
            <div className="border-b border-slate-800 px-5 py-5 sm:px-6">
              <h3 className="font-semibold">System Health</h3>

              <p className="mt-1 text-sm text-slate-500">
                SupportAI service status
              </p>
            </div>

            <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
              {[
                {
                  name: "API Server",
                  status: "Operational",
                  icon: ShieldCheck,
                },
                {
                  name: "AI Service",
                  status: "Operational",
                  icon: Bot,
                },
                {
                  name: "Database",
                  status: "Operational",
                  icon: Activity,
                },
                {
                  name: "Real-time Chat",
                  status: "Operational",
                  icon: MessageSquare,
                },
              ].map((service) => {
                const Icon = service.icon;

                return (
                  <div
                    key={service.name}
                    className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/50 p-4"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                      <Icon className="h-5 w-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {service.name}
                      </p>

                      <div className="mt-1 flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />

                        <span className="text-xs text-emerald-400">
                          {service.status}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
