import React, { useEffect, useMemo, useState } from "react";
import {
  Search,
  ShieldCheck,
  Clock3,
  RefreshCw,
  Loader2,
  AlertCircle,
  Filter,
  X,
} from "lucide-react";

import { getAuditLogs } from "../../../services/adminAuditService";

const ACTION_OPTIONS = [
  // Agents
  "AGENT_CREATED",
  "AGENT_UPDATED",
  "AGENT_ROLE_CHANGED",
  "AGENT_PERMISSIONS_UPDATED",
  "AGENT_STATUS_CHANGED",
  "AGENT_AVAILABILITY_CHANGED",
  "AGENT_DELETED",
  "AGENT_PASSWORD_RESET",

  // Roles
  "ROLE_CREATED",
  "ROLE_UPDATED",
  "ROLE_DELETED",
  "ROLE_PERMISSIONS_UPDATED",
  "USER_ROLE_CHANGED",

  // Tickets
  "TICKET_CREATED",
  "TICKET_UPDATED",
  "TICKET_ASSIGNED",
  "TICKET_REASSIGNED",
  "TICKET_STATUS_CHANGED",
  "TICKET_PRIORITY_CHANGED",
  "TICKET_ESCALATED",
  "TICKET_RESOLVED",
  "TICKET_REOPENED",
  "TICKET_DELETED",

  // Knowledge Base
  "ARTICLE_CREATED",
  "ARTICLE_UPDATED",
  "ARTICLE_PUBLISHED",
  "ARTICLE_UNPUBLISHED",
  "ARTICLE_DELETED",

  // Canned Responses
  "CANNED_RESPONSE_CREATED",
  "CANNED_RESPONSE_UPDATED",
  "CANNED_RESPONSE_STATUS_CHANGED",
  "CANNED_RESPONSE_DELETED",

  // Escalations
  "ESCALATION_CREATED",
  "ESCALATION_UPDATED",
  "ESCALATION_ASSIGNED",
  "ESCALATION_RESOLVED",
  "ESCALATION_CANCELLED",

  // SLA
  "SLA_SETTINGS_UPDATED",
  "SLA_POLICY_CREATED",
  "SLA_POLICY_UPDATED",
  "SLA_POLICY_DELETED",

  // Settings
  "SYSTEM_SETTINGS_UPDATED",
  "NOTIFICATION_SETTINGS_UPDATED",
  "EMAIL_SETTINGS_UPDATED",
  "AI_SETTINGS_UPDATED",

  // Authentication / Security
  "ADMIN_LOGIN",
  "ADMIN_LOGOUT",
  "LOGIN_FAILED",
  "PASSWORD_CHANGED",
  "PASSWORD_RESET",
  "ACCOUNT_LOCKED",
  "ACCOUNT_UNLOCKED",

  // Files
  "FILE_UPLOADED",
  "FILE_DELETED",
  "FILE_REPLACED",

  // Customers
  "CUSTOMER_CREATED",
  "CUSTOMER_UPDATED",
  "CUSTOMER_STATUS_CHANGED",
  "CUSTOMER_DELETED",
  "CUSTOMER_PASSWORD_RESET",

  // Conversations
  "CONVERSATION_RESOLVED",
];

const ROLE_OPTIONS = ["admin", "agent", "customer", "system"];

const RESOURCE_OPTIONS = [
  "agent",
  "user",
  "customer",
  "ticket",
  "article",
  "knowledge_base",
  "canned_response",
  "escalation",
  "conversation",
  "sla_policy",
  "system_settings",
  "notification_settings",
  "email_settings",
  "ai_settings",
  "file",
];

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);

  const [search, setSearch] = useState("");
  const [action, setAction] = useState("");
  const [role, setRole] = useState("");
  const [resourceType, setResourceType] = useState("");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  // ==========================================
  // LOAD AUDIT LOGS
  // ==========================================

  const loadAuditLogs = async ({ showRefreshing = false } = {}) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await getAuditLogs({
        page: pagination.page,
        limit: pagination.limit,
        search,
        action,
        role,
        resourceType,
      });

      const auditLogs = Array.isArray(response?.data) ? response.data : [];

      setLogs(auditLogs);

      if (response?.pagination) {
        setPagination((previous) => ({
          ...previous,
          ...response.pagination,
        }));
      }
    } catch (err) {
      console.error("Failed to load audit logs:", err);

      setError(err?.message || "Failed to load audit logs.");
      setLogs([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ==========================================
  // INITIAL LOAD / PAGE CHANGE
  // ==========================================

  useEffect(() => {
    loadAuditLogs();
  }, [pagination.page]);

  // ==========================================
  // FILTER / SEARCH
  // ==========================================

  useEffect(() => {
    const timer = setTimeout(() => {
      setPagination((previous) => ({
        ...previous,
        page: 1,
      }));

      loadAuditLogs();
    }, 400);

    return () => clearTimeout(timer);
  }, [search, action, role, resourceType]);

  // ==========================================
  // FORMAT ACTION
  // ==========================================

  const formatAction = (value) => {
    if (!value) {
      return "Performed an action";
    }

    return value
      .toLowerCase()
      .replace(/_/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  };

  // ==========================================
  // FORMAT RESOURCE
  // ==========================================

  const formatResource = (value) => {
    if (!value) {
      return "System";
    }

    return value
      .replace(/_/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  };

  // ==========================================
  // FORMAT TIME
  // ==========================================

  const formatTime = (date) => {
    if (!date) {
      return "Unknown time";
    }

    const timestamp = new Date(date);

    if (Number.isNaN(timestamp.getTime())) {
      return "Unknown time";
    }

    const now = new Date();

    const difference = now.getTime() - timestamp.getTime();

    const seconds = Math.floor(difference / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) {
      return "Just now";
    }

    if (minutes < 60) {
      return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
    }

    if (hours < 24) {
      return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
    }

    if (days < 7) {
      return `${days} ${days === 1 ? "day" : "days"} ago`;
    }

    return timestamp.toLocaleDateString();
  };

  // ==========================================
  // TARGET
  // ==========================================

  const getTarget = (log) => {
    if (log?.resource?.type && log?.resource?.id) {
      return `${formatResource(log.resource.type)} • ${log.resource.id}`;
    }

    if (log?.resource?.type) {
      return formatResource(log.resource.type);
    }

    return "System";
  };

  // ==========================================
  // ROLE LABEL
  // ==========================================

  const getRoleLabel = (roleValue) => {
    if (!roleValue) {
      return "System";
    }

    return roleValue.charAt(0).toUpperCase() + roleValue.slice(1);
  };

  // ==========================================
  // ACTIVE FILTERS
  // ==========================================

  const activeFilterCount = [action, role, resourceType].filter(Boolean).length;

  const clearFilters = () => {
    setAction("");
    setRole("");
    setResourceType("");

    setPagination((previous) => ({
      ...previous,
      page: 1,
    }));
  };

  // ==========================================
  // CLIENT-SIDE FALLBACK FILTER
  // ==========================================

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return logs;
    }

    return logs.filter((log) => {
      const searchableText = [
        log?.actor?.name,
        log?.actor?.email,
        log?.actor?.role,
        log?.action,
        log?.description,
        log?.resource?.type,
        log?.resource?.id,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(query);
    });
  }, [logs, search]);

  // ==========================================
  // REFRESH
  // ==========================================

  const handleRefresh = () => {
    loadAuditLogs({
      showRefreshing: true,
    });
  };

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="min-h-full px-4 py-6 sm:px-6 lg:px-8">
      {/* ==========================================
          HEADER
      ========================================== */}

      <div className="mb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-400">
              Administration
            </p>

            <h1 className="mt-1 text-2xl font-bold text-white">Audit Logs</h1>

            <p className="mt-1 text-sm text-slate-500">
              Track important administrative and support activity.
            </p>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading || refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-[#0a1222] px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:border-slate-700 hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {refreshing ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <RefreshCw size={16} />
            )}
            Refresh
          </button>
        </div>
      </div>

      {/* ==========================================
          SEARCH
      ========================================== */}

      <div className="relative mb-4">
        <Search
          size={17}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600"
        />

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search audit logs..."
          className="w-full rounded-2xl border border-slate-800 bg-[#0a1222] py-3 pl-11 pr-4 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-500/40"
        />
      </div>

      {/* ==========================================
          FILTERS
      ========================================== */}

      <div className="mb-5 rounded-2xl border border-slate-800 bg-[#0a1222] p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-slate-500" />

            <span className="text-sm font-medium text-slate-300">Filters</span>

            {activeFilterCount > 0 && (
              <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[11px] font-semibold text-blue-400">
                {activeFilterCount}
              </span>
            )}
          </div>

          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 transition hover:text-white"
            >
              <X size={13} />
              Clear
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {/* ACTION */}

          <select
            value={action}
            onChange={(e) => setAction(e.target.value)}
            className="rounded-xl border border-slate-800 bg-[#050b18] px-3 py-2.5 text-sm text-slate-300 outline-none focus:border-blue-500/40"
          >
            <option value="">All actions</option>

            {ACTION_OPTIONS.map((item) => (
              <option key={item} value={item}>
                {formatAction(item)}
              </option>
            ))}
          </select>

          {/* ROLE */}

          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="rounded-xl border border-slate-800 bg-[#050b18] px-3 py-2.5 text-sm text-slate-300 outline-none focus:border-blue-500/40"
          >
            <option value="">All roles</option>

            {ROLE_OPTIONS.map((item) => (
              <option key={item} value={item}>
                {getRoleLabel(item)}
              </option>
            ))}
          </select>

          {/* RESOURCE */}

          <select
            value={resourceType}
            onChange={(e) => setResourceType(e.target.value)}
            className="rounded-xl border border-slate-800 bg-[#050b18] px-3 py-2.5 text-sm text-slate-300 outline-none focus:border-blue-500/40"
          >
            <option value="">All resources</option>

            {RESOURCE_OPTIONS.map((item) => (
              <option key={item} value={item}>
                {formatResource(item)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ==========================================
          ERROR
      ========================================== */}

      {error && (
        <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 p-4">
          <AlertCircle size={18} className="mt-0.5 shrink-0 text-red-400" />

          <div>
            <p className="text-sm font-medium text-red-300">
              Failed to load audit logs
            </p>

            <p className="mt-1 text-xs text-red-400/70">{error}</p>
          </div>
        </div>
      )}

      {/* ==========================================
          LOGS
      ========================================== */}

      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-[#0a1222]">
        <div className="divide-y divide-slate-800">
          {loading ? (
            <div className="py-14 text-center">
              <Loader2
                size={28}
                className="mx-auto mb-3 animate-spin text-blue-400"
              />

              <p className="text-sm font-medium text-slate-400">
                Loading audit logs...
              </p>

              <p className="mt-1 text-xs text-slate-600">
                Fetching administrative activity.
              </p>
            </div>
          ) : (
            filtered.map((log) => (
              <div
                key={log._id}
                className="flex flex-col gap-4 p-5 transition hover:bg-slate-900/30 sm:flex-row sm:items-center"
              >
                {/* ICON */}

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                  <ShieldCheck size={18} />
                </div>

                {/* CONTENT */}

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-white">
                      {log?.actor?.name || "System"}
                    </span>

                    <span className="rounded-md border border-slate-800 bg-slate-900/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                      {getRoleLabel(log?.actor?.role)}
                    </span>

                    {log?.action && (
                      <span className="rounded-md border border-blue-500/10 bg-blue-500/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-400">
                        {formatAction(log.action)}
                      </span>
                    )}
                  </div>

                  <p className="mt-1 text-sm text-slate-400">
                    {log?.description || formatAction(log?.action)}
                  </p>

                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                    <span>
                      Target:{" "}
                      <span className="text-slate-500">{getTarget(log)}</span>
                    </span>

                    {log?.actor?.email && <span>{log.actor.email}</span>}
                  </div>
                </div>

                {/* TIME */}

                <div className="flex shrink-0 items-center gap-2 text-xs text-slate-600">
                  <Clock3 size={14} />

                  {formatTime(log?.createdAt)}
                </div>
              </div>
            ))
          )}
        </div>

        {/* ==========================================
            EMPTY STATE
        ========================================== */}

        {!loading && filtered.length === 0 && (
          <div className="py-12 text-center">
            <ShieldCheck size={30} className="mx-auto mb-3 text-slate-700" />

            <p className="text-sm font-medium text-slate-500">
              No audit logs found.
            </p>

            <p className="mt-1 text-xs text-slate-700">
              Administrative and system activity will appear here.
            </p>
          </div>
        )}
      </div>

      {/* ==========================================
          PAGINATION INFO
      ========================================== */}

      {!loading && pagination.total > 0 && (
        <div className="mt-4 flex items-center justify-between text-xs text-slate-600">
          <span>
            Showing {filtered.length} of {pagination.total} logs
          </span>

          <span>
            Page {pagination.page} of {pagination.totalPages || 1}
          </span>
        </div>
      )}
    </div>
  );
};

export default AuditLogs;
