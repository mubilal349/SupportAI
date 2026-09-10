import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Mail,
  Phone,
  RefreshCw,
  Ticket,
  User,
  Building2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import { getAgentCustomerProfile } from "../../services/agentService";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000/api";

const SERVER_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, "");

// =====================================================
// HELPERS
// =====================================================

const getId = (value) => {
  if (!value) return null;

  if (typeof value === "string") {
    return value;
  }

  return value._id || value.id || value.userId || null;
};

const getAvatarUrl = (avatar) => {
  if (!avatar) return null;

  if (
    avatar.startsWith("http://") ||
    avatar.startsWith("https://") ||
    avatar.startsWith("data:") ||
    avatar.startsWith("blob:")
  ) {
    return avatar;
  }

  return `${SERVER_BASE_URL}/${avatar.replace(/^\/+/, "")}`;
};

const formatDate = (date) => {
  if (!date) return "—";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "—";
  }

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatDateTime = (date) => {
  if (!date) return "—";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "—";
  }

  return parsed.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const formatStatus = (status) => {
  if (!status) return "Unknown";

  return String(status)
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const getStatusClasses = (status) => {
  const value = String(status || "").toLowerCase();

  if (value === "resolved") {
    return "border-emerald-500/20 bg-emerald-500/10 text-emerald-400";
  }

  if (value === "closed") {
    return "border-slate-700 bg-slate-800 text-slate-300";
  }

  if (value === "in-progress") {
    return "border-blue-500/20 bg-blue-500/10 text-blue-400";
  }

  if (value === "waiting") {
    return "border-amber-500/20 bg-amber-500/10 text-amber-400";
  }

  return "border-orange-500/20 bg-orange-500/10 text-orange-400";
};

const getPriorityClasses = (priority) => {
  const value = String(priority || "").toLowerCase();

  if (value === "high" || value === "urgent") {
    return "text-red-400";
  }

  if (value === "medium") {
    return "text-amber-400";
  }

  return "text-emerald-400";
};

// =====================================================
// COMPONENT
// =====================================================

const AgentCustomerProfile = () => {
  const { customerId } = useParams();
  const navigate = useNavigate();

  const [customer, setCustomer] = useState(null);

  const [stats, setStats] = useState({
    totalTickets: 0,
    openTickets: 0,
    resolvedTickets: 0,
  });

  const [tickets, setTickets] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // =====================================================
  // LOAD CUSTOMER
  // =====================================================

  const loadCustomer = async (showLoader = true) => {
    try {
      if (showLoader) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setError("");

      const response = await getAgentCustomerProfile(customerId);

      const data = response?.data || response;

      setCustomer(data?.customer || null);

      setStats(
        data?.stats || {
          totalTickets: 0,
          openTickets: 0,
          resolvedTickets: 0,
        },
      );

      setTickets(Array.isArray(data?.tickets) ? data.tickets : []);
    } catch (err) {
      console.error("Customer profile error:", err);

      setError(
        err?.response?.data?.message || "Failed to load customer profile.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    if (customerId) {
      loadCustomer();
    }
  }, [customerId]);

  // =====================================================
  // AVATAR
  // =====================================================

  const avatarUrl = useMemo(
    () => getAvatarUrl(customer?.avatar),
    [customer?.avatar],
  );

  const customerIdValue = getId(customer);

  // =====================================================
  // LOADING STATE
  // =====================================================

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050b18] px-4 text-white">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/70 px-5 py-4 text-sm text-slate-400 shadow-xl">
          <RefreshCw className="h-5 w-5 animate-spin text-blue-400" />
          <span>Loading customer profile...</span>
        </div>
      </div>
    );
  }

  // =====================================================
  // ERROR STATE
  // =====================================================

  if (error || !customer) {
    return (
      <div className="min-h-screen bg-[#050b18] px-4 py-6 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mb-6 flex min-h-10 items-center gap-2 rounded-xl px-3 text-sm text-slate-400 transition hover:bg-slate-900 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />

              <div className="min-w-0">
                <h2 className="font-semibold text-white">Customer not found</h2>

                <p className="mt-1 break-words text-sm leading-6 text-red-300">
                  {error || "Unable to load this customer's profile."}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => loadCustomer()}
              className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-xl bg-red-500/10 px-4 text-sm font-medium text-red-300 transition hover:bg-red-500/20"
            >
              <RefreshCw className="h-4 w-4" />
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =====================================================
  // MAIN
  // =====================================================

  return (
    <div className="min-h-screen bg-[#050b18] px-3 py-4 text-white sm:px-5 sm:py-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl space-y-4 sm:space-y-6">
        {/* =================================================
            TOP BAR
        ================================================= */}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex min-h-10 w-fit items-center gap-2 rounded-xl px-3 text-sm text-slate-400 transition hover:bg-slate-900 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          <button
            type="button"
            onClick={() => loadCustomer(false)}
            disabled={refreshing}
            className="flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm text-slate-300 transition hover:border-blue-500/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 sm:w-fit"
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {/* =================================================
            PROFILE HEADER
        ================================================= */}

        <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70 shadow-xl shadow-black/10 sm:rounded-3xl">
          {/* COVER */}

          <div className="relative h-24 overflow-hidden sm:h-32">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/25 via-indigo-500/15 to-transparent" />

            <div className="absolute -right-10 -top-20 h-48 w-48 rounded-full bg-blue-500/10 blur-3xl" />
            <div className="absolute -bottom-20 left-1/3 h-40 w-40 rounded-full bg-indigo-500/10 blur-3xl" />
          </div>

          {/* PROFILE CONTENT */}

          <div className="px-4 pb-5 sm:px-6 sm:pb-6 lg:px-8">
            <div className="-mt-9 flex flex-col gap-5 sm:-mt-10 sm:flex-row sm:items-end sm:justify-between">
              {/* CUSTOMER */}

              <div className="flex min-w-0 items-end gap-3 sm:gap-4">
                {/* AVATAR */}

                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={customer.name || "Customer"}
                    className="h-16 w-16 shrink-0 rounded-2xl border-4 border-slate-900 object-cover shadow-lg sm:h-20 sm:w-20"
                  />
                ) : (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border-4 border-slate-900 bg-slate-800 shadow-lg sm:h-20 sm:w-20">
                    <User className="h-7 w-7 text-slate-400 sm:h-9 sm:w-9" />
                  </div>
                )}

                {/* NAME */}

                <div className="min-w-0 pb-1">
                  <h1 className="truncate text-xl font-bold text-white sm:text-2xl">
                    {customer.name || "Customer"}
                  </h1>

                  <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                    Customer profile
                  </p>
                </div>
              </div>

              {/* STATUS */}

              <span
                className={`w-fit shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium ${
                  String(customer.status || "active").toLowerCase() === "active"
                    ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                    : "border-slate-700 bg-slate-800 text-slate-300"
                }`}
              >
                <span className="mr-1">●</span>
                {formatStatus(customer.status || "active")}
              </span>
            </div>
          </div>
        </section>

        {/* =================================================
            STATS
        ================================================= */}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
          {/* TOTAL */}

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-slate-400 sm:text-sm">Total Tickets</p>

              <div className="rounded-xl bg-blue-500/10 p-2">
                <Ticket className="h-4 w-4 text-blue-400 sm:h-5 sm:w-5" />
              </div>
            </div>

            <p className="mt-3 text-2xl font-bold text-white sm:text-3xl">
              {stats.totalTickets}
            </p>
          </div>

          {/* OPEN */}

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-slate-400 sm:text-sm">Open Tickets</p>

              <div className="rounded-xl bg-amber-500/10 p-2">
                <Clock3 className="h-4 w-4 text-amber-400 sm:h-5 sm:w-5" />
              </div>
            </div>

            <p className="mt-3 text-2xl font-bold text-white sm:text-3xl">
              {stats.openTickets}
            </p>
          </div>

          {/* RESOLVED */}

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-slate-400 sm:text-sm">
                Resolved Tickets
              </p>

              <div className="rounded-xl bg-emerald-500/10 p-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 sm:h-5 sm:w-5" />
              </div>
            </div>

            <p className="mt-3 text-2xl font-bold text-white sm:text-3xl">
              {stats.resolvedTickets}
            </p>
          </div>
        </div>

        {/* =================================================
            MAIN CONTENT
        ================================================= */}

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[320px_minmax(0,1fr)] lg:gap-6">
          {/* =================================================
              CONTACT INFORMATION
          ================================================= */}

          <section className="h-fit rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:p-5">
            <h2 className="mb-5 font-semibold text-white">
              Contact Information
            </h2>

            <div className="space-y-4 sm:space-y-5">
              {/* EMAIL */}

              <div className="flex min-w-0 gap-3">
                <div className="mt-0.5 shrink-0 rounded-lg bg-blue-500/10 p-1.5">
                  <Mail className="h-4 w-4 text-blue-400" />
                </div>

                <div className="min-w-0">
                  <p className="text-xs text-slate-500">Email</p>

                  <p className="mt-1 break-all text-sm leading-5 text-slate-200">
                    {customer.email || "Not provided"}
                  </p>
                </div>
              </div>

              {/* PHONE */}

              <div className="flex min-w-0 gap-3">
                <div className="mt-0.5 shrink-0 rounded-lg bg-blue-500/10 p-1.5">
                  <Phone className="h-4 w-4 text-blue-400" />
                </div>

                <div className="min-w-0">
                  <p className="text-xs text-slate-500">Phone</p>

                  <p className="mt-1 break-words text-sm leading-5 text-slate-200">
                    {customer.phone || "Not provided"}
                  </p>
                </div>
              </div>

              {/* COMPANY */}

              <div className="flex min-w-0 gap-3">
                <div className="mt-0.5 shrink-0 rounded-lg bg-blue-500/10 p-1.5">
                  <Building2 className="h-4 w-4 text-blue-400" />
                </div>

                <div className="min-w-0">
                  <p className="text-xs text-slate-500">Company</p>

                  <p className="mt-1 break-words text-sm leading-5 text-slate-200">
                    {customer.company || "Not provided"}
                  </p>
                </div>
              </div>

              {/* CUSTOMER SINCE */}

              <div className="flex min-w-0 gap-3">
                <div className="mt-0.5 shrink-0 rounded-lg bg-blue-500/10 p-1.5">
                  <CalendarDays className="h-4 w-4 text-blue-400" />
                </div>

                <div className="min-w-0">
                  <p className="text-xs text-slate-500">Customer Since</p>

                  <p className="mt-1 text-sm leading-5 text-slate-200">
                    {formatDate(customer.createdAt)}
                  </p>
                </div>
              </div>

              {/* LAST SEEN */}

              <div className="flex min-w-0 gap-3">
                <div className="mt-0.5 shrink-0 rounded-lg bg-blue-500/10 p-1.5">
                  <Clock3 className="h-4 w-4 text-blue-400" />
                </div>

                <div className="min-w-0">
                  <p className="text-xs text-slate-500">Last Seen</p>

                  <p className="mt-1 break-words text-sm leading-5 text-slate-200">
                    {formatDateTime(customer.lastSeen)}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* =================================================
              PREVIOUS TICKETS
          ================================================= */}

          <section className="min-w-0 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:p-5">
            {/* HEADER */}

            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <h2 className="font-semibold text-white">Previous Tickets</h2>

                <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                  Customer support history
                </p>
              </div>

              <span className="w-fit rounded-lg bg-slate-800 px-2.5 py-1 text-xs text-slate-400">
                {tickets.length} {tickets.length === 1 ? "ticket" : "tickets"}
              </span>
            </div>

            {/* EMPTY */}

            {tickets.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-800 px-4 py-12 text-center">
                <Ticket className="mx-auto h-8 w-8 text-slate-600" />

                <p className="mt-3 text-sm text-slate-400">
                  No previous tickets
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {tickets.map((item) => {
                  const ticketId = getId(item);

                  return (
                    <button
                      key={ticketId}
                      type="button"
                      onClick={() => {
                        if (ticketId) {
                          navigate(`/agent/tickets/${ticketId}`);
                        }
                      }}
                      disabled={!ticketId}
                      className="group w-full min-w-0 rounded-xl border border-slate-800 bg-slate-950/50 p-3 text-left transition hover:border-blue-500/30 hover:bg-slate-800/40 disabled:cursor-default disabled:opacity-60 sm:p-4"
                    >
                      <div className="flex min-w-0 flex-col gap-3">
                        {/* TOP */}

                        <div className="flex min-w-0 items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                              <span className="text-xs font-medium text-blue-400">
                                {item.ticketNumber || "Ticket"}
                              </span>

                              <span className="hidden text-xs text-slate-600 sm:inline">
                                •
                              </span>

                              <span className="text-xs text-slate-500">
                                {formatDate(item.createdAt)}
                              </span>
                            </div>

                            <h3 className="mt-1.5 break-words text-sm font-medium leading-5 text-white transition group-hover:text-blue-400 sm:text-base">
                              {item.subject || "Untitled ticket"}
                            </h3>
                          </div>

                          <ExternalLink className="mt-1 h-4 w-4 shrink-0 text-slate-600 transition group-hover:text-blue-400" />
                        </div>

                        {/* BOTTOM */}

                        <div className="flex min-w-0 flex-wrap items-center gap-2">
                          {item.category && (
                            <span className="rounded-md bg-slate-800 px-2 py-1 text-xs text-slate-400">
                              {item.category}
                            </span>
                          )}

                          {item.priority && (
                            <span
                              className={`rounded-md bg-slate-800/70 px-2 py-1 text-xs ${getPriorityClasses(
                                item.priority,
                              )}`}
                            >
                              {formatStatus(item.priority)}
                            </span>
                          )}

                          <span
                            className={`ml-auto rounded-full border px-2.5 py-1 text-xs ${getStatusClasses(
                              item.status,
                            )}`}
                          >
                            {formatStatus(item.status)}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default AgentCustomerProfile;
