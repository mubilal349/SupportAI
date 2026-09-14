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

      // Password:
      // - Required for create
      // - Only sent during edit if
      //   admin entered a new password
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

      // Give the success state a moment
      // before navigating.
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

        <div className="max-w-2xl animate-pulse">
          <div className="mb-6">
            <div className="h-3 w-28 rounded bg-slate-800" />
            <div className="mt-3 h-7 w-48 rounded bg-slate-800" />
            <div className="mt-2 h-4 w-72 rounded bg-slate-900" />
          </div>

          <div className="rounded-2xl border border-slate-800 bg-[#0a1222] p-5 sm:p-6">
            <div className="space-y-6">
              <div>
                <div className="mb-2 h-3 w-20 rounded bg-slate-800" />
                <div className="h-11 rounded-xl bg-slate-900" />
              </div>

              <div>
                <div className="mb-2 h-3 w-20 rounded bg-slate-800" />
                <div className="h-11 rounded-xl bg-slate-900" />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="h-20 rounded-xl bg-slate-900" />
                <div className="h-20 rounded-xl bg-slate-900" />
              </div>
            </div>
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

        <div className="flex min-h-[420px] max-w-2xl items-center justify-center rounded-2xl border border-slate-800 bg-[#0a1222]">
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
  // MAIN
  // ==========================================================

  return (
    <div className="min-h-full px-4 py-6 sm:px-6 lg:px-8">
      {/* ======================================================
          BACK
      ====================================================== */}

      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-5 inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-white"
      >
        <ArrowLeft size={16} />
        Back
      </button>

      <div className="max-w-2xl">
        {/* ====================================================
            PAGE HEADER
        ==================================================== */}

        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-400">
            User Management
          </p>

          <h1 className="mt-1 text-2xl font-bold text-white">
            {isEditMode ? "Edit User" : "Create User"}
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            {isEditMode
              ? "Update account information and permissions."
              : "Create a new customer, agent, or administrator account."}
          </p>
        </div>

        {/* ====================================================
            ALERTS
        ==================================================== */}

        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />

            <p className="flex-1 text-xs leading-5 text-red-400">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />

            <p className="text-xs leading-5 text-emerald-400">{success}</p>
          </div>
        )}

        {/* ====================================================
            FORM
        ==================================================== */}

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-slate-800 bg-[#0a1222] p-5 sm:p-6"
        >
          <div className="space-y-5">
            {/* ==================================================
                NAME
            ================================================== */}

            <div>
              <label
                htmlFor="name"
                className="mb-2 block text-xs font-medium text-slate-400"
              >
                Full Name
              </label>

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
                className="w-full rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-700 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>

            {/* ==================================================
                EMAIL
            ================================================== */}

            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-xs font-medium text-slate-400"
              >
                Email
              </label>

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
                className="w-full rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-700 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>

            {/* ==================================================
                PASSWORD
            ================================================== */}

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-xs font-medium text-slate-400"
              >
                Password
                {isEditMode && (
                  <span className="ml-2 text-[10px] font-normal text-slate-600">
                    Leave blank to keep current password
                  </span>
                )}
              </label>

              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder={
                    isEditMode ? "Enter new password" : "Enter password"
                  }
                  autoComplete={isEditMode ? "new-password" : "new-password"}
                  disabled={saving}
                  minLength={6}
                  required={!isEditMode}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3 pr-11 text-sm text-white outline-none transition placeholder:text-slate-700 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((previous) => !previous)}
                  disabled={saving}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-600 transition hover:text-slate-300 disabled:opacity-50"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              <p className="mt-2 text-[10px] text-slate-700">
                Password must contain at least 6 characters.
              </p>
            </div>

            {/* ==================================================
                ROLE + STATUS
            ================================================== */}

            <div className="grid gap-5 sm:grid-cols-2">
              {/* ROLE */}

              <div>
                <label
                  htmlFor="role"
                  className="mb-2 block text-xs font-medium text-slate-400"
                >
                  Role
                </label>

                <select
                  id="role"
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                  disabled={saving}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm text-slate-300 outline-none transition focus:border-blue-500/50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="customer">Customer</option>

                  <option value="agent">Agent</option>

                  <option value="admin">Admin</option>
                </select>
              </div>

              {/* STATUS */}

              <div>
                <label
                  htmlFor="status"
                  className="mb-2 block text-xs font-medium text-slate-400"
                >
                  Status
                </label>

                <select
                  id="status"
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  disabled={saving}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm text-slate-300 outline-none transition focus:border-blue-500/50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="active">Active</option>

                  <option value="inactive">Inactive</option>

                  <option value="suspended">Suspended</option>
                </select>
              </div>
            </div>

            {/* ==================================================
                AGENT AVAILABILITY NOTE
            ================================================== */}

            {form.role === "agent" && (
              <div className="rounded-xl border border-blue-500/10 bg-blue-500/5 px-4 py-3">
                <p className="text-xs font-medium text-blue-400">
                  Agent availability
                </p>

                <p className="mt-1 text-[10px] leading-4 text-slate-600">
                  Online, away, busy, and offline availability is managed
                  separately from the account status.
                </p>
              </div>
            )}
          </div>

          {/* ====================================================
              ACTIONS
          ==================================================== */}

          <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => navigate(-1)}
              disabled={saving}
              className="rounded-xl border border-slate-800 px-5 py-2.5 text-sm font-medium text-slate-400 transition hover:bg-slate-900 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />

                  {isEditMode ? "Saving..." : "Creating..."}
                </>
              ) : (
                <>
                  {isEditMode ? <Save size={16} /> : <UserPlus size={16} />}

                  {isEditMode ? "Save Changes" : "Create User"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditUser;
