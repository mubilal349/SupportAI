import {
  BarChart3,
  BookOpen,
  Bot,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  MessageSquare,
  Sparkles,
  Ticket,
  X,
  Settings,
} from "lucide-react";

import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useState } from "react";

import { useAuth } from "../../context/AuthContext";

const SupportLayout = () => {
  const { user } = useAuth();
  const location = useLocation();

  // ============================================================
  // SIDEBAR STATE
  // ============================================================

  const [mobileSidebar, setMobileSidebar] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  /*
   * These can later come from SupportContext.
   * For now they keep the sidebar working independently.
   */
  const activeChats = 0;
  const openTickets = 0;

  // ============================================================
  // NAVIGATION
  // ============================================================

  const navigation = [
    {
      name: "Overview",
      path: "/support",
      icon: LayoutDashboard,
    },
    {
      name: "Conversations",
      path: "/support/conversations",
      icon: MessageSquare,
      badge: activeChats,
    },
    {
      name: "My Tickets",
      path: "/support/tickets",
      icon: Ticket,
      badge: openTickets,
    },
    {
      name: "AI Support",
      path: "/support/chat",
      icon: Bot,
    },
    {
      name: "Knowledge Base",
      path: "/support/knowledge-base",
      icon: BookOpen,
    },
    {
      name: "Analytics",
      path: "/support/analytics",
      icon: BarChart3,
    },
  ];

  // ============================================================
  // AVATAR URL
  // ============================================================

  const getAvatarUrl = (avatar) => {
    if (!avatar) return "";

    if (avatar.startsWith("http://") || avatar.startsWith("https://")) {
      return avatar;
    }

    return `http://localhost:8000${
      avatar.startsWith("/") ? avatar : `/${avatar}`
    }`;
  };

  // ============================================================
  // TOGGLE SIDEBAR
  // ============================================================

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => !prev);
  };

  return (
    <div className="min-h-screen bg-[#050b18] text-white">
      {/* =====================================================
          MOBILE OVERLAY
      ===================================================== */}

      {mobileSidebar && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setMobileSidebar(false)}
        />
      )}

      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50 flex flex-col
          border-r border-slate-800/80 bg-[#07101f]
          transition-all duration-300 ease-in-out

          lg:translate-x-0

          ${sidebarCollapsed ? "lg:w-20" : "lg:w-64"}

          ${mobileSidebar ? "translate-x-0 w-64" : "-translate-x-full w-64"}
        `}
      >
        {/* =================================================
            LOGO
        ================================================= */}

        <div
          className={`
            flex h-20 items-center border-b border-slate-800/80
            transition-all duration-300
            ${sidebarCollapsed ? "justify-center px-3" : "justify-between px-5"}
          `}
        >
          <Link
            to="/support"
            className="flex min-w-0 items-center gap-3"
            onClick={() => setMobileSidebar(false)}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-600/20">
              <Bot className="h-5 w-5" />
            </div>

            {/* Logo Text */}
            <div
              className={`
                min-w-0 overflow-hidden whitespace-nowrap
                transition-all duration-300
                ${sidebarCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"}
              `}
            >
              <h1 className="text-sm font-bold tracking-wide">SupportAI</h1>

              <p className="text-[11px] text-slate-500">Customer Platform</p>
            </div>
          </Link>

          {/* Mobile Close */}
          <button
            type="button"
            onClick={() => setMobileSidebar(false)}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-800 hover:text-white lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* =================================================
            DESKTOP COLLAPSE BUTTON
        ================================================= */}

        <button
          type="button"
          onClick={toggleSidebar}
          className="
            absolute -right-3 top-[84px] z-50
            hidden h-7 w-7 items-center justify-center
            rounded-full border border-slate-700
            bg-[#0b1628] text-slate-400
            shadow-lg
            transition-all duration-200
            hover:border-blue-500/40
            hover:bg-blue-600
            hover:text-white
            lg:flex
          "
          title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>

        {/* =================================================
            NAVIGATION
        ================================================= */}

        <div className="flex-1 overflow-y-auto px-3 py-6">
          {/* Workspace Heading */}

          <p
            className={`
              overflow-hidden px-3 pb-3 text-[10px]
              font-semibold uppercase tracking-[0.18em]
              text-slate-600
              transition-all duration-300
              ${sidebarCollapsed ? "h-0 pb-0 opacity-0" : "h-auto opacity-100"}
            `}
          >
            Workspace
          </p>

          <nav className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;

              const active =
                item.path === "/support"
                  ? location.pathname === "/support"
                  : location.pathname.startsWith(item.path);

              return (
                <NavLink
                  key={item.name}
                  to={item.path}
                  onClick={() => setMobileSidebar(false)}
                  title={sidebarCollapsed ? item.name : undefined}
                  className={`
                    group flex items-center rounded-xl
                    py-2.5 text-sm transition-all duration-200

                    ${sidebarCollapsed ? "justify-center px-2" : "gap-3 px-3"}

                    ${
                      active
                        ? "bg-blue-600/15 text-blue-400 ring-1 ring-blue-500/10"
                        : "text-slate-500 hover:bg-slate-900 hover:text-slate-200"
                    }
                  `}
                >
                  {/* Icon */}

                  <Icon
                    className={`
                      h-4 w-4 shrink-0 transition-colors
                      ${
                        active
                          ? "text-blue-400"
                          : "text-slate-600 group-hover:text-slate-300"
                      }
                    `}
                  />

                  {/* Label */}

                  <span
                    className={`
                      min-w-0 flex-1 overflow-hidden whitespace-nowrap
                      transition-all duration-300
                      ${
                        sidebarCollapsed
                          ? "hidden w-0 opacity-0"
                          : "block w-auto opacity-100"
                      }
                    `}
                  >
                    {item.name}
                  </span>

                  {/* Badge */}

                  {item.badge > 0 && (
                    <span
                      className={`
                        min-w-5 rounded-full px-1.5 py-0.5
                        text-center text-[10px] font-bold
                        transition-all duration-300

                        ${sidebarCollapsed ? "hidden" : "inline-block"}

                        ${
                          active
                            ? "bg-blue-500/20 text-blue-400"
                            : "bg-slate-800 text-slate-500"
                        }
                      `}
                    >
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* =================================================
              AI TOOLS
          ================================================= */}

          <p
            className={`
              mt-8 overflow-hidden px-3 pb-3 text-[10px]
              font-semibold uppercase tracking-[0.18em]
              text-slate-600
              transition-all duration-300
              ${sidebarCollapsed ? "h-0 pb-0 opacity-0" : "h-auto opacity-100"}
            `}
          >
            AI Tools
          </p>

          <div className="space-y-1">
            {/* Ask AI */}

            <Link
              to="/support/chat"
              onClick={() => setMobileSidebar(false)}
              title={sidebarCollapsed ? "Ask AI" : undefined}
              className={`
                flex items-center rounded-xl
                py-2.5 text-sm text-slate-500
                transition-all duration-200
                hover:bg-slate-900 hover:text-slate-200

                ${sidebarCollapsed ? "justify-center px-2" : "gap-3 px-3"}
              `}
            >
              <Sparkles className="h-4 w-4 shrink-0 text-purple-400" />

              <span
                className={`
                  flex-1 overflow-hidden whitespace-nowrap
                  transition-all duration-300
                  ${
                    sidebarCollapsed
                      ? "hidden w-0 opacity-0"
                      : "block w-auto opacity-100"
                  }
                `}
              >
                Ask AI
              </span>

              {!sidebarCollapsed && (
                <ChevronRight className="h-4 w-4 text-slate-700" />
              )}
            </Link>

            {/* Help Center */}

            <Link
              to="/support/help"
              onClick={() => setMobileSidebar(false)}
              title={sidebarCollapsed ? "Help Center" : undefined}
              className={`
                flex items-center rounded-xl
                py-2.5 text-sm text-slate-500
                transition-all duration-200
                hover:bg-slate-900 hover:text-slate-200

                ${sidebarCollapsed ? "justify-center px-2" : "gap-3 px-3"}
              `}
            >
              <BookOpen className="h-4 w-4 shrink-0 text-blue-400" />

              <span
                className={`
                  flex-1 overflow-hidden whitespace-nowrap
                  transition-all duration-300
                  ${
                    sidebarCollapsed
                      ? "hidden w-0 opacity-0"
                      : "block w-auto opacity-100"
                  }
                `}
              >
                Help Center
              </span>

              {!sidebarCollapsed && (
                <ChevronRight className="h-4 w-4 text-slate-700" />
              )}
            </Link>
          </div>
        </div>

        {/* =================================================
            USER
        ================================================= */}

        <div className="border-t border-slate-800/80 p-3">
          <div
            className={`
              flex items-center rounded-xl
              bg-slate-900/50
              transition-all duration-300

              ${sidebarCollapsed ? "justify-center p-2" : "gap-3 p-3"}
            `}
          >
            {/* User Avatar */}

            <div
              className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-600/20 text-blue-400"
              title={sidebarCollapsed ? user?.name || "Customer" : undefined}
            >
              {user?.avatar ? (
                <img
                  src={getAvatarUrl(user.avatar)}
                  alt={user?.name || "User"}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                <span className="text-sm font-bold">
                  {user?.name?.charAt(0)?.toUpperCase() || "U"}
                </span>
              )}
            </div>

            {/* User Information */}

            <div
              className={`
                min-w-0 flex-1 overflow-hidden
                transition-all duration-300
                ${
                  sidebarCollapsed
                    ? "hidden w-0 opacity-0"
                    : "block w-auto opacity-100"
                }
              `}
            >
              <p className="truncate text-sm font-medium text-white">
                {user?.name || "Customer"}
              </p>

              <p className="truncate text-xs text-slate-500">
                {user?.email || "Customer account"}
              </p>
            </div>

            {/* Settings */}

            <Link
              to="/support/profile"
              className={`
                flex h-9 w-9 shrink-0 items-center justify-center
                rounded-lg text-slate-500
                transition-all duration-200
                hover:bg-slate-800 hover:text-white
                ${sidebarCollapsed ? "hidden" : "flex"}
              `}
              title="Profile Settings"
              aria-label="Open profile settings"
            >
              <Settings className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </aside>

      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <main
        className={`
          min-h-screen transition-[padding] duration-300
          ${sidebarCollapsed ? "lg:pl-20" : "lg:pl-64"}
        `}
      >
        {/* =================================================
            MOBILE HEADER
        ================================================= */}

        <div className="sticky top-0 z-30 flex h-16 items-center border-b border-slate-800/80 bg-[#050b18]/95 px-4 backdrop-blur lg:hidden">
          <button
            type="button"
            onClick={() => setMobileSidebar(true)}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
            aria-label="Open sidebar"
          >
            <Bot className="h-5 w-5" />
          </button>

          <span className="ml-3 text-sm font-semibold">SupportAI</span>
        </div>

        {/* =================================================
            PAGE CONTENT
        ================================================= */}

        <Outlet />
      </main>
    </div>
  );
};

export default SupportLayout;
