import React, { useEffect, useState } from "react";
import {
  Bell,
  CheckCircle2,
  Mail,
  MessageSquare,
  Save,
  ShieldAlert,
  Ticket,
  UserCheck,
  Loader2,
  AlertCircle,
} from "lucide-react";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000/api";

const SETTINGS_URL = `${API_BASE_URL}/notification-settings`;

const DEFAULT_SETTINGS = {
  emailNotifications: true,
  inAppNotifications: true,
  ticketNotifications: true,
  newTicketNotifications: true,
  newReplyNotifications: true,
  assignmentNotifications: true,
  statusChangeNotifications: true,
  escalationNotifications: true,
  aiReplyNotifications: true,
};

const NotificationManagement = () => {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const getToken = () => {
    return (
      localStorage.getItem("supportai_token") ||
      localStorage.getItem("token") ||
      ""
    );
  };

  // ==========================================
  // LOAD SETTINGS
  // ==========================================

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        setError("");

        const token = getToken();

        const response = await fetch(SETTINGS_URL, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Failed to load notification settings.",
          );
        }

        setSettings({
          ...DEFAULT_SETTINGS,
          ...(data.settings || {}),
        });
      } catch (err) {
        console.error("Load notification settings error:", err);

        setError(err.message || "Unable to load notification settings.");
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // ==========================================
  // TOGGLE
  // ==========================================

  const toggle = (field) => {
    setSettings((current) => ({
      ...current,
      [field]: !current[field],
    }));

    setSuccess("");
    setError("");
  };

  // ==========================================
  // SAVE SETTINGS
  // ==========================================

  const handleSave = async () => {
    try {
      setSaving(true);
      setSuccess("");
      setError("");

      const token = getToken();

      const response = await fetch(SETTINGS_URL, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to save notification settings.",
        );
      }

      setSettings({
        ...DEFAULT_SETTINGS,
        ...(data.settings || {}),
      });

      setSuccess(data.message || "Notification settings updated successfully.");
    } catch (err) {
      console.error("Save notification settings error:", err);

      setError(err.message || "Unable to save notification settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="animate-spin text-blue-400" size={28} />
      </div>
    );
  }

  return (
    <div className="min-h-full px-4 py-6 sm:px-6 lg:px-8">
      {/* HEADER */}
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-400">
          Administration
        </p>

        <h1 className="mt-1 text-2xl font-bold text-white">
          Notification Management
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Configure global SupportAI notification preferences.
        </p>
      </div>

      <div className="max-w-4xl space-y-5">
        {/* SUCCESS */}
        {success && (
          <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3">
            <CheckCircle2 size={18} className="shrink-0 text-emerald-400" />

            <p className="text-sm text-emerald-300">{success}</p>
          </div>
        )}

        {/* ERROR */}
        {error && (
          <div className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3">
            <AlertCircle size={18} className="shrink-0 text-red-400" />

            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {/* GLOBAL */}
        <section className="rounded-2xl border border-slate-800 bg-[#0a1222] p-5 sm:p-6">
          <SectionHeader
            icon={<Bell size={19} className="text-blue-400" />}
            title="Global Notifications"
            description="Control the main notification channels."
          />

          <div className="space-y-3">
            <ToggleRow
              title="In-App Notifications"
              description="Show notifications inside the SupportAI dashboard."
              enabled={settings.inAppNotifications}
              onClick={() => toggle("inAppNotifications")}
            />

            <ToggleRow
              title="Email Notifications"
              description="Allow SupportAI to send notification emails."
              enabled={settings.emailNotifications}
              onClick={() => toggle("emailNotifications")}
            />

            <ToggleRow
              title="Ticket Notifications"
              description="Enable notifications related to support tickets."
              enabled={settings.ticketNotifications}
              onClick={() => toggle("ticketNotifications")}
            />
          </div>
        </section>

        {/* TICKET EVENTS */}
        <section className="rounded-2xl border border-slate-800 bg-[#0a1222] p-5 sm:p-6">
          <SectionHeader
            icon={<Ticket size={19} className="text-purple-400" />}
            title="Ticket Events"
            description="Choose which ticket activities generate notifications."
          />

          <div className="space-y-3">
            <ToggleRow
              title="New Ticket"
              description="Notify agents and administrators when a new ticket is created."
              enabled={settings.newTicketNotifications}
              onClick={() => toggle("newTicketNotifications")}
            />

            <ToggleRow
              title="New Reply"
              description="Notify relevant users when a new ticket reply is added."
              enabled={settings.newReplyNotifications}
              onClick={() => toggle("newReplyNotifications")}
            />

            <ToggleRow
              title="Ticket Assignment"
              description="Notify agents when a ticket is assigned to them."
              enabled={settings.assignmentNotifications}
              onClick={() => toggle("assignmentNotifications")}
            />

            <ToggleRow
              title="Status Changes"
              description="Notify users when the status of a ticket changes."
              enabled={settings.statusChangeNotifications}
              onClick={() => toggle("statusChangeNotifications")}
            />
          </div>
        </section>

        {/* ESCALATION */}
        <section className="rounded-2xl border border-slate-800 bg-[#0a1222] p-5 sm:p-6">
          <SectionHeader
            icon={<ShieldAlert size={19} className="text-orange-400" />}
            title="Escalation Notifications"
            description="Configure notifications for escalated tickets."
          />

          <ToggleRow
            title="Escalation Alerts"
            description="Notify relevant agents and administrators when a ticket is escalated."
            enabled={settings.escalationNotifications}
            onClick={() => toggle("escalationNotifications")}
          />
        </section>

        {/* AI */}
        <section className="rounded-2xl border border-slate-800 bg-[#0a1222] p-5 sm:p-6">
          <SectionHeader
            icon={<MessageSquare size={19} className="text-cyan-400" />}
            title="AI Notifications"
            description="Configure notifications related to AI support."
          />

          <ToggleRow
            title="AI Reply Notifications"
            description="Notify customers when the AI assistant responds to their support request."
            enabled={settings.aiReplyNotifications}
            onClick={() => toggle("aiReplyNotifications")}
          />
        </section>

        {/* SAVE */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={16} />
                Save Settings
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// SECTION HEADER
// ==========================================

const SectionHeader = ({ icon, title, description }) => {
  return (
    <div className="mb-6 flex items-center gap-3">
      {icon}

      <div>
        <h2 className="text-sm font-semibold text-white">{title}</h2>

        <p className="text-xs text-slate-600">{description}</p>
      </div>
    </div>
  );
};

// ==========================================
// TOGGLE ROW
// ==========================================

const ToggleRow = ({ title, description, enabled, onClick }) => {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-900/40 p-4">
      <div>
        <p className="text-sm font-medium text-slate-200">{title}</p>

        <p className="mt-1 text-xs leading-5 text-slate-600">{description}</p>
      </div>

      <button
        type="button"
        onClick={onClick}
        aria-pressed={enabled}
        aria-label={title}
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${
          enabled ? "bg-blue-600" : "bg-slate-700"
        }`}
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

export default NotificationManagement;
