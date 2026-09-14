import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getAdminDashboard } from "../../services/adminDashboardService";

import {
  Activity,
  AlertTriangle,
  Bot,
  CheckCircle2,
  Clock3,
  Inbox,
  RefreshCw,
  Server,
  ShieldCheck,
  Star,
  Ticket,
  TrendingUp,
  Users,
  XCircle,
  Zap,
} from "lucide-react";

const API_SERVER = (
  import.meta.env.VITE_API_URL || "http://localhost:8000/api"
).replace(/\/api$/, "");

const getAvatarUrl = (avatar) => {
  if (!avatar) return null;

  if (avatar.startsWith("http://") || avatar.startsWith("https://")) {
    return avatar;
  }

  return `${API_SERVER}${avatar.startsWith("/") ? avatar : `/${avatar}`}`;
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // ============================================================
  // FETCH DASHBOARD
  // ============================================================

  const fetchDashboard = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const data = await getAdminDashboard();

      if (!data?.success) {
        throw new Error(data?.message || "Failed to load dashboard.");
      }

      setDashboard(data);
    } catch (err) {
      console.error("ADMIN DASHBOARD FETCH ERROR:", err);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to load admin dashboard.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  // ============================================================
  // DATA
  // ============================================================

  const stats = dashboard?.stats || {};

  const recentTickets = dashboard?.recentTickets || [];

  const agentPerformance = dashboard?.agentPerformance || [];

  // ============================================================
  // DATE
  // ============================================================

  const currentDate = useMemo(() => {
    return new Date().toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }, []);

  // ============================================================
  // HELPERS
  // ============================================================

  const formatNumber = (value) => {
    return Number(value || 0).toLocaleString();
  };

  const formatMinutes = (minutes) => {
    const value = Number(minutes || 0);

    if (value < 60) {
      return `${value}m`;
    }

    const hours = Math.floor(value / 60);
    const remainingMinutes = value % 60;

    if (remainingMinutes === 0) {
      return `${hours}h`;
    }

    return `${hours}h ${remainingMinutes}m`;
  };

  const formatStatus = (status) => {
    if (!status) return "Unknown";

    if (status === "in-progress") {
      return "In Progress";
    }

    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const getStatusClasses = (status) => {
    switch (status) {
      case "open":
        return "border-blue-500/20 bg-blue-500/10 text-blue-400";

      case "in-progress":
        return "border-amber-500/20 bg-amber-500/10 text-amber-400";

      case "waiting":
        return "border-purple-500/20 bg-purple-500/10 text-purple-400";

      case "resolved":
        return "border-emerald-500/20 bg-emerald-500/10 text-emerald-400";

      case "closed":
        return "border-slate-500/20 bg-slate-500/10 text-slate-400";

      default:
        return "border-slate-500/20 bg-slate-500/10 text-slate-400";
    }
  };

  const getPriorityClasses = (priority) => {
    switch (priority) {
      case "urgent":
        return "text-red-400";

      case "high":
        return "text-orange-400";

      case "medium":
        return "text-amber-400";

      case "low":
        return "text-emerald-400";

      default:
        return "text-slate-400";
    }
  };

  const getAgentInitials = (name) => {
    if (!name) return "AG";

    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  // ============================================================
  // LOADING SKELETON
  // ============================================================

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-72px)] bg-[#050b18] p-4 text-white sm:p-6 lg:p-8">
        <div className="mx-auto max-w-[1600px]">
          <div className="animate-pulse">
            <div className="h-4 w-32 rounded bg-slate-800" />

            <div className="mt-4 h-8 w-72 rounded bg-slate-800" />

            <div className="mt-3 h-4 w-96 max-w-full rounded bg-slate-800" />

            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="h-32 rounded-2xl border border-slate-800 bg-slate-900/50"
                />
              ))}
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
              <div className="h-80 rounded-2xl border border-slate-800 bg-slate-900/50 xl:col-span-2" />
              <div className="h-80 rounded-2xl border border-slate-800 bg-slate-900/50" />
            </div>

            <div className="mt-6 h-96 rounded-2xl border border-slate-800 bg-slate-900/50" />
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // ERROR STATE
  // ============================================================

  if (error && !dashboard) {
    return (
      <div className="min-h-[calc(100vh-72px)] bg-[#050b18] p-4 text-white sm:p-6 lg:p-8">
        <div className="mx-auto flex min-h-[60vh] max-w-2xl items-center justify-center">
          <div className="w-full rounded-2xl border border-red-500/20 bg-slate-900/70 p-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-400">
              <AlertTriangle className="h-6 w-6" />
            </div>

            <h2 className="mt-5 text-lg font-semibold text-white">
              Unable to load dashboard
            </h2>

            <p className="mt-2 text-sm text-slate-500">{error}</p>

            <button
              type="button"
              onClick={() => fetchDashboard()}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // MAIN DASHBOARD
  // ============================================================

  return (
    <div className="min-h-[calc(100vh-72px)] bg-[#050b18] text-white">
      <div className="mx-auto max-w-[1600px] p-4 sm:p-6 lg:p-8">
        {/* ======================================================
            HEADER
        ====================================================== */}

        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-blue-400">
              Admin Overview
            </p>

            <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
              Welcome back
              {user?.name ? `, ${user.name.split(" ")[0]}` : ""}.
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Monitor your support platform, agents, tickets, and AI
              performance.
            </p>

            <p className="mt-3 text-xs text-slate-600">{currentDate}</p>
          </div>

          <div className="flex items-center gap-3">
            {error && (
              <span className="hidden text-xs text-red-400 sm:block">
                {error}
              </span>
            )}

            <button
              type="button"
              onClick={() => fetchDashboard(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:border-slate-700 hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
              />

              <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
            </button>
          </div>
        </div>

        {/* ======================================================
            PRIMARY KPI CARDS
        ====================================================== */}

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Users"
            value={formatNumber(stats.totalUsers)}
            subtitle={`${formatNumber(stats.totalCustomers)} customers`}
            icon={Users}
            iconClass="bg-blue-500/10 text-blue-400"
          />

          <StatCard
            title="Total Tickets"
            value={formatNumber(stats.totalTickets)}
            subtitle={`${formatNumber(stats.openTickets)} currently open`}
            icon={Ticket}
            iconClass="bg-purple-500/10 text-purple-400"
          />

          <StatCard
            title="AI Resolved"
            value={formatNumber(stats.aiResolvedTickets)}
            subtitle={`${stats.aiResolutionRate || 0}% AI resolution rate`}
            icon={Bot}
            iconClass="bg-emerald-500/10 text-emerald-400"
          />

          <StatCard
            title="Active Agents"
            value={formatNumber(stats.activeAgents)}
            subtitle={`${formatNumber(stats.totalAgents)} total agents`}
            icon={ShieldCheck}
            iconClass="bg-amber-500/10 text-amber-400"
          />
        </div>

        {/* ======================================================
            TICKET OVERVIEW + AI PERFORMANCE
        ====================================================== */}

        <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
          {/* ====================================================
              TICKET OVERVIEW
          ==================================================== */}

          <section className="rounded-2xl border border-slate-800 bg-slate-900/40 xl:col-span-2">
            <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4 sm:px-6">
              <div>
                <h2 className="text-sm font-semibold text-white">
                  Ticket Overview
                </h2>

                <p className="mt-1 text-xs text-slate-600">
                  Current ticket distribution by status
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate("/admin/tickets")}
                className="text-xs font-medium text-blue-400 transition hover:text-blue-300"
              >
                View tickets
              </button>
            </div>

            <div className="p-5 sm:p-6">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <OverviewItem
                  label="Open"
                  value={stats.openTickets}
                  icon={Inbox}
                  iconClass="text-blue-400"
                />

                <OverviewItem
                  label="In Progress"
                  value={stats.inProgressTickets}
                  icon={Activity}
                  iconClass="text-amber-400"
                />

                <OverviewItem
                  label="Waiting"
                  value={stats.waitingTickets}
                  icon={Clock3}
                  iconClass="text-purple-400"
                />

                <OverviewItem
                  label="Resolved"
                  value={stats.resolvedTickets}
                  icon={CheckCircle2}
                  iconClass="text-emerald-400"
                />

                <OverviewItem
                  label="Closed"
                  value={stats.closedTickets}
                  icon={XCircle}
                  iconClass="text-slate-400"
                />

                <OverviewItem
                  label="Escalated"
                  value={stats.escalatedTickets}
                  icon={AlertTriangle}
                  iconClass="text-red-400"
                />
              </div>

              {/* Ticket distribution bar */}

              <div className="mt-6">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    Ticket distribution
                  </span>

                  <span className="text-xs text-slate-600">
                    {formatNumber(stats.totalTickets)} total
                  </span>
                </div>

                <div className="flex h-3 overflow-hidden rounded-full bg-slate-800">
                  <DistributionBar
                    value={stats.openTickets}
                    total={stats.totalTickets}
                  />

                  <DistributionBar
                    value={stats.inProgressTickets}
                    total={stats.totalTickets}
                  />

                  <DistributionBar
                    value={stats.waitingTickets}
                    total={stats.totalTickets}
                  />

                  <DistributionBar
                    value={stats.resolvedTickets}
                    total={stats.totalTickets}
                  />

                  <DistributionBar
                    value={stats.closedTickets}
                    total={stats.totalTickets}
                  />
                </div>

                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
                  <Legend label="Open" className="bg-blue-400" />

                  <Legend label="In Progress" className="bg-amber-400" />

                  <Legend label="Waiting" className="bg-purple-400" />

                  <Legend label="Resolved" className="bg-emerald-400" />

                  <Legend label="Closed" className="bg-slate-500" />
                </div>
              </div>
            </div>
          </section>

          {/* ====================================================
              AI PERFORMANCE
          ==================================================== */}

          <section className="rounded-2xl border border-slate-800 bg-slate-900/40">
            <div className="border-b border-slate-800 px-5 py-4 sm:px-6">
              <h2 className="text-sm font-semibold text-white">
                AI Performance
              </h2>

              <p className="mt-1 text-xs text-slate-600">
                AI-assisted ticket resolution
              </p>
            </div>

            <div className="p-5 sm:p-6">
              <div className="flex items-center justify-center py-4">
                <div className="relative flex h-40 w-40 items-center justify-center rounded-full bg-slate-800">
                  <div
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: `conic-gradient(
                        rgb(59 130 246) ${Math.min(
                          Number(stats.aiResolutionRate || 0),
                          100,
                        )}%,
                        rgb(30 41 59) 0
                      )`,
                    }}
                  />

                  <div className="relative flex h-28 w-28 flex-col items-center justify-center rounded-full bg-[#0b1220]">
                    <Bot className="mb-1 h-5 w-5 text-blue-400" />

                    <span className="text-2xl font-bold">
                      {stats.aiResolutionRate || 0}%
                    </span>

                    <span className="text-[10px] text-slate-600">
                      Resolution
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <MiniMetric
                  label="AI Assisted"
                  value={formatNumber(stats.aiAssistedTickets)}
                />

                <MiniMetric
                  label="AI Resolved"
                  value={formatNumber(stats.aiResolvedTickets)}
                />
              </div>

              <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                <div className="flex items-center gap-3">
                  <Zap className="h-4 w-4 text-blue-400" />

                  <div>
                    <p className="text-xs font-medium text-slate-300">
                      AI automation
                    </p>

                    <p className="mt-1 text-[11px] leading-5 text-slate-600">
                      AI is actively assisting with{" "}
                      {formatNumber(stats.aiAssistedTickets)} tickets.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* ======================================================
            PERFORMANCE METRICS
        ====================================================== */}

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Customer Satisfaction"
            value={stats.averageRating ? `${stats.averageRating}/5` : "0/5"}
            subtitle={`${formatNumber(stats.ratedTickets)} ratings`}
            icon={Star}
          />

          <MetricCard
            title="SLA Compliance"
            value={`${stats.slaComplianceRate || 0}%`}
            subtitle={`${formatNumber(stats.respondedWithinSLA)} within SLA`}
            icon={ShieldCheck}
          />

          <MetricCard
            title="Avg. Response Time"
            value={formatMinutes(stats.averageResponseTime)}
            subtitle="First agent response"
            icon={Clock3}
          />

          <MetricCard
            title="Unassigned Tickets"
            value={formatNumber(stats.unassignedTickets)}
            subtitle="Waiting for an agent"
            icon={Inbox}
            warning={Number(stats.unassignedTickets || 0) > 0}
          />
        </div>

        {/* ======================================================
            RECENT TICKETS
        ====================================================== */}

        <section className="mt-6 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40">
          <div className="flex flex-col gap-3 border-b border-slate-800 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <h2 className="text-sm font-semibold text-white">
                Recent Tickets
              </h2>

              <p className="mt-1 text-xs text-slate-600">
                Latest tickets created in the system
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate("/admin/tickets")}
              className="self-start text-xs font-medium text-blue-400 transition hover:text-blue-300 sm:self-auto"
            >
              View all
            </button>
          </div>

          <div className="overflow-x-auto">
            {recentTickets.length === 0 ? (
              <div className="flex min-h-[260px] items-center justify-center p-6">
                <EmptyState
                  icon={Ticket}
                  title="No tickets found"
                  description="Recent tickets will appear here."
                />
              </div>
            ) : (
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="border-b border-slate-800 text-left text-[10px] uppercase tracking-wider text-slate-600">
                    <th className="px-6 py-4 font-medium">Customer</th>

                    <th className="px-6 py-4 font-medium">Subject</th>

                    <th className="px-6 py-4 font-medium">Priority</th>

                    <th className="px-6 py-4 font-medium">Status</th>

                    <th className="px-6 py-4 font-medium">Agent</th>

                    <th className="px-6 py-4 font-medium">Created</th>
                  </tr>
                </thead>

                <tbody>
                  {recentTickets.map((ticket) => (
                    <tr
                      key={ticket.id}
                      onClick={() => navigate(`/admin/tickets/${ticket.id}`)}
                      className="cursor-pointer border-b border-slate-800/70 transition last:border-0 hover:bg-slate-800/20"
                    >
                      {/* Customer */}

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {ticket.customer?.avatar ? (
                            <img
                              src={getAvatarUrl(ticket.customer.avatar)}
                              alt={ticket.customer.name || "Customer"}
                              className="h-9 w-9 rounded-xl object-cover"
                            />
                          ) : (
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-xs font-bold text-blue-400">
                              {ticket.customer?.name
                                ?.split(" ")
                                .map((part) => part[0])
                                .join("")
                                .slice(0, 2)
                                .toUpperCase() || "CU"}
                            </div>
                          )}

                          <div className="min-w-0">
                            <p className="max-w-[150px] truncate text-sm font-medium text-slate-200">
                              {ticket.customer?.name || "Unknown Customer"}
                            </p>

                            <p className="mt-0.5 text-[10px] text-slate-600">
                              #{ticket.ticketNumber}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Subject */}

                      <td className="max-w-xs px-6 py-4">
                        <p className="max-w-[240px] truncate text-sm text-slate-400">
                          {ticket.subject || "No subject"}
                        </p>

                        {ticket.category && (
                          <p className="mt-1 text-[10px] text-slate-600">
                            {ticket.category}
                          </p>
                        )}
                      </td>

                      {/* Priority */}

                      <td className="px-6 py-4">
                        <span
                          className={`text-xs font-semibold capitalize ${getPriorityClasses(
                            ticket.priority,
                          )}`}
                        >
                          {ticket.priority || "low"}
                        </span>
                      </td>

                      {/* Status */}

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusClasses(
                            ticket.status,
                          )}`}
                        >
                          {formatStatus(ticket.status)}
                        </span>
                      </td>

                      {/* Agent */}

                      <td className="px-6 py-4">
                        {ticket.assignedAgent ? (
                          <div className="flex items-center gap-2">
                            {ticket.assignedAgent.avatar ? (
                              <img
                                src={ticket.assignedAgent.avatar}
                                alt={ticket.assignedAgent.name || "Agent"}
                                className="h-7 w-7 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800 text-[9px] font-semibold text-slate-400">
                                {getAgentInitials(ticket.assignedAgent.name)}
                              </div>
                            )}

                            <div className="min-w-0">
                              <p className="max-w-[120px] truncate text-xs text-slate-400">
                                {ticket.assignedAgent.name}
                              </p>

                              <div className="mt-0.5 flex items-center gap-1">
                                <span
                                  className={`h-1.5 w-1.5 rounded-full ${
                                    ticket.assignedAgent.status === "online"
                                      ? "bg-emerald-500"
                                      : ticket.assignedAgent.status === "busy"
                                        ? "bg-amber-500"
                                        : "bg-slate-600"
                                  }`}
                                />

                                <span className="text-[9px] capitalize text-slate-600">
                                  {ticket.assignedAgent.status || "offline"}
                                </span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-600">
                            Unassigned
                          </span>
                        )}
                      </td>

                      {/* Created */}

                      <td className="whitespace-nowrap px-6 py-4 text-xs text-slate-600">
                        {ticket.createdAt
                          ? new Date(ticket.createdAt).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              },
                            )
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        {/* ======================================================
            AGENT PERFORMANCE
        ====================================================== */}

        <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
          <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40 xl:col-span-2">
            <div className="flex flex-col gap-3 border-b border-slate-800 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div>
                <h2 className="text-sm font-semibold text-white">
                  Agent Performance
                </h2>

                <p className="mt-1 text-xs text-slate-600">
                  Performance based on assigned tickets
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate("/admin/agents")}
                className="self-start text-xs font-medium text-blue-400 transition hover:text-blue-300 sm:self-auto"
              >
                View agents
              </button>
            </div>

            <div className="divide-y divide-slate-800">
              {agentPerformance.length === 0 ? (
                <div className="p-8 text-center">
                  <EmptyState
                    icon={Users}
                    title="No agent performance data"
                    description="Performance will appear once agents have assigned tickets."
                  />
                </div>
              ) : (
                agentPerformance.map((agent) => (
                  <div key={agent.id} className="px-5 py-5 sm:px-6">
                    <div className="flex items-center gap-3">
                      {/* Avatar */}

                      <div className="relative">
                        {agent.avatar ? (
                          <img
                            src={agent.avatar}
                            alt={agent.name}
                            className="h-10 w-10 rounded-xl object-cover"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 text-xs font-semibold text-slate-400">
                            {getAgentInitials(agent.name)}
                          </div>
                        )}

                        <span
                          className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-slate-900 ${
                            agent.status === "online"
                              ? "bg-emerald-500"
                              : agent.status === "busy"
                                ? "bg-amber-500"
                                : "bg-slate-500"
                          }`}
                        />
                      </div>

                      {/* Name */}

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-200">
                          {agent.name}
                        </p>

                        <p className="text-xs capitalize text-slate-600">
                          {agent.status || "offline"}
                        </p>
                      </div>

                      {/* Resolved */}

                      <div className="hidden text-right sm:block">
                        <p className="text-sm font-semibold text-slate-200">
                          {agent.resolvedTickets}
                        </p>

                        <p className="text-xs text-slate-600">resolved</p>
                      </div>

                      {/* Rating */}

                      <div className="flex items-center gap-1 rounded-lg bg-slate-800/70 px-2.5 py-1.5">
                        <Star className="h-3.5 w-3.5 text-amber-400" />

                        <span className="text-xs font-medium text-slate-300">
                          {agent.averageRating || "0.00"}
                        </span>
                      </div>
                    </div>

                    {/* Metrics */}

                    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <AgentMetric label="Tickets" value={agent.totalTickets} />

                      <AgentMetric label="Open" value={agent.openTickets} />

                      <AgentMetric
                        label="Resolved"
                        value={agent.resolvedTickets}
                      />

                      <AgentMetric
                        label="Response"
                        value={formatMinutes(agent.averageResponseTime)}
                      />
                    </div>

                    {/* Resolution */}

                    <div className="mt-4">
                      <div className="mb-2 flex items-center justify-between text-xs">
                        <span className="text-slate-600">Resolution rate</span>

                        <span className="font-medium text-slate-400">
                          {agent.resolutionRate || 0}%
                        </span>
                      </div>

                      <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
                        <div
                          className="h-full rounded-full bg-blue-500 transition-all duration-500"
                          style={{
                            width: `${Math.min(
                              Number(agent.resolutionRate || 0),
                              100,
                            )}%`,
                          }}
                        />
                      </div>
                    </div>

                    {agent.escalatedTickets > 0 && (
                      <div className="mt-3 flex items-center gap-2 text-[10px] text-red-400">
                        <AlertTriangle className="h-3.5 w-3.5" />

                        <span>
                          {agent.escalatedTickets} escalated{" "}
                          {agent.escalatedTickets === 1 ? "ticket" : "tickets"}
                        </span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>

          {/* ====================================================
              SYSTEM OVERVIEW
          ==================================================== */}

          <section className="rounded-2xl border border-slate-800 bg-slate-900/40">
            <div className="border-b border-slate-800 px-5 py-4 sm:px-6">
              <h2 className="text-sm font-semibold text-white">
                System Overview
              </h2>

              <p className="mt-1 text-xs text-slate-600">
                Platform-wide statistics
              </p>
            </div>

            <div className="divide-y divide-slate-800">
              <SystemRow
                label="Customers"
                value={stats.totalCustomers}
                icon={Users}
              />

              <SystemRow
                label="Agents"
                value={stats.totalAgents}
                icon={ShieldCheck}
              />

              <SystemRow
                label="Administrators"
                value={stats.totalAdmins}
                icon={ShieldCheck}
              />

              <SystemRow
                label="Total tickets"
                value={stats.totalTickets}
                icon={Ticket}
              />

              <SystemRow
                label="Escalated tickets"
                value={stats.escalatedTickets}
                icon={AlertTriangle}
                warning={Number(stats.escalatedTickets || 0) > 0}
              />

              <SystemRow
                label="Unassigned tickets"
                value={stats.unassignedTickets}
                icon={Inbox}
                warning={Number(stats.unassignedTickets || 0) > 0}
              />
            </div>
          </section>
        </div>

        {/* ======================================================
            SYSTEM HEALTH
        ====================================================== */}

        <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/40">
          <div className="border-b border-slate-800 px-5 py-4 sm:px-6">
            <h2 className="text-sm font-semibold text-white">System Health</h2>

            <p className="mt-1 text-xs text-slate-600">
              Current SupportAI platform services
            </p>
          </div>

          <div className="grid grid-cols-1 divide-y divide-slate-800 sm:grid-cols-2 sm:divide-y-0 sm:divide-x xl:grid-cols-4">
            <HealthItem label="API Server" status="Operational" icon={Server} />

            <HealthItem label="Database" status="Operational" icon={Activity} />

            <HealthItem label="AI Service" status="Operational" icon={Bot} />

            <HealthItem
              label="Realtime Service"
              status="Operational"
              icon={Zap}
            />
          </div>
        </section>
      </div>
    </div>
  );
};

// ============================================================
// STAT CARD
// ============================================================

const StatCard = ({ title, value, subtitle, icon: Icon, iconClass }) => {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 transition hover:border-slate-700">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-slate-500">{title}</p>

          <p className="mt-2 text-2xl font-bold tracking-tight text-white">
            {value}
          </p>

          <p className="mt-1 text-xs text-slate-600">{subtitle}</p>
        </div>

        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
};

// ============================================================
// OVERVIEW ITEM
// ============================================================

const OverviewItem = ({ label, value, icon: Icon, iconClass }) => {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-4">
      <div className="flex items-center justify-between gap-3">
        <Icon className={`h-4 w-4 ${iconClass}`} />

        <span className="text-lg font-bold text-white">
          {Number(value || 0).toLocaleString()}
        </span>
      </div>

      <p className="mt-3 text-xs text-slate-600">{label}</p>
    </div>
  );
};

// ============================================================
// DISTRIBUTION BAR
// ============================================================

const DistributionBar = ({ value, total }) => {
  if (!total || !value) {
    return null;
  }

  const percentage = (Number(value) / Number(total)) * 100;

  return (
    <div
      className="h-full bg-slate-600 first:bg-blue-500 [&:nth-child(2)]:bg-amber-500 [&:nth-child(3)]:bg-purple-500 [&:nth-child(4)]:bg-emerald-500 [&:nth-child(5)]:bg-slate-500"
      style={{
        width: `${percentage}%`,
      }}
    />
  );
};

// ============================================================
// LEGEND
// ============================================================

const Legend = ({ label, className }) => {
  return (
    <span className="flex items-center gap-2 text-[10px] text-slate-600">
      <span className={`h-1.5 w-1.5 rounded-full ${className}`} />

      {label}
    </span>
  );
};

// ============================================================
// MINI METRIC
// ============================================================

const MiniMetric = ({ label, value }) => {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-3">
      <p className="text-[10px] uppercase tracking-wider text-slate-600">
        {label}
      </p>

      <p className="mt-1 text-lg font-semibold text-slate-200">{value}</p>
    </div>
  );
};

// ============================================================
// METRIC CARD
// ============================================================

const MetricCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  warning = false,
}) => {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-slate-500">{title}</p>

          <p
            className={`mt-2 text-2xl font-bold ${
              warning ? "text-amber-400" : "text-white"
            }`}
          >
            {value}
          </p>

          <p className="mt-1 text-xs text-slate-600">{subtitle}</p>
        </div>

        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${
            warning
              ? "bg-amber-500/10 text-amber-400"
              : "bg-slate-800 text-slate-500"
          }`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
};

// ============================================================
// AGENT METRIC
// ============================================================

const AgentMetric = ({ label, value }) => {
  return (
    <div className="rounded-lg bg-slate-950/40 px-3 py-2.5">
      <p className="text-[9px] uppercase tracking-wider text-slate-700">
        {label}
      </p>

      <p className="mt-1 text-xs font-semibold text-slate-400">{value}</p>
    </div>
  );
};

// ============================================================
// SYSTEM ROW
// ============================================================

const SystemRow = ({ label, value, icon: Icon, warning = false }) => {
  return (
    <div className="flex items-center gap-3 px-5 py-4 sm:px-6">
      <div
        className={`flex h-8 w-8 items-center justify-center rounded-lg ${
          warning
            ? "bg-amber-500/10 text-amber-400"
            : "bg-slate-800 text-slate-500"
        }`}
      >
        <Icon className="h-4 w-4" />
      </div>

      <span className="flex-1 text-xs text-slate-500">{label}</span>

      <span
        className={`text-sm font-semibold ${
          warning ? "text-amber-400" : "text-slate-300"
        }`}
      >
        {Number(value || 0).toLocaleString()}
      </span>
    </div>
  );
};

// ============================================================
// HEALTH ITEM
// ============================================================

const HealthItem = ({ label, status, icon: Icon }) => {
  return (
    <div className="flex items-center gap-3 px-5 py-4 sm:px-6 xl:py-5">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
        <Icon className="h-4 w-4" />
      </div>

      <div className="flex-1">
        <p className="text-xs font-medium text-slate-400">{label}</p>

        <div className="mt-1 flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/40" />

          <span className="text-[10px] text-emerald-400">{status}</span>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// EMPTY STATE
// ============================================================

const EmptyState = ({ icon: Icon, title, description }) => {
  return (
    <div className="text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800 text-slate-500">
        <Icon className="h-5 w-5" />
      </div>

      <p className="mt-4 text-sm font-medium text-slate-400">{title}</p>

      <p className="mt-1 text-xs text-slate-600">{description}</p>
    </div>
  );
};

export default Dashboard;
