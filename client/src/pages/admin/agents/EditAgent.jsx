import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  BriefcaseBusiness,
  Check,
  Loader2,
  Mail,
  Phone,
  Save,
  ShieldCheck,
  User,
  X,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import {
  getAdminAgent,
  createAdminAgent,
  updateAdminAgent,
} from "../../../services/adminAgentService";

const EditAgent = () => {
  const navigate = useNavigate();
  const { agentId } = useParams();

  const isEditMode = Boolean(agentId);

  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    company: "",
    timezone: "Asia/Karachi",
    language: "English",
    role: "agent",
    status: "active",
    availability: "offline",
  });

  // ============================================================
  // LOAD AGENT
  // ============================================================

  useEffect(() => {
    if (!isEditMode || !agentId) {
      setLoading(false);
      return;
    }

    const loadAgent = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await getAdminAgent(agentId);

        const agent =
          response?.agent ||
          response?.data?.agent ||
          response?.data ||
          response;

        if (!agent) {
          throw new Error("Agent not found.");
        }

        setFormData({
          name: agent.name || "",
          email: agent.email || "",
          password: "",
          phone: agent.phone || "",
          company: agent.company || "",
          timezone: agent.timezone || "Asia/Karachi",
          language: agent.language || "English",

          // Load role from database
          role: agent.role || "agent",

          status: agent.status || "active",
          availability: agent.availability || "offline",
        });
      } catch (err) {
        console.error("LOAD AGENT ERROR:", err);

        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Failed to load agent.",
        );
      } finally {
        setLoading(false);
      }
    };

    loadAgent();
  }, [agentId, isEditMode]);

  // ============================================================
  // HANDLE INPUT
  // ============================================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (error) {
      setError("");
    }

    if (success) {
      setSuccess("");
    }
  };

  // ============================================================
  // SUBMIT
  // ============================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      // ----------------------------------------------------------
      // VALIDATION
      // ----------------------------------------------------------

      if (!formData.name.trim()) {
        throw new Error("Agent name is required.");
      }

      if (!formData.email.trim()) {
        throw new Error("Agent email is required.");
      }

      if (!formData.role) {
        throw new Error("Please select a role.");
      }

      if (!isEditMode && formData.password.length < 6) {
        throw new Error("Password must be at least 6 characters.");
      }

      // ----------------------------------------------------------
      // PAYLOAD
      // ----------------------------------------------------------

      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        company: formData.company.trim(),
        timezone: formData.timezone.trim(),
        language: formData.language,

        // IMPORTANT:
        // Send selected role to backend
        role: formData.role,

        status: formData.status,
        availability: formData.availability,
      };

      // Password is required only when creating
      if (!isEditMode) {
        payload.password = formData.password;
      }

      // ----------------------------------------------------------
      // UPDATE
      // ----------------------------------------------------------

      if (isEditMode) {
        await updateAdminAgent(agentId, payload);

        setSuccess("Agent updated successfully.");

        setTimeout(() => {
          navigate(`/admin/agents/${agentId}`);
        }, 700);

        return;
      }

      // ----------------------------------------------------------
      // CREATE
      // ----------------------------------------------------------

      await createAdminAgent(payload);

      setSuccess("Agent created successfully.");

      setTimeout(() => {
        navigate("/admin/agents");
      }, 700);
    } catch (err) {
      console.error("SAVE AGENT ERROR:", err);

      setError(
        err?.response?.data?.message || err?.message || "Failed to save agent.",
      );
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-72px)] items-center justify-center bg-[#050b18]">
        <div className="flex items-center gap-3 text-sm text-slate-400">
          <Loader2 className="animate-spin" size={20} />
          Loading agent...
        </div>
      </div>
    );
  }

  // ============================================================
  // PAGE
  // ============================================================

  return (
    <div className="min-h-[calc(100vh-72px)] bg-[#050b18] px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        {/* ======================================================
            HEADER
        ====================================================== */}

        <div className="mb-6">
          <button
            type="button"
            onClick={() =>
              navigate(
                isEditMode ? `/admin/agents/${agentId}` : "/admin/agents",
              )
            }
            className="mb-5 inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
          >
            <ArrowLeft size={16} />
            Back to Agents
          </button>

          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {isEditMode ? "Edit Agent" : "Add Agent"}
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            {isEditMode
              ? "Update agent information, role, account status, and availability."
              : "Create a new support agent account and assign a role."}
          </p>
        </div>

        {/* ======================================================
            ERROR
        ====================================================== */}

        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            <X className="mt-0.5 shrink-0" size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* ======================================================
            SUCCESS
        ====================================================== */}

        {success && (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
            <Check className="mt-0.5 shrink-0" size={18} />
            <span>{success}</span>
          </div>
        )}

        {/* ======================================================
            FORM
        ====================================================== */}

        <form
          onSubmit={handleSubmit}
          className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/50 shadow-xl"
        >
          {/* ====================================================
              BASIC INFORMATION
          ==================================================== */}

          <section className="border-b border-slate-800 p-5 sm:p-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-white">
                Basic Information
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Manage the agent&apos;s personal and contact information.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {/* NAME */}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Full Name
                </label>

                <div className="relative">
                  <User
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                    size={17}
                  />

                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter full name"
                    autoComplete="name"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 py-3 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* EMAIL */}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Email Address
                </label>

                <div className="relative">
                  <Mail
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                    size={17}
                  />

                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="agent@example.com"
                    autoComplete="email"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 py-3 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* PASSWORD */}

              {!isEditMode && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Password
                  </label>

                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Minimum 6 characters"
                    autoComplete="new-password"
                    minLength={6}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500"
                  />

                  <p className="mt-2 text-xs text-slate-600">
                    Password must contain at least 6 characters.
                  </p>
                </div>
              )}

              {/* PHONE */}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Phone
                </label>

                <div className="relative">
                  <Phone
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                    size={17}
                  />

                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Enter phone number"
                    autoComplete="tel"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 py-3 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* COMPANY */}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Company
                </label>

                <div className="relative">
                  <BriefcaseBusiness
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                    size={17}
                  />

                  <input
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    placeholder="Company name"
                    autoComplete="organization"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 py-3 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* TIMEZONE */}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Timezone
                </label>

                <input
                  type="text"
                  name="timezone"
                  value={formData.timezone}
                  onChange={handleChange}
                  placeholder="Asia/Karachi"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500"
                />
              </div>

              {/* LANGUAGE */}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Language
                </label>

                <select
                  name="language"
                  value={formData.language}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500"
                >
                  <option value="English">English</option>
                  <option value="Urdu">Urdu</option>
                </select>
              </div>
            </div>
          </section>

          {/* ====================================================
              ROLE & PERMISSIONS
          ==================================================== */}

          <section className="border-b border-slate-800 p-5 sm:p-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-white">
                Role &amp; Permissions
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Assign the appropriate role to this account.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {/* ROLE SELECT */}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Account Role
                </label>

                <div className="relative">
                  <ShieldCheck
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                    size={17}
                  />

                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full appearance-none rounded-xl border border-slate-800 bg-slate-950 py-3 pl-10 pr-4 text-sm text-white outline-none transition focus:border-blue-500"
                  >
                    <option value="agent">Support Agent</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                <p className="mt-2 text-xs text-slate-600">
                  This role controls the permissions available to the account.
                </p>
              </div>

              {/* ROLE DESCRIPTION */}

              <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                    <ShieldCheck size={18} />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-white">
                      {formData.role === "admin"
                        ? "Administrator"
                        : "Support Agent"}
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      {formData.role === "admin"
                        ? "Has administrative access to manage users, agents, tickets, and system settings."
                        : "Can manage, respond to, and handle assigned support tickets."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ====================================================
              ACCOUNT SETTINGS
          ==================================================== */}

          <section className="border-b border-slate-800 p-5 sm:p-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-white">
                Account Settings
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Manage account status and support availability.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {/* STATUS */}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Account Status
                </label>

                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>

                <p className="mt-2 text-xs text-slate-600">
                  Inactive and suspended accounts cannot normally handle support
                  tickets.
                </p>
              </div>

              {/* AVAILABILITY */}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Availability
                </label>

                <select
                  name="availability"
                  value={formData.availability}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500"
                >
                  <option value="online">Online</option>
                  <option value="away">Away</option>
                  <option value="busy">Busy</option>
                  <option value="offline">Offline</option>
                </select>

                <p className="mt-2 text-xs text-slate-600">
                  Controls the agent&apos;s current availability for support
                  work.
                </p>
              </div>
            </div>
          </section>

          {/* ====================================================
              ACTIONS
          ==================================================== */}

          <div className="flex flex-col-reverse gap-3 bg-slate-950/30 p-5 sm:flex-row sm:justify-end sm:p-6">
            <button
              type="button"
              disabled={saving}
              onClick={() =>
                navigate(
                  isEditMode ? `/admin/agents/${agentId}` : "/admin/agents",
                )
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-800 px-5 py-3 text-sm font-medium text-slate-300 transition hover:border-slate-700 hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <>
                  <Loader2 className="animate-spin" size={17} />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={17} />
                  {isEditMode ? "Save Changes" : "Create Agent"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditAgent;
