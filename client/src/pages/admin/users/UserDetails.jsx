import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  ArrowLeft,
  Mail,
  ShieldCheck,
  CalendarDays,
  Ticket,
  MessageSquare,
  Edit,
  UserCheck,
  UserX,
  Phone,
  Building2,
  Clock3,
  Globe2,
  Languages,
  Bot,
  Bell,
  RefreshCw,
  AlertTriangle,
  X,
} from "lucide-react";

import {
  getAdminUser,
  getAdminUserTicketStats,
  updateAdminUserStatus,
} from "../../../services/adminUserService";

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

// ============================================================
// ROLE STYLES
// ============================================================

const roleStyles = {
  customer: "border-slate-500/10 bg-slate-500/10 text-slate-400",

  agent: "border-blue-500/10 bg-blue-500/10 text-blue-400",

  admin: "border-purple-500/10 bg-purple-500/10 text-purple-400",
};

// ============================================================
// STATUS STYLES
// ============================================================

const statusStyles = {
  active: "border-emerald-500/10 bg-emerald-500/10 text-emerald-400",

  inactive: "border-slate-500/10 bg-slate-500/10 text-slate-400",

  suspended: "border-red-500/10 bg-red-500/10 text-red-400",
};

// ============================================================
// USER DETAILS
// ============================================================

const UserDetails = () => {
  const navigate = useNavigate();
  const { userId } = useParams();

  // ==========================================================
  // STATE
  // ==========================================================

  const [user, setUser] = useState(null);

  const [ticketStats, setTicketStats] = useState({
    totalTickets: 0,
    openTickets: 0,
    inProgressTickets: 0,
    waitingTickets: 0,
    resolvedTickets: 0,
    closedTickets: 0,
    escalatedTickets: 0,
  });

  const [loading, setLoading] = useState(true);

  const [actionLoading, setActionLoading] = useState(false);

  const [error, setError] = useState("");

  const [statusModal, setStatusModal] = useState(false);

  // ==========================================================
  // FETCH USER
  // ==========================================================

  const fetchUser = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getAdminUser(userId);

      if (!response?.success) {
        throw new Error(response?.message || "Failed to load user.");
      }

      setUser(response.user || null);
    } catch (err) {
      console.error("ADMIN USER DETAILS ERROR:", err);

      setError(
        err?.response?.data?.message || err?.message || "Failed to load user.",
      );
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // ==========================================================
  // FETCH TICKET STATISTICS
  // ==========================================================

  const fetchTicketStats = useCallback(async () => {
    try {
      const response = await getAdminUserTicketStats(userId);

      if (response?.success && response?.stats) {
        setTicketStats(response.stats);
      }
    } catch (err) {
      console.error("ADMIN USER TICKET STATS ERROR:", err);

      // Do not block the entire
      // user profile if ticket stats
      // fail.
    }
  }, [userId]);

  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {
    fetchUser();
    fetchTicketStats();
  }, [fetchUser, fetchTicketStats]);

  // ==========================================================
  // STATUS CHANGE
  // ==========================================================

  const handleStatusChange = async (newStatus) => {
    try {
      setActionLoading(true);
      setError("");

      const response = await updateAdminUserStatus(userId, newStatus);

      if (!response?.success) {
        throw new Error(response?.message || "Failed to update user status.");
      }

      setStatusModal(false);

      await fetchUser();
    } catch (err) {
      console.error("ADMIN USER STATUS ERROR:", err);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to update user status.",
      );
    } finally {
      setActionLoading(false);
    }
  };

  // ==========================================================
  // HELPERS
  // ==========================================================

  const getInitials = (name) => {
    if (!name) {
      return "U";
    }

    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  const formatDate = (date) => {
    if (!date) {
      return "—";
    }

    return new Date(date).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatDateTime = (date) => {
    if (!date) {
      return "Never";
    }

    return new Date(date).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const resolutionRate =
    ticketStats.totalTickets > 0
      ? (
          (ticketStats.resolvedTickets / ticketStats.totalTickets) *
          100
        ).toFixed(1)
      : "0.0";

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <div className="min-h-full px-4 py-6 sm:px-6 lg:px-8">
        <div className="animate-pulse">
          <div className="mb-5 h-5 w-32 rounded bg-slate-800" />

          <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
            <div className="space-y-6">
              <div className="h-40 rounded-2xl border border-slate-800 bg-[#0a1222]" />

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="h-32 rounded-2xl border border-slate-800 bg-[#0a1222]" />
                <div className="h-32 rounded-2xl border border-slate-800 bg-[#0a1222]" />
                <div className="h-32 rounded-2xl border border-slate-800 bg-[#0a1222]" />
              </div>
            </div>

            <div className="h-[420px] rounded-2xl border border-slate-800 bg-[#0a1222]" />
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================
  // ERROR / USER NOT FOUND
  // ==========================================================

  if (error && !user) {
    return (
      <div className="min-h-full px-4 py-6 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => navigate("/admin/users")}
          className="mb-5 inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-white"
        >
          <ArrowLeft size={16} />
          Back to Users
        </button>

        <div className="flex min-h-[420px] items-center justify-center rounded-2xl border border-slate-800 bg-[#0a1222]">
          <div className="max-w-md px-6 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-400">
              <AlertTriangle size={24} />
            </div>

            <h2 className="mt-5 text-base font-semibold text-white">
              Unable to load user
            </h2>

            <p className="mt-2 text-xs leading-5 text-slate-600">{error}</p>

            <button
              type="button"
              onClick={() => {
                fetchUser();
                fetchTicketStats();
              }}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-500"
            >
              <RefreshCw size={14} />
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // ==========================================================
  // MAIN UI
  // ==========================================================

  return (
    <div className="min-h-full px-4 py-6 sm:px-6 lg:px-8">
      {/* ======================================================
          BACK
      ====================================================== */}

      <button
        type="button"
        onClick={() => navigate("/admin/users")}
        className="mb-5 inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-white"
      >
        <ArrowLeft size={16} />
        Back to Users
      </button>

      {/* ======================================================
          ERROR
      ====================================================== */}

      {error && (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />

          <p className="flex-1 text-xs text-red-400">{error}</p>

          <button
            type="button"
            onClick={() => setError("")}
            className="text-slate-600 transition hover:text-white"
          >
            <X size={15} />
          </button>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        {/* ====================================================
            MAIN COLUMN
        ==================================================== */}

        <div className="space-y-6">
          {/* ==================================================
              USER HEADER
          ================================================== */}

          <section className="rounded-2xl border border-slate-800 bg-[#0a1222] p-5 sm:p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-4">
                {user.avatar ? (
                  <img
                    src={getAvatarUrl(user.avatar)}
                    alt={user.name || "User"}
                    className="h-16 w-16 shrink-0 rounded-2xl object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 text-lg font-bold text-blue-400">
                    {getInitials(user.name)}
                  </div>
                )}

                <div className="min-w-0">
                  <h1 className="truncate text-xl font-bold text-white">
                    {user.name}
                  </h1>

                  <p className="mt-1 truncate text-sm text-slate-500">
                    {user.email}
                  </p>

                  <div className="mt-2 flex flex-wrap gap-2">
                    <span
                      className={`rounded-lg border px-2.5 py-1 text-xs font-medium capitalize ${
                        roleStyles[user.role] || roleStyles.customer
                      }`}
                    >
                      {user.role}
                    </span>

                    <span
                      className={`rounded-lg border px-2.5 py-1 text-xs font-medium capitalize ${
                        statusStyles[user.status] || statusStyles.inactive
                      }`}
                    >
                      {user.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={() => navigate(`/admin/users/${user._id}/edit`)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-800 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-900 hover:text-white"
                >
                  <Edit size={16} />
                  Edit User
                </button>

                <button
                  type="button"
                  onClick={() => setStatusModal(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-800 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-900 hover:text-white"
                >
                  {user.status === "active" ? (
                    <UserX size={16} />
                  ) : (
                    <UserCheck size={16} />
                  )}
                  Status
                </button>
              </div>
            </div>
          </section>

          {/* ==================================================
              TICKET STATS
          ================================================== */}

          <section className="grid gap-4 sm:grid-cols-3">
            <MetricCard
              icon={Ticket}
              iconClass="text-blue-400"
              label="Total Tickets"
              value={ticketStats.totalTickets}
            />

            <MetricCard
              icon={MessageSquare}
              iconClass="text-purple-400"
              label="Resolved"
              value={ticketStats.resolvedTickets}
            />

            <MetricCard
              icon={UserCheck}
              iconClass="text-emerald-400"
              label="Resolution Rate"
              value={`${resolutionRate}%`}
            />
          </section>

          {/* ==================================================
              TICKET BREAKDOWN
          ================================================== */}

          <section className="rounded-2xl border border-slate-800 bg-[#0a1222] p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-white">
                  Ticket Overview
                </h2>

                <p className="mt-1 text-xs text-slate-600">
                  Current ticket activity for this user.
                </p>
              </div>

              <Ticket size={18} className="text-slate-600" />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <TicketStat
                label="Open"
                value={ticketStats.openTickets}
                className="text-blue-400"
              />

              <TicketStat
                label="In Progress"
                value={ticketStats.inProgressTickets}
                className="text-amber-400"
              />

              <TicketStat
                label="Waiting"
                value={ticketStats.waitingTickets}
                className="text-purple-400"
              />

              <TicketStat
                label="Closed"
                value={ticketStats.closedTickets}
                className="text-slate-400"
              />
            </div>

            {ticketStats.escalatedTickets > 0 && (
              <div className="mt-4 rounded-xl border border-red-500/10 bg-red-500/5 px-4 py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-red-400">
                      Escalated Tickets
                    </p>

                    <p className="mt-1 text-[11px] text-slate-600">
                      Tickets requiring elevated attention.
                    </p>
                  </div>

                  <span className="text-lg font-bold text-red-400">
                    {ticketStats.escalatedTickets}
                  </span>
                </div>
              </div>
            )}
          </section>

          {/* ==================================================
              PROFILE INFORMATION
          ================================================== */}

          <section className="rounded-2xl border border-slate-800 bg-[#0a1222] p-5 sm:p-6">
            <h2 className="text-sm font-semibold text-white">
              Profile Information
            </h2>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <InfoItem icon={Mail} label="Email" value={user.email} />

              <InfoItem
                icon={Phone}
                label="Phone"
                value={user.phone || "Not provided"}
              />

              <InfoItem
                icon={Building2}
                label="Company"
                value={user.company || "Not provided"}
              />

              <InfoItem
                icon={Globe2}
                label="Timezone"
                value={user.timezone || "Not configured"}
              />

              <InfoItem
                icon={Languages}
                label="Language"
                value={user.language || "English"}
              />

              <InfoItem
                icon={Clock3}
                label="Last Seen"
                value={formatDateTime(user.lastSeen)}
              />
            </div>
          </section>
        </div>

        {/* ====================================================
            SIDEBAR
        ==================================================== */}

        <aside className="space-y-6">
          {/* ==================================================
              ACCOUNT INFORMATION
          ================================================== */}

          <section className="rounded-2xl border border-slate-800 bg-[#0a1222] p-5">
            <h2 className="text-sm font-semibold text-white">
              Account Information
            </h2>

            <div className="mt-5 space-y-5">
              <InfoItem
                icon={ShieldCheck}
                label="Role"
                value={user.role}
                capitalize
              />

              <InfoItem
                icon={UserCheck}
                label="Account Status"
                value={user.status}
                capitalize
              />

              <InfoItem
                icon={CalendarDays}
                label="Joined"
                value={formatDate(user.createdAt)}
              />

              <InfoItem
                icon={Clock3}
                label="Last Updated"
                value={formatDateTime(user.updatedAt)}
              />

              <div className="border-t border-slate-800 pt-5">
                <p className="text-[11px] text-slate-600">User ID</p>

                <p className="mt-1 break-all font-mono text-[10px] text-slate-500">
                  {user._id}
                </p>
              </div>
            </div>
          </section>

          {/* ==================================================
              PREFERENCES
          ================================================== */}

          <section className="rounded-2xl border border-slate-800 bg-[#0a1222] p-5">
            <h2 className="text-sm font-semibold text-white">Preferences</h2>

            <div className="mt-5 space-y-4">
              <PreferenceRow
                icon={Globe2}
                label="Timezone"
                value={user.timezone || "Asia/Karachi"}
              />

              <PreferenceRow
                icon={Languages}
                label="Language"
                value={user.language || "English"}
              />

              <PreferenceRow
                icon={MessageSquare}
                label="Preferred Channel"
                value={user.preferredChannel || "chat"}
              />

              <PreferenceRow
                icon={Bot}
                label="AI Support"
                value={user.aiSupport?.enabled ? "Enabled" : "Disabled"}
              />

              <PreferenceRow
                icon={Bell}
                label="Email Notifications"
                value={
                  user.notificationPreferences?.email ? "Enabled" : "Disabled"
                }
              />
            </div>
          </section>

          {/* ==================================================
              AVAILABILITY
          ================================================== */}

          {user.role === "agent" && (
            <section className="rounded-2xl border border-slate-800 bg-[#0a1222] p-5">
              <h2 className="text-sm font-semibold text-white">
                Agent Availability
              </h2>

              <div className="mt-4 flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-3">
                <div className="flex items-center gap-3">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      user.availability === "online"
                        ? "bg-emerald-400"
                        : user.availability === "busy"
                          ? "bg-amber-400"
                          : user.availability === "away"
                            ? "bg-blue-400"
                            : "bg-slate-600"
                    }`}
                  />

                  <span className="text-sm capitalize text-slate-300">
                    {user.availability || "offline"}
                  </span>
                </div>

                <span className="text-[10px] uppercase tracking-wider text-slate-600">
                  Current
                </span>
              </div>
            </section>
          )}
        </aside>
      </div>

      {/* ======================================================
          STATUS MODAL
      ====================================================== */}

      {statusModal && (
        <StatusModal
          user={user}
          loading={actionLoading}
          onClose={() => setStatusModal(false)}
          onChange={handleStatusChange}
        />
      )}
    </div>
  );
};

// ============================================================
// METRIC CARD
// ============================================================

const MetricCard = ({ icon: Icon, iconClass, label, value }) => {
  return (
    <div className="rounded-2xl border border-slate-800 bg-[#0a1222] p-5">
      <Icon size={18} className={iconClass} />

      <p className="mt-4 text-xs text-slate-500">{label}</p>

      <p className="mt-1 text-2xl font-bold text-white">{value}</p>
    </div>
  );
};

// ============================================================
// TICKET STAT
// ============================================================

const TicketStat = ({ label, value, className }) => {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
      <p className="text-[11px] text-slate-600">{label}</p>

      <p className={`mt-2 text-xl font-bold ${className}`}>{value}</p>
    </div>
  );
};

// ============================================================
// INFO ITEM
// ============================================================

const InfoItem = ({ icon: Icon, label, value, capitalize = false }) => {
  return (
    <div className="flex gap-3">
      <Icon size={17} className="mt-0.5 shrink-0 text-slate-600" />

      <div className="min-w-0">
        <p className="text-[11px] text-slate-600">{label}</p>

        <p
          className={`mt-1 break-words text-sm text-slate-300 ${
            capitalize ? "capitalize" : ""
          }`}
        >
          {value || "—"}
        </p>
      </div>
    </div>
  );
};

// ============================================================
// PREFERENCE ROW
// ============================================================

const PreferenceRow = ({ icon: Icon, label, value }) => {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-800/70 pb-3 last:border-0 last:pb-0">
      <div className="flex min-w-0 items-center gap-3">
        <Icon size={15} className="shrink-0 text-slate-600" />

        <span className="truncate text-xs text-slate-500">{label}</span>
      </div>

      <span className="shrink-0 text-xs capitalize text-slate-300">
        {value}
      </span>
    </div>
  );
};

// ============================================================
// STATUS MODAL
// ============================================================

const StatusModal = ({ user, loading, onClose, onChange }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-[#0a1222] shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-800 px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-white">
              Change User Status
            </h2>

            <p className="mt-1 text-xs text-slate-600">
              Update the account status for {user.name}.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-800 hover:text-white disabled:opacity-50"
          >
            <X size={17} />
          </button>
        </div>

        <div className="p-5">
          <div className="mb-5 flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/30 p-4">
            {user.avatar ? (
              <img
                src={getAvatarUrl(user.avatar)}
                alt={user.name}
                className="h-10 w-10 rounded-xl object-cover"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-xs font-bold text-blue-400">
                {user.name
                  ?.split(" ")
                  .map((part) => part[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
            )}

            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">
                {user.name}
              </p>

              <p className="truncate text-xs text-slate-600">{user.email}</p>
            </div>
          </div>

          <p className="mb-3 text-xs font-medium text-slate-500">
            Select account status
          </p>

          <div className="space-y-2">
            <StatusOption
              label="Active"
              description="User can access the platform normally."
              active={user.status === "active"}
              disabled={loading || user.status === "active"}
              onClick={() => onChange("active")}
              className="border-emerald-500/20 bg-emerald-500/5 text-emerald-400"
            />

            <StatusOption
              label="Inactive"
              description="Temporarily disable normal account access."
              active={user.status === "inactive"}
              disabled={loading || user.status === "inactive"}
              onClick={() => onChange("inactive")}
              className="border-slate-700 bg-slate-900/50 text-slate-400"
            />

            <StatusOption
              label="Suspended"
              description="Restrict the account due to administrative action."
              active={user.status === "suspended"}
              disabled={loading || user.status === "suspended"}
              onClick={() => onChange("suspended")}
              className="border-red-500/20 bg-red-500/5 text-red-400"
            />
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center gap-2 border-t border-slate-800 px-5 py-3 text-xs text-slate-500">
            <RefreshCw size={13} className="animate-spin" />
            Updating status...
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================
// STATUS OPTION
// ============================================================

const StatusOption = ({
  label,
  description,
  active,
  disabled,
  onClick,
  className,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`w-full rounded-xl border p-3 text-left transition ${
        active
          ? className
          : "border-slate-800 bg-slate-950/20 text-slate-500 hover:border-slate-700 hover:bg-slate-900"
      } disabled:cursor-not-allowed disabled:opacity-60`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold">{label}</span>

        {active && <UserCheck size={14} />}
      </div>

      <p className="mt-1 text-[10px] leading-4 text-slate-600">{description}</p>
    </button>
  );
};

export default UserDetails;
