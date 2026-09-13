import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Plus,
  MoreVertical,
  UserCheck,
  UserX,
  ShieldCheck,
  Users as UsersIcon,
  RefreshCw,
  Filter,
} from "lucide-react";

const mockUsers = [
  {
    _id: "1",
    name: "Ali Khan",
    email: "ali@example.com",
    role: "customer",
    status: "active",
    createdAt: "2026-09-10",
  },
  {
    _id: "2",
    name: "Sarah Ahmed",
    email: "sarah@supportai.com",
    role: "agent",
    status: "active",
    createdAt: "2026-09-08",
  },
  {
    _id: "3",
    name: "Usman Malik",
    email: "usman@example.com",
    role: "customer",
    status: "inactive",
    createdAt: "2026-09-05",
  },
  {
    _id: "4",
    name: "Ayesha Noor",
    email: "ayesha@supportai.com",
    role: "admin",
    status: "active",
    createdAt: "2026-08-29",
  },
];

const roleStyles = {
  customer: "bg-slate-500/10 text-slate-400",
  agent: "bg-blue-500/10 text-blue-400",
  admin: "bg-purple-500/10 text-purple-400",
};

const Users = () => {
  const navigate = useNavigate();

  const [users, setUsers] = useState(mockUsers);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase());

      const matchesRole = roleFilter === "all" || user.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [users, search, roleFilter]);

  const toggleStatus = (id) => {
    setUsers((current) =>
      current.map((user) =>
        user._id === id
          ? {
              ...user,
              status: user.status === "active" ? "inactive" : "active",
            }
          : user,
      ),
    );
  };

  const getInitials = (name) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <div className="min-h-full px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-400">
            Administration
          </p>

          <h1 className="mt-1 text-2xl font-bold text-white">
            User Management
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage customers, agents and administrators.
          </p>
        </div>

        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500"
        >
          <Plus size={17} />
          Add User
        </button>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-800 bg-[#0a1222] p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">Total Users</span>
            <UsersIcon size={19} className="text-blue-400" />
          </div>
          <p className="mt-3 text-2xl font-bold text-white">{users.length}</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-[#0a1222] p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">Customers</span>
            <UsersIcon size={19} className="text-slate-400" />
          </div>
          <p className="mt-3 text-2xl font-bold text-white">
            {users.filter((u) => u.role === "customer").length}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-[#0a1222] p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">Agents</span>
            <ShieldCheck size={19} className="text-blue-400" />
          </div>
          <p className="mt-3 text-2xl font-bold text-white">
            {users.filter((u) => u.role === "agent").length}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-[#0a1222] p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">Active</span>
            <UserCheck size={19} className="text-emerald-400" />
          </div>
          <p className="mt-3 text-2xl font-bold text-white">
            {users.filter((u) => u.status === "active").length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-slate-800 bg-[#0a1222] p-4 md:flex-row">
        <div className="relative flex-1">
          <Search
            size={17}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600"
          />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users..."
            className="w-full rounded-xl border border-slate-800 bg-slate-900/60 py-2.5 pl-10 pr-4 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-500/50"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter size={16} className="text-slate-500" />

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-2.5 text-sm text-slate-300 outline-none"
          >
            <option value="all">All Roles</option>
            <option value="customer">Customers</option>
            <option value="agent">Agents</option>
            <option value="admin">Admins</option>
          </select>

          <button
            type="button"
            className="rounded-xl border border-slate-800 p-2.5 text-slate-500 transition hover:text-white"
            title="Refresh"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-[#0a1222]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px]">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="px-5 py-4 text-left text-[10px] uppercase tracking-wider text-slate-500">
                  User
                </th>
                <th className="px-5 py-4 text-left text-[10px] uppercase tracking-wider text-slate-500">
                  Role
                </th>
                <th className="px-5 py-4 text-left text-[10px] uppercase tracking-wider text-slate-500">
                  Status
                </th>
                <th className="px-5 py-4 text-left text-[10px] uppercase tracking-wider text-slate-500">
                  Joined
                </th>
                <th className="px-5 py-4 text-right text-[10px] uppercase tracking-wider text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800">
              {filteredUsers.map((user) => (
                <tr key={user._id} className="transition hover:bg-slate-900/40">
                  <td className="px-5 py-4">
                    <button
                      type="button"
                      onClick={() => navigate(`/admin/users/${user._id}`)}
                      className="flex items-center gap-3 text-left"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-xs font-bold text-blue-400">
                        {getInitials(user.name)}
                      </div>

                      <div>
                        <p className="text-sm font-medium text-white">
                          {user.name}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-600">
                          {user.email}
                        </p>
                      </div>
                    </button>
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`rounded-lg px-2.5 py-1 text-xs font-medium capitalize ${
                        roleStyles[user.role]
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs ${
                        user.status === "active"
                          ? "text-emerald-400"
                          : "text-slate-500"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          user.status === "active"
                            ? "bg-emerald-400"
                            : "bg-slate-600"
                        }`}
                      />
                      {user.status}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-sm text-slate-500">
                    {user.createdAt}
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => toggleStatus(user._id)}
                        className="rounded-lg border border-slate-800 p-2 text-slate-500 transition hover:border-slate-700 hover:text-white"
                        title={
                          user.status === "active" ? "Deactivate" : "Activate"
                        }
                      >
                        {user.status === "active" ? (
                          <UserX size={15} />
                        ) : (
                          <UserCheck size={15} />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => navigate(`/admin/users/${user._id}`)}
                        className="rounded-lg border border-slate-800 p-2 text-slate-500 transition hover:border-slate-700 hover:text-white"
                        title="More"
                      >
                        <MoreVertical size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="px-6 py-12 text-center text-sm text-slate-600">
            No users match your search.
          </div>
        )}
      </div>
    </div>
  );
};

export default Users;
