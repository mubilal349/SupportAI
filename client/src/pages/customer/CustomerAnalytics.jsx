import { useMemo, useState } from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Bot,
  CheckCircle2,
  Clock3,
  Headphones,
  MessageSquare,
  RefreshCw,
  Star,
  Ticket,
  TrendingUp,
  UserRound,
} from "lucide-react";

const CustomerAnalytics = () => {
  const [period, setPeriod] = useState("7d");

  // Replace these with API data later.
  const analytics = {
    totalConversations: 24,
    previousConversations: 19,

    aiResolved: 18,
    humanResolved: 4,

    openTickets: 2,
    resolvedTickets: 12,

    satisfaction: 94,
    previousSatisfaction: 91,

    avgResponseTime: "1m 42s",
    previousResponseTime: "2m 18s",

    totalMessages: 186,
    aiMessages: 121,
    agentMessages: 65,
  };

  const activityData = useMemo(() => {
    if (period === "30d") {
      return [
        { label: "Aug 2", conversations: 3, tickets: 1 },
        { label: "Aug 6", conversations: 5, tickets: 2 },
        { label: "Aug 10", conversations: 4, tickets: 1 },
        { label: "Aug 14", conversations: 7, tickets: 2 },
        { label: "Aug 18", conversations: 5, tickets: 1 },
        { label: "Aug 22", conversations: 8, tickets: 2 },
        { label: "Aug 26", conversations: 6, tickets: 1 },
        { label: "Aug 30", conversations: 9, tickets: 2 },
      ];
    }

    if (period === "90d") {
      return [
        { label: "Jun", conversations: 18, tickets: 6 },
        { label: "Jul", conversations: 25, tickets: 8 },
        { label: "Aug", conversations: 31, tickets: 10 },
      ];
    }

    return [
      { label: "Mon", conversations: 2, tickets: 0 },
      { label: "Tue", conversations: 4, tickets: 1 },
      { label: "Wed", conversations: 3, tickets: 0 },
      { label: "Thu", conversations: 5, tickets: 1 },
      { label: "Fri", conversations: 3, tickets: 0 },
      { label: "Sat", conversations: 4, tickets: 1 },
      { label: "Sun", conversations: 3, tickets: 0 },
    ];
  }, [period]);

  const maxActivity = Math.max(
    ...activityData.map((item) => item.conversations),
    1,
  );

  const conversationChange = Math.round(
    ((analytics.totalConversations - analytics.previousConversations) /
      analytics.previousConversations) *
      100,
  );

  const satisfactionChange =
    analytics.satisfaction - analytics.previousSatisfaction;

  const resolutionRate = Math.round(
    ((analytics.aiResolved + analytics.humanResolved) /
      analytics.totalConversations) *
      100,
  );

  const aiResolutionRate = Math.round(
    (analytics.aiResolved / (analytics.aiResolved + analytics.humanResolved)) *
      100,
  );

  const ticketTotal = analytics.openTickets + analytics.resolvedTickets;

  const openTicketPercentage =
    ticketTotal > 0
      ? Math.round((analytics.openTickets / ticketTotal) * 100)
      : 0;

  const resolvedTicketPercentage =
    ticketTotal > 0
      ? Math.round((analytics.resolvedTickets / ticketTotal) * 100)
      : 0;

  const statCards = [
    {
      title: "Conversations",
      value: analytics.totalConversations,
      icon: MessageSquare,
      change: `${conversationChange >= 0 ? "+" : ""}${conversationChange}%`,
      description: "vs previous period",
      positive: conversationChange >= 0,
    },
    {
      title: "Resolution Rate",
      value: `${resolutionRate}%`,
      icon: CheckCircle2,
      change: "+6%",
      description: "issues resolved",
      positive: true,
    },
    {
      title: "Avg. Response Time",
      value: analytics.avgResponseTime,
      icon: Clock3,
      change: "-36s",
      description: "faster than before",
      positive: true,
    },
    {
      title: "Satisfaction",
      value: `${analytics.satisfaction}%`,
      icon: Star,
      change: `+${satisfactionChange}%`,
      description: "customer rating",
      positive: true,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm text-slate-400">
              <Activity size={16} />
              Customer Analytics
            </div>

            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Your Support Analytics
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-slate-400">
              Track your conversations, support requests, AI assistance, and
              overall support experience.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm text-slate-200 outline-none transition focus:border-indigo-500"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>

            <button
              className="rounded-xl border border-slate-800 bg-slate-900 p-2.5 text-slate-400 transition hover:bg-slate-800 hover:text-white"
              title="Refresh analytics"
            >
              <RefreshCw size={18} />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {statCards.map((card) => {
            const Icon = card.icon;

            return (
              <div
                key={card.title}
                className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg shadow-black/10"
              >
                <div className="flex items-start justify-between">
                  <div className="rounded-xl bg-indigo-500/10 p-3 text-indigo-400">
                    <Icon size={21} />
                  </div>

                  <div
                    className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
                      card.positive
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "bg-rose-500/10 text-rose-400"
                    }`}
                  >
                    {card.positive ? (
                      <ArrowUpRight size={13} />
                    ) : (
                      <ArrowDownRight size={13} />
                    )}

                    {card.change}
                  </div>
                </div>

                <div className="mt-5">
                  <p className="text-sm text-slate-400">{card.title}</p>
                  <h2 className="mt-1 text-2xl font-bold text-white">
                    {card.value}
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    {card.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Main Analytics */}
        <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
          {/* Activity Chart */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 xl:col-span-2">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-semibold text-white">Support Activity</h2>
                <p className="mt-1 text-xs text-slate-500">
                  Your conversations and support tickets
                </p>
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-400">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-indigo-400" />
                  Conversations
                </span>

                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  Tickets
                </span>
              </div>
            </div>

            <div className="mt-8 flex h-64 items-end gap-3 overflow-x-auto pb-6">
              {activityData.map((item) => {
                const conversationHeight =
                  (item.conversations / maxActivity) * 100;

                const ticketHeight = Math.max(
                  (item.tickets / maxActivity) * 100,
                  4,
                );

                return (
                  <div
                    key={item.label}
                    className="flex min-w-[52px] flex-1 flex-col items-center justify-end gap-2"
                  >
                    <div className="flex h-48 w-full max-w-[46px] items-end justify-center gap-1">
                      <div
                        className="w-3 rounded-t-md bg-indigo-500 transition-all"
                        style={{
                          height: `${conversationHeight}%`,
                        }}
                        title={`${item.conversations} conversations`}
                      />

                      <div
                        className="w-3 rounded-t-md bg-emerald-500 transition-all"
                        style={{
                          height: `${ticketHeight}%`,
                        }}
                        title={`${item.tickets} tickets`}
                      />
                    </div>

                    <span className="whitespace-nowrap text-[10px] text-slate-500">
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Resolution Overview */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <div>
              <h2 className="font-semibold text-white">Resolution Overview</h2>

              <p className="mt-1 text-xs text-slate-500">
                How your support issues were resolved
              </p>
            </div>

            <div className="mt-8 flex justify-center">
              <div className="relative flex h-44 w-44 items-center justify-center rounded-full border-[18px] border-slate-800">
                <div
                  className="absolute inset-[-18px] rounded-full border-[18px] border-indigo-500"
                  style={{
                    clipPath: `polygon(
                      0 0,
                      100% 0,
                      100% ${aiResolutionRate}%,
                      0 ${aiResolutionRate}%
                    )`,
                  }}
                />

                <div className="text-center">
                  <p className="text-3xl font-bold">{aiResolutionRate}%</p>
                  <p className="text-xs text-slate-500">AI resolved</p>
                </div>
              </div>
            </div>

            <div className="mt-8 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-indigo-500/10 p-2 text-indigo-400">
                    <Bot size={17} />
                  </div>

                  <div>
                    <p className="text-sm text-slate-200">AI Support</p>
                    <p className="text-xs text-slate-500">
                      Automatically resolved
                    </p>
                  </div>
                </div>

                <span className="font-semibold">{analytics.aiResolved}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400">
                    <Headphones size={17} />
                  </div>

                  <div>
                    <p className="text-sm text-slate-200">Human Support</p>
                    <p className="text-xs text-slate-500">Resolved by agents</p>
                  </div>
                </div>

                <span className="font-semibold">{analytics.humanResolved}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Lower Section */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Ticket Overview */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-white">Ticket Overview</h2>

                <p className="mt-1 text-xs text-slate-500">
                  Current status of your support tickets
                </p>
              </div>

              <div className="rounded-xl bg-indigo-500/10 p-3 text-indigo-400">
                <Ticket size={20} />
              </div>
            </div>

            <div className="mt-6">
              <div className="mb-3 flex items-center justify-between text-sm">
                <span className="text-slate-400">Ticket resolution</span>

                <span className="font-medium text-white">
                  {resolvedTicketPercentage}%
                </span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all"
                  style={{
                    width: `${resolvedTicketPercentage}%`,
                  }}
                />
              </div>
            </div>

            <div className="mt-7 grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                <div className="flex items-center gap-2 text-amber-400">
                  <Clock3 size={17} />
                  <span className="text-sm">Open</span>
                </div>

                <p className="mt-3 text-2xl font-bold">
                  {analytics.openTickets}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  {openTicketPercentage}% of tickets
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                <div className="flex items-center gap-2 text-emerald-400">
                  <CheckCircle2 size={17} />
                  <span className="text-sm">Resolved</span>
                </div>

                <p className="mt-3 text-2xl font-bold">
                  {analytics.resolvedTickets}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  {resolvedTicketPercentage}% of tickets
                </p>
              </div>
            </div>
          </div>

          {/* Support Method */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <div>
              <h2 className="font-semibold text-white">Support Usage</h2>

              <p className="mt-1 text-xs text-slate-500">
                How you interacted with SupportAI
              </p>
            </div>

            <div className="mt-6 space-y-6">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bot size={17} className="text-indigo-400" />
                    <span className="text-sm text-slate-300">AI Assistant</span>
                  </div>

                  <span className="text-sm font-semibold">
                    {analytics.aiMessages}
                  </span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-indigo-500"
                    style={{
                      width: `${
                        (analytics.aiMessages / analytics.totalMessages) * 100
                      }%`,
                    }}
                  />
                </div>

                <p className="mt-2 text-xs text-slate-500">
                  {Math.round(
                    (analytics.aiMessages / analytics.totalMessages) * 100,
                  )}
                  % of your messages
                </p>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserRound size={17} className="text-emerald-400" />
                    <span className="text-sm text-slate-300">Human Agents</span>
                  </div>

                  <span className="text-sm font-semibold">
                    {analytics.agentMessages}
                  </span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{
                      width: `${
                        (analytics.agentMessages / analytics.totalMessages) *
                        100
                      }%`,
                    }}
                  />
                </div>

                <p className="mt-2 text-xs text-slate-500">
                  {Math.round(
                    (analytics.agentMessages / analytics.totalMessages) * 100,
                  )}
                  % of your messages
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-white">
                Recent Support Activity
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Your latest interactions with SupportAI
              </p>
            </div>

            <TrendingUp size={20} className="text-indigo-400" />
          </div>

          <div className="mt-5 divide-y divide-slate-800">
            {[
              {
                icon: Bot,
                title: "AI resolved your payment question",
                time: "Today, 10:42 PM",
                type: "AI Support",
              },
              {
                icon: Ticket,
                title: "Ticket #10482 was updated",
                time: "Yesterday, 4:20 PM",
                type: "Support Ticket",
              },
              {
                icon: Headphones,
                title: "You contacted a support agent",
                time: "Aug 29, 2:14 PM",
                type: "Human Support",
              },
              {
                icon: CheckCircle2,
                title: "Ticket #10471 was resolved",
                time: "Aug 28, 11:05 AM",
                type: "Resolved",
              },
            ].map((activity, index) => {
              const Icon = activity.icon;

              return (
                <div key={index} className="flex items-center gap-4 py-4">
                  <div className="rounded-xl bg-slate-800 p-2.5 text-slate-300">
                    <Icon size={18} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-200">
                      {activity.title}
                    </p>

                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-xs text-slate-500">
                        {activity.type}
                      </span>

                      <span className="text-slate-700">•</span>

                      <span className="text-xs text-slate-500">
                        {activity.time}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerAnalytics;
