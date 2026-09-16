import React, { useCallback, useEffect, useState } from "react";

import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Loader2,
  RefreshCw,
  Save,
  ShieldCheck,
  Timer,
  TrendingUp,
  XCircle,
} from "lucide-react";

import {
  getSlaPolicy,
  updateSlaPolicy,
  getSlaStatistics,
} from "../../../services/adminSLAService";

// ==========================================
// DEFAULT RULES
// ==========================================

const DEFAULT_RULES = [
  {
    priority: "urgent",
    firstResponseMinutes: 30,
    resolutionMinutes: 240,
    isActive: true,
  },
  {
    priority: "high",
    firstResponseMinutes: 60,
    resolutionMinutes: 480,
    isActive: true,
  },
  {
    priority: "medium",
    firstResponseMinutes: 120,
    resolutionMinutes: 1440,
    isActive: true,
  },
  {
    priority: "low",
    firstResponseMinutes: 240,
    resolutionMinutes: 2880,
    isActive: true,
  },
];

// ==========================================
// HELPERS
// ==========================================

const formatMinutes = (minutes) => {
  const value = Number(minutes);

  if (!Number.isFinite(value) || value <= 0) {
    return "—";
  }

  if (value < 60) {
    return `${value} min`;
  }

  const hours = value / 60;

  if (Number.isInteger(hours)) {
    if (hours < 24) {
      return `${hours} hr`;
    }

    const days = hours / 24;

    if (Number.isInteger(days)) {
      return `${days} day${days !== 1 ? "s" : ""}`;
    }

    return `${hours} hrs`;
  }

  return `${value} min`;
};

const normalizeRules = (rules = []) => {
  return DEFAULT_RULES.map((defaultRule) => {
    const existingRule = rules.find(
      (rule) => rule.priority === defaultRule.priority,
    );

    return existingRule
      ? {
          priority: existingRule.priority,
          firstResponseMinutes: existingRule.firstResponseMinutes,
          resolutionMinutes: existingRule.resolutionMinutes,
          isActive: existingRule.isActive !== false,
        }
      : { ...defaultRule };
  });
};

// ==========================================
// PRIORITY STYLES
// ==========================================

const getPriorityStyles = (priority) => {
  const styles = {
    urgent: {
      badge: "border-red-500/20 bg-red-500/10 text-red-300",
      dot: "bg-red-400",
    },

    high: {
      badge: "border-orange-500/20 bg-orange-500/10 text-orange-300",
      dot: "bg-orange-400",
    },

    medium: {
      badge: "border-yellow-500/20 bg-yellow-500/10 text-yellow-300",
      dot: "bg-yellow-400",
    },

    low: {
      badge: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
      dot: "bg-emerald-400",
    },
  };

  return styles[priority] || styles.medium;
};

// ==========================================
// STAT CARD
// ==========================================

const StatCard = ({ title, value, description, icon: Icon }) => {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-[#0b1324] p-4 transition hover:border-white/[0.14]">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {title}
          </p>

          <p className="mt-2 text-2xl font-bold text-white">{value}</p>

          <p className="mt-1 text-xs text-slate-500">{description}</p>
        </div>

        <div className="rounded-lg border border-white/[0.08] bg-white/[0.04] p-2.5">
          <Icon className="h-4 w-4 text-slate-400" />
        </div>
      </div>
    </div>
  );
};

// ==========================================
// SLA STATUS CARD
// ==========================================

const SlaStatusCard = ({ title, pending, breached, completed }) => {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-[#0b1324]">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
        <div>
          <h3 className="text-sm font-semibold text-white">{title}</h3>

          <p className="mt-0.5 text-xs text-slate-500">Current SLA status</p>
        </div>

        <Timer className="h-4 w-4 text-slate-500" />
      </div>

      <div className="grid grid-cols-3 gap-px bg-white/[0.06]">
        <div className="bg-[#0b1324] px-4 py-4">
          <p className="text-xs text-slate-500">Pending</p>

          <p className="mt-1 text-xl font-semibold text-white">{pending}</p>
        </div>

        <div className="bg-[#0b1324] px-4 py-4">
          <p className="text-xs text-slate-500">Breached</p>

          <p className="mt-1 text-xl font-semibold text-red-300">{breached}</p>
        </div>

        <div className="bg-[#0b1324] px-4 py-4">
          <p className="text-xs text-slate-500">Completed</p>

          <p className="mt-1 text-xl font-semibold text-emerald-300">
            {completed}
          </p>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// MAIN COMPONENT
// ==========================================

const SLAManagement = () => {
  const [policy, setPolicy] = useState({
    name: "Default SLA Policy",
    description: "Default SLA rules for SupportAI tickets.",
    rules: DEFAULT_RULES,
    isActive: true,
  });

  const [statistics, setStatistics] = useState({
    totalTickets: 0,

    response: {
      pending: 0,
      breached: 0,
      completed: 0,
    },

    resolution: {
      pending: 0,
      breached: 0,
      completed: 0,
    },
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ========================================
  // LOAD DATA
  // ========================================

  const loadData = useCallback(async (showRefreshLoader = false) => {
    try {
      if (showRefreshLoader) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");
      setSuccess("");

      const [policyResponse, statisticsResponse] = await Promise.all([
        getSlaPolicy(),
        getSlaStatistics(),
      ]);

      const policyData = policyResponse?.data?.policy;

      const statisticsData = statisticsResponse?.data?.statistics;

      if (policyData) {
        setPolicy({
          name: policyData.name || "Default SLA Policy",

          description: policyData.description || "",

          rules: normalizeRules(policyData.rules || []),

          isActive: policyData.isActive !== false,
        });
      }

      if (statisticsData) {
        setStatistics({
          totalTickets: statisticsData.totalTickets || 0,

          response: {
            pending: statisticsData.response?.pending || 0,

            breached: statisticsData.response?.breached || 0,

            completed: statisticsData.response?.completed || 0,
          },

          resolution: {
            pending: statisticsData.resolution?.pending || 0,

            breached: statisticsData.resolution?.breached || 0,

            completed: statisticsData.resolution?.completed || 0,
          },
        });
      }
    } catch (err) {
      console.error("Failed to load SLA data:", err);

      setError(
        err?.response?.data?.message || "Failed to load SLA management data.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // ========================================
  // INITIAL LOAD
  // ========================================

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ========================================
  // POLICY CHANGE
  // ========================================

  const handlePolicyChange = (field, value) => {
    setPolicy((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // ========================================
  // RULE CHANGE
  // ========================================

  const handleRuleChange = (priority, field, value) => {
    setPolicy((prev) => ({
      ...prev,

      rules: prev.rules.map((rule) =>
        rule.priority === priority
          ? {
              ...rule,
              [field]: value,
            }
          : rule,
      ),
    }));
  };

  // ========================================
  // SAVE
  // ========================================

  const handleSave = async () => {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const rules = policy.rules.map((rule) => ({
        priority: rule.priority,

        firstResponseMinutes: Number(rule.firstResponseMinutes),

        resolutionMinutes: Number(rule.resolutionMinutes),

        isActive: rule.isActive !== false,
      }));

      for (const rule of rules) {
        if (
          !Number.isFinite(rule.firstResponseMinutes) ||
          rule.firstResponseMinutes <= 0
        ) {
          setError(`Enter a valid first response time for ${rule.priority}.`);

          return;
        }

        if (
          !Number.isFinite(rule.resolutionMinutes) ||
          rule.resolutionMinutes <= 0
        ) {
          setError(`Enter a valid resolution time for ${rule.priority}.`);

          return;
        }
      }

      const response = await updateSlaPolicy({
        name: policy.name.trim() || "Default SLA Policy",

        description: policy.description.trim(),

        rules,

        isActive: policy.isActive,
      });

      const updatedPolicy = response?.data?.policy;

      if (updatedPolicy) {
        setPolicy({
          name: updatedPolicy.name || "Default SLA Policy",

          description: updatedPolicy.description || "",

          rules: normalizeRules(updatedPolicy.rules || []),

          isActive: updatedPolicy.isActive !== false,
        });
      }

      setSuccess("SLA policy updated successfully.");
    } catch (err) {
      console.error("Failed to update SLA policy:", err);

      setError(err?.response?.data?.message || "Failed to update SLA policy.");
    } finally {
      setSaving(false);
    }
  };

  // ========================================
  // LOADING
  // ========================================

  if (loading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center bg-[#050b18]">
        <div className="flex items-center gap-3 text-sm text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading SLA management...
        </div>
      </div>
    );
  }

  // ========================================
  // RENDER
  // ========================================

  return (
    <div className="min-h-full bg-[#050b18] p-4 md:p-6">
      <div className="mx-auto max-w-[1600px] space-y-5">
        {/* ================================= */}
        {/* HEADER */}
        {/* ================================= */}

        <div className="flex flex-col gap-4 border-b border-white/[0.06] pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-[#0b1324]">
                <ShieldCheck className="h-5 w-5 text-slate-300" />
              </div>

              <div>
                <h1 className="text-xl font-semibold text-white">
                  SLA Management
                </h1>

                <p className="mt-0.5 text-xs text-slate-500">
                  Configure and monitor service level agreements.
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/[0.08] bg-[#0b1324] px-3.5 py-2 text-sm font-medium text-slate-300 transition hover:border-white/[0.14] hover:bg-white/[0.04] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {refreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Refresh
          </button>
        </div>

        {/* ================================= */}
        {/* ALERTS */}
        {/* ================================= */}

        {error && (
          <div className="flex items-start gap-3 rounded-lg border border-red-500/20 bg-red-500/[0.08] px-4 py-3 text-sm text-red-300">
            <XCircle className="mt-0.5 h-4 w-4 shrink-0" />

            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-start gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/[0.08] px-4 py-3 text-sm text-emerald-300">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />

            <span>{success}</span>
          </div>
        )}

        {/* ================================= */}
        {/* OVERVIEW HEADER */}
        {/* ================================= */}

        <div>
          <h2 className="text-sm font-semibold text-white">Overview</h2>

          <p className="mt-1 text-xs text-slate-500">
            Current SLA performance across active tickets.
          </p>
        </div>

        {/* ================================= */}
        {/* STAT CARDS */}
        {/* ================================= */}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Active Tickets"
            value={statistics.totalTickets}
            description="Currently monitored"
            icon={TrendingUp}
          />

          <StatCard
            title="Response Breaches"
            value={statistics.response.breached}
            description="Response deadline missed"
            icon={AlertTriangle}
          />

          <StatCard
            title="Resolution Breaches"
            value={statistics.resolution.breached}
            description="Resolution deadline missed"
            icon={XCircle}
          />

          <StatCard
            title="Completed Responses"
            value={statistics.response.completed}
            description="Human responses completed"
            icon={CheckCircle2}
          />
        </div>

        {/* ================================= */}
        {/* SLA STATUS */}
        {/* ================================= */}

        <div className="grid gap-4 lg:grid-cols-2">
          <SlaStatusCard
            title="First Response SLA"
            pending={statistics.response.pending}
            breached={statistics.response.breached}
            completed={statistics.response.completed}
          />

          <SlaStatusCard
            title="Resolution SLA"
            pending={statistics.resolution.pending}
            breached={statistics.resolution.breached}
            completed={statistics.resolution.completed}
          />
        </div>

        {/* ================================= */}
        {/* CONFIGURATION HEADER */}
        {/* ================================= */}

        <div className="pt-2">
          <h2 className="text-sm font-semibold text-white">
            SLA Configuration
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            Configure response and resolution targets by ticket priority.
          </p>
        </div>

        {/* ================================= */}
        {/* CONFIGURATION PANEL */}
        {/* ================================= */}

        <section className="rounded-xl border border-white/[0.08] bg-[#0b1324]">
          {/* Panel Header */}

          <div className="flex flex-col gap-4 border-b border-white/[0.06] px-5 py-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg border border-white/[0.08] bg-white/[0.04] p-2">
                <Clock3 className="h-4 w-4 text-slate-400" />
              </div>

              <div>
                <h3 className="text-sm font-semibold text-white">
                  Policy Settings
                </h3>

                <p className="mt-0.5 text-xs text-slate-500">
                  Manage the active SLA policy.
                </p>
              </div>
            </div>

            <label className="inline-flex cursor-pointer items-center gap-2.5">
              <input
                type="checkbox"
                checked={policy.isActive}
                onChange={(event) =>
                  handlePolicyChange("isActive", event.target.checked)
                }
                className="h-4 w-4 rounded border-white/20 bg-transparent"
              />

              <span className="text-sm text-slate-300">Policy Active</span>
            </label>
          </div>

          {/* Policy Details */}

          <div className="grid gap-5 border-b border-white/[0.06] p-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-500">
                Policy Name
              </label>

              <input
                type="text"
                value={policy.name}
                onChange={(event) =>
                  handlePolicyChange("name", event.target.value)
                }
                placeholder="Default SLA Policy"
                className="w-full rounded-lg border border-white/[0.08] bg-[#07101f] px-3.5 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-white/[0.18]"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-500">
                Description
              </label>

              <input
                type="text"
                value={policy.description}
                maxLength={500}
                onChange={(event) =>
                  handlePolicyChange("description", event.target.value)
                }
                placeholder="Describe this SLA policy..."
                className="w-full rounded-lg border border-white/[0.08] bg-[#07101f] px-3.5 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-white/[0.18]"
              />
            </div>
          </div>

          {/* Priority Rules */}

          <div className="p-5">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-white">
                Priority Rules
              </h3>

              <p className="mt-1 text-xs text-slate-500">
                Configure response and resolution targets in minutes.
              </p>
            </div>

            {/* Desktop Table */}

            <div className="hidden overflow-hidden rounded-lg border border-white/[0.08] md:block">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-white/[0.025]">
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Priority
                    </th>

                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      First Response
                    </th>

                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Resolution
                    </th>

                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Target Preview
                    </th>

                    <th className="px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Active
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {policy.rules.map((rule) => {
                    const priorityStyle = getPriorityStyles(rule.priority);

                    return (
                      <tr
                        key={rule.priority}
                        className="border-b border-white/[0.05] last:border-b-0"
                      >
                        {/* Priority */}

                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex items-center gap-2 rounded-md border px-2.5 py-1 text-xs font-medium capitalize ${priorityStyle.badge}`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${priorityStyle.dot}`}
                            />

                            {rule.priority}
                          </span>
                        </td>

                        {/* First Response */}

                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="1"
                              value={rule.firstResponseMinutes}
                              onChange={(event) =>
                                handleRuleChange(
                                  rule.priority,
                                  "firstResponseMinutes",
                                  event.target.value,
                                )
                              }
                              className="w-28 rounded-md border border-white/[0.08] bg-[#07101f] px-3 py-2 text-sm text-white outline-none focus:border-white/[0.18]"
                            />

                            <span className="text-xs text-slate-500">min</span>
                          </div>
                        </td>

                        {/* Resolution */}

                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="1"
                              value={rule.resolutionMinutes}
                              onChange={(event) =>
                                handleRuleChange(
                                  rule.priority,
                                  "resolutionMinutes",
                                  event.target.value,
                                )
                              }
                              className="w-28 rounded-md border border-white/[0.08] bg-[#07101f] px-3 py-2 text-sm text-white outline-none focus:border-white/[0.18]"
                            />

                            <span className="text-xs text-slate-500">min</span>
                          </div>
                        </td>

                        {/* Preview */}

                        <td className="px-4 py-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <span>Response</span>

                              <span className="text-slate-300">
                                {formatMinutes(rule.firstResponseMinutes)}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <span>Resolution</span>

                              <span className="text-slate-300">
                                {formatMinutes(rule.resolutionMinutes)}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Active */}

                        <td className="px-4 py-4 text-center">
                          <input
                            type="checkbox"
                            checked={rule.isActive !== false}
                            onChange={(event) =>
                              handleRuleChange(
                                rule.priority,
                                "isActive",
                                event.target.checked,
                              )
                            }
                            className="h-4 w-4 rounded border-white/20 bg-transparent"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Rules */}

            <div className="space-y-3 md:hidden">
              {policy.rules.map((rule) => {
                const priorityStyle = getPriorityStyles(rule.priority);

                return (
                  <div
                    key={rule.priority}
                    className="rounded-lg border border-white/[0.08] bg-[#07101f] p-4"
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <span
                        className={`inline-flex items-center gap-2 rounded-md border px-2.5 py-1 text-xs font-medium capitalize ${priorityStyle.badge}`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${priorityStyle.dot}`}
                        />

                        {rule.priority}
                      </span>

                      <label className="flex items-center gap-2 text-xs text-slate-400">
                        <input
                          type="checkbox"
                          checked={rule.isActive !== false}
                          onChange={(event) =>
                            handleRuleChange(
                              rule.priority,
                              "isActive",
                              event.target.checked,
                            )
                          }
                          className="h-4 w-4 rounded border-white/20 bg-transparent"
                        />
                        Active
                      </label>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1.5 block text-xs text-slate-500">
                          First Response
                        </label>

                        <input
                          type="number"
                          min="1"
                          value={rule.firstResponseMinutes}
                          onChange={(event) =>
                            handleRuleChange(
                              rule.priority,
                              "firstResponseMinutes",
                              event.target.value,
                            )
                          }
                          className="w-full rounded-md border border-white/[0.08] bg-[#0b1324] px-3 py-2 text-sm text-white outline-none focus:border-white/[0.18]"
                        />
                      </div>

                      <div>
                        <label className="mb-1.5 block text-xs text-slate-500">
                          Resolution
                        </label>

                        <input
                          type="number"
                          min="1"
                          value={rule.resolutionMinutes}
                          onChange={(event) =>
                            handleRuleChange(
                              rule.priority,
                              "resolutionMinutes",
                              event.target.value,
                            )
                          }
                          className="w-full rounded-md border border-white/[0.08] bg-[#0b1324] px-3 py-2 text-sm text-white outline-none focus:border-white/[0.18]"
                        />
                      </div>
                    </div>

                    <div className="mt-3 flex gap-4 border-t border-white/[0.06] pt-3 text-xs text-slate-500">
                      <span>
                        Response:{" "}
                        <strong className="font-medium text-slate-300">
                          {formatMinutes(rule.firstResponseMinutes)}
                        </strong>
                      </span>

                      <span>
                        Resolution:{" "}
                        <strong className="font-medium text-slate-300">
                          {formatMinutes(rule.resolutionMinutes)}
                        </strong>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Save Footer */}

            <div className="mt-5 flex items-center justify-between border-t border-white/[0.06] pt-5">
              <div className="hidden items-center gap-2 text-xs text-slate-500 sm:flex">
                <ShieldCheck className="h-3.5 w-3.5" />
                Changes apply to newly calculated ticket SLAs.
              </div>

              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="ml-auto inline-flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}

                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </section>

        {/* ================================= */}
        {/* INFORMATION */}
        {/* ================================= */}

        <section className="rounded-xl border border-white/[0.08] bg-[#0b1324]">
          <div className="flex items-start gap-3 p-5">
            <div className="rounded-lg border border-white/[0.08] bg-white/[0.04] p-2">
              <ShieldCheck className="h-4 w-4 text-slate-400" />
            </div>

            <div>
              <h3 className="text-sm font-semibold text-white">
                SLA Policy Behavior
              </h3>

              <div className="mt-3 grid gap-2 text-xs text-slate-500 md:grid-cols-2">
                <p>• First response measures the first human agent response.</p>

                <p>• AI responses do not count toward human response SLA.</p>

                <p>
                  • Resolution measures the target time until the ticket is
                  resolved.
                </p>

                <p>• Existing tickets retain their stored SLA deadlines.</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default SLAManagement;
