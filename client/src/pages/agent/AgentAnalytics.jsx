import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  CheckCircle2,
  Clock3,
  Loader2,
  MessageSquareText,
  RefreshCw,
  Star,
  Target,
  Ticket,
  TrendingDown,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";

import { getAgentAnalytics } from "../../services/agentService";

// ==========================================
// HELPERS
// ==========================================

const formatNumber = (value = 0) => {
  return new Intl.NumberFormat().format(Number(value || 0));
};

const formatDate = (date) => {
  if (!date) return "";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  return parsedDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

const formatRating = (value = 0) => {
  return Number(value || 0).toFixed(1);
};

const formatPercent = (value = 0) => {
  return `${Number(value || 0).toFixed(1)}%`;
};

const statusLabels = {
  open: "Open",
  pending: "Pending",
  "in-progress": "In Progress",
  waiting: "Waiting",
  resolved: "Resolved",
  closed: "Closed",
};

const priorityLabels = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
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
        console.log("========== AGENT ANALYTICS ==========");
        console.log("Full response:", response);
        console.log("Analytics:", response.analytics);
        console.log("Satisfaction:", response.analytics?.satisfaction);
        console.log(
          "Satisfaction trend:",
          response.analytics?.satisfactionTrend,
        );
        console.log("=====================================");

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
        Math.max(Number(item.handled || 0), Number(item.resolved || 0)),
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
      (sum, value) => sum + Number(value || 0),
      0,
    );
  }, [analytics]);

  // ==========================================
  // PRIORITY TOTAL
  // ==========================================

  const priorityTotal = useMemo(() => {
    if (!analytics?.priorityBreakdown) {
      return 0;
    }

    return Object.values(analytics.priorityBreakdown).reduce(
      (sum, value) => sum + Number(value || 0),
      0,
    );
  }, [analytics]);

  // ==========================================
  // SATISFACTION DATA
  // ==========================================

  const satisfaction = analytics?.satisfaction || {};

  const ratingDistribution = satisfaction?.distribution || {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };

  const satisfactionTrend = analytics?.satisfactionTrend || [];

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
              Track your support performance, productivity, and customer
              satisfaction.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* RANGE SELECTOR */}

            <div className="flex overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/70 p-1">
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
                  className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium transition ${
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
                  width: `${Math.min(
                    Number(analytics?.resolutionRate || 0),
                    100,
                  )}%`,
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
            CUSTOMER SATISFACTION
        ========================================== */}

        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl shadow-black/10 sm:p-6">
          {/* HEADER */}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <div className="rounded-xl bg-amber-500/10 p-2.5 text-amber-400">
                  <Star size={20} className="fill-amber-400" />
                </div>

                <h2 className="text-lg font-semibold">Customer Satisfaction</h2>
              </div>

              <p className="mt-2 text-sm text-slate-500">
                Measure how customers rate your support after their tickets are
                resolved.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-xs text-slate-500">
              {formatNumber(satisfaction.totalRatings || 0)} total ratings
            </div>
          </div>

          {/* SATISFACTION CARDS */}

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {/* AVERAGE RATING */}

            <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-400">Average Rating</p>

                <Star size={18} className="fill-amber-400 text-amber-400" />
              </div>

              <div className="mt-3 flex items-end gap-2">
                <span className="text-3xl font-bold">
                  {formatRating(satisfaction.averageRating)}
                </span>

                <span className="mb-1 text-sm text-slate-600">/ 5</span>
              </div>

              <div className="mt-4 flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={15}
                    className={
                      star <=
                      Math.round(Number(satisfaction.averageRating || 0))
                        ? "fill-amber-400 text-amber-400"
                        : "text-slate-700"
                    }
                  />
                ))}
              </div>
            </div>

            {/* CSAT */}

            <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-400">CSAT Score</p>

                <Target size={18} className="text-emerald-400" />
              </div>

              <h3 className="mt-3 text-3xl font-bold text-emerald-400">
                {formatPercent(satisfaction.csat)}
              </h3>

              <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                  style={{
                    width: `${Math.min(Number(satisfaction.csat || 0), 100)}%`,
                  }}
                />
              </div>

              <p className="mt-3 text-xs text-slate-600">4–5 star ratings</p>
            </div>

            {/* SATISFIED */}

            <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-400">Satisfied Customers</p>

                <CheckCircle2 size={18} className="text-emerald-400" />
              </div>

              <h3 className="mt-3 text-3xl font-bold">
                {formatNumber(satisfaction.satisfiedRatings || 0)}
              </h3>

              <p className="mt-3 text-xs text-slate-600">
                Customers rated 4 or 5 stars
              </p>
            </div>

            {/* FEEDBACK */}

            <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-400">Written Feedback</p>

                <MessageSquareText size={18} className="text-blue-400" />
              </div>

              <h3 className="mt-3 text-3xl font-bold">
                {formatNumber(satisfaction.feedbackCount || 0)}
              </h3>

              <p className="mt-3 text-xs text-slate-600">
                {formatPercent(satisfaction.feedbackPercentage)} of ratings
                included feedback
              </p>
            </div>
          </div>

          {/* SATISFACTION DETAILS */}

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* RATING DISTRIBUTION */}

            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5">
              <div className="mb-5">
                <h3 className="font-semibold">Rating Distribution</h3>

                <p className="mt-1 text-xs text-slate-600">
                  Customer ratings from 1 to 5 stars
                </p>
              </div>

              <div className="space-y-4">
                {[5, 4, 3, 2, 1].map((rating) => {
                  const count = Number(ratingDistribution[rating] || 0);

                  const total = Number(satisfaction.totalRatings || 0);

                  const percentage = total > 0 ? (count / total) * 100 : 0;

                  return (
                    <div key={rating}>
                      <div className="mb-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-3 text-xs text-slate-400">
                            {rating}
                          </span>

                          <Star
                            size={14}
                            className="fill-amber-400 text-amber-400"
                          />
                        </div>

                        <span className="text-xs text-slate-500">
                          {count} {count === 1 ? "rating" : "ratings"}
                        </span>
                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            rating >= 4
                              ? "bg-emerald-500"
                              : rating === 3
                                ? "bg-amber-500"
                                : "bg-red-500"
                          }`}
                          style={{
                            width: `${percentage}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* CSAT COMPARISON */}

            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5">
              <div className="mb-5">
                <h3 className="font-semibold">Satisfaction Performance</h3>

                <p className="mt-1 text-xs text-slate-600">
                  Current period compared with the previous period
                </p>
              </div>

              <div className="space-y-4">
                {/* CSAT */}

                <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">CSAT</span>

                    <div className="flex items-center gap-2">
                      {Number(satisfaction.csatChange || 0) >= 0 ? (
                        <TrendingUp size={15} className="text-emerald-400" />
                      ) : (
                        <TrendingDown size={15} className="text-red-400" />
                      )}

                      <span
                        className={
                          Number(satisfaction.csatChange || 0) >= 0
                            ? "text-xs font-medium text-emerald-400"
                            : "text-xs font-medium text-red-400"
                        }
                      >
                        {Number(satisfaction.csatChange || 0) > 0 ? "+" : ""}
                        {Number(satisfaction.csatChange || 0).toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 flex items-end justify-between">
                    <span className="text-2xl font-bold text-white">
                      {formatPercent(satisfaction.csat)}
                    </span>

                    <span className="text-xs text-slate-600">
                      Previous: {formatPercent(satisfaction.previousCsat)}
                    </span>
                  </div>
                </div>

                {/* RATING */}

                <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">
                      Average Rating
                    </span>

                    <Star size={15} className="fill-amber-400 text-amber-400" />
                  </div>

                  <div className="mt-3 flex items-end justify-between">
                    <span className="text-2xl font-bold">
                      {formatRating(satisfaction.averageRating)}
                      /5
                    </span>

                    <span className="text-xs text-slate-600">
                      Previous:{" "}
                      {formatRating(satisfaction.previousAverageRating)}
                      /5
                    </span>
                  </div>
                </div>

                {/* RATINGS */}

                <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">
                      Ratings received
                    </span>

                    <Users size={15} className="text-blue-400" />
                  </div>

                  <div className="mt-3 flex items-end justify-between">
                    <span className="text-2xl font-bold">
                      {formatNumber(satisfaction.totalRatings || 0)}
                    </span>

                    <span className="text-xs text-slate-600">
                      Previous:{" "}
                      {formatNumber(satisfaction.previousRatings || 0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SATISFACTION TREND */}

          <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/40 p-5">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Satisfaction Trend</h3>

                <p className="mt-1 text-xs text-slate-600">
                  Average customer rating and CSAT over time
                </p>
              </div>

              <TrendingUp size={18} className="text-amber-400" />
            </div>

            {satisfactionTrend.length > 0 ? (
              <div className="overflow-x-auto">
                <div className="flex min-w-[620px] items-end gap-3">
                  {satisfactionTrend.slice(-12).map((item) => {
                    const averageRating = Number(item.averageRating || 0);

                    const ratingHeight = (averageRating / 5) * 100;

                    return (
                      <div
                        key={item.date}
                        className="group flex min-w-[42px] flex-1 flex-col items-center"
                      >
                        <div className="mb-2 opacity-0 transition group-hover:opacity-100">
                          <span className="rounded-md bg-slate-800 px-2 py-1 text-[10px] text-white">
                            {averageRating.toFixed(1)}
                            /5
                          </span>
                        </div>

                        <div className="flex h-40 w-full max-w-[30px] items-end">
                          <div
                            className="w-full rounded-t-md bg-amber-500/80 transition-all group-hover:bg-amber-400"
                            style={{
                              height: `${Math.max(
                                ratingHeight,
                                averageRating > 0 ? 4 : 0,
                              )}%`,
                            }}
                          />
                        </div>

                        <span className="mt-2 whitespace-nowrap text-[9px] text-slate-600">
                          {formatDate(item.date)}
                        </span>

                        <span className="mt-1 text-[9px] text-emerald-500">
                          {Number(item.csat || 0).toFixed(0)}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="flex h-40 items-center justify-center text-center">
                <div>
                  <Star size={30} className="mx-auto text-slate-700" />

                  <p className="mt-3 text-sm text-slate-500">
                    No customer ratings for this period.
                  </p>

                  <p className="mt-1 text-xs text-slate-700">
                    Ratings will appear here after customers submit feedback.
                  </p>
                </div>
              </div>
            )}
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
                    const handledHeight =
                      (Number(item.handled || 0) / maxTrendValue) * 100;

                    const resolvedHeight =
                      (Number(item.resolved || 0) / maxTrendValue) * 100;

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
                      ? Math.round((Number(count || 0) / statusTotal) * 100)
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
            PRIORITY BREAKDOWN
        ========================================== */}

        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5">
          <div>
            <h2 className="font-semibold">Priority Distribution</h2>

            <p className="mt-1 text-xs text-slate-500">
              Priority mix across your assigned tickets
            </p>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {Object.entries(analytics?.priorityBreakdown || {}).map(
              ([priority, count]) => {
                const percentage =
                  priorityTotal > 0
                    ? Math.round((Number(count || 0) / priorityTotal) * 100)
                    : 0;

                return (
                  <div
                    key={priority}
                    className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-medium ${
                          priority === "urgent"
                            ? "text-red-400"
                            : priority === "high"
                              ? "text-orange-400"
                              : priority === "medium"
                                ? "text-amber-400"
                                : "text-blue-400"
                        }`}
                      >
                        {priorityLabels[priority] || priority}
                      </span>

                      <span className="text-lg font-bold">{count}</span>
                    </div>

                    <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-800">
                      <div
                        className={`h-full rounded-full ${
                          priority === "urgent"
                            ? "bg-red-500"
                            : priority === "high"
                              ? "bg-orange-500"
                              : priority === "medium"
                                ? "bg-amber-500"
                                : "bg-blue-500"
                        }`}
                        style={{
                          width: `${percentage}%`,
                        }}
                      />
                    </div>

                    <p className="mt-2 text-[11px] text-slate-600">
                      {percentage}% of tickets
                    </p>
                  </div>
                );
              },
            )}
          </div>
        </div>

        {/* ==========================================
            COMMUNICATION + ESCALATION
        ========================================== */}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* CONVERSATION ACTIVITY */}

          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-blue-500/10 p-3 text-blue-400">
                <MessageSquareText size={20} />
              </div>

              <div>
                <h2 className="font-semibold">Conversation Activity</h2>

                <p className="mt-1 text-xs text-slate-500">
                  Messages across your tickets
                </p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                <p className="text-xs text-slate-600">Total</p>

                <p className="mt-2 text-xl font-bold">
                  {formatNumber(analytics?.messages?.total || 0)}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                <p className="text-xs text-slate-600">Agent</p>

                <p className="mt-2 text-xl font-bold">
                  {formatNumber(analytics?.messages?.agent || 0)}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                <p className="text-xs text-slate-600">Customer</p>

                <p className="mt-2 text-xl font-bold">
                  {formatNumber(analytics?.messages?.customer || 0)}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                <p className="text-xs text-slate-600">AI</p>

                <p className="mt-2 text-xl font-bold">
                  {formatNumber(analytics?.messages?.ai || 0)}
                </p>
              </div>
            </div>
          </div>

          {/* ESCALATIONS */}

          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-orange-500/10 p-3 text-orange-400">
                <TrendingUp size={20} />
              </div>

              <div>
                <h2 className="font-semibold">Escalations</h2>

                <p className="mt-1 text-xs text-slate-500">
                  Tickets requiring escalation
                </p>
              </div>
            </div>

            <div className="mt-7 flex items-end justify-between gap-4">
              <div>
                <p className="text-4xl font-bold text-white">
                  {formatNumber(analytics?.escalations?.total || 0)}
                </p>

                <p className="mt-2 text-xs text-slate-500">Escalated tickets</p>
              </div>

              <div className="text-right">
                <span className="inline-flex rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1.5 text-xs font-medium text-orange-400">
                  {formatPercent(analytics?.escalations?.percentage || 0)}
                </span>

                <p className="mt-2 text-[11px] text-slate-600">
                  of handled tickets
                </p>
              </div>
            </div>

            {/* Escalated ticket preview */}
            {analytics?.escalations?.tickets?.length > 0 && (
              <div className="mt-6 border-t border-slate-800 pt-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-slate-400">
                    Recent escalations
                  </p>

                  <span className="text-[11px] text-slate-600">
                    {analytics.escalations.tickets.length} shown
                  </span>
                </div>

                <div className="mt-3 space-y-2">
                  {analytics.escalations.tickets.slice(0, 3).map((ticket) => (
                    <div
                      key={ticket.ticketId}
                      className="rounded-xl border border-slate-800 bg-slate-950/40 p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-xs font-medium text-slate-300">
                            {ticket.ticketNumber || "Ticket"}
                          </p>

                          <p className="mt-1 truncate text-xs text-slate-500">
                            {ticket.subject || "Escalated ticket"}
                          </p>
                        </div>

                        <span className="shrink-0 rounded-full bg-orange-500/10 px-2 py-1 text-[10px] font-medium text-orange-400">
                          Escalated
                        </span>
                      </div>

                      {ticket.reason && (
                        <p className="mt-2 line-clamp-1 text-[11px] text-slate-600">
                          {ticket.reason}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty state */}
            {(!analytics?.escalations?.tickets ||
              analytics.escalations.tickets.length === 0) && (
              <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950/30 px-4 py-3">
                <p className="text-xs text-slate-600">
                  No escalated tickets in this period.
                </p>
              </div>
            )}
          </div>

          {/* ALL TIME */}

          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-violet-500/10 p-3 text-violet-400">
                <Users size={20} />
              </div>

              <div>
                <h2 className="font-semibold">All-Time Performance</h2>

                <p className="mt-1 text-xs text-slate-500">Lifetime totals</p>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-3">
                <span className="text-xs text-slate-500">Tickets</span>

                <span className="font-semibold">
                  {formatNumber(analytics?.allTime?.tickets || 0)}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-3">
                <span className="text-xs text-slate-500">Resolved</span>

                <span className="font-semibold text-emerald-400">
                  {formatNumber(analytics?.allTime?.resolved || 0)}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-3">
                <span className="text-xs text-slate-500">Ratings</span>

                <span className="font-semibold text-amber-400">
                  {formatNumber(analytics?.allTime?.ratings || 0)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ==========================================
            RECENT ACTIVITY
        ========================================== */}

        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-500/10 p-3 text-blue-400">
              <Clock3 size={20} />
            </div>

            <div>
              <h2 className="font-semibold">Recent Activity</h2>

              <p className="mt-1 text-xs text-slate-500">
                Latest activity from your assigned tickets
              </p>
            </div>
          </div>

          {analytics?.recentActivity?.length ? (
            <div className="mt-6 divide-y divide-slate-800/70">
              {analytics.recentActivity.map((activity, index) => (
                <div
                  key={`${activity.ticketId}-${activity.type}-${index}`}
                  className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-800 bg-slate-950">
                      {activity.type === "rated" ? (
                        <Star
                          size={15}
                          className="fill-amber-400 text-amber-400"
                        />
                      ) : activity.type === "resolved" ? (
                        <CheckCircle2 size={15} className="text-emerald-400" />
                      ) : (
                        <Ticket size={15} className="text-blue-400" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-300">
                        {activity.type === "rated"
                          ? "Customer submitted a rating"
                          : activity.type === "resolved"
                            ? "Ticket resolved"
                            : "Ticket handled"}
                      </p>

                      <p className="mt-1 truncate text-xs text-slate-600">
                        {activity.ticketNumber || "Ticket"}

                        {activity.subject ? ` · ${activity.subject}` : ""}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 sm:flex-col sm:items-end sm:gap-1">
                    {activity.rating && (
                      <span className="flex items-center gap-1 text-xs font-medium text-amber-400">
                        <Star size={12} className="fill-amber-400" />
                        {activity.rating}/5
                      </span>
                    )}

                    <span className="text-[11px] text-slate-700">
                      {new Date(activity.timestamp).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center">
              <Clock3 size={30} className="mx-auto text-slate-700" />

              <p className="mt-3 text-sm text-slate-500">No recent activity.</p>
            </div>
          )}
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
              <p className="text-xs text-slate-500">Customer satisfaction</p>

              <p className="mt-1 flex items-center gap-2 text-xl font-bold md:justify-end">
                <Star size={17} className="fill-amber-400 text-amber-400" />
                {formatRating(satisfaction.averageRating)}
                /5
              </p>

              <p className="mt-1 text-xs text-emerald-400">
                {formatPercent(satisfaction.csat)} CSAT
              </p>
            </div>
          </div>
        </div>

        {/* ==========================================
            FOOTER
        ========================================== */}

        <div className="pb-4 text-center text-[11px] text-slate-700">
          Analytics are calculated from tickets assigned to you during the
          selected period.
        </div>
      </div>
    </div>
  );
};

export default AgentAnalytics;
