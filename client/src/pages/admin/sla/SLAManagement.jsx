import React, { useState } from "react";
import { Clock3, Save, AlertTriangle, CheckCircle2 } from "lucide-react";

const SLAManagement = () => {
  const [settings, setSettings] = useState({
    low: 1440,
    medium: 480,
    high: 240,
    urgent: 60,
  });

  const update = (priority, value) => {
    setSettings((current) => ({
      ...current,
      [priority]: value,
    }));
  };

  return (
    <div className="min-h-full px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-400">
          Administration
        </p>

        <h1 className="mt-1 text-2xl font-bold text-white">SLA Management</h1>

        <p className="mt-1 text-sm text-slate-500">
          Configure response and resolution targets for support tickets.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <div className="rounded-2xl border border-slate-800 bg-[#0a1222] p-5 sm:p-6">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
              <Clock3 size={19} />
            </div>

            <div>
              <h2 className="text-sm font-semibold text-white">
                Priority Targets
              </h2>
              <p className="text-xs text-slate-600">
                Resolution target in minutes
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {Object.entries(settings).map(([priority, value]) => (
              <div
                key={priority}
                className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-900/40 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-medium capitalize text-white">
                    {priority}
                  </p>

                  <p className="mt-1 text-xs text-slate-600">
                    Target resolution time
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    value={value}
                    onChange={(e) => update(priority, e.target.value)}
                    className="w-28 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white outline-none"
                  />

                  <span className="text-xs text-slate-600">minutes</span>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-500"
          >
            <Save size={16} />
            Save SLA Settings
          </button>
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-[#0a1222] p-5">
            <div className="flex gap-3">
              <CheckCircle2 size={18} className="mt-0.5 text-emerald-400" />

              <div>
                <p className="text-sm font-medium text-white">
                  SLA Tracking Active
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-600">
                  Tickets are currently being monitored against their configured
                  targets.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-amber-500/10 bg-amber-500/5 p-5">
            <div className="flex gap-3">
              <AlertTriangle size={18} className="mt-0.5 text-amber-400" />

              <div>
                <p className="text-sm font-medium text-amber-300">
                  Configuration Preview
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Backend persistence will be connected later.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default SLAManagement;
