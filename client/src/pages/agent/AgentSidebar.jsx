import {
  Bot,
  ChevronRight,
  ClipboardList,
  LayoutDashboard,
  Settings,
  Ticket,
  UserRound,
  X,
} from "lucide-react";

import { NavLink, Link } from "react-router-dom";

const AgentSidebar = ({ mobileOpen = false, onClose = () => {} }) => {
  const workspaceItems = [
    {
      label: "Overview",
      path: "/agent",
      icon: LayoutDashboard,
      end: true,
    },
    {
      label: "Ticket Queue",
      path: "/agent/queue",
      icon: Ticket,
      end: true,
    },
    {
      label: "My Tickets",
      path: "/agent/my-tickets",
      icon: ClipboardList,
      end: true,
    },
  ];

  const renderNavItem = (item) => {
    const Icon = item.icon;

    return (
      <NavLink
        key={item.label}
        to={item.path}
        end={item.end}
        onClick={onClose}
        className={({ isActive }) =>
          [
            "group flex items-center gap-4 rounded-2xl px-4 py-3.5",
            "text-[15px] transition-all duration-200",
            isActive
              ? "bg-blue-600/15 text-blue-400 shadow-[inset_0_0_0_1px_rgba(37,99,235,0.18)]"
              : "text-slate-500 hover:bg-slate-900/70 hover:text-slate-200",
          ].join(" ")
        }
      >
        {({ isActive }) => (
          <>
            <Icon
              size={21}
              strokeWidth={isActive ? 2.2 : 1.8}
              className={
                isActive
                  ? "text-blue-400"
                  : "text-slate-500 group-hover:text-slate-300"
              }
            />

            <span className="flex-1">{item.label}</span>

            {isActive && (
              <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
            )}
          </>
        )}
      </NavLink>
    );
  };

  return (
    <aside
      className={[
        "fixed inset-y-0 left-0 z-50 flex w-[356px]",
        "-translate-x-full flex-col",
        "border-r border-slate-800/80 bg-[#07101f]",
        "transition-transform duration-300",
        "lg:sticky lg:top-0 lg:h-screen lg:translate-x-0",
        mobileOpen ? "translate-x-0" : "",
      ].join(" ")}
    >
      {/* =========================================================
          BRAND
      ========================================================= */}
      <div className="flex h-[110px] shrink-0 items-center justify-between border-b border-slate-800/80 px-6">
        <div className="flex items-center gap-4">
          <div className="flex h-[58px] w-[58px] items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-600/20">
            <Bot size={29} strokeWidth={2} className="text-white" />
          </div>

          <div>
            <h2 className="text-xl font-bold tracking-tight text-white">
              SupportAI
            </h2>

            <p className="mt-0.5 text-sm text-slate-500">Agent Platform</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-900 hover:text-white lg:hidden"
        >
          <X size={20} />
        </button>
      </div>

      {/* =========================================================
          NAVIGATION
      ========================================================= */}
      <div className="flex-1 overflow-y-auto px-3 py-7 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-700">
        <div className="mb-8">
          <p className="mb-4 px-4 text-[12px] font-semibold uppercase tracking-[0.22em] text-slate-600">
            Workspace
          </p>

          <nav className="space-y-1.5">{workspaceItems.map(renderNavItem)}</nav>
        </div>

        {/* =======================================================
            QUICK ACCESS
        ======================================================= */}
        <div>
          <p className="mb-4 px-4 text-[12px] font-semibold uppercase tracking-[0.22em] text-slate-600">
            Quick Access
          </p>

          <nav className="space-y-1.5">
            <NavLink
              to="/agent/my-tickets"
              onClick={onClose}
              className="group flex items-center gap-4 rounded-2xl px-4 py-3.5 text-[15px] text-slate-500 transition hover:bg-slate-900/70 hover:text-slate-200"
            >
              <Ticket
                size={21}
                strokeWidth={1.8}
                className="text-slate-500 transition group-hover:text-blue-400"
              />

              <span className="flex-1">Open Tickets</span>

              <ChevronRight
                size={17}
                className="text-slate-700 transition group-hover:translate-x-0.5 group-hover:text-slate-400"
              />
            </NavLink>

            <NavLink
              to="/agent/assigned-tickets"
              onClick={onClose}
              className="group flex items-center gap-4 rounded-2xl px-4 py-3.5 text-[15px] text-slate-500 transition hover:bg-slate-900/70 hover:text-slate-200"
            >
              <ClipboardList
                size={21}
                strokeWidth={1.8}
                className="text-slate-500 transition group-hover:text-blue-400"
              />

              <span className="flex-1">Assigned Tickets</span>

              <ChevronRight
                size={17}
                className="text-slate-700 transition group-hover:translate-x-0.5 group-hover:text-slate-400"
              />
            </NavLink>
          </nav>
        </div>
      </div>

      {/* =========================================================
          AGENT PROFILE
      ========================================================= */}
      <div className="shrink-0 border-t border-slate-800/80 p-4">
        <div className="flex items-center gap-3 rounded-2xl bg-slate-900/55 p-3.5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-600/20 text-blue-400 ring-1 ring-blue-500/20">
            <UserRound size={22} />
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">Agent</p>

            <p className="truncate text-xs text-slate-500">
              support@supportai.com
            </p>
          </div>

          <Link
            to="/agent/profile"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-800 hover:text-white"
            title="Profile Settings"
          >
            <Settings size={18} />
          </Link>
        </div>
      </div>
    </aside>
  );
};

export default AgentSidebar;
