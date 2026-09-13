import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Filter,
  RefreshCw,
  Ticket,
  AlertTriangle,
  Clock3,
  CheckCircle2,
} from "lucide-react";

const mockTickets = [
  {
    _id: "T001",
    ticketNumber: "SUP-1024",
    subject: "Unable to access my account",
    customer: "Ali Khan",
    agent: "Sarah Ahmed",
    status: "open",
    priority: "high",
    escalated: false,
    createdAt: "2 hours ago",
  },
  {
    _id: "T002",
    ticketNumber: "SUP-1023",
    subject: "Payment failed during checkout",
    customer: "Usman Malik",
    agent: "Ahmed Raza",
    status: "in-progress",
    priority: "urgent",
    escalated: true,
    createdAt: "4 hours ago",
  },
  {
    _id: "T003",
    ticketNumber: "SUP-1022",
    subject: "How can I change my password?",
    customer: "Ayesha Noor",
    agent: "Sarah Ahmed",
    status: "resolved",
    priority: "medium",
    escalated: false,
    createdAt: "Yesterday",
  },
  {
    _id: "T004",
    ticketNumber: "SUP-1021",
    subject: "Feature request for dashboard",
    customer: "Hamza Khan",
    agent: "Unassigned",
    status: "pending",
    priority: "low",
    escalated: false,
    createdAt: "Yesterday",
  },
];

const statusStyles = {
  open: "bg-blue-500/10 text-blue-400",
  pending: "bg-amber-500/10 text-amber-400",
  "in-progress": "bg-purple-500/10 text-purple-400",
  resolved: "bg-emerald-500/10 text-emerald-400",
  closed: "bg-slate-500/10 text-slate-400",
};

const priorityStyles = {
  low: "text-slate-500",
  medium: "text-blue-400",
  high: "text-amber-400",
  urgent: "text-red-400",
};

const Tickets = () => {
  const navigate = useNavigate();

  const [tickets] = useState(mockTickets);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [priority, setPriority] = useState("all");

  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      const matchesSearch =
        ticket.ticketNumber.toLowerCase().includes(search.toLowerCase()) ||
        ticket.subject.toLowerCase().includes(search.toLowerCase()) ||
        ticket.customer.toLowerCase().includes(search.toLowerCase());

      const matchesStatus = status === "all" || ticket.status === status;

      const matchesPriority =
        priority === "all" || ticket.priority === priority;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [tickets, search, status, priority]);

  return (
    <div className="min-h-full px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-400">
          Administration
        </p>

        <h1 className="mt-1 text-2xl font-bold text-white">
          Ticket Management
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Monitor, assign and manage all support tickets.
        </p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-800 bg-[#0a1222] p-4">
          <Ticket size={18} className="text-blue-400" />
          <p className="mt-3 text-xs text-slate-500">Total</p>
          <p className="mt-1 text-2xl font-bold text-white">{tickets.length}</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-[#0a1222] p-4">
          <Clock3 size={18} className="text-amber-400" />
          <p className="mt-3 text-xs text-slate-500">Open</p>
          <p className="mt-1 text-2xl font-bold text-white">
            {tickets.filter((t) => t.status === "open").length}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-[#0a1222] p-4">
          <AlertTriangle size={18} className="text-red-400" />
          <p className="mt-3 text-xs text-slate-500">Escalated</p>
          <p className="mt-1 text-2xl font-bold text-white">
            {tickets.filter((t) => t.escalated).length}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-[#0a1222] p-4">
          <CheckCircle2 size={18} className="text-emerald-400" />
          <p className="mt-3 text-xs text-slate-500">Resolved</p>
          <p className="mt-1 text-2xl font-bold text-white">
            {tickets.filter((t) => t.status === "resolved").length}
          </p>
        </div>
      </div>

      <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-slate-800 bg-[#0a1222] p-4 xl:flex-row">
        <div className="relative flex-1">
          <Search
            size={17}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600"
          />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tickets..."
            className="w-full rounded-xl border border-slate-800 bg-slate-900/60 py-2.5 pl-10 pr-4 text-sm text-white outline-none placeholder:text-slate-600"
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-2.5 text-sm text-slate-300 outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="open">Open</option>
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>

          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-2.5 text-sm text-slate-300 outline-none"
          >
            <option value="all">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>

          <button
            type="button"
            className="rounded-xl border border-slate-800 p-2.5 text-slate-500 hover:text-white"
            title="Refresh"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-[#0a1222]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[950px]">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="px-5 py-4 text-left text-[10px] uppercase tracking-wider text-slate-500">
                  Ticket
                </th>
                <th className="px-5 py-4 text-left text-[10px] uppercase tracking-wider text-slate-500">
                  Customer
                </th>
                <th className="px-5 py-4 text-left text-[10px] uppercase tracking-wider text-slate-500">
                  Agent
                </th>
                <th className="px-5 py-4 text-left text-[10px] uppercase tracking-wider text-slate-500">
                  Priority
                </th>
                <th className="px-5 py-4 text-left text-[10px] uppercase tracking-wider text-slate-500">
                  Status
                </th>
                <th className="px-5 py-4 text-left text-[10px] uppercase tracking-wider text-slate-500">
                  Created
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800">
              {filteredTickets.map((ticket) => (
                <tr
                  key={ticket._id}
                  onClick={() => navigate(`/admin/tickets/${ticket._id}`)}
                  className="cursor-pointer transition hover:bg-slate-900/40"
                >
                  <td className="px-5 py-4">
                    <p className="text-xs font-semibold text-blue-400">
                      {ticket.ticketNumber}
                    </p>
                    <p className="mt-1 max-w-[260px] truncate text-sm text-white">
                      {ticket.subject}
                    </p>
                  </td>

                  <td className="px-5 py-4 text-sm text-slate-400">
                    {ticket.customer}
                  </td>

                  <td className="px-5 py-4 text-sm text-slate-400">
                    {ticket.agent}
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`text-xs font-semibold capitalize ${
                        priorityStyles[ticket.priority]
                      }`}
                    >
                      {ticket.priority}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`rounded-lg px-2.5 py-1 text-xs font-medium capitalize ${
                        statusStyles[ticket.status]
                      }`}
                    >
                      {ticket.status.replace("-", " ")}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-xs text-slate-600">
                    {ticket.createdAt}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredTickets.length === 0 && (
          <div className="py-12 text-center text-sm text-slate-600">
            No tickets found.
          </div>
        )}
      </div>
    </div>
  );
};

export default Tickets;
