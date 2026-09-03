import { useCallback, useEffect, useMemo, useState } from "react";

import {
  Activity,
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  Bot,
  CheckCircle2,
  Clock3,
  Headphones,
  Loader2,
  MessageSquare,
  RefreshCw,
  Star,
  Ticket,
  TrendingUp,
  UserRound,
} from "lucide-react";

import { getCustomerAnalytics } from "../../services/analyticsService";

/*
 * =========================================================
 * HELPERS
 * =========================================================
 */

const PERIODS = [
  {
    key: "7d",
    label: "7 Days",
  },
  {
    key: "30d",
    label: "30 Days",
  },
  {
    key: "90d",
    label: "90 Days",
  },
];

const formatNumber = (value) => {
  const number = Number(value || 0);

  return number.toLocaleString();
};

const formatPercentage = (value) => {
  const number = Number(value || 0);

  return `${Math.round(number)}%`;
};

const formatDuration = (seconds) => {
  const totalSeconds = Number(seconds || 0);

  if (!totalSeconds || totalSeconds < 0) {
    return "0s";
  }

  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secs = Math.floor(totalSeconds % 60);

  if (days > 0) {
    return `${days}d ${hours}h`;
  }

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  }

  return `${secs}s`;
};

const getChangeValue = (current, previous) => {
  const currentValue = Number(current || 0);
  const previousValue = Number(previous || 0);

  if (previousValue === 0) {
    if (currentValue === 0) {
      return 0;
    }

    return 100;
  }

  return Math.round(((currentValue - previousValue) / previousValue) * 100);
};

const getChangeText = (value) => {
  if (value > 0) {
    return `+${value}%`;
  }

  return `${value}%`;
};

const getStatusLabel = (status) => {
  const labels = {
    open: "Open",
    "in-progress": "In Progress",
    waiting: "Waiting",
    resolved: "Resolved",
    closed: "Closed",
  };

  return labels[status] || status;
};

const getPriorityLabel = (priority) => {
  const labels = {
    low: "Low",
    medium: "Medium",
    high: "High",
  };

  return labels[priority] || priority;
};

const getCategoryLabel = (category) => {
  return category || "General";
};

/*
 * =========================================================
 * COMPONENT
 * =========================================================
 */

export default function CustomerAnalytics() {
  const [period, setPeriod] = useState("7d");

  const [analytics, setAnalytics] = useState(null);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  /*
   * =======================================================
   * FETCH ANALYTICS
   * =======================================================
   */

  const loadAnalytics = useCallback(
    async (showRefreshLoader = false) => {
      try {
        setError("");

        if (showRefreshLoader) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const data = await getCustomerAnalytics(period);

        setAnalytics(data);
      } catch (err) {
        console.error("Failed to load customer analytics:", err);

        setError(
          err?.response?.data?.message ||
            err?.response?.data?.error ||
            "Failed to load analytics. Please try again.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [period],
  );

  /*
   * =======================================================
   * LOAD WHEN PERIOD CHANGES
   * =======================================================
   */

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  /*
   * =======================================================
   * NORMALIZED BACKEND DATA
   *
   * This supports the analyticsController response:
   *
   * overview
   * status
   * resolution
   * messages
   * responseTime
   * resolutionTime
   * satisfaction
   * priorities
   * categories
   * escalations
   * attachments
   * activity
   * recentActivity
   * =======================================================
   */

  const normalized = useMemo(() => {
    if (!analytics) {
      return {
        overview: {},
        status: {},
        resolution: {},
        messages: {},
        responseTime: {},
        resolutionTime: {},
        satisfaction: {},
        priorities: [],
        categories: [],
        escalations: {},
        attachments: {},
        activity: [],
        recentActivity: [],
      };
    }

    return {
      overview: analytics.overview || {},
      status: analytics.status || {},
      resolution: analytics.resolution || {},
      messages: analytics.messages || {},
      responseTime: analytics.responseTime || {},
      resolutionTime: analytics.resolutionTime || {},
      satisfaction: analytics.satisfaction || {},
      priorities: Array.isArray(analytics.priorities?.data)
        ? analytics.priorities.data
        : [],

      categories: Array.isArray(analytics.categories?.data)
        ? analytics.categories.data
        : [],
      escalations: analytics.escalations || {},
      attachments: analytics.attachments || {},
      activity: Array.isArray(analytics.activity) ? analytics.activity : [],
      recentActivity: Array.isArray(analytics.recentActivity)
        ? analytics.recentActivity
        : [],
    };
  }, [analytics]);

  /*
   * =======================================================
   * OVERVIEW VALUES
   * =======================================================
   */

  const totalConversations = Number(
    normalized.overview.totalConversations ??
      normalized.overview.totalTickets ??
      0,
  );

  const previousConversations = Number(
    normalized.overview.previousConversations ??
      normalized.overview.previousTickets ??
      0,
  );

  const conversationChange = getChangeValue(
    totalConversations,
    previousConversations,
  );

  /*
   * =======================================================
   * RESOLUTION
   * =======================================================
   */

  const aiResolved = Number(normalized.resolution.aiResolved ?? 0);

  const humanResolved = Number(normalized.resolution.humanResolved ?? 0);

  const totalResolved = Number(
    normalized.resolution.totalResolved ?? aiResolved + humanResolved,
  );

  const resolutionRate =
    normalized.resolution.resolutionRate !== undefined
      ? Number(normalized.resolution.resolutionRate)
      : totalConversations > 0
        ? Math.round((totalResolved / totalConversations) * 100)
        : 0;

  const aiResolutionRate =
    totalResolved > 0 ? Math.round((aiResolved / totalResolved) * 100) : 0;

  /*
   * =======================================================
   * STATUS
   * =======================================================
   */

  /*
   * =======================================================
   * STATUS
   * =======================================================
   *
   * Backend response:
   *
   * status: {
   *   current: {
   *     open,
   *     "in-progress",
   *     waiting,
   *     resolved,
   *     closed
   *   },
   *
   *   allTime: {
   *     open,
   *     "in-progress",
   *     waiting,
   *     resolved,
   *     closed
   *   }
   * }
   *
   * Total Tickets comes from:
   *
   * overview.totalTickets
   *
   * because Total Tickets is an ALL-TIME value.
   * =======================================================
   */

  const currentStatus = normalized.status?.current || {};

  const allTimeStatus = normalized.status?.allTime || {};

  // =======================================================
  // ALL-TIME STATUS
  // =======================================================

  const openTickets = Number(allTimeStatus.open ?? 0);

  const inProgressTickets = Number(allTimeStatus["in-progress"] ?? 0);

  const waitingTickets = Number(allTimeStatus.waiting ?? 0);

  const resolvedTickets = Number(allTimeStatus.resolved ?? 0);

  const closedTickets = Number(allTimeStatus.closed ?? 0);

  // =======================================================
  // ALL-TIME TOTAL TICKETS
  // =======================================================

  const ticketTotal = Number(normalized.overview?.totalTickets ?? 0);

  // =======================================================
  // CURRENT UNRESOLVED / COMPLETED
  // =======================================================

  const unresolvedTickets = openTickets + inProgressTickets + waitingTickets;

  const completedTickets = resolvedTickets + closedTickets;

  // =======================================================
  // PERCENTAGES
  // =======================================================

  const openTicketPercentage =
    ticketTotal > 0 ? Math.round((unresolvedTickets / ticketTotal) * 100) : 0;

  const resolvedTicketPercentage =
    ticketTotal > 0 ? Math.round((completedTickets / ticketTotal) * 100) : 0;

  /*
   * =======================================================
   * SATISFACTION
   * =======================================================
   */

  const satisfaction = Number(
    normalized.satisfaction.percentage ??
      normalized.satisfaction.score ??
      normalized.satisfaction.satisfaction ??
      0,
  );

  const previousSatisfaction = Number(
    normalized.satisfaction.previousPercentage ??
      normalized.satisfaction.previousScore ??
      0,
  );

  const satisfactionChange =
    normalized.satisfaction.change !== undefined
      ? Number(normalized.satisfaction.change)
      : satisfaction - previousSatisfaction;

  /*
   * =======================================================
   * RESPONSE TIME
   * =======================================================
   */
  const averageResponseTime = normalized.responseTime?.average || "0s";

  const previousResponseTime = normalized.responseTime?.previousAverage || "0s";

  const averageResponseMilliseconds = Number(
    normalized.responseTime?.averageMilliseconds ?? 0,
  );

  const previousResponseMilliseconds = Number(
    normalized.responseTime?.previousAverageMilliseconds ?? 0,
  );

  const responseTimeChange = Number(
    normalized.responseTime?.changePercentage ?? 0,
  );

  const responseTimeImproved =
    normalized.responseTime?.improved ??
    (previousResponseMilliseconds > 0 &&
      averageResponseMilliseconds < previousResponseMilliseconds);
  /*
   * =======================================================
   * MESSAGES
   * =======================================================
   */

  const totalMessages = Number(
    normalized.messages.total ?? normalized.messages.totalMessages ?? 0,
  );

  const aiMessages = Number(
    normalized.messages.ai ?? normalized.messages.aiMessages ?? 0,
  );

  const agentMessages = Number(
    normalized.messages.agent ?? normalized.messages.agentMessages ?? 0,
  );

  const customerMessages = Number(
    normalized.messages.customer ?? normalized.messages.customerMessages ?? 0,
  );

  const humanMessages = agentMessages + Number(normalized.messages.admin ?? 0);

  /*
   * =======================================================
   * ACTIVITY
   * =======================================================
   */

  const activity = normalized.activity.map((item) => ({
    label: item.label || item.date || item.day || item.month || "",
    conversations: Number(
      item.conversations ?? item.tickets ?? item.count ?? 0,
    ),
    messages: Number(item.messages ?? 0),
  }));

  const maxActivity = Math.max(
    ...activity.map((item) => item.conversations),
    1,
  );

  /*
   * =======================================================
   * RECENT ACTIVITY
   * =======================================================
   */

  const recentActivity = normalized.recentActivity;

  /*
   * =======================================================
   * REFRESH
   * =======================================================
   */

  const handleRefresh = () => {
    loadAnalytics(true);
  };

  /*
   * =======================================================
   * LOADING STATE
   * =======================================================
   */

  if (loading && !analytics) {
    return (
      <div className="min-h-full bg-slate-950 p-6">
        <div className="mx-auto flex max-w-7xl items-center justify-center py-32">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-blue-400" />

            <p className="text-sm text-slate-400">
              Loading your support analytics...
            </p>
          </div>
        </div>
      </div>
    );
  }

  /*
   * =======================================================
   * ERROR STATE
   * =======================================================
   */

  if (error && !analytics) {
    return (
      <div className="min-h-full bg-slate-950 p-6">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/10">
                <AlertCircle className="h-5 w-5 text-red-400" />
              </div>

              <div className="flex-1">
                <h3 className="font-semibold text-white">
                  Unable to load analytics
                </h3>

                <p className="mt-1 text-sm text-red-300">{error}</p>

                <button
                  type="button"
                  onClick={() => loadAnalytics()}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-red-500/10 px-4 py-2 text-sm font-medium text-red-300 transition hover:bg-red-500/20"
                >
                  <RefreshCw className="h-4 w-4" />
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /*
   * =======================================================
   * MAIN UI
   * =======================================================
   */

  return (
    <div className="min-h-full bg-slate-950 p-4 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* =================================================
            HEADER
        ================================================= */}

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-500/10">
                <TrendingUp className="h-5 w-5 text-blue-400" />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-white">
                  Your Support Analytics
                </h1>

                <p className="mt-1 text-sm text-slate-400">
                  Understand your support activity and performance.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* PERIOD SELECTOR */}

            <div className="flex items-center rounded-xl border border-slate-800 bg-slate-900 p-1">
              {PERIODS.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setPeriod(item.key)}
                  className={`rounded-lg px-3 py-2 text-xs font-medium transition sm:px-4 ${
                    period === item.key
                      ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20"
                      : "text-slate-400 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* REFRESH */}

            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-4 text-sm font-medium text-slate-300 transition hover:border-slate-700 hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
              />

              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* =================================================
            ERROR BANNER
        ================================================= */}

        {error && analytics && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />

              <p className="text-sm text-red-300">{error}</p>
            </div>
          </div>
        )}

        {/* =================================================
            STATS
        ================================================= */}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {/* CONVERSATIONS */}

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-400">Conversations</p>

                <h2 className="mt-2 text-3xl font-bold text-white">
                  {formatNumber(totalConversations)}
                </h2>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
                <MessageSquare className="h-5 w-5 text-blue-400" />
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 text-xs">
              {conversationChange >= 0 ? (
                <ArrowUpRight className="h-4 w-4 text-emerald-400" />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-red-400" />
              )}

              <span
                className={
                  conversationChange >= 0 ? "text-emerald-400" : "text-red-400"
                }
              >
                {getChangeText(conversationChange)}
              </span>

              <span className="text-slate-500">vs previous period</span>
            </div>
          </div>

          {/* RESOLUTION */}

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-400">Resolution Rate</p>

                <h2 className="mt-2 text-3xl font-bold text-white">
                  {formatPercentage(resolutionRate)}
                </h2>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              </div>
            </div>

            <div className="mt-4">
              <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                  style={{
                    width: `${Math.min(resolutionRate, 100)}%`,
                  }}
                />
              </div>

              <p className="mt-2 text-xs text-slate-500">
                {formatNumber(totalResolved)} resolved
              </p>
            </div>
          </div>

          {/* RESPONSE TIME */}

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-400">Avg. Response Time</p>

                <h2 className="mt-2 text-3xl font-bold text-white">
                  {averageResponseTime}
                </h2>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
                <Clock3 className="h-5 w-5 text-amber-400" />
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 text-xs">
              {responseTimeChange <= 0 ? (
                <ArrowDownRight className="h-4 w-4 text-emerald-400" />
              ) : (
                <ArrowUpRight className="h-4 w-4 text-red-400" />
              )}

              <span
                className={
                  responseTimeChange <= 0 ? "text-emerald-400" : "text-red-400"
                }
              >
                {responseTimeChange <= 0
                  ? `${Math.abs(responseTimeChange)}% faster`
                  : `${responseTimeChange}% slower`}
              </span>
            </div>
          </div>

          {/* SATISFACTION */}

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-400">Satisfaction</p>

                <h2 className="mt-2 text-3xl font-bold text-white">
                  {formatPercentage(satisfaction)}
                </h2>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-500/10">
                <Star className="h-5 w-5 fill-current text-yellow-400" />
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 text-xs">
              {satisfactionChange >= 0 ? (
                <ArrowUpRight className="h-4 w-4 text-emerald-400" />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-red-400" />
              )}

              <span
                className={
                  satisfactionChange >= 0 ? "text-emerald-400" : "text-red-400"
                }
              >
                {satisfactionChange >= 0
                  ? `+${satisfactionChange}`
                  : satisfactionChange}
                %
              </span>

              <span className="text-slate-500">vs previous period</span>
            </div>
          </div>
        </div>

        {/* =================================================
            SUPPORT ACTIVITY
        ================================================= */}

        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-400" />

                <h2 className="text-lg font-semibold text-white">
                  Support Activity
                </h2>
              </div>

              <p className="mt-1 text-sm text-slate-500">
                Conversations created during the selected period.
              </p>
            </div>

            <div className="text-xs text-slate-500">
              {PERIODS.find((item) => item.key === period)?.label}
            </div>
          </div>

          {activity.length > 0 ? (
            <div className="mt-8">
              <div className="flex h-56 items-end gap-2 sm:gap-4">
                {activity.map((item, index) => {
                  const height =
                    item.conversations > 0
                      ? Math.max((item.conversations / maxActivity) * 100, 8)
                      : 3;

                  return (
                    <div
                      key={`${item.label}-${index}`}
                      className="flex min-w-0 flex-1 flex-col items-center justify-end gap-3"
                    >
                      <span className="text-xs font-medium text-slate-400">
                        {item.conversations}
                      </span>

                      <div className="flex h-40 w-full items-end">
                        <div
                          className="w-full rounded-t-lg bg-blue-500/70 transition-all duration-500 hover:bg-blue-400"
                          style={{
                            height: `${height}%`,
                          }}
                        />
                      </div>

                      <span className="w-full truncate text-center text-[11px] text-slate-500 sm:text-xs">
                        {item.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex h-56 items-center justify-center">
              <div className="text-center">
                <Activity className="mx-auto h-8 w-8 text-slate-700" />

                <p className="mt-3 text-sm text-slate-500">
                  No support activity during this period.
                </p>
              </div>
            </div>
          )}
        </section>

        {/* =================================================
            RESOLUTION + TICKET OVERVIEW
        ================================================= */}

        <div className="grid gap-6 lg:grid-cols-2">
          {/* RESOLUTION OVERVIEW */}

          <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />

              <h2 className="text-lg font-semibold text-white">
                Resolution Overview
              </h2>
            </div>

            <p className="mt-1 text-sm text-slate-500">
              How your support requests were resolved.
            </p>

            <div className="mt-8 flex items-center gap-8">
              <div className="relative flex h-36 w-36 shrink-0 items-center justify-center rounded-full border-[14px] border-slate-800">
                <div
                  className="absolute inset-[-14px] rounded-full border-[14px] border-transparent"
                  style={{
                    borderTopColor: "rgb(59 130 246)",
                    borderRightColor:
                      aiResolutionRate > 25 ? "rgb(59 130 246)" : "transparent",
                    borderBottomColor:
                      aiResolutionRate > 50 ? "rgb(59 130 246)" : "transparent",
                    borderLeftColor:
                      aiResolutionRate > 75 ? "rgb(59 130 246)" : "transparent",
                    transform: "rotate(-45deg)",
                  }}
                />

                <div className="text-center">
                  <p className="text-2xl font-bold text-white">
                    {formatPercentage(aiResolutionRate)}
                  </p>

                  <p className="text-xs text-slate-500">AI resolved</p>
                </div>
              </div>

              <div className="flex-1 space-y-5">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bot className="h-4 w-4 text-blue-400" />

                      <span className="text-sm text-slate-300">
                        AI Assistant
                      </span>
                    </div>

                    <span className="text-sm font-semibold text-white">
                      {formatNumber(aiResolved)}
                    </span>
                  </div>

                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full bg-blue-500 transition-all"
                      style={{
                        width: `${Math.min(aiResolutionRate, 100)}%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <UserRound className="h-4 w-4 text-purple-400" />

                      <span className="text-sm text-slate-300">
                        Human Support
                      </span>
                    </div>

                    <span className="text-sm font-semibold text-white">
                      {formatNumber(humanResolved)}
                    </span>
                  </div>

                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full bg-purple-500 transition-all"
                      style={{
                        width: `${Math.min(
                          totalResolved > 0
                            ? (humanResolved / totalResolved) * 100
                            : 0,
                          100,
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* TICKET OVERVIEW */}

          <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <Ticket className="h-5 w-5 text-orange-400" />

              <h2 className="text-lg font-semibold text-white">
                Ticket Overview
              </h2>
            </div>

            <p className="mt-1 text-sm text-slate-500">
              Current status of all your support tickets.
            </p>

            <div className="mt-8 space-y-5">
              {/* OPEN */}

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm text-slate-300">Open / Pending</span>

                  <span className="text-sm font-semibold text-white">
                    {formatNumber(unresolvedTickets)}
                  </span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-orange-500"
                    style={{
                      width: `${openTicketPercentage}%`,
                    }}
                  />
                </div>
              </div>

              {/* RESOLVED */}

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm text-slate-300">
                    Resolved / Closed
                  </span>

                  <span className="text-sm font-semibold text-white">
                    {formatNumber(completedTickets)}
                  </span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{
                      width: `${resolvedTicketPercentage}%`,
                    }}
                  />
                </div>
              </div>

              {/* STATUS BREAKDOWN */}

              <div className="grid grid-cols-2 gap-3 pt-2 sm:grid-cols-5">
                {[
                  ["Open", openTickets],
                  ["In Progress", inProgressTickets],
                  ["Waiting", waitingTickets],
                  ["Resolved", resolvedTickets],
                  ["Closed", closedTickets],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-xl border border-slate-800 bg-slate-950/50 p-3"
                  >
                    <p className="text-[11px] text-slate-500">{label}</p>

                    <p className="mt-1 text-lg font-bold text-white">
                      {formatNumber(value)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        {/* =================================================
            SUPPORT USAGE
        ================================================= */}

        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <Headphones className="h-5 w-5 text-cyan-400" />

            <h2 className="text-lg font-semibold text-white">Support Usage</h2>
          </div>

          <p className="mt-1 text-sm text-slate-500">
            Messages handled by AI and human support.
          </p>

          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {/* AI */}

            <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
                    <Bot className="h-5 w-5 text-blue-400" />
                  </div>

                  <div>
                    <p className="font-medium text-white">AI Assistant</p>

                    <p className="text-xs text-slate-500">
                      AI-generated messages
                    </p>
                  </div>
                </div>

                <span className="text-xl font-bold text-white">
                  {formatNumber(aiMessages)}
                </span>
              </div>

              <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-blue-500"
                  style={{
                    width: `${
                      totalMessages > 0
                        ? Math.min((aiMessages / totalMessages) * 100, 100)
                        : 0
                    }%`,
                  }}
                />
              </div>

              <p className="mt-2 text-xs text-slate-500">
                {totalMessages > 0
                  ? Math.round((aiMessages / totalMessages) * 100)
                  : 0}
                % of all messages
              </p>
            </div>

            {/* HUMAN */}

            <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10">
                    <UserRound className="h-5 w-5 text-purple-400" />
                  </div>

                  <div>
                    <p className="font-medium text-white">Human Agents</p>

                    <p className="text-xs text-slate-500">
                      Agent/admin messages
                    </p>
                  </div>
                </div>

                <span className="text-xl font-bold text-white">
                  {formatNumber(humanMessages)}
                </span>
              </div>

              <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-purple-500"
                  style={{
                    width: `${
                      totalMessages > 0
                        ? Math.min((humanMessages / totalMessages) * 100, 100)
                        : 0
                    }%`,
                  }}
                />
              </div>

              <p className="mt-2 text-xs text-slate-500">
                {totalMessages > 0
                  ? Math.round((humanMessages / totalMessages) * 100)
                  : 0}
                % of all messages
              </p>
            </div>
          </div>

          {/* MESSAGE SUMMARY */}

          <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
              <p className="text-xs text-slate-500">Total Messages</p>

              <p className="mt-1 text-xl font-bold text-white">
                {formatNumber(totalMessages)}
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
              <p className="text-xs text-slate-500">AI Messages</p>

              <p className="mt-1 text-xl font-bold text-white">
                {formatNumber(aiMessages)}
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
              <p className="text-xs text-slate-500">Agent Messages</p>

              <p className="mt-1 text-xl font-bold text-white">
                {formatNumber(agentMessages)}
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
              <p className="text-xs text-slate-500">Customer Messages</p>

              <p className="mt-1 text-xl font-bold text-white">
                {formatNumber(customerMessages)}
              </p>
            </div>
          </div>
        </section>

        {/* =================================================
            ADDITIONAL ANALYTICS
        ================================================= */}

        <div className="grid gap-6 lg:grid-cols-2">
          {/* PRIORITIES */}

          <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-400" />

              <h2 className="text-lg font-semibold text-white">
                Ticket Priorities
              </h2>
            </div>

            <div className="mt-6 space-y-4">
              {normalized.priorities.length > 0 ? (
                normalized.priorities.map((item, index) => {
                  const value = Number(item.count ?? item.total ?? 0);

                  const total = normalized.priorities.reduce(
                    (sum, current) =>
                      sum + Number(current.count ?? current.total ?? 0),
                    0,
                  );

                  const percentage =
                    total > 0 ? Math.round((value / total) * 100) : 0;

                  return (
                    <div key={index}>
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm text-slate-300">
                          {getPriorityLabel(
                            item.priority || item.name || item.label,
                          )}
                        </span>

                        <span className="text-sm font-semibold text-white">
                          {formatNumber(value)}
                        </span>
                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                        <div
                          className="h-full rounded-full bg-orange-400"
                          style={{
                            width: `${percentage}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="py-8 text-center text-sm text-slate-500">
                  No priority data available.
                </p>
              )}
            </div>
          </section>

          {/* CATEGORIES */}

          <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <Ticket className="h-5 w-5 text-blue-400" />

              <h2 className="text-lg font-semibold text-white">
                Ticket Categories
              </h2>
            </div>

            <div className="mt-6 space-y-4">
              {normalized.categories.length > 0 ? (
                normalized.categories.map((item, index) => {
                  const value = Number(item.count ?? item.total ?? 0);

                  const total = normalized.categories.reduce(
                    (sum, current) =>
                      sum + Number(current.count ?? current.total ?? 0),
                    0,
                  );

                  const percentage =
                    total > 0 ? Math.round((value / total) * 100) : 0;

                  return (
                    <div key={index}>
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm text-slate-300">
                          {getCategoryLabel(
                            item.category || item.name || item.label,
                          )}
                        </span>

                        <span className="text-sm font-semibold text-white">
                          {formatNumber(value)}
                        </span>
                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                        <div
                          className="h-full rounded-full bg-blue-400"
                          style={{
                            width: `${percentage}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="py-8 text-center text-sm text-slate-500">
                  No category data available.
                </p>
              )}
            </div>
          </section>
        </div>

        {/* =================================================
            RECENT SUPPORT ACTIVITY
        ================================================= */}

        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <Clock3 className="h-5 w-5 text-cyan-400" />

            <h2 className="text-lg font-semibold text-white">
              Recent Support Activity
            </h2>
          </div>

          <p className="mt-1 text-sm text-slate-500">
            Your latest support activity.
          </p>

          <div className="mt-6 divide-y divide-slate-800">
            {recentActivity.length > 0 ? (
              recentActivity.map((item, index) => {
                const status = item.status || item.type || "Support activity";

                const subject =
                  item.subject ||
                  item.title ||
                  item.message ||
                  "Support ticket";

                const ticketNumber = item.ticketNumber || item.ticket || "";

                const date = item.createdAt || item.date || item.updatedAt;

                let formattedDate = "";

                if (date) {
                  const parsedDate = new Date(date);

                  if (!Number.isNaN(parsedDate.getTime())) {
                    formattedDate = parsedDate.toLocaleString();
                  } else {
                    formattedDate = String(date);
                  }
                }

                return (
                  <div
                    key={item._id || item.id || `${subject}-${index}`}
                    className="flex items-center gap-4 py-4"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-800">
                      {status.toLowerCase().includes("message") ? (
                        <MessageSquare className="h-4 w-4 text-blue-400" />
                      ) : status.toLowerCase().includes("resolved") ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <Ticket className="h-4 w-4 text-orange-400" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-white">
                        {subject}
                      </p>

                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        {ticketNumber && (
                          <span className="text-xs text-blue-400">
                            {ticketNumber}
                          </span>
                        )}

                        <span className="text-xs text-slate-500">
                          {getStatusLabel(status)}
                        </span>
                      </div>
                    </div>

                    {formattedDate && (
                      <span className="hidden shrink-0 text-xs text-slate-500 sm:block">
                        {formattedDate}
                      </span>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="py-10 text-center">
                <MessageSquare className="mx-auto h-8 w-8 text-slate-700" />

                <p className="mt-3 text-sm text-slate-500">
                  No recent support activity.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* =================================================
            FOOTER SUMMARY
        ================================================= */}

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <p className="text-xs text-slate-500">Escalated Tickets</p>

            <p className="mt-2 text-2xl font-bold text-white">
              {formatNumber(
                normalized.escalations.total ??
                  normalized.escalations.count ??
                  0,
              )}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <p className="text-xs text-slate-500">Attachments</p>

            <p className="mt-2 text-2xl font-bold text-white">
              {formatNumber(
                normalized.attachments.total ??
                  normalized.attachments.count ??
                  0,
              )}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <p className="text-xs text-slate-500">Total Tickets</p>

            <p className="mt-2 text-2xl font-bold text-white">
              {formatNumber(ticketTotal)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
