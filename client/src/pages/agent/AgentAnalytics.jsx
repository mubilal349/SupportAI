import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  CheckCircle2,
  Clock3,
  Loader2,
  RefreshCw,
  Target,
  Ticket,
  TrendingUp,
  Zap,
} from "lucide-react";

import { getAgentAnalytics } from "../../services/agentService";

// ==========================================
// HELPERS
// ==========================================

const formatNumber = (value = 0) => {
  return new Intl.NumberFormat().format(value);
};

const formatDate = (date) => {
  if (!date) return "";

  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

const statusLabels = {
  open: "Open",
  "in-progress": "In Progress",
  waiting: "Waiting",
  resolved: "Resolved",
  closed: "Closed",
};

// ==========================================
// COMPONENT
// ==========================================

const AgentAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);

  const [range, setRange] = useState("30d");

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  // ==========================================
  // LOAD ANALYTICS
  // ==========================================

  const loadAnalytics = async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await getAgentAnalytics(range);

      if (response?.success) {
        setAnalytics(response.analytics);
      } else {
        throw new Error(response?.message || "Failed to load analytics");
      }
    } catch (err) {
      console.error("Agent analytics error:", err);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to load analytics.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ==========================================
  // RANGE CHANGE
  // ==========================================

  useEffect(() => {
    loadAnalytics();
  }, [range]);

  // ==========================================
  // MAX CHART VALUE
  // ==========================================

  const maxTrendValue = useMemo(() => {
    if (!analytics?.trend?.length) {
      return 1;
    }

    return Math.max(
      ...analytics.trend.map((item) =>
        Math.max(item.handled || 0, item.resolved || 0),
      ),
      1,
    );
  }, [analytics]);

  // ==========================================
  // STATUS TOTAL
  // ==========================================

  const statusTotal = useMemo(() => {
    if (!analytics?.statusBreakdown) {
      return 0;
    }

    return Object.values(analytics.statusBreakdown).reduce(
      (sum, value) => sum + value,
      0,
    );
  }, [analytics]);

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050b18] px-4 py-6 text-white sm:px-6 lg:px-8">
        <div className="flex min-h-[70vh] items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-slate-400">
            <Loader2 size={34} className="animate-spin text-blue-400" />

            <p className="text-sm">Loading your analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // ERROR
  // ==========================================

  if (error && !analytics) {
    return (
      <div className="min-h-screen bg-[#050b18] px-4 py-6 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-6">
            <h2 className="text-lg font-semibold text-red-300">
              Unable to load analytics
            </h2>

            <p className="mt-2 text-sm text-slate-400">{error}</p>

            <button
              type="button"
              onClick={() => loadAnalytics(true)}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500"
            >
              <RefreshCw size={16} />
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // MAIN UI
  // ==========================================

  return (
    <div className="min-h-screen bg-[#050b18] px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* ==========================================
            HEADER
        ========================================== */}

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-blue-400">
              <BarChart3 size={20} />

              <span className="text-sm font-medium">Performance Analytics</span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Agent Analytics
            </h1>

            <p className="mt-1 text-sm text-slate-400">
              Track your support performance and productivity.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* RANGE SELECTOR */}

            <div className="flex rounded-xl border border-slate-800 bg-slate-900/70 p-1">
              {[
                ["7d", "7 Days"],
                ["30d", "30 Days"],
                ["90d", "90 Days"],
                ["all", "All Time"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRange(value)}
                  className={`rounded-lg px-3 py-2 text-xs font-medium transition ${
                    range === value
                      ? "bg-blue-600 text-white"
                      : "text-slate-400 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* REFRESH */}

            <button
              type="button"
              onClick={() => loadAnalytics(true)}
              disabled={refreshing}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900/70 px-3 text-sm text-slate-300 transition hover:border-blue-500/30 hover:text-white disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={refreshing ? "animate-spin" : ""}
              />

              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* ==========================================
            ERROR BANNER
        ========================================== */}

        {error && (
          <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-300">
            {error}
          </div>
        )}

        {/* ==========================================
            STAT CARDS
        ========================================== */}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {/* RESOLUTION RATE */}

          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl shadow-black/10">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-400">Resolution Rate</p>

                <h2 className="mt-3 text-3xl font-bold">
                  {analytics?.resolutionRate ?? 0}%
                </h2>
              </div>

              <div className="rounded-2xl bg-emerald-500/10 p-3 text-emerald-400">
                <Target size={22} />
              </div>
            </div>

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                style={{
                  width: `${Math.min(analytics?.resolutionRate || 0, 100)}%`,
                }}
              />
            </div>

            <p className="mt-3 text-xs text-slate-500">
              {formatNumber(analytics?.resolvedTickets || 0)} resolved tickets
            </p>
          </div>

          {/* RESPONSE TIME */}

          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl shadow-black/10">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-400">Avg Response Time</p>

                <h2 className="mt-3 text-3xl font-bold">
                  {analytics?.averageResponseTimeFormatted || "0m"}
                </h2>
              </div>

              <div className="rounded-2xl bg-blue-500/10 p-3 text-blue-400">
                <Clock3 size={22} />
              </div>
            </div>

            <p className="mt-4 text-xs text-slate-500">
              First public response to customer
            </p>
          </div>

          {/* TICKETS HANDLED */}

          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl shadow-black/10">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-400">Tickets Handled</p>

                <h2 className="mt-3 text-3xl font-bold">
                  {formatNumber(analytics?.ticketsHandled || 0)}
                </h2>
              </div>

              <div className="rounded-2xl bg-violet-500/10 p-3 text-violet-400">
                <Ticket size={22} />
              </div>
            </div>

            <p className="mt-4 text-xs text-slate-500">
              Tickets assigned to you
            </p>
          </div>

          {/* RESPONSE RATE */}

          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl shadow-black/10">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-400">Response Rate</p>

                <h2 className="mt-3 text-3xl font-bold">
                  {analytics?.responseRate ?? 0}%
                </h2>
              </div>

              <div className="rounded-2xl bg-cyan-500/10 p-3 text-cyan-400">
                <Zap size={22} />
              </div>
            </div>

            <p className="mt-4 text-xs text-slate-500">
              {formatNumber(analytics?.respondedTickets || 0)} tickets received
              a response
            </p>
          </div>
        </div>

        {/* ==========================================
            PERFORMANCE + STATUS
        ========================================== */}

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          {/* PERFORMANCE TREND */}

          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 xl:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold">Ticket Performance</h2>

                <p className="mt-1 text-xs text-slate-500">
                  Handled vs resolved tickets
                </p>
              </div>

              <TrendingUp size={20} className="text-blue-400" />
            </div>

            {analytics?.trend?.length ? (
              <div className="mt-8">
                <div className="flex h-64 items-end gap-2 overflow-x-auto pb-8">
                  {analytics.trend.map((item) => {
                    const handledHeight = (item.handled / maxTrendValue) * 100;

                    const resolvedHeight =
                      (item.resolved / maxTrendValue) * 100;

                    return (
                      <div
                        key={item.date}
                        className="group flex min-w-[38px] flex-1 flex-col items-center justify-end"
                      >
                        <div className="relative flex h-52 w-full max-w-[28px] items-end justify-center gap-1">
                          {/* HANDLED */}

                          <div
                            title={`Handled: ${item.handled}`}
                            className="w-2.5 rounded-t-md bg-blue-500/70 transition-all group-hover:bg-blue-400"
                            style={{
                              height: `${Math.max(
                                handledHeight,
                                item.handled > 0 ? 4 : 0,
                              )}%`,
                            }}
                          />

                          {/* RESOLVED */}

                          <div
                            title={`Resolved: ${item.resolved}`}
                            className="w-2.5 rounded-t-md bg-emerald-500/70 transition-all group-hover:bg-emerald-400"
                            style={{
                              height: `${Math.max(
                                resolvedHeight,
                                item.resolved > 0 ? 4 : 0,
                              )}%`,
                            }}
                          />
                        </div>

                        <span className="mt-3 whitespace-nowrap text-[10px] text-slate-600">
                          {formatDate(item.date)}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* LEGEND */}

                <div className="flex items-center justify-center gap-6 text-xs text-slate-400">
                  <span className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                    Handled
                  </span>

                  <span className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    Resolved
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex h-64 items-center justify-center">
                <div className="text-center">
                  <BarChart3 size={32} className="mx-auto text-slate-700" />

                  <p className="mt-3 text-sm text-slate-500">
                    No ticket activity for this period.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* STATUS BREAKDOWN */}

          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5">
            <div>
              <h2 className="font-semibold">Ticket Status</h2>

              <p className="mt-1 text-xs text-slate-500">
                Current ticket distribution
              </p>
            </div>

            <div className="mt-7 space-y-5">
              {Object.entries(analytics?.statusBreakdown || {}).map(
                ([status, count]) => {
                  const percentage =
                    statusTotal > 0
                      ? Math.round((count / statusTotal) * 100)
                      : 0;

                  return (
                    <div key={status}>
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="text-slate-300">
                          {statusLabels[status] || status}
                        </span>

                        <span className="text-slate-500">{count}</span>
                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                        <div
                          className="h-full rounded-full bg-blue-500 transition-all duration-500"
                          style={{
                            width: `${percentage}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                },
              )}
            </div>
          </div>
        </div>

        {/* ==========================================
            RESPONSE TIME DETAILS
        ========================================== */}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* AVERAGE */}

          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-blue-500/10 p-3 text-blue-400">
                <Clock3 size={20} />
              </div>

              <div>
                <p className="text-xs text-slate-500">Average</p>

                <p className="mt-1 font-semibold">
                  {analytics?.averageResponseTimeFormatted || "0m"}
                </p>
              </div>
            </div>
          </div>

          {/* FASTEST */}

          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-400">
                <Zap size={20} />
              </div>

              <div>
                <p className="text-xs text-slate-500">Fastest</p>

                <p className="mt-1 font-semibold">
                  {analytics?.fastestResponseTimeFormatted || "0m"}
                </p>
              </div>
            </div>
          </div>

          {/* SLOWEST */}

          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-orange-500/10 p-3 text-orange-400">
                <TrendingUp size={20} />
              </div>

              <div>
                <p className="text-xs text-slate-500">Slowest</p>

                <p className="mt-1 font-semibold">
                  {analytics?.slowestResponseTimeFormatted || "0m"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ==========================================
            PERFORMANCE SUMMARY
        ========================================== */}

        <div className="rounded-3xl border border-slate-800 bg-gradient-to-r from-blue-500/10 via-slate-900/60 to-emerald-500/10 p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-blue-500/10 p-3 text-blue-400">
                <CheckCircle2 size={24} />
              </div>

              <div>
                <h2 className="font-semibold">Your performance summary</h2>

                <p className="mt-1 text-sm text-slate-400">
                  You have handled{" "}
                  <span className="font-semibold text-white">
                    {formatNumber(analytics?.ticketsHandled || 0)}
                  </span>{" "}
                  tickets with a{" "}
                  <span className="font-semibold text-emerald-400">
                    {analytics?.resolutionRate || 0}%
                  </span>{" "}
                  resolution rate.
                </p>
              </div>
            </div>

            <div className="text-left md:text-right">
              <p className="text-xs text-slate-500">Avg first response</p>

              <p className="mt-1 text-xl font-bold">
                {analytics?.averageResponseTimeFormatted || "0m"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentAnalytics;
