import React, { useEffect, useMemo, useState } from "react";
import {
  Search,
  ShieldCheck,
  Clock3,
  RefreshCw,
  Loader2,
  AlertCircle,
} from "lucide-react";

import { getAuditLogs } from "../../../services/adminAuditService";

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 0,
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
  // INITIAL LOAD
  // ==========================================

  useEffect(() => {
    loadAuditLogs();
  }, [pagination.page]);

  // ==========================================
  // SEARCH
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
  }, [search]);

  // ==========================================
  // FORMAT ACTION
  // ==========================================

  const formatAction = (action) => {
    if (!action) {
      return "Performed an action";
    }

    return action
      .toLowerCase()
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
      return `${log.resource.type} • ${log.resource.id}`;
    }

    if (log?.resource?.type) {
      return log.resource.type;
    }

    return "System";
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

      <div className="relative mb-5">
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
                  <p className="text-sm text-white">
                    <span className="font-semibold">
                      {log?.actor?.name || "System"}
                    </span>{" "}
                    <span className="text-slate-500">
                      {log?.description || formatAction(log?.action)}
                    </span>
                  </p>

                  <p className="mt-1 truncate text-xs text-slate-600">
                    Target: {getTarget(log)}
                  </p>
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
