import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Mail,
  UserCheck,
  Ticket,
  CheckCircle2,
  Star,
  Clock3,
  Loader2,
  AlertCircle,
  RefreshCw,
  Power,
} from "lucide-react";

import {
  getAdminAgent,
  updateAdminAgentStatus,
  updateAdminAgentAvailability,
} from "../../../services/adminAgentService";

const AgentDetails = () => {
  const navigate = useNavigate();
  const { agentId } = useParams();

  const [agent, setAgent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  // ============================================================
  // LOAD AGENT
  // ============================================================

  const loadAgent = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getAdminAgent(agentId);

      setAgent(response?.agent || null);
    } catch (err) {
      console.error("ADMIN LOAD AGENT ERROR:", err);

      setError(
        err?.response?.data?.message || err?.message || "Failed to load agent.",
      );
    } finally {
      setLoading(false);
    }
  }, [agentId]);

  useEffect(() => {
    loadAgent();
  }, [loadAgent]);

  // ============================================================
  // AVATAR
  // ============================================================

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

  // ============================================================
  // AVAILABILITY STYLE
  // ============================================================

  const getAvailabilityStyle = (availability) => {
    switch (availability) {
      case "online":
        return {
          dot: "bg-emerald-400",
          badge: "bg-emerald-500/10 text-emerald-400",
        };

      case "away":
        return {
          dot: "bg-amber-400",
          badge: "bg-amber-500/10 text-amber-400",
        };

      case "busy":
        return {
          dot: "bg-orange-400",
          badge: "bg-orange-500/10 text-orange-400",
        };

      case "offline":
      default:
        return {
          dot: "bg-slate-600",
          badge: "bg-slate-500/10 text-slate-400",
        };
    }
  };

  // ============================================================
  // UPDATE STATUS
  // ============================================================

  const handleStatusChange = async (newStatus) => {
    if (!agent) return;

    try {
      setActionLoading(true);
      setError("");

      const response = await updateAdminAgentStatus(agent._id, newStatus);

      if (response?.agent) {
        setAgent((current) => ({
          ...current,
          ...response.agent,
        }));
      }
    } catch (err) {
      console.error("ADMIN UPDATE AGENT STATUS ERROR:", err);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to update agent status.",
      );
    } finally {
      setActionLoading(false);
    }
  };

  // ============================================================
  // UPDATE AVAILABILITY
  // ============================================================

  const handleAvailabilityChange = async (newAvailability) => {
    if (!agent) return;

    try {
      setActionLoading(true);
      setError("");

      const response = await updateAdminAgentAvailability(
        agent._id,
        newAvailability,
      );

      if (response?.agent) {
        setAgent((current) => ({
          ...current,
          ...response.agent,
        }));
      }
    } catch (err) {
      console.error("ADMIN UPDATE AGENT AVAILABILITY ERROR:", err);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to update availability.",
      );
    } finally {
      setActionLoading(false);
    }
  };

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Loader2 size={18} className="animate-spin" />
          Loading agent...
        </div>
      </div>
    );
  }

  // ============================================================
  // ERROR / NOT FOUND
  // ============================================================

  if (!agent) {
    return (
      <div className="min-h-full px-4 py-6 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => navigate("/admin/agents")}
          className="mb-5 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-white"
        >
          <ArrowLeft size={16} />
          Back to Agents
        </button>

        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
          <div className="flex items-center gap-3 text-red-400">
            <AlertCircle size={18} />
            <p className="text-sm">{error || "Agent not found."}</p>
          </div>

          <button
            type="button"
            onClick={loadAgent}
            className="mt-4 inline-flex items-center gap-2 rounded-xl border border-slate-800 px-4 py-2 text-sm text-slate-300 hover:bg-slate-900"
          >
            <RefreshCw size={15} />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const availabilityStyle = getAvailabilityStyle(agent.availability);

  const avatarUrl = getAvatarUrl(agent.avatar);

  const assigned = agent.workload?.openTickets ?? 0;

  const resolved = agent.workload?.resolvedTickets ?? 0;

  const totalTickets = agent.workload?.totalTickets ?? 0;

  const inProgress = agent.workload?.inProgressTickets ?? 0;

  const waiting = agent.workload?.waitingTickets ?? 0;

  const closed = agent.workload?.closedTickets ?? 0;

  const rating =
    agent.rating ?? agent.averageRating ?? agent.performance?.rating ?? null;

  return (
    <div className="min-h-full px-4 py-6 sm:px-6 lg:px-8">
      {/* ======================================================
          BACK
      ====================================================== */}

      <button
        type="button"
        onClick={() => navigate("/admin/agents")}
        className="mb-5 inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-white"
      >
        <ArrowLeft size={16} />
        Back to Agents
      </button>

      {/* ======================================================
          ERROR
      ====================================================== */}

      {error && (
        <div className="mb-5 flex items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
          <AlertCircle size={17} />
          <span>{error}</span>

          <button
            type="button"
            onClick={loadAgent}
            className="ml-auto rounded-lg border border-red-500/20 px-3 py-1.5 text-xs hover:bg-red-500/10"
          >
            Retry
          </button>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          {/* ==================================================
              AGENT HEADER
          ================================================== */}

          <section className="rounded-2xl border border-slate-800 bg-[#0a1222] p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                {/* Avatar */}

                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-blue-500/10 text-lg font-bold text-blue-400">
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
                  <h1 className="text-xl font-bold text-white">{agent.name}</h1>

                  <p className="mt-1 text-sm text-slate-500">{agent.email}</p>

                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-2 rounded-lg px-2.5 py-1 text-xs capitalize ${availabilityStyle.badge}`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${availabilityStyle.dot}`}
                      />

                      {agent.availability || "offline"}
                    </span>

                    <span
                      className={`rounded-lg px-2.5 py-1 text-xs capitalize ${
                        agent.status === "active"
                          ? "bg-emerald-500/10 text-emerald-400"
                          : agent.status === "suspended"
                            ? "bg-red-500/10 text-red-400"
                            : "bg-slate-500/10 text-slate-400"
                      }`}
                    >
                      {agent.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Manage */}

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => navigate(`/admin/agents/${agent._id}/edit`)}
                  className="rounded-xl border border-slate-800 px-4 py-2.5 text-sm text-slate-300 transition hover:bg-slate-900 disabled:opacity-50"
                >
                  Edit Agent
                </button>

                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() =>
                    handleStatusChange(
                      agent.status === "active" ? "inactive" : "active",
                    )
                  }
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-800 px-4 py-2.5 text-sm text-slate-300 transition hover:bg-slate-900 disabled:opacity-50"
                >
                  {actionLoading ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <Power size={15} />
                  )}

                  {agent.status === "active" ? "Deactivate" : "Activate"}
                </button>
              </div>
            </div>
          </section>

          {/* ==================================================
              STAT CARDS
          ================================================== */}

          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Assigned", assigned, Ticket, "text-blue-400"],
              ["Resolved", resolved, CheckCircle2, "text-emerald-400"],
              ["Rating", rating ? `★ ${rating}` : "—", Star, "text-amber-400"],
              ["Total Tickets", totalTickets, Clock3, "text-purple-400"],
            ].map(([label, value, Icon, iconColor]) => (
              <div
                key={label}
                className="rounded-2xl border border-slate-800 bg-[#0a1222] p-5"
              >
                <Icon size={18} className={iconColor} />

                <p className="mt-4 text-xs text-slate-500">{label}</p>

                <p className="mt-1 text-xl font-bold text-white">{value}</p>
              </div>
            ))}
          </section>

          {/* ==================================================
              WORKLOAD
          ================================================== */}

          <section className="rounded-2xl border border-slate-800 bg-[#0a1222] p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-white">
                  Ticket Workload
                </h2>

                <p className="mt-1 text-xs text-slate-600">
                  Current ticket distribution for this agent.
                </p>
              </div>

              <Ticket size={18} className="text-blue-400" />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
              {[
                ["Open", assigned],
                ["In Progress", inProgress],
                ["Waiting", waiting],
                ["Resolved", resolved],
                ["Closed", closed],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-xl border border-slate-800 bg-slate-900/40 p-4"
                >
                  <p className="text-[11px] text-slate-600">{label}</p>

                  <p className="mt-1 text-lg font-bold text-white">{value}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ==================================================
              AVAILABILITY MANAGEMENT
          ================================================== */}

          <section className="rounded-2xl border border-slate-800 bg-[#0a1222] p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-white">
                  Manage Availability
                </h2>

                <p className="mt-1 text-xs text-slate-600">
                  Update the agent's current availability.
                </p>
              </div>

              {actionLoading && (
                <Loader2 size={17} className="animate-spin text-slate-500" />
              )}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {["online", "away", "busy", "offline"].map((value) => {
                const active = agent.availability === value;

                return (
                  <button
                    key={value}
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleAvailabilityChange(value)}
                    className={`rounded-xl border px-4 py-3 text-sm capitalize transition ${
                      active
                        ? "border-blue-500/40 bg-blue-500/10 text-blue-400"
                        : "border-slate-800 bg-slate-900/40 text-slate-400 hover:bg-slate-900 hover:text-white"
                    } disabled:cursor-not-allowed disabled:opacity-50`}
                  >
                    {value}
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        {/* ======================================================
            SIDEBAR
        ====================================================== */}

        <aside className="h-fit rounded-2xl border border-slate-800 bg-[#0a1222] p-5">
          <h2 className="text-sm font-semibold text-white">
            Agent Information
          </h2>

          <div className="mt-5 space-y-5">
            {/* Email */}

            <div className="flex gap-3">
              <Mail size={17} className="text-slate-600" />

              <div className="min-w-0">
                <p className="text-[11px] text-slate-600">Email</p>

                <p className="mt-1 break-all text-sm text-slate-300">
                  {agent.email}
                </p>
              </div>
            </div>

            {/* Availability */}

            <div className="flex gap-3">
              <UserCheck size={17} className="text-slate-600" />

              <div>
                <p className="text-[11px] text-slate-600">Availability</p>

                <p className="mt-1 text-sm capitalize text-slate-300">
                  {agent.availability || "offline"}
                </p>
              </div>
            </div>

            {/* Status */}

            <div className="flex gap-3">
              <Power size={17} className="text-slate-600" />

              <div>
                <p className="text-[11px] text-slate-600">Account Status</p>

                <p className="mt-1 text-sm capitalize text-slate-300">
                  {agent.status}
                </p>
              </div>
            </div>

            {/* Rating */}

            <div className="flex gap-3">
              <Star size={17} className="text-slate-600" />

              <div>
                <p className="text-[11px] text-slate-600">Customer Rating</p>

                <p className="mt-1 text-sm text-slate-300">
                  {rating ? `★ ${rating} / 5` : "No rating yet"}
                </p>
              </div>
            </div>

            {/* Created */}

            {agent.createdAt && (
              <div className="border-t border-slate-800 pt-5">
                <p className="text-[11px] text-slate-600">Joined</p>

                <p className="mt-1 text-sm text-slate-400">
                  {new Date(agent.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
            )}

            {/* Agent ID */}

            <div className="border-t border-slate-800 pt-5">
              <p className="text-[11px] text-slate-600">Agent ID</p>

              <p className="mt-1 break-all text-xs text-slate-500">{agentId}</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default AgentDetails;
