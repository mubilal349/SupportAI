import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Mail,
  UserCheck,
  Ticket,
  CheckCircle2,
  Star,
  Clock3,
} from "lucide-react";

const AgentDetails = () => {
  const navigate = useNavigate();
  const { agentId } = useParams();

  const agent = {
    name: "Sarah Ahmed",
    email: "sarah@supportai.com",
    status: "online",
    availability: "available",
    assigned: 12,
    resolved: 86,
    rating: 4.8,
    responseTime: "4m 32s",
  };

  return (
    <div className="min-h-full px-4 py-6 sm:px-6 lg:px-8">
      <button
        type="button"
        onClick={() => navigate("/admin/agents")}
        className="mb-5 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-white"
      >
        <ArrowLeft size={16} />
        Back to Agents
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
                  <h1 className="text-xl font-bold text-white">{agent.name}</h1>

                  <p className="mt-1 text-sm text-slate-500">{agent.email}</p>

                  <span className="mt-2 inline-flex items-center gap-2 rounded-lg bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    {agent.availability}
                  </span>
                </div>
              </div>

              <button
                type="button"
                className="rounded-xl border border-slate-800 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-900"
              >
                Manage Availability
              </button>
            </div>
          </section>

          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Assigned", agent.assigned, Ticket, "text-blue-400"],
              ["Resolved", agent.resolved, CheckCircle2, "text-emerald-400"],
              ["Rating", agent.rating, Star, "text-amber-400"],
              ["Avg. Response", agent.responseTime, Clock3, "text-purple-400"],
            ].map(([label, value, Icon, iconColor]) => (
              <div
                key={label}
                className="rounded-2xl border border-slate-800 bg-[#0a1222] p-5"
              >
                <Icon size={18} className={iconColor} />
                <p className="mt-4 text-xs text-slate-500">{label}</p>
                <p className="mt-1 text-xl font-bold text-white">{value}</p>
              </div>
            ))}
          </section>
        </div>

        <aside className="rounded-2xl border border-slate-800 bg-[#0a1222] p-5">
          <h2 className="text-sm font-semibold text-white">
            Agent Information
          </h2>

          <div className="mt-5 space-y-5">
            <div className="flex gap-3">
              <Mail size={17} className="text-slate-600" />
              <div>
                <p className="text-[11px] text-slate-600">Email</p>
                <p className="mt-1 break-all text-sm text-slate-300">
                  {agent.email}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <UserCheck size={17} className="text-slate-600" />
              <div>
                <p className="text-[11px] text-slate-600">Availability</p>
                <p className="mt-1 text-sm capitalize text-slate-300">
                  {agent.availability}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Star size={17} className="text-slate-600" />
              <div>
                <p className="text-[11px] text-slate-600">Customer Rating</p>
                <p className="mt-1 text-sm text-slate-300">
                  ★ {agent.rating} / 5
                </p>
              </div>
            </div>

            <div className="border-t border-slate-800 pt-5">
              <p className="text-[11px] text-slate-600">Agent ID</p>
              <p className="mt-1 break-all text-xs text-slate-500">{agentId}</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default AgentDetails;
