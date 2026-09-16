import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  RefreshCw,
  Users,
  UserCheck,
  Clock3,
  BarChart3,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Timer,
  TrendingUp,
} from "lucide-react";

import { getAdminAgents } from "../../../services/adminAgentService";

const Agents = () => {
  const navigate = useNavigate();

  const [agents, setAgents] = useState([]);
  const [search, setSearch] = useState("");
  const [availability, setAvailability] = useState("all");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // ============================================================
  // LOAD AGENTS
  // ============================================================

  const loadAgents = useCallback(
    async ({ showLoader = true } = {}) => {
      try {
        if (showLoader) {
          setLoading(true);
        } else {
          setRefreshing(true);
        }

        setError("");

        const params = {};

        if (search.trim()) {
          params.search = search.trim();
        }

        if (availability !== "all") {
          params.availability = availability;
        }

        const response = await getAdminAgents(params);

        setAgents(Array.isArray(response?.agents) ? response.agents : []);
      } catch (err) {
        console.error("ADMIN LOAD AGENTS ERROR:", err);

        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Failed to load agents.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [search, availability],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      loadAgents();
    }, 300);

    return () => clearTimeout(timer);
  }, [loadAgents]);

  // ============================================================
  // PERFORMANCE HELPERS
  // ============================================================

  const getAssignedCount = (agent) => {
    return (
      agent.workload?.openTickets ??
      agent.performance?.assignedTickets ??
      agent.assignedTickets ??
      0
    );
  };

  const getResolvedCount = (agent) => {
    return (
      agent.workload?.resolvedTickets ??
      agent.performance?.resolvedTickets ??
      agent.resolvedTickets ??
      0
    );
  };

  const getTotalHandledCount = (agent) => {
    return (
      agent.performance?.totalTickets ??
      agent.totalTickets ??
      getAssignedCount(agent) + getResolvedCount(agent)
    );
  };

  const getResolutionRate = (agent) => {
    const explicitRate =
      agent.performance?.resolutionRate ?? agent.resolutionRate;

    if (
      explicitRate !== undefined &&
      explicitRate !== null &&
      explicitRate !== ""
    ) {
      const value = Number(explicitRate);

      return Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 0;
    }

    const assigned = getAssignedCount(agent);
    const resolved = getResolvedCount(agent);

    const total =
      agent.performance?.totalTickets ??
      agent.totalTickets ??
      assigned + resolved;

    if (!total) {
      return 0;
    }

    return Math.min(100, Math.max(0, (resolved / total) * 100));
  };

  const getAverageResponseMinutes = (agent) => {
    return (
      agent.performance?.averageResponseTime ??
      agent.performance?.averageResponseMinutes ??
      agent.averageResponseTime ??
      agent.averageFirstResponseMinutes ??
      null
    );
  };

  const getAverageResolutionMinutes = (agent) => {
    return (
      agent.performance?.averageResolutionTime ??
      agent.performance?.averageResolutionMinutes ??
      agent.averageResolutionTime ??
      null
    );
  };

  const formatMinutes = (minutes) => {
    if (
      minutes === null ||
      minutes === undefined ||
      minutes === "" ||
      Number.isNaN(Number(minutes))
    ) {
      return "—";
    }

    const value = Number(minutes);

    if (value < 1) {
      return "<1m";
    }

    if (value < 60) {
      return `${Math.round(value)}m`;
    }

    const hours = Math.floor(value / 60);
    const remainingMinutes = Math.round(value % 60);

    if (hours < 24) {
      if (!remainingMinutes) {
        return `${hours}h`;
      }

      return `${hours}h ${remainingMinutes}m`;
    }

    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;

    if (!remainingHours) {
      return `${days}d`;
    }

    return `${days}d ${remainingHours}h`;
  };

  // ============================================================
  // STATS
  // ============================================================

  const stats = useMemo(() => {
    const total = agents.length;

    const online = agents.filter(
      (agent) => agent.availability === "online",
    ).length;

    const busy = agents.filter((agent) => agent.availability === "busy").length;

    const ratings = agents
      .map((agent) =>
        Number(
          agent.rating ?? agent.averageRating ?? agent.performance?.rating ?? 0,
        ),
      )
      .filter((rating) => rating > 0);

    const averageRating =
      ratings.length > 0
        ? (
            ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
          ).toFixed(1)
        : "—";

    const totalAssigned = agents.reduce(
      (sum, agent) => sum + getAssignedCount(agent),
      0,
    );

    const totalResolved = agents.reduce(
      (sum, agent) => sum + getResolvedCount(agent),
      0,
    );

    const responseTimes = agents
      .map((agent) => Number(getAverageResponseMinutes(agent)))
      .filter((value) => Number.isFinite(value) && value >= 0);

    const resolutionTimes = agents
      .map((agent) => Number(getAverageResolutionMinutes(agent)))
      .filter((value) => Number.isFinite(value) && value >= 0);

    const averageResponse =
      responseTimes.length > 0
        ? responseTimes.reduce((sum, value) => sum + value, 0) /
          responseTimes.length
        : null;

    const averageResolution =
      resolutionTimes.length > 0
        ? resolutionTimes.reduce((sum, value) => sum + value, 0) /
          resolutionTimes.length
        : null;

    const totalHandled = agents.reduce(
      (sum, agent) => sum + getTotalHandledCount(agent),
      0,
    );

    const overallResolutionRate =
      totalHandled > 0 ? (totalResolved / totalHandled) * 100 : 0;

    return {
      total,
      online,
      busy,
      averageRating,
      totalAssigned,
      totalResolved,
      averageResponse,
      averageResolution,
      overallResolutionRate,
    };
  }, [agents]);

  // ============================================================
  // AVAILABILITY STYLE
  // ============================================================

  const getAvailabilityStyle = (value) => {
    switch (value) {
      case "online":
        return {
          dot: "bg-emerald-400",
          text: "text-emerald-400",
        };

      case "away":
        return {
          dot: "bg-amber-400",
          text: "text-amber-400",
        };

      case "busy":
        return {
          dot: "bg-orange-400",
          text: "text-orange-400",
        };

      case "offline":
      default:
        return {
          dot: "bg-slate-600",
          text: "text-slate-400",
        };
    }
  };

  // ============================================================
  // RESOLUTION RATE STYLE
  // ============================================================

  const getResolutionRateStyle = (rate) => {
    if (rate >= 80) {
      return "text-emerald-400";
    }

    if (rate >= 60) {
      return "text-amber-400";
    }

    return "text-red-400";
  };

  // ============================================================
  // AVATAR
  // ============================================================

  const getInitials = (name = "") => {
    return (
      name
        .split(" ")
        .filter(Boolean)
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase() || "AG"
    );
  };

  const API_SERVER = (
    import.meta.env.VITE_API_URL || "http://localhost:8000/api"
  ).replace(/\/api$/, "");

  const getAvatarUrl = (avatar) => {
    if (!avatar) return null;

    if (
      avatar.startsWith("http://") ||
      avatar.startsWith("https://") ||
      avatar.startsWith("blob:") ||
      avatar.startsWith("data:")
    ) {
      return avatar;
    }

    return `${API_SERVER}${avatar.startsWith("/") ? avatar : `/${avatar}`}`;
  };

  return (
    <div className="min-h-full px-4 py-6 sm:px-6 lg:px-8">
      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-400">
          Administration
        </p>

        <h1 className="mt-1 text-2xl font-bold text-white">
          Agent Performance
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Monitor agent availability, workload and performance.
        </p>
      </div>

      {/* ======================================================
          STATS
      ====================================================== */}

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {/* Total Agents */}

        <div className="rounded-2xl border border-slate-800 bg-[#0a1222] p-5">
          <Users size={19} className="text-blue-400" />

          <p className="mt-3 text-xs text-slate-500">Total Agents</p>

          <p className="mt-1 text-2xl font-bold text-white">
            {loading ? "—" : stats.total}
          </p>
        </div>

        {/* Online */}

        <div className="rounded-2xl border border-slate-800 bg-[#0a1222] p-5">
          <UserCheck size={19} className="text-emerald-400" />

          <p className="mt-3 text-xs text-slate-500">Online</p>

          <p className="mt-1 text-2xl font-bold text-white">
            {loading ? "—" : stats.online}
          </p>
        </div>

        {/* Assigned */}

        <div className="rounded-2xl border border-slate-800 bg-[#0a1222] p-5">
          <Clock3 size={19} className="text-amber-400" />

          <p className="mt-3 text-xs text-slate-500">Assigned Tickets</p>

          <p className="mt-1 text-2xl font-bold text-white">
            {loading ? "—" : stats.totalAssigned}
          </p>
        </div>

        {/* Resolution Rate */}

        <div className="rounded-2xl border border-slate-800 bg-[#0a1222] p-5">
          <TrendingUp size={19} className="text-purple-400" />

          <p className="mt-3 text-xs text-slate-500">Resolution Rate</p>

          <p className="mt-1 text-2xl font-bold text-white">
            {loading ? "—" : `${stats.overallResolutionRate.toFixed(1)}%`}
          </p>
        </div>
      </div>

      {/* ======================================================
          PERFORMANCE SUMMARY
      ====================================================== */}

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-[#0a1222] p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-500/10 p-2">
              <Timer size={17} className="text-blue-400" />
            </div>

            <div>
              <p className="text-xs text-slate-500">Avg. Response Time</p>

              <p className="mt-1 text-lg font-semibold text-white">
                {loading ? "—" : formatMinutes(stats.averageResponse)}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-[#0a1222] p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-500/10 p-2">
              <CheckCircle2 size={17} className="text-emerald-400" />
            </div>

            <div>
              <p className="text-xs text-slate-500">Total Resolved</p>

              <p className="mt-1 text-lg font-semibold text-white">
                {loading ? "—" : stats.totalResolved}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-[#0a1222] p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-purple-500/10 p-2">
              <Clock3 size={17} className="text-purple-400" />
            </div>

            <div>
              <p className="text-xs text-slate-500">Avg. Resolution Time</p>

              <p className="mt-1 text-lg font-semibold text-white">
                {loading ? "—" : formatMinutes(stats.averageResolution)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================
          FILTERS
      ====================================================== */}

      <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-slate-800 bg-[#0a1222] p-4 md:flex-row">
        <div className="relative flex-1">
          <Search
            size={17}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600"
          />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search agents..."
            className="w-full rounded-xl border border-slate-800 bg-slate-900/60 py-2.5 pl-10 pr-4 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-500/40"
          />
        </div>

        <div className="flex gap-3">
          <select
            value={availability}
            onChange={(e) => setAvailability(e.target.value)}
            className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-2.5 text-sm text-slate-300 outline-none focus:border-blue-500/40"
          >
            <option value="all">All Availability</option>

            <option value="online">Online</option>

            <option value="away">Away</option>

            <option value="busy">Busy</option>

            <option value="offline">Offline</option>
          </select>

          <button
            type="button"
            onClick={() =>
              loadAgents({
                showLoader: false,
              })
            }
            disabled={loading || refreshing}
            className="rounded-xl border border-slate-800 p-2.5 text-slate-500 transition hover:border-slate-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            title="Refresh agents"
          >
            {refreshing ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <RefreshCw size={16} />
            )}
          </button>
        </div>
      </div>

      {/* ======================================================
          ERROR
      ====================================================== */}

      {error && (
        <div className="mb-5 flex items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
          <AlertCircle size={17} />

          <span>{error}</span>

          <button
            type="button"
            onClick={() => loadAgents()}
            className="ml-auto rounded-lg border border-red-500/20 px-3 py-1.5 text-xs transition hover:bg-red-500/10"
          >
            Retry
          </button>
        </div>
      )}

      {/* ======================================================
          AGENT PERFORMANCE TABLE
      ====================================================== */}

      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-[#0a1222]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1250px]">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="px-5 py-4 text-left text-[10px] uppercase tracking-wider text-slate-500">
                  Agent
                </th>

                <th className="px-5 py-4 text-left text-[10px] uppercase tracking-wider text-slate-500">
                  Availability
                </th>

                <th className="px-5 py-4 text-left text-[10px] uppercase tracking-wider text-slate-500">
                  Assigned
                </th>

                <th className="px-5 py-4 text-left text-[10px] uppercase tracking-wider text-slate-500">
                  Resolved
                </th>

                <th className="px-5 py-4 text-left text-[10px] uppercase tracking-wider text-slate-500">
                  Resolution Rate
                </th>

                <th className="px-5 py-4 text-left text-[10px] uppercase tracking-wider text-slate-500">
                  Avg. Response
                </th>

                <th className="px-5 py-4 text-left text-[10px] uppercase tracking-wider text-slate-500">
                  Avg. Resolution
                </th>

                <th className="px-5 py-4 text-left text-[10px] uppercase tracking-wider text-slate-500">
                  Rating
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800">
              {/* Loading */}

              {loading && (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center">
                    <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
                      <Loader2 size={18} className="animate-spin" />
                      Loading agents...
                    </div>
                  </td>
                </tr>
              )}

              {/* Empty */}

              {!loading && !error && agents.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <Users size={28} className="text-slate-700" />

                      <p className="mt-3 text-sm font-medium text-slate-400">
                        No agents found
                      </p>

                      <p className="mt-1 text-xs text-slate-600">
                        Try changing your search or availability filter.
                      </p>
                    </div>
                  </td>
                </tr>
              )}

              {/* Agents */}

              {!loading &&
                agents.map((agent) => {
                  const availabilityStyle = getAvailabilityStyle(
                    agent.availability,
                  );

                  const avatarUrl = getAvatarUrl(agent.avatar);

                  const assigned = getAssignedCount(agent);

                  const resolved = getResolvedCount(agent);

                  const resolutionRate = getResolutionRate(agent);

                  const responseTime = getAverageResponseMinutes(agent);

                  const resolutionTime = getAverageResolutionMinutes(agent);

                  return (
                    <tr
                      key={agent._id}
                      onClick={() => navigate(`/admin/agents/${agent._id}`)}
                      className="cursor-pointer transition hover:bg-slate-900/40"
                    >
                      {/* Agent */}

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-blue-500/10 text-xs font-bold text-blue-400">
                            {avatarUrl ? (
                              <img
                                src={avatarUrl}
                                alt={agent.name || "Agent"}
                                className="h-full w-full object-cover"
                                onError={(event) => {
                                  event.currentTarget.style.display = "none";
                                }}
                              />
                            ) : (
                              getInitials(agent.name)
                            )}
                          </div>

                          <div>
                            <p className="text-sm font-medium text-white">
                              {agent.name}
                            </p>

                            <p className="text-xs text-slate-600">
                              {agent.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Availability */}

                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-2 text-xs capitalize">
                          <span
                            className={`h-2 w-2 rounded-full ${availabilityStyle.dot}`}
                          />

                          <span className={availabilityStyle.text}>
                            {agent.availability || "offline"}
                          </span>
                        </span>
                      </td>

                      {/* Assigned */}

                      <td className="px-5 py-4 text-sm text-slate-300">
                        <span className="font-medium">{assigned}</span>
                      </td>

                      {/* Resolved */}

                      <td className="px-5 py-4 text-sm text-slate-300">
                        <span className="font-medium">{resolved}</span>
                      </td>

                      {/* Resolution Rate */}

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-800">
                            <div
                              className="h-full rounded-full bg-emerald-400 transition-all"
                              style={{
                                width: `${resolutionRate}%`,
                              }}
                            />
                          </div>

                          <span
                            className={`text-xs font-medium ${getResolutionRateStyle(
                              resolutionRate,
                            )}`}
                          >
                            {resolutionRate.toFixed(1)}%
                          </span>
                        </div>
                      </td>

                      {/* Response Time */}

                      <td className="px-5 py-4 text-sm text-slate-400">
                        {formatMinutes(responseTime)}
                      </td>

                      {/* Resolution Time */}

                      <td className="px-5 py-4 text-sm text-slate-400">
                        {formatMinutes(resolutionTime)}
                      </td>

                      {/* Rating */}
                      <td className="px-5 py-4 text-sm">
                        {agent.averageRating != null ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-amber-400">★</span>

                            <span className="font-medium text-amber-300">
                              {Number(agent.averageRating).toFixed(1)}
                            </span>

                            {agent.totalRatings > 0 && (
                              <span className="text-xs text-slate-600">
                                ({agent.totalRatings})
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Agents;
