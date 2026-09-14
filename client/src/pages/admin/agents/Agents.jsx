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

    return {
      total,
      online,
      busy,
      averageRating,
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

  // ============================================================
  // WORKLOAD
  // ============================================================

  const getAssignedCount = (agent) => {
    return agent.workload?.openTickets ?? 0;
  };

  const getResolvedCount = (agent) => {
    return agent.workload?.resolvedTickets ?? 0;
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

        <h1 className="mt-1 text-2xl font-bold text-white">Agent Management</h1>

        <p className="mt-1 text-sm text-slate-500">
          Monitor agent availability, workload and performance.
        </p>
      </div>

      {/* ======================================================
          STATS
      ====================================================== */}

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {/* Total */}

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

        {/* Busy */}

        <div className="rounded-2xl border border-slate-800 bg-[#0a1222] p-5">
          <Clock3 size={19} className="text-amber-400" />

          <p className="mt-3 text-xs text-slate-500">Busy</p>

          <p className="mt-1 text-2xl font-bold text-white">
            {loading ? "—" : stats.busy}
          </p>
        </div>

        {/* Rating */}

        <div className="rounded-2xl border border-slate-800 bg-[#0a1222] p-5">
          <BarChart3 size={19} className="text-purple-400" />

          <p className="mt-3 text-xs text-slate-500">Avg. Rating</p>

          <p className="mt-1 text-2xl font-bold text-white">
            {loading ? "—" : stats.averageRating}
          </p>
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
          TABLE
      ====================================================== */}

      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-[#0a1222]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
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
                  Rating
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800">
              {/* Loading */}

              {loading && (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center">
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
                  <td colSpan={5} className="px-5 py-12 text-center">
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

                      <td className="px-5 py-4 text-sm text-slate-400">
                        {getAssignedCount(agent)}
                      </td>

                      {/* Resolved */}

                      <td className="px-5 py-4 text-sm text-slate-400">
                        {getResolvedCount(agent)}
                      </td>

                      {/* Rating */}

                      <td className="px-5 py-4 text-sm text-amber-400">
                        {agent.rating ||
                        agent.averageRating ||
                        agent.performance?.rating ? (
                          <>
                            ★{" "}
                            {agent.rating ||
                              agent.averageRating ||
                              agent.performance?.rating}
                          </>
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
