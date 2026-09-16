import React, { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  Clock3,
  RefreshCw,
  Star,
  Ticket,
  TrendingUp,
  Users,
  XCircle,
} from "lucide-react";

import { getSystemAnalytics } from "../../../services/adminAnalyticsService";

// ==========================================
// HELPERS
// ==========================================

const formatMinutes = (minutes) => {
  if (!minutes || minutes <= 0) {
    return "0m";
  }

  if (minutes < 60) {
    return `${Math.round(minutes)}m`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.round(minutes % 60);

  if (hours < 24) {
    return remainingMinutes ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  }

  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;

  return remainingHours ? `${days}d ${remainingHours}h` : `${days}d`;
};

const formatDate = (date) => {
  if (!date) {
    return "";
  }

  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

// ==========================================
// STAT CARD
// ==========================================

const StatCard = ({
  title,
  value,
  subtitle,
  Icon,
  iconClass = "text-blue-400",
}) => {
  return (
    <div className="rounded-2xl border border-slate-800 bg-[#0a1222] p-5">
      <div className="flex items-center justify-between">
        <Icon size={19} className={iconClass} />

        {subtitle && (
          <span className="text-[11px] font-medium text-slate-500">
            {subtitle}
          </span>
        )}
      </div>

      <p className="mt-4 text-xs text-slate-500">{title}</p>

      <p className="mt-1 text-2xl font-bold text-white">{value}</p>
    </div>
  );
};

// ==========================================
// SECTION CARD
// ==========================================

const SectionCard = ({ title, description, children, className = "" }) => {
  return (
    <div
      className={`rounded-2xl border border-slate-800 bg-[#0a1222] p-5 sm:p-6 ${className}`}
    >
      <div className="mb-5">
        <h2 className="text-sm font-semibold text-white">{title}</h2>

        {description && (
          <p className="mt-1 text-xs text-slate-600">{description}</p>
        )}
      </div>

      {children}
    </div>
  );
};

// ==========================================
// PROGRESS BAR
// ==========================================

const ProgressBar = ({ value, className = "bg-blue-500" }) => {
  const percentage = Math.min(100, Math.max(0, Number(value) || 0));

  return (
    <div className="h-2 overflow-hidden rounded-full bg-slate-800">
      <div
        className={`h-full rounded-full transition-all ${className}`}
        style={{
          width: `${percentage}%`,
        }}
      />
    </div>
  );
};

// ==========================================
// ANALYTICS COMPONENT
// ==========================================

const Analytics = () => {
  const [period, setPeriod] = useState("30d");

  const [analytics, setAnalytics] = useState(null);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  // ==========================================
  // FETCH ANALYTICS
  // ==========================================

  const loadAnalytics = useCallback(
    async (showRefresh = false) => {
      try {
        setError("");

        if (showRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const response = await getSystemAnalytics(period);

        if (!response?.data?.success) {
          throw new Error(
            response?.data?.message || "Failed to load analytics.",
          );
        }

        setAnalytics(response.data.analytics || null);
      } catch (err) {
        console.error("Analytics loading error:", err);

        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Failed to load system analytics.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [period],
  );

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  // ==========================================
  // LOADING STATE
  // ==========================================

  if (loading) {
    return (
      <div className="min-h-full px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex min-h-[500px] items-center justify-center">
          <div className="text-center">
            <RefreshCw
              size={28}
              className="mx-auto animate-spin text-blue-400"
            />

            <p className="mt-3 text-sm text-slate-400">
              Loading system analytics...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // ERROR STATE
  // ==========================================

  if (error && !analytics) {
    return (
      <div className="min-h-full px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
          <div className="flex items-start gap-3">
            <XCircle size={20} className="mt-0.5 shrink-0 text-red-400" />

            <div>
              <h2 className="text-sm font-semibold text-white">
                Unable to load analytics
              </h2>

              <p className="mt-1 text-xs text-slate-400">{error}</p>

              <button
                type="button"
                onClick={() => loadAnalytics()}
                className="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-slate-600 hover:text-white"
              >
                <RefreshCw size={14} />
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // SAFE DATA
  // ==========================================

  const overview = analytics?.overview || {};

  const priorities = analytics?.priorities || {};

  const statuses = analytics?.statuses || {};

  const categories = analytics?.categories || [];

  const sla = analytics?.sla || {};

  const performance = analytics?.performance || {};

  const satisfaction = analytics?.satisfaction || {};

  const supportChannels = analytics?.supportChannels || {};

  const escalations = analytics?.escalations || {};

  const agents = analytics?.agents || [];

  const trends = analytics?.trends || [];

  const totalPriorityTickets = Object.values(priorities).reduce(
    (sum, value) => sum + (Number(value) || 0),
    0,
  );

  const totalStatusTickets = Object.values(statuses).reduce(
    (sum, value) => sum + (Number(value) || 0),
    0,
  );

  const maxTrendValue = Math.max(
    ...trends.map((item) =>
      Math.max(Number(item.created) || 0, Number(item.resolved) || 0),
    ),
    1,
  );

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="min-h-full px-4 py-6 sm:px-6 lg:px-8">
      {/* ======================================
          HEADER
      ====================================== */}

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-400">
            Administration
          </p>

          <h1 className="mt-1 text-2xl font-bold text-white">
            System Analytics
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Analyze overall support performance and customer service trends.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => loadAnalytics(true)}
            disabled={refreshing}
            className="inline-flex items-center justify-center rounded-xl border border-slate-800 bg-slate-900 p-2.5 text-slate-400 transition hover:border-slate-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            title="Refresh analytics"
          >
            <RefreshCw size={17} className={refreshing ? "animate-spin" : ""} />
          </button>

          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm text-slate-300 outline-none transition focus:border-blue-500"
          >
            <option value="7d">Last 7 days</option>

            <option value="30d">Last 30 days</option>

            <option value="90d">Last 90 days</option>

            <option value="1y">Last year</option>

            <option value="all">All time</option>
          </select>
        </div>
      </div>

      {/* ======================================
          ERROR BANNER
      ====================================== */}

      {error && analytics && (
        <div className="mb-5 flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-xs text-amber-300">
          <AlertTriangle size={15} />
          {error}
        </div>
      )}

      {/* ======================================
          OVERVIEW CARDS
      ====================================== */}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          title="Total Tickets"
          value={overview.totalTickets ?? 0}
          subtitle="Selected period"
          Icon={Ticket}
          iconClass="text-blue-400"
        />

        <StatCard
          title="Resolved Tickets"
          value={overview.resolvedTickets ?? 0}
          subtitle="Resolved"
          Icon={CheckCircle2}
          iconClass="text-emerald-400"
        />

        <StatCard
          title="Escalated Tickets"
          value={overview.escalatedTickets ?? 0}
          subtitle="Escalations"
          Icon={AlertTriangle}
          iconClass="text-amber-400"
        />

        <StatCard
          title="Resolution Rate"
          value={
            overview.totalTickets > 0
              ? `${(
                  ((overview.resolvedTickets || 0) / overview.totalTickets) *
                  100
                ).toFixed(1)}%`
              : "0%"
          }
          subtitle="Tickets resolved"
          Icon={TrendingUp}
          iconClass="text-cyan-400"
        />
      </div>

      {/* ======================================
          SECONDARY PERFORMANCE CARDS
      ====================================== */}

      <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          title="Avg. First Response"
          value={formatMinutes(performance.averageFirstResponseMinutes)}
          subtitle={`${performance.responseSamples || 0} samples`}
          Icon={Clock3}
          iconClass="text-amber-400"
        />

        <StatCard
          title="Avg. Resolution"
          value={formatMinutes(performance.averageResolutionMinutes)}
          subtitle={`${performance.resolutionSamples || 0} samples`}
          Icon={Clock3}
          iconClass="text-purple-400"
        />

        <StatCard
          title="Customer Rating"
          value={
            satisfaction.averageRating
              ? `${satisfaction.averageRating}/5`
              : "0/5"
          }
          subtitle={`${satisfaction.totalRatings || 0} ratings`}
          Icon={Star}
          iconClass="text-yellow-400"
        />

        <StatCard
          title="Active Agents"
          value={
            agents.filter(
              (agent) => agent.status === "online" || agent.status === "active",
            ).length
          }
          subtitle={`${agents.length} total agents`}
          Icon={Users}
          iconClass="text-emerald-400"
        />
      </div>

      {/* ======================================
          TICKET VOLUME
      ====================================== */}

      <div className="mt-6">
        <SectionCard
          title="Ticket Volume"
          description="Tickets created and resolved during the selected period."
        >
          {trends.length > 0 ? (
            <>
              <div className="flex h-64 items-end gap-1 overflow-x-auto sm:gap-2">
                {trends.map((item) => {
                  const createdHeight =
                    ((Number(item.created) || 0) / maxTrendValue) * 100;

                  const resolvedHeight =
                    ((Number(item.resolved) || 0) / maxTrendValue) * 100;

                  return (
                    <div
                      key={item.date}
                      className="group flex h-full min-w-[20px] flex-1 items-end justify-center gap-1 sm:min-w-[28px]"
                      title={`${formatDate(item.date)}: ${
                        item.created || 0
                      } created, ${item.resolved || 0} resolved`}
                    >
                      <div
                        className="w-1/2 rounded-t-md bg-blue-500/60 transition group-hover:bg-blue-400/80"
                        style={{
                          height: `${Math.max(
                            createdHeight,
                            item.created ? 2 : 0,
                          )}%`,
                        }}
                      />

                      <div
                        className="w-1/2 rounded-t-md bg-emerald-500/60 transition group-hover:bg-emerald-400/80"
                        style={{
                          height: `${Math.max(
                            resolvedHeight,
                            item.resolved ? 2 : 0,
                          )}%`,
                        }}
                      />
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 flex items-center justify-center gap-5 text-[10px] text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-sm bg-blue-500/60" />
                  Created
                </span>

                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-sm bg-emerald-500/60" />
                  Resolved
                </span>
              </div>
            </>
          ) : (
            <div className="flex h-64 items-center justify-center text-xs text-slate-600">
              No ticket trend data available.
            </div>
          )}
        </SectionCard>
      </div>

      {/* ======================================
          PRIORITY + STATUS
      ====================================== */}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* PRIORITY */}

        <SectionCard
          title="Tickets by Priority"
          description="Distribution of tickets by priority."
        >
          <div className="space-y-4">
            {[
              {
                label: "Urgent",
                key: "urgent",
                className: "bg-red-500",
              },
              {
                label: "High",
                key: "high",
                className: "bg-orange-500",
              },
              {
                label: "Medium",
                key: "medium",
                className: "bg-amber-500",
              },
              {
                label: "Low",
                key: "low",
                className: "bg-emerald-500",
              },
            ].map((item) => {
              const count = priorities[item.key] || 0;

              const percentage =
                totalPriorityTickets > 0
                  ? (count / totalPriorityTickets) * 100
                  : 0;

              return (
                <div key={item.key}>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs text-slate-400">{item.label}</span>

                    <span className="text-xs font-medium text-white">
                      {count}
                    </span>
                  </div>

                  <ProgressBar value={percentage} className={item.className} />
                </div>
              );
            })}
          </div>
        </SectionCard>

        {/* STATUS */}

        <SectionCard
          title="Tickets by Status"
          description="Current ticket status distribution."
        >
          <div className="grid grid-cols-2 gap-3">
            {[
              ["Open", "open"],
              ["Pending", "pending"],
              ["In Progress", "in-progress"],
              ["Waiting", "waiting"],
              ["Resolved", "resolved"],
              ["Closed", "closed"],
            ].map(([label, key]) => (
              <div
                key={key}
                className="rounded-xl border border-slate-800 bg-slate-900/40 p-3"
              >
                <p className="text-[11px] text-slate-500">{label}</p>

                <p className="mt-1 text-lg font-semibold text-white">
                  {statuses[key] || 0}
                </p>

                <p className="mt-1 text-[10px] text-slate-600">
                  {totalStatusTickets > 0
                    ? `${(
                        ((statuses[key] || 0) / totalStatusTickets) *
                        100
                      ).toFixed(1)}%`
                    : "0%"}
                </p>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* ======================================
          CATEGORY + SLA
      ====================================== */}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* CATEGORIES */}

        <SectionCard
          title="Tickets by Category"
          description="Support requests grouped by category."
        >
          {categories.length > 0 ? (
            <div className="space-y-3">
              {categories.map((item) => {
                const percentage =
                  totalPriorityTickets > 0
                    ? (item.count / totalPriorityTickets) * 100
                    : 0;

                return (
                  <div key={item.category}>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs text-slate-400">
                        {item.category}
                      </span>

                      <span className="text-xs font-medium text-white">
                        {item.count}
                      </span>
                    </div>

                    <ProgressBar
                      value={percentage}
                      className="bg-blue-500/70"
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-10 text-center text-xs text-slate-600">
              No category data available.
            </div>
          )}
        </SectionCard>

        {/* SLA */}

        <SectionCard
          title="SLA Performance"
          description="Response and resolution SLA compliance."
        >
          <div className="space-y-6">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-300">
                    Response SLA
                  </p>

                  <p className="mt-1 text-[10px] text-slate-600">
                    {sla.response?.completed || 0} completed ·{" "}
                    {sla.response?.breached || 0} breached
                  </p>
                </div>

                <span className="text-lg font-bold text-white">
                  {sla.response?.compliance ?? 0}%
                </span>
              </div>

              <ProgressBar
                value={sla.response?.compliance || 0}
                className="bg-blue-500"
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-300">
                    Resolution SLA
                  </p>

                  <p className="mt-1 text-[10px] text-slate-600">
                    {sla.resolution?.completed || 0} completed ·{" "}
                    {sla.resolution?.breached || 0} breached
                  </p>
                </div>

                <span className="text-lg font-bold text-white">
                  {sla.resolution?.compliance ?? 0}%
                </span>
              </div>

              <ProgressBar
                value={sla.resolution?.compliance || 0}
                className="bg-emerald-500"
              />
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Overall SLA Compliance
                </span>

                <span className="text-sm font-bold text-white">
                  {sla.overallCompliance ?? 0}%
                </span>
              </div>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* ======================================
          SUPPORT + ESCALATION
      ====================================== */}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* AI / HUMAN */}

        <SectionCard
          title="AI & Human Support"
          description="Conversation activity by support channel."
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-purple-500/10 bg-purple-500/5 p-4">
              <Bot size={18} className="text-purple-400" />

              <p className="mt-3 text-[11px] text-slate-500">AI Replies</p>

              <p className="mt-1 text-xl font-bold text-white">
                {supportChannels.aiReplies || 0}
              </p>

              <p className="mt-1 text-[10px] text-slate-600">
                {supportChannels.aiPercentage || 0}% of support replies
              </p>
            </div>

            <div className="rounded-xl border border-blue-500/10 bg-blue-500/5 p-4">
              <Users size={18} className="text-blue-400" />

              <p className="mt-3 text-[11px] text-slate-500">Human Replies</p>

              <p className="mt-1 text-xl font-bold text-white">
                {supportChannels.humanReplies || 0}
              </p>

              <p className="mt-1 text-[10px] text-slate-600">
                Agent + admin replies
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
              <p className="text-[11px] text-slate-500">Customer Replies</p>

              <p className="mt-1 text-xl font-bold text-white">
                {supportChannels.customerReplies || 0}
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
              <p className="text-[11px] text-slate-500">Internal Notes</p>

              <p className="mt-1 text-xl font-bold text-white">
                {supportChannels.internalNotes || 0}
              </p>
            </div>
          </div>
        </SectionCard>

        {/* ESCALATIONS */}

        <SectionCard
          title="Escalations"
          description="Escalation activity during the selected period."
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-amber-500/10 bg-amber-500/5 p-4">
              <AlertTriangle size={18} className="text-amber-400" />

              <p className="mt-3 text-[11px] text-slate-500">
                Total Escalations
              </p>

              <p className="mt-1 text-xl font-bold text-white">
                {escalations.totalEscalations || 0}
              </p>
            </div>

            <div className="rounded-xl border border-blue-500/10 bg-blue-500/5 p-4">
              <Clock3 size={18} className="text-blue-400" />

              <p className="mt-3 text-[11px] text-slate-500">Active</p>

              <p className="mt-1 text-xl font-bold text-white">
                {escalations.activeEscalations || 0}
              </p>
            </div>

            <div className="rounded-xl border border-emerald-500/10 bg-emerald-500/5 p-4">
              <CheckCircle2 size={18} className="text-emerald-400" />

              <p className="mt-3 text-[11px] text-slate-500">Resolved</p>

              <p className="mt-1 text-xl font-bold text-white">
                {escalations.resolvedEscalations || 0}
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
              <p className="text-[11px] text-slate-500">Resolution Rate</p>

              <p className="mt-1 text-xl font-bold text-white">
                {escalations.resolutionRate || 0}%
              </p>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* ======================================
          CUSTOMER SATISFACTION
      ====================================== */}

      <div className="mt-6">
        <SectionCard
          title="Customer Satisfaction"
          description="Customer rating distribution."
        >
          <div className="grid gap-6 md:grid-cols-2">
            <div className="flex items-center gap-5">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-yellow-500/10 bg-yellow-500/5">
                <div className="text-center">
                  <Star size={20} className="mx-auto text-yellow-400" />

                  <p className="mt-1 text-lg font-bold text-white">
                    {satisfaction.averageRating || 0}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-white">
                  Average Customer Rating
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Based on {satisfaction.totalRatings || 0} submitted ratings.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = satisfaction.distribution?.[rating] || 0;

                const percentage =
                  satisfaction.totalRatings > 0
                    ? (count / satisfaction.totalRatings) * 100
                    : 0;

                return (
                  <div key={rating} className="flex items-center gap-3">
                    <span className="w-8 text-xs text-slate-500">
                      {rating} ★
                    </span>

                    <div className="flex-1">
                      <ProgressBar
                        value={percentage}
                        className="bg-yellow-400"
                      />
                    </div>

                    <span className="w-8 text-right text-xs text-slate-400">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </SectionCard>
      </div>

      {/* ======================================
          AGENT PERFORMANCE
      ====================================== */}

      <div className="mt-6">
        <SectionCard
          title="Agent Performance"
          description="Ticket workload and response performance by agent."
        >
          {agents.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px]">
                <thead>
                  <tr className="border-b border-slate-800 text-left">
                    <th className="pb-3 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                      Agent
                    </th>

                    <th className="pb-3 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                      Assigned
                    </th>

                    <th className="pb-3 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                      Open
                    </th>

                    <th className="pb-3 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                      Resolved
                    </th>

                    <th className="pb-3 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                      Avg Response
                    </th>

                    <th className="pb-3 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                      Avg Resolution
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {agents.map((agent) => (
                    <tr
                      key={agent.id}
                      className="border-b border-slate-800/60 last:border-0"
                    >
                      <td className="py-4">
                        <div>
                          <p className="text-xs font-medium text-white">
                            {agent.name || "Unknown Agent"}
                          </p>

                          <p className="mt-0.5 text-[10px] text-slate-600">
                            {agent.email || ""}
                          </p>
                        </div>
                      </td>

                      <td className="py-4 text-xs text-slate-300">
                        {agent.assignedTickets || 0}
                      </td>

                      <td className="py-4 text-xs text-slate-300">
                        {agent.openTickets || 0}
                      </td>

                      <td className="py-4 text-xs text-emerald-400">
                        {agent.resolvedTickets || 0}
                      </td>

                      <td className="py-4 text-xs text-slate-300">
                        {formatMinutes(agent.averageResponseTime)}
                      </td>

                      <td className="py-4 text-xs text-slate-300">
                        {formatMinutes(agent.averageResolutionTime)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-10 text-center text-xs text-slate-600">
              No agent performance data available.
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
};

export default Analytics;
