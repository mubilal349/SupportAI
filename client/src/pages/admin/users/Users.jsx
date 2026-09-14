import React, { useCallback, useEffect, useMemo, useState } from "react";
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
  ChevronLeft,
  ChevronRight,
  Eye,
  Pencil,
  Trash2,
  Ban,
  UserRound,
  AlertTriangle,
  X,
} from "lucide-react";

import {
  getAdminUsers,
  getAdminUserStats,
  updateAdminUserStatus,
  deleteAdminUser,
} from "../../../services/adminUserService";

// ============================================================
// API SERVER
// ============================================================

const API_SERVER = (
  import.meta.env.VITE_API_URL || "http://localhost:8000/api"
).replace(/\/api\/?$/, "");

// ============================================================
// AVATAR URL
// ============================================================

const getAvatarUrl = (avatar) => {
  if (!avatar) {
    return "";
  }

  const value = String(avatar).trim();

  if (!value) {
    return "";
  }

  // Already an absolute URL
  if (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("blob:") ||
    value.startsWith("data:")
  ) {
    return value;
  }

  // Normalize relative path
  const normalizedAvatar = value.startsWith("/") ? value : `/${value}`;

  return `${API_SERVER}${normalizedAvatar}`;
};

// ============================================================
// GET INITIALS
// ============================================================

const getInitials = (name = "") => {
  const normalizedName = String(name).trim();

  if (!normalizedName) {
    return "U";
  }

  return normalizedName
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
};

// ============================================================
// ROLE STYLES
// ============================================================

const roleStyles = {
  customer: "bg-slate-500/10 text-slate-400 border-slate-500/10",

  agent: "bg-blue-500/10 text-blue-400 border-blue-500/10",

  admin: "bg-purple-500/10 text-purple-400 border-purple-500/10",
};

// ============================================================
// STATUS STYLES
// ============================================================

const statusStyles = {
  active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/10",

  inactive: "bg-slate-500/10 text-slate-400 border-slate-500/10",

  suspended: "bg-red-500/10 text-red-400 border-red-500/10",
};

// ============================================================
// USERS
// ============================================================

const Users = () => {
  const navigate = useNavigate();

  // ==========================================================
  // STATE
  // ==========================================================

  const [users, setUsers] = useState([]);

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCustomers: 0,
    totalAgents: 0,
    totalAdmins: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    suspendedUsers: 0,
  });

  const [search, setSearch] = useState("");

  const [roleFilter, setRoleFilter] = useState("all");

  const [statusFilter, setStatusFilter] = useState("all");

  const [page, setPage] = useState(1);

  const [limit] = useState(10);

  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalUsers: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  const [actionLoading, setActionLoading] = useState(null);

  const [openMenu, setOpenMenu] = useState(null);

  const [deleteModal, setDeleteModal] = useState(null);

  const [statusModal, setStatusModal] = useState(null);

  // ==========================================================
  // FETCH USERS
  // ==========================================================

  const fetchUsers = useCallback(
    async ({ showLoader = true, currentPage = page } = {}) => {
      try {
        if (showLoader) {
          setLoading(true);
        } else {
          setRefreshing(true);
        }

        setError("");

        const response = await getAdminUsers({
          search,
          role: roleFilter,
          status: statusFilter,
          page: currentPage,
          limit,
        });

        if (!response?.success) {
          throw new Error(response?.message || "Failed to load users.");
        }

        setUsers(Array.isArray(response.users) ? response.users : []);

        setPagination(
          response.pagination || {
            currentPage,
            totalPages: 1,
            totalUsers: 0,
            hasNextPage: false,
            hasPreviousPage: false,
          },
        );
      } catch (err) {
        console.error("ADMIN USERS FETCH ERROR:", err);

        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Failed to load users.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [search, roleFilter, statusFilter, page, limit],
  );

  // ==========================================================
  // FETCH STATS
  // ==========================================================

  const fetchStats = useCallback(async () => {
    try {
      const response = await getAdminUserStats();

      if (response?.success && response?.stats) {
        setStats(response.stats);
      }
    } catch (err) {
      console.error("ADMIN USER STATS ERROR:", err);
    }
  }, []);

  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // ==========================================================
  // LOAD USERS WHEN FILTERS CHANGE
  // ==========================================================

  useEffect(() => {
    fetchUsers({
      showLoader: true,
      currentPage: page,
    });
  }, [search, roleFilter, statusFilter, page, fetchUsers]);

  // ==========================================================
  // RESET PAGE WHEN FILTER CHANGES
  // ==========================================================

  useEffect(() => {
    setPage(1);
  }, [search, roleFilter, statusFilter]);

  // ==========================================================
  // REFRESH
  // ==========================================================

  const handleRefresh = async () => {
    setOpenMenu(null);

    await Promise.all([
      fetchUsers({
        showLoader: false,
        currentPage: page,
      }),
      fetchStats(),
    ]);
  };

  // ==========================================================
  // STATUS ACTION
  // ==========================================================

  const handleStatusChange = async (user, newStatus) => {
    try {
      setActionLoading(user._id);

      setError("");

      const response = await updateAdminUserStatus(user._id, newStatus);

      if (!response?.success) {
        throw new Error(response?.message || "Failed to update user status.");
      }

      setStatusModal(null);
      setOpenMenu(null);

      await Promise.all([
        fetchUsers({
          showLoader: false,
          currentPage: page,
        }),
        fetchStats(),
      ]);
    } catch (err) {
      console.error("ADMIN USER STATUS ERROR:", err);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to update user status.",
      );
    } finally {
      setActionLoading(null);
    }
  };

  // ==========================================================
  // DELETE USER
  // ==========================================================

  const handleDeleteUser = async (user) => {
    try {
      setActionLoading(user._id);

      setError("");

      const response = await deleteAdminUser(user._id);

      if (!response?.success) {
        throw new Error(response?.message || "Failed to delete user.");
      }

      setDeleteModal(null);
      setOpenMenu(null);

      // If deleting the last user on
      // the current page, go back one page.

      if (users.length === 1 && page > 1) {
        setPage((currentPage) => currentPage - 1);
      } else {
        await fetchUsers({
          showLoader: false,
          currentPage: page,
        });
      }

      await fetchStats();
    } catch (err) {
      console.error("ADMIN DELETE USER ERROR:", err);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to delete user.",
      );
    } finally {
      setActionLoading(null);
    }
  };

  // ==========================================================
  // FORMAT DATE
  // ==========================================================

  const formatDate = (date) => {
    if (!date) {
      return "—";
    }

    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // ==========================================================
  // STATUS LABEL
  // ==========================================================

  const getStatusLabel = (status) => {
    if (!status) {
      return "Unknown";
    }

    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  // ==========================================================
  // PAGINATION TEXT
  // ==========================================================

  const paginationText = useMemo(() => {
    const total = pagination.totalUsers || 0;

    if (total === 0) {
      return "No users";
    }

    const start = (page - 1) * limit + 1;

    const end = Math.min(page * limit, total);

    return `Showing ${start}-${end} of ${total}`;
  }, [pagination.totalUsers, page, limit]);

  // ==========================================================
  // MAIN UI
  // ==========================================================

  return (
    <div className="min-h-full px-4 py-6 sm:px-6 lg:px-8">
      {/* ======================================================
          HEADER
      ====================================================== */}

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
          onClick={() => navigate("/admin/users/new")}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500"
        >
          <Plus size={17} />
          Add User
        </button>
      </div>

      {/* ======================================================
          ERROR
      ====================================================== */}

      {error && (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />

          <p className="flex-1 text-xs text-red-400">{error}</p>

          <button
            type="button"
            onClick={() => setError("")}
            className="text-slate-600 transition hover:text-white"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* ======================================================
          STATS
      ====================================================== */}

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          icon={UsersIcon}
          iconClass="text-blue-400 bg-blue-500/10"
        />

        <StatCard
          title="Customers"
          value={stats.totalCustomers}
          icon={UserRound}
          iconClass="text-slate-400 bg-slate-500/10"
        />

        <StatCard
          title="Agents"
          value={stats.totalAgents}
          icon={ShieldCheck}
          iconClass="text-blue-400 bg-blue-500/10"
        />

        <StatCard
          title="Active Users"
          value={stats.activeUsers}
          subtitle={`${stats.inactiveUsers || 0} inactive`}
          icon={UserCheck}
          iconClass="text-emerald-400 bg-emerald-500/10"
        />
      </div>

      {/* ======================================================
          FILTERS
      ====================================================== */}

      <div className="mb-5 rounded-2xl border border-slate-800 bg-[#0a1222] p-4">
        <div className="flex flex-col gap-3 lg:flex-row">
          {/* Search */}

          <div className="relative flex-1">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600"
            />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, email, phone or company..."
              className="w-full rounded-xl border border-slate-800 bg-slate-900/60 py-2.5 pl-10 pr-4 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-500/50"
            />
          </div>

          {/* Filters */}

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="flex items-center gap-2">
              <Filter size={16} className="hidden text-slate-500 sm:block" />

              <select
                value={roleFilter}
                onChange={(event) => setRoleFilter(event.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-2.5 text-sm text-slate-300 outline-none focus:border-blue-500/50 sm:w-auto"
              >
                <option value="all">All Roles</option>

                <option value="customer">Customers</option>

                <option value="agent">Agents</option>

                <option value="admin">Admins</option>
              </select>
            </div>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-2.5 text-sm text-slate-300 outline-none focus:border-blue-500/50 sm:w-auto"
            >
              <option value="all">All Statuses</option>

              <option value="active">Active</option>

              <option value="inactive">Inactive</option>

              <option value="suspended">Suspended</option>
            </select>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-2.5 text-sm text-slate-400 transition hover:border-slate-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              title="Refresh users"
            >
              <RefreshCw
                size={16}
                className={refreshing ? "animate-spin" : ""}
              />

              <span className="sm:hidden">Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================
          TABLE
      ====================================================== */}

      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-[#0a1222]">
        {loading ? (
          <LoadingTable />
        ) : users.length === 0 ? (
          <EmptyUsers />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[950px]">
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
                      Availability
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
                  {users.map((user) => (
                    <UserRow
                      key={user._id}
                      user={user}
                      formatDate={formatDate}
                      getStatusLabel={getStatusLabel}
                      openMenu={openMenu}
                      setOpenMenu={setOpenMenu}
                      actionLoading={actionLoading}
                      onView={() => navigate(`/admin/users/${user._id}`)}
                      onEdit={() => navigate(`/admin/users/${user._id}/edit`)}
                      onStatus={() => setStatusModal(user)}
                      onDelete={() => setDeleteModal(user)}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {/* ==================================================
                PAGINATION
            ================================================== */}

            <div className="flex flex-col gap-3 border-t border-slate-800 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-slate-600">{paginationText}</p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={!pagination.hasPreviousPage}
                  onClick={() =>
                    setPage((currentPage) => Math.max(currentPage - 1, 1))
                  }
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-800 px-3 py-2 text-xs text-slate-500 transition hover:border-slate-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <ChevronLeft size={14} />
                  Previous
                </button>

                <span className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-medium text-slate-400">
                  {pagination.currentPage || page} /{" "}
                  {pagination.totalPages || 1}
                </span>

                <button
                  type="button"
                  disabled={!pagination.hasNextPage}
                  onClick={() => setPage((currentPage) => currentPage + 1)}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-800 px-3 py-2 text-xs text-slate-500 transition hover:border-slate-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                >
                  Next
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ======================================================
          STATUS MODAL
      ====================================================== */}

      {statusModal && (
        <StatusModal
          user={statusModal}
          loading={actionLoading === statusModal._id}
          onClose={() => setStatusModal(null)}
          onChange={handleStatusChange}
        />
      )}

      {/* ======================================================
          DELETE MODAL
      ====================================================== */}

      {deleteModal && (
        <DeleteModal
          user={deleteModal}
          loading={actionLoading === deleteModal._id}
          onClose={() => setDeleteModal(null)}
          onConfirm={() => handleDeleteUser(deleteModal)}
        />
      )}
    </div>
  );
};

// ============================================================
// USER ROW
// ============================================================

const UserRow = ({
  user,
  formatDate,
  getStatusLabel,
  openMenu,
  setOpenMenu,
  actionLoading,
  onView,
  onEdit,
  onStatus,
  onDelete,
}) => {
  const isLoading = actionLoading === user._id;

  // ==========================================================
  // AVATAR ERROR STATE
  // ==========================================================

  const [avatarError, setAvatarError] = useState(false);

  // Reset avatar error if the user's
  // avatar changes after a refresh/update.
  useEffect(() => {
    setAvatarError(false);
  }, [user.avatar]);

  return (
    <tr className="transition hover:bg-slate-900/40">
      {/* ======================================================
          USER
      ====================================================== */}

      <td className="px-5 py-4">
        <button
          type="button"
          onClick={onView}
          className="flex items-center gap-3 text-left"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-blue-500/10 text-xs font-bold text-blue-400">
            {user.avatar && !avatarError ? (
              <img
                src={getAvatarUrl(user.avatar)}
                alt={user.name || "User"}
                className="h-full w-full object-cover"
                onError={() => setAvatarError(true)}
              />
            ) : (
              getInitials(user.name)
            )}
          </div>

          <div className="min-w-0">
            <p className="max-w-[220px] truncate text-sm font-medium text-white">
              {user.name}
            </p>

            <p className="mt-0.5 max-w-[220px] truncate text-xs text-slate-600">
              {user.email}
            </p>
          </div>
        </button>
      </td>

      {/* ======================================================
          ROLE
      ====================================================== */}

      <td className="px-5 py-4">
        <span
          className={`inline-flex rounded-lg border px-2.5 py-1 text-xs font-medium capitalize ${
            roleStyles[user.role] || roleStyles.customer
          }`}
        >
          {user.role}
        </span>
      </td>

      {/* ======================================================
          STATUS
      ====================================================== */}

      <td className="px-5 py-4">
        <span
          className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium ${
            statusStyles[user.status] || statusStyles.inactive
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              user.status === "active"
                ? "bg-emerald-400"
                : user.status === "suspended"
                  ? "bg-red-400"
                  : "bg-slate-500"
            }`}
          />

          {getStatusLabel(user.status)}
        </span>
      </td>

      {/* ======================================================
          AVAILABILITY
      ====================================================== */}

      <td className="px-5 py-4">
        <div className="flex items-center gap-2">
          <span
            className={`h-2 w-2 rounded-full ${
              user.availability === "online"
                ? "bg-emerald-400"
                : user.availability === "busy"
                  ? "bg-amber-400"
                  : user.availability === "away"
                    ? "bg-blue-400"
                    : "bg-slate-600"
            }`}
          />

          <span className="text-xs capitalize text-slate-500">
            {user.availability || "offline"}
          </span>
        </div>
      </td>

      {/* ======================================================
          JOINED
      ====================================================== */}

      <td className="px-5 py-4 text-sm text-slate-500">
        {formatDate(user.createdAt)}
      </td>

      {/* ======================================================
          ACTIONS
      ====================================================== */}

      <td className="px-5 py-4">
        <div className="relative flex justify-end">
          <button
            type="button"
            disabled={isLoading}
            onClick={() => setOpenMenu(openMenu === user._id ? null : user._id)}
            className="rounded-lg border border-slate-800 p-2 text-slate-500 transition hover:border-slate-700 hover:text-white disabled:opacity-40"
            title="Actions"
          >
            {isLoading ? (
              <RefreshCw size={15} className="animate-spin" />
            ) : (
              <MoreVertical size={15} />
            )}
          </button>

          {openMenu === user._id && (
            <>
              <button
                type="button"
                onClick={() => setOpenMenu(null)}
                className="fixed inset-0 z-10 cursor-default"
                aria-label="Close menu"
              />

              <div className="absolute right-0 top-10 z-20 w-48 overflow-hidden rounded-xl border border-slate-800 bg-[#0b1425] p-1.5 shadow-2xl">
                <ActionButton
                  icon={Eye}
                  label="View details"
                  onClick={() => {
                    setOpenMenu(null);
                    onView();
                  }}
                />

                <ActionButton
                  icon={Pencil}
                  label="Edit user"
                  onClick={() => {
                    setOpenMenu(null);
                    onEdit();
                  }}
                />

                <ActionButton
                  icon={user.status === "active" ? UserX : UserCheck}
                  label={user.status === "active" ? "Deactivate" : "Activate"}
                  onClick={() => {
                    setOpenMenu(null);
                    onStatus();
                  }}
                />

                {user.status !== "suspended" && (
                  <ActionButton
                    icon={Ban}
                    label="Suspend user"
                    danger
                    onClick={() => {
                      setOpenMenu(null);
                      onStatus();
                    }}
                  />
                )}

                <div className="my-1 border-t border-slate-800" />

                <ActionButton
                  icon={Trash2}
                  label="Delete user"
                  danger
                  onClick={() => {
                    setOpenMenu(null);
                    onDelete();
                  }}
                />
              </div>
            </>
          )}
        </div>
      </td>
    </tr>
  );
};

// ============================================================
// ACTION BUTTON
// ============================================================

const ActionButton = ({ icon: Icon, label, onClick, danger = false }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-xs transition ${
        danger
          ? "text-red-400 hover:bg-red-500/10"
          : "text-slate-400 hover:bg-slate-800 hover:text-white"
      }`}
    >
      <Icon size={14} />

      {label}
    </button>
  );
};

// ============================================================
// STAT CARD
// ============================================================

const StatCard = ({ title, value, subtitle, icon: Icon, iconClass }) => {
  return (
    <div className="rounded-2xl border border-slate-800 bg-[#0a1222] p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-500">{title}</span>

        <div
          className={`flex h-9 w-9 items-center justify-center rounded-xl ${iconClass}`}
        >
          <Icon size={18} />
        </div>
      </div>

      <p className="mt-3 text-2xl font-bold text-white">
        {Number(value || 0).toLocaleString()}
      </p>

      {subtitle && <p className="mt-1 text-xs text-slate-600">{subtitle}</p>}
    </div>
  );
};

// ============================================================
// LOADING TABLE
// ============================================================

const LoadingTable = () => {
  return (
    <div className="animate-pulse">
      <div className="border-b border-slate-800 px-5 py-4">
        <div className="h-3 w-32 rounded bg-slate-800" />
      </div>

      {Array.from({
        length: 6,
      }).map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-6 border-b border-slate-800 px-5 py-5 last:border-0"
        >
          <div className="h-10 w-10 rounded-xl bg-slate-800" />

          <div className="flex-1 space-y-2">
            <div className="h-3 w-32 rounded bg-slate-800" />

            <div className="h-2.5 w-48 rounded bg-slate-800" />
          </div>

          <div className="hidden h-6 w-16 rounded-lg bg-slate-800 sm:block" />

          <div className="hidden h-6 w-20 rounded-lg bg-slate-800 md:block" />

          <div className="h-8 w-8 rounded-lg bg-slate-800" />
        </div>
      ))}
    </div>
  );
};

// ============================================================
// EMPTY USERS
// ============================================================

const EmptyUsers = () => {
  return (
    <div className="flex min-h-[360px] items-center justify-center px-6 py-12">
      <div className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800 text-slate-500">
          <UsersIcon size={24} />
        </div>

        <h3 className="mt-4 text-sm font-semibold text-slate-300">
          No users found
        </h3>

        <p className="mt-1 max-w-sm text-xs leading-5 text-slate-600">
          Try changing your search or filters to find users.
        </p>
      </div>
    </div>
  );
};

// ============================================================
// STATUS MODAL
// ============================================================

const StatusModal = ({ user, loading, onClose, onChange }) => {
  const isSuspended = user.status === "suspended";

  const [avatarError, setAvatarError] = useState(false);

  useEffect(() => {
    setAvatarError(false);
  }, [user.avatar]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-[#0a1222] shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-800 px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-white">
              Change User Status
            </h2>

            <p className="mt-1 text-xs text-slate-600">
              Update the account status for {user.name}.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-800 hover:text-white"
          >
            <X size={17} />
          </button>
        </div>

        <div className="p-5">
          <div className="mb-5 rounded-xl border border-slate-800 bg-slate-950/30 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-blue-500/10 text-xs font-bold text-blue-400">
                {user.avatar && !avatarError ? (
                  <img
                    src={getAvatarUrl(user.avatar)}
                    alt={user.name || "User"}
                    className="h-full w-full object-cover"
                    onError={() => setAvatarError(true)}
                  />
                ) : (
                  getInitials(user.name)
                )}
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">
                  {user.name}
                </p>

                <p className="truncate text-xs text-slate-600">{user.email}</p>
              </div>
            </div>
          </div>

          <p className="mb-3 text-xs font-medium text-slate-500">
            Select account status
          </p>

          <div className="grid grid-cols-1 gap-2">
            <StatusOption
              label="Active"
              description="User can access the platform normally."
              active={user.status === "active"}
              onClick={() => onChange(user, "active")}
              disabled={loading || user.status === "active"}
              className="border-emerald-500/20 bg-emerald-500/5 text-emerald-400"
            />

            <StatusOption
              label="Inactive"
              description="Temporarily disable normal account access."
              active={user.status === "inactive"}
              onClick={() => onChange(user, "inactive")}
              disabled={loading || user.status === "inactive"}
              className="border-slate-700 bg-slate-900/50 text-slate-400"
            />

            <StatusOption
              label="Suspended"
              description="Restrict the account due to administrative action."
              active={isSuspended}
              onClick={() => onChange(user, "suspended")}
              disabled={loading || isSuspended}
              className="border-red-500/20 bg-red-500/5 text-red-400"
            />
          </div>
        </div>

        {loading && (
          <div className="border-t border-slate-800 px-5 py-3">
            <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
              <RefreshCw size={13} className="animate-spin" />
              Updating status...
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================
// STATUS OPTION
// ============================================================

const StatusOption = ({
  label,
  description,
  active,
  onClick,
  disabled,
  className,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-xl border p-3 text-left transition ${
        active
          ? className
          : "border-slate-800 bg-slate-950/20 text-slate-500 hover:border-slate-700 hover:bg-slate-900"
      } disabled:cursor-not-allowed disabled:opacity-60`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold">{label}</span>

        {active && <UserCheck size={14} />}
      </div>

      <p className="mt-1 text-[10px] leading-4 text-slate-600">{description}</p>
    </button>
  );
};

// ============================================================
// DELETE MODAL
// ============================================================

const DeleteModal = ({ user, loading, onClose, onConfirm }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-[#0a1222] shadow-2xl">
        <div className="p-6">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10 text-red-400">
            <Trash2 size={20} />
          </div>

          <div className="mt-5 text-center">
            <h2 className="text-base font-semibold text-white">Delete user?</h2>

            <p className="mt-2 text-xs leading-5 text-slate-500">
              You are about to permanently delete{" "}
              <span className="font-medium text-slate-300">{user.name}</span>.
              This action cannot be undone.
            </p>
          </div>

          <div className="mt-5 rounded-xl border border-red-500/10 bg-red-500/5 p-3">
            <div className="flex gap-2">
              <AlertTriangle
                size={14}
                className="mt-0.5 shrink-0 text-red-400"
              />

              <p className="text-[10px] leading-4 text-red-400/80">
                Make sure this account should no longer exist before continuing.
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border border-slate-800 px-4 py-2.5 text-xs font-medium text-slate-400 transition hover:bg-slate-900 hover:text-white disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading && <RefreshCw size={13} className="animate-spin" />}

              {loading ? "Deleting..." : "Delete User"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Users;
