import React, { useEffect, useState } from "react";
import {
  Save,
  Bell,
  ShieldCheck,
  Bot,
  Globe,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000/api";

const SETTINGS_URL = `${API_BASE_URL}/system-settings`;

const getToken = () => {
  return (
    localStorage.getItem("supportai_token") ||
    localStorage.getItem("token") ||
    ""
  );
};

const DEFAULT_SETTINGS = {
  systemName: "SupportAI",
  timezone: "Asia/Karachi",
  emailNotifications: true,
  ticketNotifications: true,
  aiEnabled: true,
  maintenanceMode: false,
};

const Settings = () => {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // ============================================================
  // LOAD SETTINGS
  // ============================================================

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const token = getToken();

      const response = await fetch(SETTINGS_URL, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Failed to load system settings.");
      }

      setSettings({
        ...DEFAULT_SETTINGS,
        ...(data?.settings || {}),
      });
    } catch (error) {
      console.error("Load system settings error:", error);

      setErrorMessage(error.message || "Failed to load system settings.");
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // TOGGLE
  // ============================================================

  const toggle = (field) => {
    setSettings((current) => ({
      ...current,
      [field]: !current[field],
    }));

    setSuccessMessage("");
    setErrorMessage("");
  };

  // ============================================================
  // UPDATE
  // ============================================================

  const update = (field, value) => {
    setSettings((current) => ({
      ...current,
      [field]: value,
    }));

    setSuccessMessage("");
    setErrorMessage("");
  };

  // ============================================================
  // SAVE SETTINGS
  // ============================================================

  const handleSave = async () => {
    try {
      setSaving(true);
      setSuccessMessage("");
      setErrorMessage("");

      const token = getToken();

      const response = await fetch(SETTINGS_URL, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Failed to save system settings.");
      }

      setSettings({
        ...DEFAULT_SETTINGS,
        ...(data?.settings || settings),
      });

      setSuccessMessage("System settings updated successfully.");
    } catch (error) {
      console.error("Save system settings error:", error);

      setErrorMessage(error.message || "Failed to save system settings.");
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="min-h-full px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="flex items-center gap-3 text-sm text-slate-400">
            <Loader2 size={18} className="animate-spin" />
            Loading system settings...
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // UI
  // ============================================================

  return (
    <div className="min-h-full px-4 py-6 sm:px-6 lg:px-8">
      {/* HEADER */}
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-400">
          Administration
        </p>

        <h1 className="mt-1 text-2xl font-bold text-white">System Settings</h1>

        <p className="mt-1 text-sm text-slate-500">
          Configure global SupportAI system preferences.
        </p>
      </div>

      <div className="max-w-4xl space-y-5">
        {/* ======================================================
            GENERAL SETTINGS
        ====================================================== */}

        <section className="rounded-2xl border border-slate-800 bg-[#0a1222] p-5 sm:p-6">
          <div className="mb-6 flex items-center gap-3">
            <Globe size={19} className="text-blue-400" />

            <div>
              <h2 className="text-sm font-semibold text-white">
                General Settings
              </h2>

              <p className="text-xs text-slate-600">
                Basic system configuration
              </p>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            {/* SYSTEM NAME */}

            <div>
              <label className="mb-2 block text-xs text-slate-400">
                System Name
              </label>

              <input
                type="text"
                value={settings.systemName}
                onChange={(e) => update("systemName", e.target.value)}
                maxLength={100}
                className="w-full rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500"
                placeholder="SupportAI"
              />
            </div>

            {/* TIMEZONE */}

            <div>
              <label className="mb-2 block text-xs text-slate-400">
                Timezone
              </label>

              <select
                value={settings.timezone}
                onChange={(e) => update("timezone", e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm text-slate-300 outline-none transition focus:border-blue-500"
              >
                <option value="Asia/Karachi">Asia/Karachi</option>

                <option value="UTC">UTC</option>

                <option value="Asia/Dubai">Asia/Dubai</option>

                <option value="Europe/London">Europe/London</option>

                <option value="America/New_York">America/New_York</option>

                <option value="America/Los_Angeles">America/Los_Angeles</option>

                <option value="Asia/Kolkata">Asia/Kolkata</option>
              </select>
            </div>
          </div>
        </section>

        {/* ======================================================
            NOTIFICATIONS
        ====================================================== */}

        <section className="rounded-2xl border border-slate-800 bg-[#0a1222] p-5 sm:p-6">
          <div className="mb-6 flex items-center gap-3">
            <Bell size={19} className="text-purple-400" />

            <div>
              <h2 className="text-sm font-semibold text-white">
                Notifications
              </h2>

              <p className="text-xs text-slate-600">
                Configure system notifications
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <ToggleRow
              title="Email Notifications"
              description="Send important system events through email."
              enabled={settings.emailNotifications}
              onClick={() => toggle("emailNotifications")}
            />

            <ToggleRow
              title="Ticket Notifications"
              description="Notify agents and administrators about ticket activity."
              enabled={settings.ticketNotifications}
              onClick={() => toggle("ticketNotifications")}
            />
          </div>
        </section>

        {/* ======================================================
            AI CONFIGURATION
        ====================================================== */}

        <section className="rounded-2xl border border-slate-800 bg-[#0a1222] p-5 sm:p-6">
          <div className="mb-6 flex items-center gap-3">
            <Bot size={19} className="text-cyan-400" />

            <div>
              <h2 className="text-sm font-semibold text-white">
                AI Configuration
              </h2>

              <p className="text-xs text-slate-600">
                Configure AI support behavior
              </p>
            </div>
          </div>

          <ToggleRow
            title="AI Support"
            description="Allow the AI assistant to respond to customer support requests."
            enabled={settings.aiEnabled}
            onClick={() => toggle("aiEnabled")}
          />
        </section>

        {/* ======================================================
            MAINTENANCE MODE
        ====================================================== */}

        <section className="rounded-2xl border border-red-500/10 bg-red-500/5 p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <ShieldCheck size={19} className="mt-0.5 text-red-400" />

            <div className="flex-1">
              <h2 className="text-sm font-semibold text-red-300">
                Maintenance Mode
              </h2>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                Temporarily restrict access while performing system maintenance.
              </p>

              <div className="mt-4">
                <ToggleRow
                  title="Enable Maintenance Mode"
                  description="Restrict customer access while administrators perform maintenance."
                  enabled={settings.maintenanceMode}
                  onClick={() => toggle("maintenanceMode")}
                  danger
                />
              </div>
            </div>
          </div>
        </section>

        {/* ======================================================
            MESSAGES
        ====================================================== */}

        {successMessage && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            <CheckCircle2 size={17} />
            {successMessage}
          </div>
        )}

        {errorMessage && (
          <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            <AlertCircle size={17} />
            {errorMessage}
          </div>
        )}

        {/* ======================================================
            SAVE BUTTON
        ====================================================== */}

        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}

            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// TOGGLE ROW
// ============================================================

const ToggleRow = ({
  title,
  description,
  enabled,
  onClick,
  danger = false,
}) => {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-900/40 p-4">
      <div>
        <p
          className={`text-sm font-medium ${
            danger ? "text-red-300" : "text-slate-200"
          }`}
        >
          {title}
        </p>

        <p className="mt-1 text-xs leading-5 text-slate-600">{description}</p>
      </div>

      <button
        type="button"
        onClick={onClick}
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${
          enabled ? "bg-blue-600" : "bg-slate-700"
        }`}
        aria-label={title}
        aria-pressed={enabled}
      >
        <span
          className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
            enabled ? "left-6" : "left-1"
          }`}
        />
      </button>
    </div>
  );
};

export default Settings;
