import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  User,
  UserCheck,
  AlertTriangle,
  Clock3,
  Send,
  CheckCircle2,
} from "lucide-react";

const TicketDetails = () => {
  const navigate = useNavigate();
  const { ticketId } = useParams();

  const [status, setStatus] = useState("open");
  const [priority, setPriority] = useState("high");
  const [message, setMessage] = useState("");

  const ticket = {
    ticketNumber: "SUP-1024",
    subject: "Unable to access my account",
    customer: "Ali Khan",
    email: "ali@example.com",
    agent: "Sarah Ahmed",
    createdAt: "September 13, 2026 at 8:30 PM",
    description:
      "The customer is unable to log into their account after resetting the password.",
  };

  const handleSend = (e) => {
    e.preventDefault();

    if (!message.trim()) return;

    console.log("Admin message:", message);
    setMessage("");
  };

  return (
    <div className="min-h-full px-4 py-6 sm:px-6 lg:px-8">
      <button
        type="button"
        onClick={() => navigate("/admin/tickets")}
        className="mb-5 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-white"
      >
        <ArrowLeft size={16} />
        Back to Tickets
      </button>

      <div className="mb-5 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <p className="text-xs font-semibold text-blue-400">
            {ticket.ticketNumber}
          </p>

          <h1 className="mt-1 text-xl font-bold text-white sm:text-2xl">
            {ticket.subject}
          </h1>
        </div>

        <div className="flex flex-wrap gap-2">
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-300 outline-none"
          >
            <option value="low">Low Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="high">High Priority</option>
            <option value="urgent">Urgent Priority</option>
          </select>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-300 outline-none"
          >
            <option value="open">Open</option>
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <div className="rounded-2xl border border-slate-800 bg-[#0a1222]">
          <div className="border-b border-slate-800 p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                  <User size={18} />
                </div>

                <div>
                  <p className="text-sm font-medium text-white">
                    {ticket.customer}
                  </p>
                  <p className="text-xs text-slate-600">{ticket.createdAt}</p>
                </div>
              </div>

              {status === "resolved" && (
                <CheckCircle2 size={19} className="text-emerald-400" />
              )}
            </div>
          </div>

          <div className="min-h-[380px] space-y-5 p-5">
            <div className="max-w-2xl rounded-2xl rounded-tl-none border border-slate-800 bg-slate-900/60 p-4">
              <p className="text-sm leading-6 text-slate-300">
                {ticket.description}
              </p>
            </div>

            <div className="ml-auto max-w-2xl rounded-2xl rounded-tr-none border border-blue-500/20 bg-blue-500/10 p-4">
              <p className="text-sm leading-6 text-slate-300">
                Hello Ali, we're looking into your account access issue. We'll
                help you resolve this as quickly as possible.
              </p>
              <p className="mt-2 text-[10px] text-slate-600">
                {ticket.agent} • Agent
              </p>
            </div>
          </div>

          <form onSubmit={handleSend} className="border-t border-slate-800 p-4">
            <div className="flex gap-3">
              <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Send an administrative message..."
                className="flex-1 rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-500/50"
              />

              <button
                type="submit"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white hover:bg-blue-500"
              >
                <Send size={17} />
              </button>
            </div>
          </form>
        </div>

        <aside className="space-y-5">
          <div className="rounded-2xl border border-slate-800 bg-[#0a1222] p-5">
            <h2 className="text-sm font-semibold text-white">
              Ticket Information
            </h2>

            <div className="mt-5 space-y-4">
              <div>
                <p className="text-[11px] text-slate-600">Status</p>
                <p className="mt-1 text-sm capitalize text-slate-300">
                  {status.replace("-", " ")}
                </p>
              </div>

              <div>
                <p className="text-[11px] text-slate-600">Priority</p>
                <p className="mt-1 text-sm capitalize text-slate-300">
                  {priority}
                </p>
              </div>

              <div>
                <p className="text-[11px] text-slate-600">Ticket ID</p>
                <p className="mt-1 break-all text-xs text-slate-500">
                  {ticketId}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-[#0a1222] p-5">
            <div className="flex items-center gap-3">
              <UserCheck size={18} className="text-blue-400" />
              <div>
                <p className="text-xs text-slate-600">Assigned Agent</p>
                <p className="mt-1 text-sm font-medium text-white">
                  {ticket.agent}
                </p>
              </div>
            </div>

            <button
              type="button"
              className="mt-4 w-full rounded-xl border border-slate-800 py-2.5 text-sm text-slate-400 hover:bg-slate-900 hover:text-white"
            >
              Reassign Ticket
            </button>
          </div>

          <div className="rounded-2xl border border-red-500/10 bg-red-500/5 p-5">
            <div className="flex items-start gap-3">
              <AlertTriangle
                size={18}
                className="mt-0.5 shrink-0 text-red-400"
              />

              <div>
                <p className="text-sm font-medium text-red-300">
                  Administrative Actions
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Escalation, reassignment and SLA actions will be connected to
                  the backend later.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-[#0a1222] p-5">
            <div className="flex items-center gap-3">
              <Clock3 size={18} className="text-amber-400" />
              <div>
                <p className="text-xs text-slate-600">SLA</p>
                <p className="mt-1 text-sm text-slate-300">Monitoring active</p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default TicketDetails;
