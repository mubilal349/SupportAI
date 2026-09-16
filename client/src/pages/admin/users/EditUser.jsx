import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  ArrowLeft,
  Save,
  UserPlus,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Eye,
  EyeOff,
  User,
  Mail,
  ShieldCheck,
  Activity,
  LockKeyhole,
  UserCog,
  CircleCheck,
  CirclePause,
  Ban,
  Info,
} from "lucide-react";

import {
  getAdminUser,
  createAdminUser,
  updateAdminUser,
} from "../../../services/adminUserService";

// ============================================================
// INITIAL FORM
// ============================================================

const EMPTY_FORM = {
  name: "",
  email: "",
  password: "",
  role: "customer",
  status: "active",
  avatar: "",
};

// ============================================================
// ROLE CONFIG
// ============================================================

const ROLE_CONFIG = {
  customer: {
    label: "Customer",
    description: "Standard customer account",
    icon: User,
    className: "border-slate-700 bg-slate-800/60 text-slate-300",
  },

  agent: {
    label: "Agent",
    description: "Customer support agent",
    icon: UserCog,
    className: "border-blue-500/20 bg-blue-500/10 text-blue-400",
  },

  admin: {
    label: "Administrator",
    description: "Full administrative access",
    icon: ShieldCheck,
    className: "border-purple-500/20 bg-purple-500/10 text-purple-400",
  },
};

// ============================================================
// STATUS CONFIG
// ============================================================

const STATUS_CONFIG = {
  active: {
    label: "Active",
    description: "User can access the platform",
    icon: CircleCheck,
    className: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
  },

  inactive: {
    label: "Inactive",
    description: "User account is temporarily inactive",
    icon: CirclePause,
    className: "border-amber-500/20 bg-amber-500/10 text-amber-400",
  },

  suspended: {
    label: "Suspended",
    description: "User access has been suspended",
    icon: Ban,
    className: "border-red-500/20 bg-red-500/10 text-red-400",
  },
};

// ============================================================
// HELPERS
// ============================================================

const getInitials = (name = "") => {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (!parts.length) {
    return "U";
  }

  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }

  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

// ============================================================
// AVATAR URL
// ============================================================

const getAvatarUrl = (avatar) => {
  if (!avatar) {
    return "";
  }

  if (
    avatar.startsWith("http://") ||
    avatar.startsWith("https://") ||
    avatar.startsWith("data:")
  ) {
    return avatar;
  }

  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

  const serverUrl = apiUrl.replace(/\/api\/?$/, "");

  return `${serverUrl}${avatar.startsWith("/") ? "" : "/"}${avatar}`;
};

// ============================================================
// EDIT USER
// ============================================================

const EditUser = () => {
  const navigate = useNavigate();
  const { userId } = useParams();

  const isEditMode = Boolean(userId);

  // ==========================================================
  // STATE
  // ==========================================================

  const [form, setForm] = useState(EMPTY_FORM);

  const [loading, setLoading] = useState(isEditMode);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  // ==========================================================
  // LOAD USER
  // ==========================================================

  const fetchUser = useCallback(async () => {
    if (!userId) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await getAdminUser(userId);

      if (!response?.success) {
        throw new Error(response?.message || "Failed to load user.");
      }

      const user = response.user;

      if (!user) {
        throw new Error("User data was not returned.");
      }

      setForm({
        name: user.name || "",
        email: user.email || "",
        password: "",
        role: user.role || "customer",
        status: user.status || "active",
        avatar: user.avatar || "",
      });
    } catch (err) {
      console.error("ADMIN EDIT USER LOAD ERROR:", err);

      setError(
        err?.response?.data?.message || err?.message || "Failed to load user.",
      );
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // ==========================================================
  // INPUT CHANGE
  // ==========================================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (error) {
      setError("");
    }

    if (success) {
      setSuccess("");
    }
  };

  // ==========================================================
  // VALIDATION
  // ==========================================================

  const validateForm = () => {
    const name = form.name.trim();

    const email = form.email.trim();

    if (!name) {
      return "Full name is required.";
    }

    if (name.length < 2) {
      return "Full name must contain at least 2 characters.";
    }

    if (name.length > 100) {
      return "Full name cannot exceed 100 characters.";
    }

    if (!email) {
      return "Email address is required.";
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
      return "Please enter a valid email address.";
    }

    if (!isEditMode && !form.password) {
      return "Password is required when creating a user.";
    }

    if (form.password && form.password.length < 6) {
      return "Password must contain at least 6 characters.";
    }

    if (!["customer", "agent", "admin"].includes(form.role)) {
      return "Please select a valid user role.";
    }

    if (!["active", "inactive", "suspended"].includes(form.status)) {
      return "Please select a valid account status.";
    }

    return "";
  };

  // ==========================================================
  // SUBMIT
  // ==========================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const payload = {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        role: form.role,
        status: form.status,
      };

      if (form.password.trim()) {
        payload.password = form.password;
      }

      let response;

      if (isEditMode) {
        response = await updateAdminUser(userId, payload);
      } else {
        response = await createAdminUser(payload);
      }

      if (!response?.success) {
        throw new Error(
          response?.message ||
            `Failed to ${isEditMode ? "update" : "create"} user.`,
        );
      }

      setSuccess(
        isEditMode
          ? "User updated successfully."
          : "User created successfully.",
      );

      setTimeout(() => {
        if (isEditMode) {
          navigate(`/admin/users/${userId}`);
        } else if (response?.user?._id) {
          navigate(`/admin/users/${response.user._id}`);
        } else {
          navigate("/admin/users");
        }
      }, 700);
    } catch (err) {
      console.error("ADMIN USER SAVE ERROR:", err);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          `Failed to ${isEditMode ? "update" : "create"} user.`,
      );
    } finally {
      setSaving(false);
    }
  };

  // ==========================================================
  // LOADING STATE
  // ==========================================================

  if (loading) {
    return (
      <div className="min-h-full px-4 py-6 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-5 inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-white"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <div className="mx-auto max-w-5xl animate-pulse">
          <div className="mb-6 h-5 w-32 rounded bg-slate-800" />

          <div className="rounded-2xl border border-slate-800 bg-[#0a1222] p-6">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-slate-800" />

              <div className="space-y-3">
                <div className="h-5 w-48 rounded bg-slate-800" />
                <div className="h-4 w-64 rounded bg-slate-900" />
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <div className="h-72 rounded-2xl bg-[#0a1222]" />
            <div className="h-72 rounded-2xl bg-[#0a1222] lg:col-span-2" />
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================
  // ERROR WITHOUT USER
  // ==========================================================

  if (isEditMode && error && !form.name && !form.email) {
    return (
      <div className="min-h-full px-4 py-6 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-5 inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-white"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <div className="mx-auto flex min-h-[420px] max-w-5xl items-center justify-center rounded-2xl border border-slate-800 bg-[#0a1222]">
          <div className="px-6 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-400">
              <AlertTriangle size={24} />
            </div>

            <h2 className="mt-5 text-base font-semibold text-white">
              Unable to load user
            </h2>

            <p className="mt-2 text-xs text-slate-600">{error}</p>

            <button
              type="button"
              onClick={fetchUser}
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

  // ==========================================================
  // CONFIG
  // ==========================================================

  const roleConfig = ROLE_CONFIG[form.role] || ROLE_CONFIG.customer;

  const statusConfig = STATUS_CONFIG[form.status] || STATUS_CONFIG.active;

  const RoleIcon = roleConfig.icon;
  const StatusIcon = statusConfig.icon;

  const avatarUrl = getAvatarUrl(form.avatar);

  // ==========================================================
  // MAIN
  // ==========================================================

  return (
    <div className="min-h-full px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        {/* ====================================================
            BACK
        ==================================================== */}

        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-5 inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-white"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        {/* ====================================================
            PROFILE HEADER
        ==================================================== */}

        <div className="mb-6 overflow-hidden rounded-2xl border border-slate-800 bg-[#0a1222]">
          <div className="border-b border-slate-800 px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                {/* ==================================================
                    AVATAR
                ================================================== */}

                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-slate-800 bg-blue-500/10">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={form.name || "User avatar"}
                      className="h-full w-full object-cover"
                      onError={(event) => {
                        event.currentTarget.style.display = "none";

                        const parent = event.currentTarget.parentElement;

                        parent.classList.add(
                          "flex",
                          "items-center",
                          "justify-center",
                          "text-lg",
                          "font-bold",
                          "text-blue-400",
                        );

                        parent.innerText = getInitials(form.name);
                      }}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-lg font-bold text-blue-400">
                      {getInitials(form.name)}
                    </div>
                  )}
                </div>

                {/* USER INFO */}

                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-400">
                    User Management
                  </p>

                  <h1 className="mt-1 truncate text-xl font-bold text-white sm:text-2xl">
                    {isEditMode ? form.name || "Edit User" : "Create New User"}
                  </h1>

                  {form.email && (
                    <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                      <Mail size={13} />

                      <span className="truncate">{form.email}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* STATUS */}

              {isEditMode && (
                <div
                  className={`inline-flex w-fit items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold ${statusConfig.className}`}
                >
                  <StatusIcon size={14} />

                  {statusConfig.label}
                </div>
              )}
            </div>
          </div>

          {/* ==================================================
              PROFILE META
          ================================================== */}

          <div className="grid border-b border-slate-800 sm:grid-cols-2">
            {/* ROLE */}

            <div className="border-b border-slate-800 px-5 py-4 sm:border-b-0 sm:border-r sm:px-6">
              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-600">
                Account Role
              </p>

              <div className="mt-2 flex items-center gap-2">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-lg border ${roleConfig.className}`}
                >
                  <RoleIcon size={15} />
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-200">
                    {roleConfig.label}
                  </p>

                  <p className="text-[10px] text-slate-600">
                    {roleConfig.description}
                  </p>
                </div>
              </div>
            </div>

            {/* STATUS */}

            <div className="px-5 py-4 sm:px-6">
              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-600">
                Account Status
              </p>

              <div className="mt-2 flex items-center gap-2">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-lg border ${statusConfig.className}`}
                >
                  <StatusIcon size={15} />
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-200">
                    {statusConfig.label}
                  </p>

                  <p className="text-[10px] text-slate-600">
                    {statusConfig.description}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ====================================================
            ALERTS
        ==================================================== */}

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 px-4 py-3.5">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />

            <div>
              <p className="text-xs font-semibold text-red-400">
                Unable to save changes
              </p>

              <p className="mt-1 text-xs leading-5 text-red-400/80">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3.5">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />

            <div>
              <p className="text-xs font-semibold text-emerald-400">
                {success}
              </p>

              <p className="mt-1 text-[10px] text-emerald-400/70">
                Redirecting to the user profile...
              </p>
            </div>
          </div>
        )}

        {/* ====================================================
            CONTENT
        ==================================================== */}

        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 lg:grid-cols-3">
            {/* ==================================================
                LEFT COLUMN
            ================================================== */}

            <div className="space-y-6">
              {/* ACCOUNT ROLE */}

              <section className="rounded-2xl border border-slate-800 bg-[#0a1222] p-5">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                    <ShieldCheck size={17} />
                  </div>

                  <div>
                    <h2 className="text-sm font-semibold text-white">
                      Account Role
                    </h2>

                    <p className="text-[10px] text-slate-600">
                      Access permissions
                    </p>
                  </div>
                </div>

                <label
                  htmlFor="role"
                  className="mb-2 block text-[10px] font-medium uppercase tracking-wider text-slate-600"
                >
                  Role
                </label>

                <select
                  id="role"
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                  disabled={saving}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm text-slate-300 outline-none transition focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="customer">Customer</option>

                  <option value="agent">Agent</option>

                  <option value="admin">Admin</option>
                </select>

                <div
                  className={`mt-3 rounded-xl border px-3 py-3 ${roleConfig.className}`}
                >
                  <div className="flex items-center gap-2">
                    <RoleIcon size={14} />

                    <span className="text-xs font-semibold">
                      {roleConfig.label}
                    </span>
                  </div>

                  <p className="mt-1 text-[10px] opacity-70">
                    {roleConfig.description}
                  </p>
                </div>
              </section>

              {/* ACCOUNT STATUS */}

              <section className="rounded-2xl border border-slate-800 bg-[#0a1222] p-5">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                    <Activity size={17} />
                  </div>

                  <div>
                    <h2 className="text-sm font-semibold text-white">
                      Account Status
                    </h2>

                    <p className="text-[10px] text-slate-600">
                      Current access state
                    </p>
                  </div>
                </div>

                <label
                  htmlFor="status"
                  className="mb-2 block text-[10px] font-medium uppercase tracking-wider text-slate-600"
                >
                  Status
                </label>

                <select
                  id="status"
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  disabled={saving}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm text-slate-300 outline-none transition focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="active">Active</option>

                  <option value="inactive">Inactive</option>

                  <option value="suspended">Suspended</option>
                </select>

                <div
                  className={`mt-3 rounded-xl border px-3 py-3 ${statusConfig.className}`}
                >
                  <div className="flex items-center gap-2">
                    <StatusIcon size={14} />

                    <span className="text-xs font-semibold">
                      {statusConfig.label}
                    </span>
                  </div>

                  <p className="mt-1 text-[10px] opacity-70">
                    {statusConfig.description}
                  </p>
                </div>
              </section>
            </div>

            {/* ==================================================
                RIGHT COLUMN
            ================================================== */}

            <div className="space-y-6 lg:col-span-2">
              {/* PROFILE INFORMATION */}

              <section className="rounded-2xl border border-slate-800 bg-[#0a1222]">
                <div className="border-b border-slate-800 px-5 py-4 sm:px-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                      <User size={17} />
                    </div>

                    <div>
                      <h2 className="text-sm font-semibold text-white">
                        Profile Information
                      </h2>

                      <p className="text-[10px] text-slate-600">
                        Basic account information
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
                  {/* NAME */}

                  <div className="sm:col-span-2">
                    <label
                      htmlFor="name"
                      className="mb-2 block text-[10px] font-medium uppercase tracking-wider text-slate-600"
                    >
                      Full Name
                    </label>

                    <div className="relative">
                      <User
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600"
                        size={15}
                      />

                      <input
                        id="name"
                        name="name"
                        type="text"
                        value={form.name}
                        onChange={handleChange}
                        placeholder="Enter full name"
                        autoComplete="name"
                        disabled={saving}
                        maxLength={100}
                        required
                        className="w-full rounded-xl border border-slate-800 bg-slate-900/60 py-3 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-slate-700 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                      />
                    </div>

                    <p className="mt-2 text-[10px] text-slate-700">
                      The user's display name shown throughout SupportAI.
                    </p>
                  </div>

                  {/* EMAIL */}

                  <div className="sm:col-span-2">
                    <label
                      htmlFor="email"
                      className="mb-2 block text-[10px] font-medium uppercase tracking-wider text-slate-600"
                    >
                      Email Address
                    </label>

                    <div className="relative">
                      <Mail
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600"
                        size={15}
                      />

                      <input
                        id="email"
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        placeholder="user@example.com"
                        autoComplete="email"
                        disabled={saving}
                        required
                        className="w-full rounded-xl border border-slate-800 bg-slate-900/60 py-3 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-slate-700 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                      />
                    </div>

                    <p className="mt-2 text-[10px] text-slate-700">
                      This email address is used for authentication and
                      notifications.
                    </p>
                  </div>
                </div>
              </section>

              {/* SECURITY */}

              <section className="rounded-2xl border border-slate-800 bg-[#0a1222]">
                <div className="border-b border-slate-800 px-5 py-4 sm:px-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
                      <LockKeyhole size={17} />
                    </div>

                    <div>
                      <h2 className="text-sm font-semibold text-white">
                        Security
                      </h2>

                      <p className="text-[10px] text-slate-600">
                        Manage account password
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-5 sm:p-6">
                  <label
                    htmlFor="password"
                    className="mb-2 block text-[10px] font-medium uppercase tracking-wider text-slate-600"
                  >
                    {isEditMode ? "New Password" : "Password"}
                  </label>

                  <div className="relative">
                    <LockKeyhole
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600"
                      size={15}
                    />

                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      placeholder={
                        isEditMode ? "Enter new password" : "Enter password"
                      }
                      autoComplete="new-password"
                      disabled={saving}
                      minLength={6}
                      required={!isEditMode}
                      className="w-full rounded-xl border border-slate-800 bg-slate-900/60 py-3 pl-10 pr-12 text-sm text-white outline-none transition placeholder:text-slate-700 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword((previous) => !previous)}
                      disabled={saving}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-600 transition hover:text-slate-300 disabled:opacity-50"
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  <div className="mt-3 flex items-start gap-2 rounded-xl border border-slate-800 bg-slate-900/30 px-3 py-3">
                    <Info
                      size={14}
                      className="mt-0.5 shrink-0 text-slate-600"
                    />

                    <p className="text-[10px] leading-4 text-slate-600">
                      {isEditMode
                        ? "Leave this field empty to keep the user's current password unchanged."
                        : "The password must contain at least 6 characters."}
                    </p>
                  </div>
                </div>
              </section>

              {/* AGENT AVAILABILITY */}

              {form.role === "agent" && (
                <section className="rounded-2xl border border-blue-500/10 bg-blue-500/[0.03]">
                  <div className="border-b border-blue-500/10 px-5 py-4 sm:px-6">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                        <Activity size={17} />
                      </div>

                      <div>
                        <h2 className="text-sm font-semibold text-white">
                          Agent Availability
                        </h2>

                        <p className="text-[10px] text-slate-600">
                          Agent presence is managed separately
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="px-5 py-4 sm:px-6">
                    <p className="text-xs leading-5 text-slate-500">
                      Online, away, busy, and offline availability is managed
                      separately from the account status. Changing the account
                      status here controls whether the agent account can access
                      SupportAI.
                    </p>
                  </div>
                </section>
              )}
            </div>
          </div>

          {/* ====================================================
              ACTION BAR
          ==================================================== */}

          <div className="mt-6 rounded-2xl border border-slate-800 bg-[#0a1222] p-4 sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-slate-500 sm:flex">
                  <UserPlus size={16} />
                </div>

                <div>
                  <p className="text-xs font-semibold text-slate-300">
                    {isEditMode ? "Save User Changes" : "Create User Account"}
                  </p>

                  <p className="mt-1 text-[10px] leading-4 text-slate-600">
                    {isEditMode
                      ? "Review the information above before saving."
                      : "Create the account with the selected role and status."}
                  </p>
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  disabled={saving}
                  className="inline-flex items-center justify-center rounded-xl border border-slate-800 px-5 py-2.5 text-sm font-medium text-slate-400 transition hover:bg-slate-900 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-900/20 transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />

                      {isEditMode ? "Saving Changes..." : "Creating User..."}
                    </>
                  ) : (
                    <>
                      {isEditMode ? <Save size={16} /> : <UserPlus size={16} />}

                      {isEditMode ? "Save Changes" : "Create User"}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditUser;
