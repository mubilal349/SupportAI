import React, { useState } from "react";
import { Save, Bell, ShieldCheck, Bot, Globe } from "lucide-react";

const Settings = () => {
  const [settings, setSettings] = useState({
    systemName: "SupportAI",
    timezone: "Asia/Karachi",
    emailNotifications: true,
    ticketNotifications: true,
    aiEnabled: true,
    maintenanceMode: false,
  });

  const toggle = (field) => {
    setSettings((current) => ({
      ...current,
      [field]: !current[field],
    }));
  };

  const update = (field, value) => {
    setSettings((current) => ({
      ...current,
      [field]: value,
    }));
  };

  return (
    <div className="min-h-full px-4 py-6 sm:px-6 lg:px-8">
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
            <div>
              <label className="mb-2 block text-xs text-slate-400">
                System Name
              </label>

              <input
                value={settings.systemName}
                onChange={(e) => update("systemName", e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm text-white outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs text-slate-400">
                Timezone
              </label>

              <select
                value={settings.timezone}
                onChange={(e) => update("timezone", e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm text-slate-300 outline-none"
              >
                <option value="Asia/Karachi">Asia/Karachi</option>
                <option value="UTC">UTC</option>
                <option value="Asia/Dubai">Asia/Dubai</option>
                <option value="Europe/London">Europe/London</option>
              </select>
            </div>
          </div>
        </section>

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
            {[
              [
                "emailNotifications",
                "Email Notifications",
                "Send important system events through email.",
              ],
              [
                "ticketNotifications",
                "Ticket Notifications",
                "Notify agents and administrators about ticket activity.",
              ],
            ].map(([field, title, description]) => (
              <ToggleRow
                key={field}
                title={title}
                description={description}
                enabled={settings[field]}
                onClick={() => toggle(field)}
              />
            ))}
          </div>
        </section>

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
                  description="This setting will be connected to the backend later."
                  enabled={settings.maintenanceMode}
                  onClick={() => toggle("maintenanceMode")}
                  danger
                />
              </div>
            </div>
          </div>
        </section>

        <button
          type="button"
          onClick={() => console.log("Settings:", settings)}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-500"
        >
          <Save size={16} />
          Save Settings
        </button>
      </div>
    </div>
  );
};

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
