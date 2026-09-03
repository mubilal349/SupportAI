import {
  BarChart3,
  BookOpen,
  Bot,
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

  const [mobileSidebar, setMobileSidebar] = useState(false);

  /*
   * These can later come from SupportContext.
   * For now they keep the sidebar working independently.
   */
  const activeChats = 0;
  const openTickets = 0;

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

  // Get avtar URL function
  const getAvatarUrl = (avatar) => {
    if (!avatar) return "";

    if (avatar.startsWith("http://") || avatar.startsWith("https://")) {
      return avatar;
    }

    return `http://localhost:8000${
      avatar.startsWith("/") ? avatar : `/${avatar}`
    }`;
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
          fixed inset-y-0 left-0 z-50 flex w-64 flex-col
          border-r border-slate-800/80 bg-[#07101f]
          transition-transform duration-300
          lg:translate-x-0
          ${mobileSidebar ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* =================================================
            LOGO
        ================================================= */}

        <div className="flex h-20 items-center justify-between border-b border-slate-800/80 px-5">
          <Link
            to="/support"
            className="flex items-center gap-3"
            onClick={() => setMobileSidebar(false)}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-600/20">
              <Bot className="h-5 w-5" />
            </div>

            <div>
              <h1 className="text-sm font-bold tracking-wide">SupportAI</h1>

              <p className="text-[11px] text-slate-500">Customer Platform</p>
            </div>
          </Link>

          <button
            type="button"
            onClick={() => setMobileSidebar(false)}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-800 hover:text-white lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* =================================================
            NAVIGATION
        ================================================= */}

        <div className="flex-1 overflow-y-auto px-3 py-6">
          <p className="px-3 pb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">
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
                  className={`
                    group flex items-center gap-3 rounded-xl px-3 py-2.5
                    text-sm transition

                    ${
                      active
                        ? "bg-blue-600/15 text-blue-400 ring-1 ring-blue-500/10"
                        : "text-slate-500 hover:bg-slate-900 hover:text-slate-200"
                    }
                  `}
                >
                  <Icon
                    className={`h-4 w-4 ${
                      active
                        ? "text-blue-400"
                        : "text-slate-600 group-hover:text-slate-300"
                    }`}
                  />

                  <span className="flex-1">{item.name}</span>

                  {item.badge > 0 && (
                    <span
                      className={`
                        min-w-5 rounded-full px-1.5 py-0.5
                        text-center text-[10px] font-bold

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

          <p className="mt-8 px-3 pb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">
            AI Tools
          </p>

          <div className="space-y-1">
            <Link
              to="/support/chat"
              onClick={() => setMobileSidebar(false)}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-500 transition hover:bg-slate-900 hover:text-slate-200"
            >
              <Sparkles className="h-4 w-4 text-purple-400" />

              <span className="flex-1">Ask AI</span>

              <ChevronRight className="h-4 w-4 text-slate-700" />
            </Link>

            <Link
              to="/support/help"
              onClick={() => setMobileSidebar(false)}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-500 transition hover:bg-slate-900 hover:text-slate-200"
            >
              <BookOpen className="h-4 w-4 text-blue-400" />

              <span className="flex-1">Help Center</span>

              <ChevronRight className="h-4 w-4 text-slate-700" />
            </Link>
          </div>
        </div>

        {/* =================================================
            USER
        ================================================= */}

        <div className="border-t border-slate-800/80 p-4">
          <div className="flex items-center gap-3 rounded-xl bg-slate-900/50 p-3">
            {/* User Avatar */}
            <div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-600/20 text-blue-400">
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
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">
                {user?.name || "Customer"}
              </p>

              <p className="truncate text-xs text-slate-500">
                {user?.email || "Customer account"}
              </p>
            </div>

            {/* Settings / Profile Button */}
            <Link
              to="/support/profile"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-all duration-200 hover:bg-slate-800 hover:text-white"
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

      <main className="min-h-screen lg:pl-64">
        {/* MOBILE HEADER */}

        <div className="sticky top-0 z-30 flex h-16 items-center border-b border-slate-800/80 bg-[#050b18]/95 px-4 backdrop-blur lg:hidden">
          <button
            type="button"
            onClick={() => setMobileSidebar(true)}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <Bot className="h-5 w-5" />
          </button>

          <span className="ml-3 text-sm font-semibold">SupportAI</span>
        </div>

        {/* PAGE CHANGES HERE */}

        <Outlet />
      </main>
    </div>
  );
};

export default SupportLayout;
