import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Bell, ChevronRight, Menu, Search, Settings } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const AdminHeader = () => {
  const { user } = useAuth();
  const location = useLocation();

  const getPageTitle = () => {
    if (location.pathname === "/admin") {
      return "Dashboard";
    }

    if (location.pathname.startsWith("/admin/users")) {
      return "Users";
    }

    if (location.pathname.startsWith("/admin/tickets")) {
      return "Tickets";
    }

    if (location.pathname.startsWith("/admin/agents")) {
      return "Agents";
    }

    if (location.pathname.startsWith("/admin/knowledge-base")) {
      return "Knowledge Base";
    }

    if (location.pathname.startsWith("/admin/canned-responses")) {
      return "Canned Responses";
    }

    if (location.pathname.startsWith("/admin/sla")) {
      return "SLA Management";
    }

    if (location.pathname.startsWith("/admin/analytics")) {
      return "Analytics";
    }

    if (location.pathname.startsWith("/admin/audit-logs")) {
      return "Audit Logs";
    }

    if (location.pathname.startsWith("/admin/settings")) {
      return "Settings";
    }

    return "Admin";
  };

  const getInitials = () => {
    if (!user?.name) return "AD";

    return user.name
      .split(" ")
      .map((name) => name[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <header className="sticky top-0 z-30 h-[72px] border-b border-slate-800 bg-[#050b18]/95 backdrop-blur-xl">
      <div className="flex h-full items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left */}
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            className="rounded-xl border border-slate-800 bg-slate-900 p-2 text-slate-400 transition hover:border-slate-700 hover:text-white lg:hidden"
            title="Open menu"
            onClick={() => {
              window.dispatchEvent(new CustomEvent("admin:open-sidebar"));
            }}
          >
            <Menu size={18} />
          </button>

          <div className="hidden items-center gap-2 text-sm text-slate-600 sm:flex">
            <span>Admin</span>
            <ChevronRight size={14} />
          </div>

          <h1 className="truncate text-sm font-semibold text-white sm:text-base">
            {getPageTitle()}
          </h1>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            className="hidden rounded-xl border border-slate-800 bg-slate-900 p-2.5 text-slate-500 transition hover:border-slate-700 hover:text-white sm:block"
            title="Search"
          >
            <Search size={18} />
          </button>

          <button
            type="button"
            className="relative rounded-xl border border-slate-800 bg-slate-900 p-2.5 text-slate-400 transition hover:border-slate-700 hover:text-white"
            title="Notifications"
          >
            <Bell size={18} />

            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-blue-500" />
          </button>

          <Link
            to="/admin/settings"
            className="hidden rounded-xl border border-slate-800 bg-slate-900 p-2.5 text-slate-500 transition hover:border-slate-700 hover:text-white sm:block"
            title="Settings"
          >
            <Settings size={18} />
          </Link>

          <div className="hidden h-8 w-px bg-slate-800 sm:block" />

          <div className="hidden text-right md:block">
            <p className="text-sm font-medium text-white">
              {user?.name || "Administrator"}
            </p>

            <p className="text-[11px] capitalize text-slate-500">
              {user?.role || "admin"}
            </p>
          </div>

          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-xs font-bold text-white">
            {getInitials()}
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
