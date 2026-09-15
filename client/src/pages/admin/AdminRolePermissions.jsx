import { useEffect, useMemo, useState } from "react";
import {
  Check,
  ChevronDown,
  Loader2,
  RefreshCw,
  Save,
  Shield,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";

import {
  getRolePermissions,
  updateRolePermissions,
} from "../../services/rolePermissionService";

// ==========================================
// ROLE CONFIGURATION
// ==========================================

const ROLE_CONFIG = {
  admin: {
    label: "Admin",
    description: "Full system access and administration controls.",
    icon: ShieldCheck,
  },

  agent: {
    label: "Agent",
    description: "Customer support access with limited management permissions.",
    icon: Shield,
  },

  customer: {
    label: "Customer",
    description: "Customer-facing access with ownership-based permissions.",
    icon: Users,
  },
};

// ==========================================
// PERMISSION GROUPS
// ==========================================

const PERMISSION_GROUPS = [
  {
    name: "General",
    keys: ["dashboard.view"],
  },

  {
    name: "Tickets",
    keys: ["tickets.view", "tickets.create", "tickets.reply", "tickets.assign"],
  },

  {
    name: "Users & Agents",
    keys: ["users.manage", "agents.manage"],
  },

  {
    name: "Knowledge Base",
    keys: ["knowledge_base.view", "knowledge_base.manage"],
  },

  {
    name: "Canned Responses",
    keys: ["canned_responses.view", "canned_responses.use"],
  },

  {
    name: "SLA",
    keys: ["sla.view", "sla.manage"],
  },

  {
    name: "Analytics",
    keys: ["analytics.view", "analytics.limited", "analytics.own"],
  },

  {
    name: "Administration",
    keys: ["audit_logs.view", "settings.view", "settings.manage"],
  },
];

// ==========================================
// ACCESS LABELS
// ==========================================

const getAccessLabel = (role, permission, enabled) => {
  if (!enabled) {
    return "No Access";
  }

  if (permission === "tickets.view") {
    if (role === "customer") return "Own Only";
    if (role === "agent") return "Assigned";
    return "Full";
  }

  if (permission === "tickets.reply") {
    if (role === "customer") return "Own Only";
    return "Allowed";
  }

  if (permission === "knowledge_base.view" && role !== "admin") {
    return "View";
  }

  if (permission === "knowledge_base.manage") {
    return role === "admin" ? "Manage" : "No Access";
  }

  if (permission === "canned_responses.use" && role === "agent") {
    return "Use";
  }

  if (permission === "canned_responses.view" && role === "admin") {
    return "Manage";
  }

  if (permission === "sla.view" && role === "agent") {
    return "View";
  }

  if (permission === "sla.manage" && role === "admin") {
    return "Manage";
  }

  if (permission === "analytics.limited" && role === "agent") {
    return "Limited";
  }

  if (permission === "analytics.own" && role === "customer") {
    return "Own";
  }

  return "Allowed";
};

// ==========================================
// MAIN COMPONENT
// ==========================================

const AdminRolePermissions = () => {
  const [roles, setRoles] = useState({
    admin: [],
    agent: [],
    customer: [],
  });

  const [definitions, setDefinitions] = useState([]);

  const [activeRole, setActiveRole] = useState("admin");

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [refreshing, setRefreshing] = useState(false);

  const [message, setMessage] = useState("");

  const [error, setError] = useState("");

  // ========================================
  // CREATE DEFINITION MAP
  // ========================================

  const definitionMap = useMemo(() => {
    return definitions.reduce((acc, definition) => {
      acc[definition.key] = definition;
      return acc;
    }, {});
  }, [definitions]);

  // ========================================
  // FETCH PERMISSIONS
  // ========================================

  const fetchPermissions = async (showRefreshLoader = false) => {
    try {
      setError("");

      if (showRefreshLoader) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const data = await getRolePermissions();

      const roleData = {
        admin: [],
        agent: [],
        customer: [],
      };

      data?.permissions?.forEach((item) => {
        if (roleData[item.role]) {
          roleData[item.role] = item.permissions || [];
        }
      });

      setRoles(roleData);

      setDefinitions(data?.definitions || []);
    } catch (err) {
      console.error("FETCH ROLE PERMISSIONS ERROR:", err);

      setError(err?.message || "Failed to load role permissions.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ========================================
  // INITIAL LOAD
  // ========================================

  useEffect(() => {
    fetchPermissions();
  }, []);

  // ========================================
  // TOGGLE PERMISSION
  // ========================================

  const togglePermission = (role, permission) => {
    setMessage("");
    setError("");

    setRoles((previous) => {
      const currentPermissions = previous[role] || [];

      const hasPermission = currentPermissions.includes(permission);

      // --------------------------------------
      // Prevent removing admin dashboard access
      // --------------------------------------

      if (
        role === "admin" &&
        permission === "dashboard.view" &&
        hasPermission
      ) {
        setError("Admin must retain dashboard access.");

        return previous;
      }

      const updatedPermissions = hasPermission
        ? currentPermissions.filter((item) => item !== permission)
        : [...currentPermissions, permission];

      return {
        ...previous,
        [role]: updatedPermissions,
      };
    });
  };

  // ========================================
  // SAVE ACTIVE ROLE
  // ========================================

  const saveRolePermissions = async () => {
    try {
      setSaving(true);
      setError("");
      setMessage("");

      const updatedPermissions = roles[activeRole] || [];

      const data = await updateRolePermissions(activeRole, updatedPermissions);

      setRoles((previous) => ({
        ...previous,
        [activeRole]: data?.permissions || updatedPermissions,
      }));

      setMessage(
        `${ROLE_CONFIG[activeRole].label} permissions updated successfully.`,
      );
    } catch (err) {
      console.error("SAVE ROLE PERMISSIONS ERROR:", err);

      setError(err?.message || "Failed to update permissions.");
    } finally {
      setSaving(false);
    }
  };

  // ========================================
  // RESET ACTIVE ROLE TO DEFAULT
  // ========================================

  const resetActiveRole = async () => {
    try {
      setError("");
      setMessage("");

      await fetchPermissions(true);

      setMessage(`${ROLE_CONFIG[activeRole].label} permissions refreshed.`);
    } catch (err) {
      console.error("RESET ROLE PERMISSIONS ERROR:", err);
    }
  };

  // ========================================
  // GET PERMISSION DEFINITION
  // ========================================

  const getDefinition = (permission) => {
    return (
      definitionMap[permission] || {
        key: permission,
        label: permission,
        description: "Permission for this role.",
      }
    );
  };

  // ========================================
  // LOADING STATE
  // ========================================

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-[#050b18]">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Loader2 size={32} className="animate-spin" />

          <p className="text-sm">Loading role permissions...</p>
        </div>
      </div>
    );
  }

  // ========================================
  // RENDER
  // ========================================

  return (
    <div className="min-h-screen bg-[#050b18] text-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* ====================================
            HEADER
        ==================================== */}

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                <ShieldCheck size={22} className="text-indigo-400" />
              </div>

              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">
                  Role & Permissions
                </h1>

                <p className="text-sm text-slate-400 mt-1">
                  Control what each role can access across SupportAI.
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => fetchPermissions(true)}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] text-sm font-medium transition disabled:opacity-50"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {/* ====================================
            STATUS MESSAGES
        ==================================== */}

        {message && (
          <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            <Check size={18} />

            <span>{message}</span>

            <button
              type="button"
              onClick={() => setMessage("")}
              className="ml-auto text-emerald-400 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            <X size={18} />

            <span>{error}</span>

            <button
              type="button"
              onClick={() => setError("")}
              className="ml-auto text-red-400 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* ====================================
            ROLE SELECTOR
        ==================================== */}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(ROLE_CONFIG).map(([role, config]) => {
            const Icon = config.icon;

            const active = activeRole === role;

            const permissionCount = roles[role]?.length || 0;

            return (
              <button
                key={role}
                type="button"
                onClick={() => {
                  setActiveRole(role);
                  setMessage("");
                  setError("");
                }}
                aria-pressed={active}
                className={`
                    group
                    relative
                    w-full
                    text-left
                    rounded-2xl
                    border
                    p-5
                    transition-all
                    duration-200
                    focus:outline-none
                    focus:ring-2
                    focus:ring-indigo-500/50
                    ${
                      active
                        ? `
                          border-indigo-500
                          bg-indigo-500/[0.12]
                          shadow-lg
                          shadow-indigo-500/10
                          ring-1
                          ring-indigo-500/30
                        `
                        : `
                          border-white/10
                          bg-white/[0.02]
                          hover:border-white/20
                          hover:bg-white/[0.05]
                        `
                    }
                  `}
              >
                {/* ACTIVE INDICATOR */}

                {active && (
                  <div className="absolute inset-0 rounded-2xl border border-indigo-400/20 pointer-events-none" />
                )}

                <div className="flex items-start justify-between gap-4">
                  {/* ROLE ICON + INFO */}

                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`
                          w-11
                          h-11
                          shrink-0
                          rounded-xl
                          flex
                          items-center
                          justify-center
                          border
                          transition-all
                          duration-200
                          ${
                            active
                              ? `
                                bg-indigo-500
                                border-indigo-400
                                text-white
                                shadow-lg
                                shadow-indigo-500/25
                              `
                              : `
                                bg-white/5
                                border-white/5
                                text-slate-400
                                group-hover:text-slate-200
                              `
                          }
                        `}
                    >
                      <Icon size={20} />
                    </div>

                    <div className="min-w-0">
                      <h2
                        className={`
                            font-semibold
                            transition-colors
                            ${active ? "text-white" : "text-slate-200"}
                          `}
                      >
                        {config.label}
                      </h2>

                      <p
                        className={`
                            text-xs
                            mt-1
                            leading-5
                            ${active ? "text-indigo-200/70" : "text-slate-500"}
                          `}
                      >
                        {config.description}
                      </p>
                    </div>
                  </div>

                  {/* FULL ROUND CHECK */}

                  <div
                    className={`
                        shrink-0
                        w-7
                        h-7
                        rounded-full
                        border
                        flex
                        items-center
                        justify-center
                        transition-all
                        duration-200
                        ${
                          active
                            ? `
                              bg-indigo-500
                              border-indigo-400
                              text-white
                              shadow-md
                              shadow-indigo-500/30
                            `
                            : `
                              bg-transparent
                              border-white/15
                              text-transparent
                            `
                        }
                      `}
                  >
                    <Check size={15} strokeWidth={3} />
                  </div>
                </div>

                {/* PERMISSION COUNT */}

                <div
                  className={`
                      mt-5
                      pt-4
                      border-t
                      flex
                      items-center
                      justify-between
                      text-xs
                      ${active ? "border-indigo-500/20" : "border-white/5"}
                    `}
                >
                  <span
                    className={active ? "text-indigo-200/70" : "text-slate-500"}
                  >
                    Permissions enabled
                  </span>

                  <span
                    className={`
                        font-semibold
                        px-2.5
                        py-1
                        rounded-full
                        ${
                          active
                            ? "bg-indigo-500/20 text-indigo-300"
                            : "bg-white/5 text-slate-300"
                        }
                      `}
                  >
                    {permissionCount}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* ====================================
            PERMISSION MATRIX
        ==================================== */}

        <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
          {/* TABLE HEADER */}

          <div className="px-5 py-4 border-b border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="font-semibold text-lg">
                {ROLE_CONFIG[activeRole].label} Permissions
              </h2>

              <p className="text-xs text-slate-500 mt-1">
                Enable or disable permissions for this role.
              </p>
            </div>

            <button
              type="button"
              onClick={saveRolePermissions}
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Save Changes
                </>
              )}
            </button>
          </div>

          {/* PERMISSION GROUPS */}

          <div className="divide-y divide-white/5">
            {PERMISSION_GROUPS.map((group) => (
              <div key={group.name} className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <ChevronDown size={16} className="text-slate-500" />

                  <h3 className="text-sm font-semibold text-slate-200">
                    {group.name}
                  </h3>
                </div>

                <div className="space-y-2">
                  {group.keys.map((permission) => {
                    const definition = getDefinition(permission);

                    const enabled = roles[activeRole]?.includes(permission);

                    const accessLabel = getAccessLabel(
                      activeRole,
                      permission,
                      enabled,
                    );

                    return (
                      <div
                        key={permission}
                        className={`
                              flex
                              flex-col
                              sm:flex-row
                              sm:items-center
                              gap-4
                              rounded-xl
                              border
                              px-4
                              py-3
                              transition
                              ${
                                enabled
                                  ? "border-indigo-500/20 bg-indigo-500/[0.04]"
                                  : "border-white/5 bg-black/10 hover:bg-white/[0.02]"
                              }
                            `}
                      >
                        {/* PERMISSION INFO */}

                        <div className="flex-1 min-w-0">
                          <div
                            className={`
                                  font-medium
                                  text-sm
                                  ${enabled ? "text-white" : "text-slate-200"}
                                `}
                          >
                            {definition.label}
                          </div>

                          <div className="text-xs text-slate-500 mt-1">
                            {definition.description}
                          </div>
                        </div>

                        {/* ACCESS + TOGGLE */}

                        <div className="flex items-center gap-3">
                          <span
                            className={`
                                  text-xs
                                  font-medium
                                  min-w-[75px]
                                  text-right
                                  ${
                                    enabled
                                      ? "text-emerald-400"
                                      : "text-slate-600"
                                  }
                                `}
                          >
                            {accessLabel}
                          </span>

                          {/* TOGGLE */}

                          <button
                            type="button"
                            role="switch"
                            aria-checked={enabled}
                            aria-label={`Toggle ${definition.label}`}
                            onClick={() =>
                              togglePermission(activeRole, permission)
                            }
                            className={`
                                  relative
                                  w-11
                                  h-6
                                  shrink-0
                                  rounded-full
                                  transition-all
                                  duration-200
                                  ${enabled ? "bg-indigo-600" : "bg-slate-700"}
                                `}
                          >
                            <span
                              className={`
                                    absolute
                                    top-1
                                    w-4
                                    h-4
                                    rounded-full
                                    bg-white
                                    shadow-sm
                                    transition-all
                                    duration-200
                                    ${enabled ? "left-6" : "left-1"}
                                  `}
                            />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ====================================
            SECURITY NOTE
        ==================================== */}

        <div className="rounded-2xl border border-indigo-500/10 bg-indigo-500/[0.04] p-5">
          <div className="flex items-start gap-3">
            <Shield size={19} className="text-indigo-400 mt-0.5 shrink-0" />

            <div>
              <h3 className="text-sm font-semibold text-slate-200">
                Permission Security
              </h3>

              <p className="text-xs leading-5 text-slate-500 mt-1">
                Permissions are enforced on the backend. Changing the frontend
                UI alone does not grant access to protected SupportAI APIs.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminRolePermissions;
