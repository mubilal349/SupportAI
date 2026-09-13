import React, { useMemo, useState } from "react";
import { Search, ShieldCheck, Clock3 } from "lucide-react";

const logs = [
  {
    id: "1",
    user: "Ayesha Noor",
    action: "Updated user role",
    target: "Ali Khan",
    type: "user",
    time: "5 minutes ago",
  },
  {
    id: "2",
    user: "Sarah Ahmed",
    action: "Resolved ticket",
    target: "SUP-1022",
    type: "ticket",
    time: "18 minutes ago",
  },
  {
    id: "3",
    user: "Admin",
    action: "Updated SLA configuration",
    target: "High Priority",
    type: "settings",
    time: "1 hour ago",
  },
  {
    id: "4",
    user: "Ahmed Raza",
    action: "Escalated ticket",
    target: "SUP-1023",
    type: "ticket",
    time: "2 hours ago",
  },
  {
    id: "5",
    user: "Admin",
    action: "Created knowledge article",
    target: "Payment Troubleshooting",
    type: "content",
    time: "Yesterday",
  },
];

const AuditLogs = () => {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return logs.filter((log) =>
      `${log.user} ${log.action} ${log.target}`
        .toLowerCase()
        .includes(search.toLowerCase()),
    );
  }, [search]);

  return (
    <div className="min-h-full px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-400">
          Administration
        </p>

        <h1 className="mt-1 text-2xl font-bold text-white">Audit Logs</h1>

        <p className="mt-1 text-sm text-slate-500">
          Track important administrative and support activity.
        </p>
      </div>

      <div className="mb-5 relative">
        <Search
          size={17}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600"
        />

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search audit logs..."
          className="w-full rounded-2xl border border-slate-800 bg-[#0a1222] py-3 pl-11 pr-4 text-sm text-white outline-none placeholder:text-slate-600"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-[#0a1222]">
        <div className="divide-y divide-slate-800">
          {filtered.map((log) => (
            <div
              key={log.id}
              className="flex flex-col gap-4 p-5 transition hover:bg-slate-900/30 sm:flex-row sm:items-center"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                <ShieldCheck size={18} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm text-white">
                  <span className="font-semibold">{log.user}</span>{" "}
                  <span className="text-slate-500">{log.action}</span>
                </p>

                <p className="mt-1 truncate text-xs text-slate-600">
                  Target: {log.target}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-2 text-xs text-slate-600">
                <Clock3 size={14} />
                {log.time}
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="py-12 text-center text-sm text-slate-600">
            No audit logs found.
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLogs;
