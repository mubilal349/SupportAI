import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  Inbox,
  Loader2,
  MessageSquare,
  RefreshCw,
  Ticket,
  TrendingUp,
  UserRound,
  XCircle,
  Zap,
} from "lucide-react";

import { getAgentDashboard } from "../../services/agentService";

const formatNumber = (value) => {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return 0;
  }

  return number;
};

const getDashboardData = (response) => {
  const data =
    response?.data?.dashboard ||
    response?.data ||
    response?.dashboard ||
    response ||
    {};

  return {
    assignedTickets: formatNumber(
      data.assignedTickets ??
        data.myTickets ??
        data.assigned ??
        data.stats?.assignedTickets,
    ),

    queueTickets: formatNumber(
      data.queueTickets ??
        data.openTickets ??
        data.queue ??
        data.stats?.queueTickets,
    ),

    inProgress: formatNumber(
      data.inProgress ?? data.inProgressTickets ?? data.stats?.inProgress,
    ),

    resolvedTickets: formatNumber(
      data.resolvedTickets ?? data.resolved ?? data.stats?.resolvedTickets,
    ),

    resolutionRate: Number(
      data.resolutionRate ?? data.stats?.resolutionRate ?? 0,
    ),

    recentTickets: data.recentTickets || data.recent || data.tickets || [],

    performance: data.performance || data.agentPerformance || {},
  };
};

const getStatusStyles = (status) => {
  const value = String(status || "").toLowerCase();

  if (value.includes("resolved") || value.includes("closed")) {
    return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
  }

  if (value.includes("progress")) {
    return "bg-blue-500/10 text-blue-400 border-blue-500/20";
  }

  if (value.includes("pending") || value.includes("waiting")) {
    return "bg-amber-500/10 text-amber-400 border-amber-500/20";
  }

  return "bg-slate-800 text-slate-400 border-slate-700";
};

const StatCard = ({
  icon: Icon,
  iconClass,
  value,
  title,
  description,
  trend,
  trendClass,
  progress,
}) => {
  return (
    <div className="rounded-3xl border border-slate-800 bg-[#0a1425] p-7 transition duration-300 hover:-translate-y-0.5 hover:border-slate-700">
      <div className="flex items-start justify-between">
        <div
          className={`flex h-14 w-14 items-center justify-center rounded-2xl ${iconClass}`}
        >
          <Icon size={25} strokeWidth={2} />
        </div>

        {trend && (
          <span className={`text-sm font-medium ${trendClass}`}>{trend}</span>
        )}
      </div>

      <div className="mt-7">
        <p className="text-sm text-slate-500">{title}</p>

        <p className="mt-2 text-3xl font-bold tracking-tight text-white">
          {value}
        </p>

        {description && (
          <p className="mt-2 text-sm text-slate-600">{description}</p>
        )}
      </div>

      {typeof progress === "number" && (
        <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full rounded-full bg-blue-500 transition-all"
            style={{
              width: `${Math.min(Math.max(progress, 0), 100)}%`,
            }}
          />
        </div>
      )}
    </div>
  );
};

const AgentDashboard = () => {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadDashboard = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await getAgentDashboard();

      setDashboard(getDashboardData(response));
    } catch (err) {
      console.error("Agent dashboard error:", err);

      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Unable to load the agent dashboard.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const data = useMemo(
    () =>
      dashboard || {
        assignedTickets: 0,
        queueTickets: 0,
        inProgress: 0,
        resolvedTickets: 0,
        resolutionRate: 0,
        recentTickets: [],
        performance: {},
      },
    [dashboard],
  );

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-110px)] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={32} className="animate-spin text-blue-500" />
          <p className="text-sm text-slate-500">Loading agent dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1500px] px-4 py-8 sm:px-6 lg:px-10 lg:py-12">
      {/* =========================================================
          PAGE HEADER
      ========================================================= */}
      <div className="mb-9 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-400">
            Overview
          </p>

          <h2 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Hi, Agent
          </h2>

          <p className="mt-3 text-base text-slate-500">
            Here's what's happening with your support workload.
          </p>
        </div>

        <div className="flex items-center gap-3 text-sm text-slate-500">
          <Clock3 size={17} />
          <span>Last updated just now</span>

          <button
            type="button"
            onClick={() => loadDashboard(true)}
            className="ml-2 flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/70 transition hover:border-blue-500/30 hover:text-white"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* =========================================================
          ERROR
      ========================================================= */}
      {error && (
        <div className="mb-6 flex items-center justify-between rounded-2xl border border-red-500/20 bg-red-500/5 px-5 py-4">
          <div className="flex items-center gap-3">
            <XCircle size={19} className="text-red-400" />
            <p className="text-sm text-red-300">{error}</p>
          </div>

          <button
            type="button"
            onClick={() => loadDashboard()}
            className="text-sm font-medium text-red-300 hover:text-white"
          >
            Retry
          </button>
        </div>
      )}

      {/* =========================================================
          STAT CARDS
      ========================================================= */}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Ticket}
          iconClass="bg-blue-500/10 text-blue-400"
          value={data.assignedTickets}
          title="Assigned tickets"
          description="Currently assigned to you"
          trend="↗ Active"
          trendClass="text-emerald-400"
        />

        <StatCard
          icon={Inbox}
          iconClass="bg-violet-500/10 text-violet-400"
          value={data.queueTickets}
          title="Queue tickets"
          description="Waiting for an agent"
          trend="Available"
          trendClass="text-violet-400"
        />

        <StatCard
          icon={Clock3}
          iconClass="bg-amber-500/10 text-amber-400"
          value={data.inProgress}
          title="In progress"
          description="Currently being handled"
          trend="Active"
          trendClass="text-amber-400"
        />

        <StatCard
          icon={CheckCircle2}
          iconClass="bg-emerald-500/10 text-emerald-400"
          value={data.resolvedTickets}
          title="Resolved tickets"
          description="Successfully completed"
          trend={`${data.resolutionRate || 0}%`}
          trendClass="text-emerald-400"
          progress={data.resolutionRate}
        />
      </div>

      {/* =========================================================
          LOWER CONTENT
      ========================================================= */}
      <div className="mt-7 grid gap-6 xl:grid-cols-[1.7fr_1fr]">
        {/* =======================================================
            RECENT TICKETS
        ======================================================= */}
        <section className="overflow-hidden rounded-3xl border border-slate-800 bg-[#0a1425]">
          <div className="flex items-center justify-between border-b border-slate-800 px-7 py-6">
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-semibold text-white">
                  Recent tickets
                </h3>

                <span className="flex items-center gap-2 text-xs font-medium text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Live
                </span>
              </div>

              <p className="mt-1 text-sm text-slate-600">
                Your latest support assignments
              </p>
            </div>

            <a
              href="/agent/tickets"
              className="text-sm font-medium text-blue-400 transition hover:text-blue-300"
            >
              View all
            </a>
          </div>

          <div className="divide-y divide-slate-800/80">
            {data.recentTickets.length > 0 ? (
              data.recentTickets.slice(0, 5).map((ticket, index) => {
                const ticketId = ticket?._id || ticket?.id || ticket?.ticketId;

                const customer =
                  ticket?.customer?.name ||
                  ticket?.customer?.fullName ||
                  ticket?.customerName ||
                  "Customer";

                return (
                  <a
                    key={ticketId || index}
                    href={
                      ticketId ? `/agent/tickets/${ticketId}` : "/agent/tickets"
                    }
                    className="flex items-center gap-4 px-7 py-5 transition hover:bg-slate-900/50"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                      <MessageSquare size={20} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold text-slate-200">
                          {ticket?.subject ||
                            ticket?.title ||
                            "Support request"}
                        </p>
                      </div>

                      <p className="mt-1 truncate text-xs text-slate-600">
                        {customer}
                        {ticket?.ticketNumber
                          ? ` • #${ticket.ticketNumber}`
                          : ""}
                      </p>
                    </div>

                    <span
                      className={`hidden rounded-full border px-3 py-1 text-xs font-medium sm:inline-flex ${getStatusStyles(
                        ticket?.status,
                      )}`}
                    >
                      {ticket?.status || "Open"}
                    </span>

                    <ArrowUpRight size={18} className="text-slate-700" />
                  </a>
                );
              })
            ) : (
              <div className="flex min-h-[240px] flex-col items-center justify-center px-6 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800/70 text-slate-600">
                  <Ticket size={25} />
                </div>

                <p className="mt-4 text-sm font-medium text-slate-400">
                  No recent tickets
                </p>

                <p className="mt-1 max-w-sm text-xs text-slate-600">
                  Your assigned tickets will appear here.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* =======================================================
            PERFORMANCE
        ======================================================= */}
        <section className="rounded-3xl border border-slate-800 bg-[#0a1425] p-7">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xl font-semibold text-white">
                My performance
              </h3>

              <p className="mt-1 text-sm text-slate-600">
                Your current support performance
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400">
              <TrendingUp size={21} />
            </div>
          </div>

          <div className="mt-10">
            <p className="text-sm text-slate-500">Resolution rate</p>

            <div className="mt-2 flex items-end gap-2">
              <span className="text-4xl font-bold text-white">
                {data.resolutionRate || 0}%
              </span>

              <span className="mb-1 text-sm text-emerald-400">↗ Active</span>
            </div>

            <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-violet-500"
                style={{
                  width: `${Math.min(
                    Math.max(data.resolutionRate || 0, 0),
                    100,
                  )}%`,
                }}
              />
            </div>
          </div>

          <div className="mt-10 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
              <Zap size={19} className="text-blue-400" />

              <p className="mt-4 text-xs text-slate-600">Tickets handled</p>

              <p className="mt-1 text-xl font-bold text-white">
                {data.assignedTickets + data.resolvedTickets}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
              <CheckCircle2 size={19} className="text-emerald-400" />

              <p className="mt-4 text-xs text-slate-600">Resolved</p>

              <p className="mt-1 text-xl font-bold text-white">
                {data.resolvedTickets}
              </p>
            </div>
          </div>

          <div className="mt-5 flex items-center gap-3 rounded-2xl bg-blue-500/5 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
              <UserRound size={19} className="text-blue-400" />
            </div>

            <div>
              <p className="text-sm font-medium text-slate-300">Keep it up!</p>

              <p className="mt-0.5 text-xs text-slate-600">
                Your support activity is being tracked.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AgentDashboard;
