import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  RefreshCw,
  Users,
  UserCheck,
  Clock3,
  BarChart3,
} from "lucide-react";

const mockAgents = [
  {
    _id: "agent-1",
    name: "Sarah Ahmed",
    email: "sarah@supportai.com",
    status: "online",
    availability: "available",
    assigned: 12,
    resolved: 86,
    rating: 4.8,
  },
  {
    _id: "agent-2",
    name: "Ahmed Raza",
    email: "ahmed@supportai.com",
    status: "online",
    availability: "busy",
    assigned: 18,
    resolved: 73,
    rating: 4.6,
  },
  {
    _id: "agent-3",
    name: "Hamza Khan",
    email: "hamza@supportai.com",
    status: "offline",
    availability: "offline",
    assigned: 7,
    resolved: 61,
    rating: 4.7,
  },
  {
    _id: "agent-4",
    name: "Ayesha Noor",
    email: "ayesha@supportai.com",
    status: "online",
    availability: "available",
    assigned: 9,
    resolved: 91,
    rating: 4.9,
  },
];

const Agents = () => {
  const navigate = useNavigate();

  const [agents] = useState(mockAgents);
  const [search, setSearch] = useState("");
  const [availability, setAvailability] = useState("all");

  const filteredAgents = useMemo(() => {
    return agents.filter((agent) => {
      const searchMatch =
        agent.name.toLowerCase().includes(search.toLowerCase()) ||
        agent.email.toLowerCase().includes(search.toLowerCase());

      const availabilityMatch =
        availability === "all" || agent.availability === availability;

      return searchMatch && availabilityMatch;
    });
  }, [agents, search, availability]);

  return (
    <div className="min-h-full px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-400">
          Administration
        </p>

        <h1 className="mt-1 text-2xl font-bold text-white">Agent Management</h1>

        <p className="mt-1 text-sm text-slate-500">
          Monitor agent availability, workload and performance.
        </p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-800 bg-[#0a1222] p-5">
          <Users size={19} className="text-blue-400" />
          <p className="mt-3 text-xs text-slate-500">Total Agents</p>
          <p className="mt-1 text-2xl font-bold text-white">{agents.length}</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-[#0a1222] p-5">
          <UserCheck size={19} className="text-emerald-400" />
          <p className="mt-3 text-xs text-slate-500">Available</p>
          <p className="mt-1 text-2xl font-bold text-white">
            {agents.filter((a) => a.availability === "available").length}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-[#0a1222] p-5">
          <Clock3 size={19} className="text-amber-400" />
          <p className="mt-3 text-xs text-slate-500">Busy</p>
          <p className="mt-1 text-2xl font-bold text-white">
            {agents.filter((a) => a.availability === "busy").length}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-[#0a1222] p-5">
          <BarChart3 size={19} className="text-purple-400" />
          <p className="mt-3 text-xs text-slate-500">Avg. Rating</p>
          <p className="mt-1 text-2xl font-bold text-white">4.8</p>
        </div>
      </div>

      <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-slate-800 bg-[#0a1222] p-4 md:flex-row">
        <div className="relative flex-1">
          <Search
            size={17}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600"
          />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search agents..."
            className="w-full rounded-xl border border-slate-800 bg-slate-900/60 py-2.5 pl-10 pr-4 text-sm text-white outline-none placeholder:text-slate-600"
          />
        </div>

        <div className="flex gap-3">
          <select
            value={availability}
            onChange={(e) => setAvailability(e.target.value)}
            className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-2.5 text-sm text-slate-300 outline-none"
          >
            <option value="all">All Availability</option>
            <option value="available">Available</option>
            <option value="busy">Busy</option>
            <option value="offline">Offline</option>
          </select>

          <button
            type="button"
            className="rounded-xl border border-slate-800 p-2.5 text-slate-500 hover:text-white"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-[#0a1222]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="px-5 py-4 text-left text-[10px] uppercase tracking-wider text-slate-500">
                  Agent
                </th>
                <th className="px-5 py-4 text-left text-[10px] uppercase tracking-wider text-slate-500">
                  Availability
                </th>
                <th className="px-5 py-4 text-left text-[10px] uppercase tracking-wider text-slate-500">
                  Assigned
                </th>
                <th className="px-5 py-4 text-left text-[10px] uppercase tracking-wider text-slate-500">
                  Resolved
                </th>
                <th className="px-5 py-4 text-left text-[10px] uppercase tracking-wider text-slate-500">
                  Rating
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800">
              {filteredAgents.map((agent) => (
                <tr
                  key={agent._id}
                  onClick={() => navigate(`/admin/agents/${agent._id}`)}
                  className="cursor-pointer transition hover:bg-slate-900/40"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-xs font-bold text-blue-400">
                        {agent.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>

                      <div>
                        <p className="text-sm font-medium text-white">
                          {agent.name}
                        </p>
                        <p className="text-xs text-slate-600">{agent.email}</p>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <span className="inline-flex items-center gap-2 text-xs capitalize">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          agent.availability === "available"
                            ? "bg-emerald-400"
                            : agent.availability === "busy"
                              ? "bg-amber-400"
                              : "bg-slate-600"
                        }`}
                      />

                      <span className="text-slate-400">
                        {agent.availability}
                      </span>
                    </span>
                  </td>

                  <td className="px-5 py-4 text-sm text-slate-400">
                    {agent.assigned}
                  </td>

                  <td className="px-5 py-4 text-sm text-slate-400">
                    {agent.resolved}
                  </td>

                  <td className="px-5 py-4 text-sm text-amber-400">
                    ★ {agent.rating}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Agents;
