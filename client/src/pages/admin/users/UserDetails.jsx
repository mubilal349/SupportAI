import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Mail,
  ShieldCheck,
  CalendarDays,
  Ticket,
  MessageSquare,
  Edit,
  UserCheck,
} from "lucide-react";

const UserDetails = () => {
  const navigate = useNavigate();
  const { userId } = useParams();

  const user = {
    _id: userId,
    name: "Sarah Ahmed",
    email: "sarah@supportai.com",
    role: "agent",
    status: "active",
    createdAt: "August 12, 2026",
    lastSeen: "2 minutes ago",
    tickets: 84,
    resolved: 72,
  };

  return (
    <div className="min-h-full px-4 py-6 sm:px-6 lg:px-8">
      <button
        type="button"
        onClick={() => navigate("/admin/users")}
        className="mb-5 inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-white"
      >
        <ArrowLeft size={16} />
        Back to Users
      </button>

      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-800 bg-[#0a1222] p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/10 text-lg font-bold text-blue-400">
                  SA
                </div>

                <div>
                  <h1 className="text-xl font-bold text-white">{user.name}</h1>
                  <p className="mt-1 text-sm text-slate-500">{user.email}</p>

                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="rounded-lg bg-blue-500/10 px-2.5 py-1 text-xs text-blue-400">
                      {user.role}
                    </span>

                    <span className="rounded-lg bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-400">
                      Active
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-800 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-900 hover:text-white"
              >
                <Edit size={16} />
                Edit User
              </button>
            </div>
          </section>

          <section className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-800 bg-[#0a1222] p-5">
              <Ticket size={18} className="text-blue-400" />
              <p className="mt-4 text-xs text-slate-500">Total Tickets</p>
              <p className="mt-1 text-2xl font-bold text-white">
                {user.tickets}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-[#0a1222] p-5">
              <MessageSquare size={18} className="text-purple-400" />
              <p className="mt-4 text-xs text-slate-500">Resolved</p>
              <p className="mt-1 text-2xl font-bold text-white">
                {user.resolved}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-[#0a1222] p-5">
              <UserCheck size={18} className="text-emerald-400" />
              <p className="mt-4 text-xs text-slate-500">Resolution Rate</p>
              <p className="mt-1 text-2xl font-bold text-white">85.7%</p>
            </div>
          </section>
        </div>

        <aside className="rounded-2xl border border-slate-800 bg-[#0a1222] p-5">
          <h2 className="text-sm font-semibold text-white">
            Account Information
          </h2>

          <div className="mt-5 space-y-5">
            <div className="flex gap-3">
              <Mail size={17} className="mt-0.5 text-slate-600" />
              <div>
                <p className="text-[11px] text-slate-600">Email</p>
                <p className="mt-1 break-all text-sm text-slate-300">
                  {user.email}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <ShieldCheck size={17} className="mt-0.5 text-slate-600" />
              <div>
                <p className="text-[11px] text-slate-600">Role</p>
                <p className="mt-1 text-sm capitalize text-slate-300">
                  {user.role}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <CalendarDays size={17} className="mt-0.5 text-slate-600" />
              <div>
                <p className="text-[11px] text-slate-600">Joined</p>
                <p className="mt-1 text-sm text-slate-300">{user.createdAt}</p>
              </div>
            </div>

            <div className="border-t border-slate-800 pt-5">
              <p className="text-[11px] text-slate-600">Last Seen</p>
              <p className="mt-1 text-sm text-slate-300">{user.lastSeen}</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default UserDetails;
