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
  getUsersForPermissions,
  getUserPermissions,
  updateUserPermissions,
  resetUserPermissions,
} from "../../services/rolePermissionService";

// ============================================================
// API SERVER
// ============================================================

const API_SERVER = (
  import.meta.env.VITE_API_URL || "http://localhost:8000/api"
).replace(/\/api\/?$/, "");

// ============================================================
// AVATAR URL
// ============================================================

const getAvatarUrl = (avatar) => {
  if (!avatar) {
    return "";
  }

  const value = String(avatar).trim();

  if (!value) {
    return "";
  }

  // Already an absolute URL
  if (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("blob:") ||
    value.startsWith("data:")
  ) {
    return value;
  }

  // Normalize relative path
  const normalizedAvatar = value.startsWith("/") ? value : `/${value}`;

  return `${API_SERVER}${normalizedAvatar}`;
};

const ROLE_CONFIG = {
  admin: {
    label: "Administrator",
    description: "Full system access and management permissions.",
    icon: ShieldCheck,
  },
  agent: {
    label: "Agent",
    description: "Handles support tickets and customer conversations.",
    icon: Shield,
  },
  customer: {
    label: "Customer",
    description: "Can manage their own support requests and account.",
    icon: Users,
  },
};

const PERMISSION_GROUPS = [
  {
    title: "General",
    permissions: ["dashboard.view"],
  },
  {
    title: "Tickets",
    permissions: [
      "tickets.view",
      "tickets.create",
      "tickets.reply",
      "tickets.assign",
    ],
  },
  {
    title: "Users & Agents",
    permissions: ["users.manage", "agents.manage"],
  },
  {
    title: "Knowledge Base",
    permissions: ["knowledge_base.view", "knowledge_base.manage"],
  },
  {
    title: "Canned Responses",
    permissions: ["canned_responses.view", "canned_responses.use"],
  },
  {
    title: "SLA",
    permissions: ["sla.view", "sla.manage"],
  },
  {
    title: "Analytics",
    permissions: ["analytics.view", "analytics.limited", "analytics.own"],
  },
  {
    title: "Administration",
    permissions: ["audit_logs.view", "settings.view", "settings.manage"],
  },
];

const getPermissionLabel = (permission) => {
  const labels = {
    "dashboard.view": "Dashboard",

    "tickets.view": "View Tickets",
    "tickets.create": "Create Tickets",
    "tickets.reply": "Reply to Tickets",
    "tickets.assign": "Assign Tickets",

    "users.manage": "Manage Users",
    "agents.manage": "Manage Agents",

    "knowledge_base.view": "View Knowledge Base",
    "knowledge_base.manage": "Manage Knowledge Base",

    "canned_responses.view": "View Canned Responses",
    "canned_responses.use": "Use Canned Responses",

    "sla.view": "View SLA",
    "sla.manage": "Manage SLA",

    "analytics.view": "Full Analytics",
    "analytics.limited": "Limited Analytics",
    "analytics.own": "Own Analytics",

    "audit_logs.view": "Audit Logs",

    "settings.view": "View System Settings",
    "settings.manage": "Manage System Settings",
  };

  return labels[permission] || permission;
};

const getPermissionDescription = (permission) => {
  const descriptions = {
    "dashboard.view": "Access the dashboard.",

    "tickets.view": "View support tickets.",
    "tickets.create": "Create new support tickets.",
    "tickets.reply": "Reply to ticket conversations.",
    "tickets.assign": "Assign tickets to support agents.",

    "users.manage": "Create, update and manage users.",
    "agents.manage": "Create, update and manage agents.",

    "knowledge_base.view": "View knowledge base articles.",
    "knowledge_base.manage":
      "Create, update and delete knowledge base articles.",

    "canned_responses.view": "View available canned responses.",
    "canned_responses.use": "Use canned responses while replying to customers.",

    "sla.view": "View SLA information.",
    "sla.manage": "Create and manage SLA policies.",

    "analytics.view": "Access full analytics.",
    "analytics.limited": "Access limited agent analytics.",
    "analytics.own": "Access analytics for the customer's own activity.",

    "audit_logs.view": "View system audit logs.",

    "settings.view": "View system settings.",
    "settings.manage": "Manage system settings.",
  };

  return descriptions[permission] || "";
};

const getAccessLabel = (role, permission, enabled) => {
  if (!enabled) return "No Access";

  if (
    role === "customer" &&
    ["tickets.view", "tickets.reply"].includes(permission)
  ) {
    return "Own Only";
  }

  if (role === "agent" && permission === "tickets.view") {
    return "Assigned";
  }

  if (permission === "knowledge_base.view") {
    return "View";
  }

  if (permission === "knowledge_base.manage") {
    return "Manage";
  }

  if (permission === "canned_responses.use") {
    return "Use";
  }

  if (permission === "canned_responses.view") {
    return role === "admin" ? "Manage" : "View";
  }

  if (permission === "sla.view") {
    return "View";
  }

  if (permission === "sla.manage") {
    return "Manage";
  }

  if (permission === "analytics.limited") {
    return "Limited";
  }

  if (permission === "analytics.own") {
    return "Own";
  }

  if (permission === "analytics.view") {
    return "Full";
  }

  if (
    [
      "tickets.assign",
      "users.manage",
      "agents.manage",
      "audit_logs.view",
      "settings.manage",
    ].includes(permission)
  ) {
    return "Manage";
  }

  return "Allowed";
};

const normalizeUsers = (data) => {
  if (Array.isArray(data?.users)) {
    return data.users;
  }

  return [];
};

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

  // Individual permission state
  const [individualRole, setIndividualRole] = useState("agent");
  const [individualUsers, setIndividualUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");

  const [individualPermissions, setIndividualPermissions] = useState([]);

  const [roleDefaultPermissions, setRoleDefaultPermissions] = useState([]);

  const [individualLoading, setIndividualLoading] = useState(false);

  const [individualSaving, setIndividualSaving] = useState(false);

  const [individualResetting, setIndividualResetting] = useState(false);

  const [individualMessage, setIndividualMessage] = useState("");

  const [individualError, setIndividualError] = useState("");

  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const activePermissions = roles[activeRole] || [];

  const selectedUser = useMemo(() => {
    return individualUsers.find(
      (user) => String(user._id || user.id) === String(selectedUserId),
    );
  }, [individualUsers, selectedUserId]);

  const permissionDefinitions = useMemo(() => {
    if (definitions.length > 0) {
      return definitions;
    }

    return PERMISSION_GROUPS.flatMap((group) =>
      group.permissions.map((key) => ({
        key,
        label: getPermissionLabel(key),
        description: getPermissionDescription(key),
      })),
    );
  }, [definitions]);

  const getDefinition = (permission) => {
    return (
      permissionDefinitions.find((item) => item.key === permission) || {
        key: permission,
        label: getPermissionLabel(permission),
        description: getPermissionDescription(permission),
      }
    );
  };

  const fetchPermissions = async ({ showLoader = true } = {}) => {
    try {
      if (showLoader) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setError("");
      setMessage("");

      const data = await getRolePermissions();

      const roleData = {
        admin: [],
        agent: [],
        customer: [],
      };

      if (Array.isArray(data?.permissions)) {
        data.permissions.forEach((item) => {
          if (roleData[item.role]) {
            roleData[item.role] = Array.isArray(item.permissions)
              ? item.permissions
              : [];
          }
        });
      }

      setRoles(roleData);

      if (Array.isArray(data?.definitions)) {
        setDefinitions(data.definitions);
      }
    } catch (err) {
      console.error("FETCH ROLE PERMISSIONS ERROR:", err);

      setError(err?.message || "Failed to load role permissions.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchIndividualUsers = async (role = individualRole) => {
    try {
      setIndividualLoading(true);
      setIndividualError("");
      setIndividualMessage("");

      const data = await getUsersForPermissions(role);

      const users = normalizeUsers(data);

      setIndividualUsers(users);

      const responseRolePermissions = Array.isArray(data?.rolePermissions)
        ? data.rolePermissions
        : roles[role] || [];

      setRoleDefaultPermissions(responseRolePermissions);

      if (users.length === 0) {
        setSelectedUserId("");
        setIndividualPermissions([]);
        return;
      }

      const currentSelectedExists = users.some(
        (user) => String(user._id || user.id) === String(selectedUserId),
      );

      if (!currentSelectedExists) {
        setSelectedUserId(String(users[0]._id || users[0].id));
      }
    } catch (err) {
      console.error("FETCH INDIVIDUAL USERS ERROR:", err);

      setIndividualError(err?.message || `Failed to load ${role}s.`);

      setIndividualUsers([]);
      setSelectedUserId("");
      setIndividualPermissions([]);
    } finally {
      setIndividualLoading(false);
    }
  };

  const fetchSelectedUserPermissions = async (userId) => {
    if (!userId) {
      setIndividualPermissions([]);
      return;
    }

    try {
      setIndividualLoading(true);
      setIndividualError("");
      setIndividualMessage("");

      const data = await getUserPermissions(userId);

      const effectivePermissions = Array.isArray(data?.effectivePermissions)
        ? data.effectivePermissions
        : Array.isArray(data?.permissions)
          ? data.permissions
          : [];

      const rolePermissions = Array.isArray(data?.rolePermissions)
        ? data.rolePermissions
        : roles[individualRole] || [];

      setIndividualPermissions(effectivePermissions);

      setRoleDefaultPermissions(rolePermissions);
    } catch (err) {
      console.error("FETCH USER PERMISSIONS ERROR:", err);

      setIndividualError(err?.message || "Failed to load user permissions.");

      setIndividualPermissions([]);
    } finally {
      setIndividualLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, []);

  useEffect(() => {
    fetchIndividualUsers(individualRole);
  }, [individualRole]);

  useEffect(() => {
    if (selectedUserId) {
      fetchSelectedUserPermissions(selectedUserId);
    }
  }, [selectedUserId]);

  const togglePermission = (permission) => {
    if (
      activeRole === "admin" &&
      permission === "dashboard.view" &&
      activePermissions.includes(permission)
    ) {
      return;
    }

    setRoles((previous) => {
      const current = previous[activeRole] || [];

      const updated = current.includes(permission)
        ? current.filter((item) => item !== permission)
        : [...current, permission];

      return {
        ...previous,
        [activeRole]: updated,
      };
    });

    setMessage("");
    setError("");
  };

  const toggleIndividualPermission = (permission) => {
    setIndividualPermissions((previous) => {
      if (previous.includes(permission)) {
        return previous.filter((item) => item !== permission);
      }

      return [...previous, permission];
    });

    setIndividualMessage("");
    setIndividualError("");
  };

  const saveRolePermissions = async () => {
    try {
      setSaving(true);
      setError("");
      setMessage("");

      const updatedPermissions = roles[activeRole] || [];

      if (
        activeRole === "admin" &&
        !updatedPermissions.includes("dashboard.view")
      ) {
        setError("Admin must retain dashboard access.");
        return;
      }

      await updateRolePermissions(activeRole, updatedPermissions);

      setMessage(
        `${ROLE_CONFIG[activeRole].label} permissions updated successfully.`,
      );

      await fetchPermissions({
        showLoader: false,
      });

      if (["agent", "customer"].includes(individualRole)) {
        await fetchIndividualUsers(individualRole);
      }
    } catch (err) {
      console.error("SAVE ROLE PERMISSIONS ERROR:", err);

      setError(err?.message || "Failed to save role permissions.");
    } finally {
      setSaving(false);
    }
  };

  const saveIndividualPermissions = async () => {
    if (!selectedUserId) {
      setIndividualError(`Select an ${individualRole} first.`);
      return;
    }

    try {
      setIndividualSaving(true);
      setIndividualError("");
      setIndividualMessage("");

      await updateUserPermissions(selectedUserId, individualPermissions);

      setIndividualMessage("Individual permissions updated successfully.");

      await fetchIndividualUsers(individualRole);

      await fetchSelectedUserPermissions(selectedUserId);
    } catch (err) {
      console.error("SAVE INDIVIDUAL PERMISSIONS ERROR:", err);

      setIndividualError(
        err?.message || "Failed to save individual permissions.",
      );
    } finally {
      setIndividualSaving(false);
    }
  };

  const resetIndividualPermissions = async () => {
    if (!selectedUserId) {
      setIndividualError(`Select an ${individualRole} first.`);
      return;
    }

    try {
      setIndividualResetting(true);
      setIndividualError("");
      setIndividualMessage("");

      const data = await resetUserPermissions(selectedUserId);

      const permissions = Array.isArray(data?.permissions)
        ? data.permissions
        : roleDefaultPermissions;

      setIndividualPermissions(permissions);

      setIndividualMessage("User permissions reset to role defaults.");

      await fetchIndividualUsers(individualRole);

      await fetchSelectedUserPermissions(selectedUserId);
    } catch (err) {
      console.error("RESET INDIVIDUAL PERMISSIONS ERROR:", err);

      setIndividualError(err?.message || "Failed to reset user permissions.");
    } finally {
      setIndividualResetting(false);
    }
  };

  const isIndividualCustomized =
    selectedUser?.isCustomized === true ||
    (Array.isArray(selectedUser?.permissions) &&
      selectedUser.permissions !== null);

  const individualPermissionCount = individualPermissions.length;

  const individualRolePermissionCount = roleDefaultPermissions.length;

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="flex items-center gap-3 text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading role permissions...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-700 bg-slate-900">
              <ShieldCheck className="h-5 w-5 text-slate-200" />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-white">
                Role & Permissions
              </h1>

              <p className="mt-1 text-sm text-slate-400">
                Manage role defaults and individual user access.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() =>
            fetchPermissions({
              showLoader: false,
            })
          }
          disabled={refreshing}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:border-slate-600 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw
            className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </button>
      </div>

      {/* Global messages */}
      {message && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          <Check className="h-4 w-4" />
          {message}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          <X className="h-4 w-4" />
          {error}
        </div>
      )}

      {/* Role selection */}
      <section>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-white">Role Defaults</h2>

          <p className="mt-1 text-sm text-slate-500">
            These permissions are inherited by users unless they have individual
            permissions.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {Object.entries(ROLE_CONFIG).map(([role, config]) => {
            const Icon = config.icon;
            const isActive = activeRole === role;

            return (
              <button
                key={role}
                type="button"
                onClick={() => setActiveRole(role)}
                className={`rounded-2xl border p-5 text-left transition ${
                  isActive
                    ? "border-slate-500 bg-slate-800/80 shadow-lg shadow-black/10"
                    : "border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-800/60"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                      isActive
                        ? "bg-white text-slate-950"
                        : "bg-slate-800 text-slate-300"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>

                  {isActive && (
                    <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-slate-200">
                      Active
                    </span>
                  )}
                </div>

                <h3 className="mt-4 font-semibold text-white">
                  {config.label}
                </h3>

                <p className="mt-1 text-sm leading-5 text-slate-500">
                  {config.description}
                </p>

                <div className="mt-4 text-xs text-slate-400">
                  {(roles[role] || []).length} permissions enabled
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Role permission matrix */}
      <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60">
        <div className="flex flex-col gap-4 border-b border-slate-800 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-white">
              {ROLE_CONFIG[activeRole].label} Permissions
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Configure the default permissions for this role.
            </p>
          </div>

          <button
            type="button"
            onClick={saveRolePermissions}
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saving ? "Saving..." : "Save Role Defaults"}
          </button>
        </div>

        <div className="divide-y divide-slate-800">
          {PERMISSION_GROUPS.map((group) => {
            const groupPermissions = group.permissions.filter(
              (permission) =>
                permissionDefinitions.some(
                  (definition) => definition.key === permission,
                ) || true,
            );

            if (groupPermissions.length === 0) {
              return null;
            }

            return (
              <div key={group.title} className="p-5">
                <div className="mb-4">
                  <h3 className="font-medium text-slate-200">{group.title}</h3>
                </div>

                <div className="space-y-2">
                  {groupPermissions.map((permission) => {
                    const enabled = activePermissions.includes(permission);

                    const definition = getDefinition(permission);

                    return (
                      <div
                        key={permission}
                        className="flex items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-3"
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-medium text-slate-200">
                              {definition.label ||
                                getPermissionLabel(permission)}
                            </p>

                            <span
                              className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                                enabled
                                  ? "bg-emerald-500/10 text-emerald-300"
                                  : "bg-slate-800 text-slate-500"
                              }`}
                            >
                              {getAccessLabel(activeRole, permission, enabled)}
                            </span>
                          </div>

                          <p className="mt-1 text-xs text-slate-500">
                            {definition.description ||
                              getPermissionDescription(permission)}
                          </p>
                        </div>

                        <button
                          type="button"
                          role="switch"
                          aria-checked={enabled}
                          onClick={() => togglePermission(permission)}
                          disabled={
                            activeRole === "admin" &&
                            permission === "dashboard.view" &&
                            enabled
                          }
                          className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                            enabled ? "bg-emerald-500" : "bg-slate-700"
                          } disabled:cursor-not-allowed disabled:opacity-70`}
                        >
                          <span
                            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition ${
                              enabled ? "left-[22px]" : "left-0.5"
                            }`}
                          />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="border-t border-slate-800 bg-slate-950/30 px-5 py-4">
          <div className="flex items-start gap-3">
            <Shield className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />

            <p className="text-xs leading-5 text-slate-500">
              Role defaults apply automatically to users whose individual
              permissions are set to <code>null</code>. Individual permissions
              can override these defaults for agents and customers.
            </p>
          </div>
        </div>
      </section>

      {/* Individual permissions */}
      <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60">
        <div className="border-b border-slate-800 p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 text-slate-300">
                  <Users className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="font-semibold text-white">
                    Individual User Permissions
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Override role defaults for a specific agent or customer.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex rounded-xl border border-slate-700 bg-slate-950 p-1">
              <button
                type="button"
                onClick={() => {
                  setIndividualRole("agent");
                  setSelectedUserId("");
                }}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                  individualRole === "agent"
                    ? "bg-slate-700 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Agents
              </button>

              <button
                type="button"
                onClick={() => {
                  setIndividualRole("customer");
                  setSelectedUserId("");
                }}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                  individualRole === "customer"
                    ? "bg-slate-700 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Customers
              </button>
            </div>
          </div>
        </div>

        {/* User selector */}
        <div className="border-b border-slate-800 p-5">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div className="relative">
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Select {individualRole === "agent" ? "Agent" : "Customer"}
              </label>

              <button
                type="button"
                onClick={() => setUserDropdownOpen((previous) => !previous)}
                disabled={individualLoading || individualUsers.length === 0}
                className="flex w-full items-center justify-between rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-left transition hover:border-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <div className="flex min-w-0 items-center gap-3">
                  {selectedUser ? (
                    <>
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-800 text-sm font-semibold text-slate-300">
                        {selectedUser.avatar ? (
                          <img
                            src={getAvatarUrl(selectedUser.avatar)}
                            alt={selectedUser.name || "User"}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          (selectedUser.name || "U").charAt(0).toUpperCase()
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-white">
                          {selectedUser.name || "Unnamed User"}
                        </p>

                        <p className="truncate text-xs text-slate-500">
                          {selectedUser.email || ""}
                        </p>
                      </div>
                    </>
                  ) : (
                    <span className="text-sm text-slate-500">
                      {individualLoading
                        ? "Loading users..."
                        : individualUsers.length === 0
                          ? `No ${individualRole}s found`
                          : `Select an ${individualRole}`}
                    </span>
                  )}
                </div>

                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-slate-500 transition ${
                    userDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {userDropdownOpen && individualUsers.length > 0 && (
                <div className="absolute left-0 right-0 top-full z-30 mt-2 max-h-72 overflow-y-auto rounded-xl border border-slate-700 bg-slate-900 p-1 shadow-2xl">
                  {individualUsers.map((user) => {
                    const userId = String(user._id || user.id);

                    const isSelected = userId === String(selectedUserId);

                    return (
                      <button
                        key={userId}
                        type="button"
                        onClick={() => {
                          setSelectedUserId(userId);
                          setUserDropdownOpen(false);
                        }}
                        className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition ${
                          isSelected ? "bg-slate-800" : "hover:bg-slate-800/70"
                        }`}
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-800 text-sm font-semibold text-slate-300">
                          {user.avatar ? (
                            <img
                              src={getAvatarUrl(user.avatar)}
                              alt={user.name || "User"}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            (user.name || "U").charAt(0).toUpperCase()
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-slate-200">
                            {user.name || "Unnamed User"}
                          </p>

                          <p className="truncate text-xs text-slate-500">
                            {user.email || ""}
                          </p>
                        </div>

                        {user.isCustomized && (
                          <span className="shrink-0 rounded-full bg-amber-500/10 px-2 py-1 text-[10px] font-medium text-amber-300">
                            Custom
                          </span>
                        )}

                        {isSelected && (
                          <Check className="h-4 w-4 shrink-0 text-emerald-400" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              {selectedUser && (
                <div className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3">
                  <p className="text-xs text-slate-500">Current access</p>

                  <p className="mt-1 text-sm font-medium text-slate-200">
                    {isIndividualCustomized ? "Customized" : "Role Defaults"}
                  </p>
                </div>
              )}

              <button
                type="button"
                onClick={() => fetchIndividualUsers(individualRole)}
                disabled={individualLoading}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-950 px-4 text-sm font-medium text-slate-300 transition hover:border-slate-600 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw
                  className={`h-4 w-4 ${
                    individualLoading ? "animate-spin" : ""
                  }`}
                />
                Refresh
              </button>
            </div>
          </div>

          {individualUsers.length === 0 && !individualLoading && (
            <div className="mt-4 rounded-xl border border-dashed border-slate-800 bg-slate-950/40 px-4 py-6 text-center">
              <Users className="mx-auto h-6 w-6 text-slate-600" />

              <p className="mt-2 text-sm text-slate-400">
                No {individualRole === "agent" ? "agents" : "customers"} are
                available.
              </p>
            </div>
          )}

          {individualError && (
            <div className="mt-4 flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              <X className="h-4 w-4" />
              {individualError}
            </div>
          )}

          {individualMessage && (
            <div className="mt-4 flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
              <Check className="h-4 w-4" />
              {individualMessage}
            </div>
          )}
        </div>

        {/* Selected user information */}
        {selectedUser && (
          <>
            <div className="grid gap-4 border-b border-slate-800 bg-slate-950/30 p-5 sm:grid-cols-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-600">
                  User
                </p>

                <p className="mt-1 text-sm font-medium text-slate-200">
                  {selectedUser.name || "Unnamed User"}
                </p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wide text-slate-600">
                  Role
                </p>

                <p className="mt-1 text-sm font-medium capitalize text-slate-200">
                  {selectedUser.role || individualRole}
                </p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wide text-slate-600">
                  Permissions
                </p>

                <p className="mt-1 text-sm font-medium text-slate-200">
                  {individualPermissionCount} / {individualRolePermissionCount}{" "}
                  role defaults
                </p>
              </div>
            </div>

            {/* Individual permission matrix */}
            <div className="divide-y divide-slate-800">
              {PERMISSION_GROUPS.map((group) => {
                const groupPermissions = group.permissions;

                return (
                  <div key={group.title} className="p-5">
                    <div className="mb-4">
                      <h3 className="font-medium text-slate-200">
                        {group.title}
                      </h3>

                      <p className="mt-1 text-xs text-slate-500">
                        These settings affect only this selected user.
                      </p>
                    </div>

                    <div className="space-y-2">
                      {groupPermissions.map((permission) => {
                        const enabled =
                          individualPermissions.includes(permission);

                        const roleDefault =
                          roleDefaultPermissions.includes(permission);

                        const definition = getDefinition(permission);

                        return (
                          <div
                            key={permission}
                            className="flex items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-3"
                          >
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-sm font-medium text-slate-200">
                                  {definition.label ||
                                    getPermissionLabel(permission)}
                                </p>

                                {roleDefault && (
                                  <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-400">
                                    Role Default
                                  </span>
                                )}

                                <span
                                  className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                                    enabled
                                      ? "bg-emerald-500/10 text-emerald-300"
                                      : "bg-slate-800 text-slate-500"
                                  }`}
                                >
                                  {enabled ? "Allowed" : "No Access"}
                                </span>
                              </div>

                              <p className="mt-1 text-xs text-slate-500">
                                {definition.description ||
                                  getPermissionDescription(permission)}
                              </p>
                            </div>

                            <button
                              type="button"
                              role="switch"
                              aria-checked={enabled}
                              onClick={() =>
                                toggleIndividualPermission(permission)
                              }
                              className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                                enabled ? "bg-emerald-500" : "bg-slate-700"
                              }`}
                            >
                              <span
                                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition ${
                                  enabled ? "left-[22px]" : "left-0.5"
                                }`}
                              />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Individual actions */}
            <div className="flex flex-col gap-3 border-t border-slate-800 bg-slate-950/30 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-slate-200">
                  Individual access override
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Save custom permissions or reset this user to the role
                  defaults.
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={resetIndividualPermissions}
                  disabled={individualResetting || individualSaving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:border-slate-600 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {individualResetting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  Reset to Role Defaults
                </button>

                <button
                  type="button"
                  onClick={saveIndividualPermissions}
                  disabled={
                    individualSaving || individualResetting || individualLoading
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {individualSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {individualSaving
                    ? "Saving..."
                    : "Save Individual Permissions"}
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      {/* Security note */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />

          <div>
            <h3 className="text-sm font-semibold text-slate-200">
              Permission inheritance
            </h3>

            <p className="mt-1 text-sm leading-6 text-slate-500">
              Admin permissions are controlled by the global administrator role.
              Agents and customers inherit their role defaults when their
              individual permissions are
              <code className="mx-1 rounded bg-slate-800 px-1.5 py-0.5 text-xs text-slate-300">
                null
              </code>
              . Once individual permissions are saved, that user's custom
              permission list is used instead. Resetting the user restores
              inheritance from the role.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AdminRolePermissions;
