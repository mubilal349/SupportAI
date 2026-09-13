import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

import {
  Activity,
  BarChart3,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock3,
  LayoutDashboard,
  MessageSquare,
  Menu,
  Settings,
  ShieldCheck,
  Ticket,
  Users,
  X,
  LogOut,
} from "lucide-react";

const AdminSidebar = () => {
  const { logout } = useAuth();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // ============================================================
  // MENU ITEMS
  // ============================================================

  const menuItems = [
    {
      label: "Dashboard",
      path: "/admin",
      icon: LayoutDashboard,
    },
    {
      label: "Users",
      path: "/admin/users",
      icon: Users,
    },
    {
      label: "Tickets",
      path: "/admin/tickets",
      icon: Ticket,
    },
    {
      label: "Agents",
      path: "/admin/agents",
      icon: ShieldCheck,
    },
    {
      label: "Knowledge Base",
      path: "/admin/knowledge-base",
      icon: BookOpen,
    },
    {
      label: "Canned Responses",
      path: "/admin/canned-responses",
      icon: MessageSquare,
    },
    {
      label: "SLA Management",
      path: "/admin/sla",
      icon: Clock3,
    },
    {
      label: "Analytics",
      path: "/admin/analytics",
      icon: BarChart3,
    },
    {
      label: "Audit Logs",
      path: "/admin/audit-logs",
      icon: ClipboardList,
    },
    {
      label: "Settings",
      path: "/admin/settings",
      icon: Settings,
    },
  ];

  // ============================================================
  // OPEN MOBILE SIDEBAR FROM HEADER
  // ============================================================

  useEffect(() => {
    const handleOpenSidebar = () => {
      setMobileOpen(true);
    };

    window.addEventListener("admin:open-sidebar", handleOpenSidebar);

    return () => {
      window.removeEventListener("admin:open-sidebar", handleOpenSidebar);
    };
  }, []);

  // ============================================================
  // CLOSE MOBILE SIDEBAR ON DESKTOP RESIZE
  // ============================================================

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // ============================================================
  // PREVENT BODY SCROLL WHEN MOBILE SIDEBAR IS OPEN
  // ============================================================

  useEffect(() => {
    if (mobileOpen && window.innerWidth < 1024) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  // ============================================================
  // CLOSE MOBILE SIDEBAR
  // ============================================================

  const closeMobileSidebar = () => {
    setMobileOpen(false);
  };

  // ============================================================
  // LOGOUT HANDLER
  // ============================================================

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("ADMIN LOGOUT ERROR:", error);
    }
  };

  return (
    <>
      {/* ======================================================
          MOBILE OVERLAY
      ====================================================== */}

      {mobileOpen && (
        <button
          type="button"
          aria-label="Close admin sidebar"
          onClick={closeMobileSidebar}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* ======================================================
          MOBILE SIDEBAR
      ====================================================== */}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[280px] max-w-[85vw] flex-col border-r border-slate-800 bg-[#050b18] shadow-2xl transition-transform duration-300 ease-out lg:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <SidebarContent
          menuItems={menuItems}
          collapsed={false}
          mobile
          onClose={closeMobileSidebar}
          logout={handleLogout}
        />
      </aside>

      {/* ======================================================
          DESKTOP SIDEBAR
      ====================================================== */}

      <aside
        className={`fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-slate-800 bg-[#050b18] transition-all duration-300 lg:flex ${
          collapsed ? "w-20" : "w-64"
        }`}
      >
        <SidebarContent
          menuItems={menuItems}
          collapsed={collapsed}
          logout={handleLogout}
        />

        {/* ====================================================
            COLLAPSE / EXPAND BUTTON
        ==================================================== */}

        <button
          type="button"
          onClick={() => setCollapsed((previous) => !previous)}
          className="absolute -right-3 top-24 flex h-7 w-7 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-slate-400 shadow-lg transition hover:border-slate-600 hover:text-white"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </aside>

      {/* ======================================================
          MOBILE MENU BUTTON
      ====================================================== */}

      {!mobileOpen && (
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="fixed bottom-5 left-5 z-30 flex h-11 w-11 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-300 shadow-xl transition hover:border-slate-700 hover:bg-slate-800 hover:text-white lg:hidden"
          aria-label="Open admin menu"
          title="Open admin menu"
        >
          <Menu size={19} />
        </button>
      )}
    </>
  );
};

// ============================================================
// SIDEBAR CONTENT
// ============================================================

const SidebarContent = ({
  menuItems,
  collapsed,
  mobile = false,
  onClose,
  logout,
}) => {
  return (
    <>
      {/* ======================================================
          BRAND HEADER
      ====================================================== */}

      <div
        className={`flex h-[72px] shrink-0 items-center border-b border-slate-800 ${
          collapsed ? "justify-center px-3" : "justify-between px-5"
        }`}
      >
        <div className="flex min-w-0 items-center gap-3">
          {/* Logo */}
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
            <MessageSquare size={19} />
          </div>

          {/* Brand Text */}
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-white">SupportAI</p>

              <p className="truncate text-[11px] text-slate-500">
                Admin Control Center
              </p>
            </div>
          )}
        </div>

        {/* Mobile Close */}
        {mobile && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-800 hover:text-white"
            aria-label="Close admin menu"
            title="Close menu"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* ======================================================
          NAVIGATION
      ====================================================== */}

      <div className="flex-1 overflow-y-auto px-3 py-5">
        {!collapsed && (
          <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">
            Administration
          </p>
        )}

        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/admin"}
                onClick={mobile ? onClose : undefined}
                title={collapsed ? item.label : undefined}
                className={({ isActive }) =>
                  `group flex items-center rounded-xl py-2.5 text-sm font-medium transition ${
                    collapsed ? "justify-center px-2" : "gap-3 px-3"
                  } ${
                    isActive
                      ? "bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/10"
                      : "text-slate-500 hover:bg-slate-900 hover:text-slate-200"
                  }`
                }
              >
                <Icon size={18} className="shrink-0" />

                {!collapsed && <span className="truncate">{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* ======================================================
          BOTTOM SECTION
      ====================================================== */}

      <div className="border-t border-slate-800 p-3">
        {/* ====================================================
            SYSTEM STATUS
        ==================================================== */}

        <div
          className={`rounded-xl border border-slate-800 bg-slate-900/60 ${
            collapsed ? "p-2" : "p-3"
          }`}
        >
          <div
            className={`flex items-center ${
              collapsed ? "justify-center" : "gap-3"
            }`}
          >
            {/* Online Indicator */}
            <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/40" />

            {!collapsed && (
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-300">
                  System Online
                </p>

                <p className="mt-0.5 truncate text-[10px] text-slate-600">
                  All services operational
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ====================================================
            LOGOUT
        ==================================================== */}

        <div className={`mt-3 ${collapsed ? "flex justify-center" : ""}`}>
          <button
            type="button"
            onClick={logout}
            className={`group flex rounded-xl border border-slate-800 text-sm text-slate-400 transition hover:border-red-500/30 hover:bg-red-500/5 hover:text-red-400 ${
              collapsed
                ? "h-10 w-10 items-center justify-center px-0"
                : "w-full items-center justify-center gap-2 px-4 py-2.5"
            }`}
            title={collapsed ? "Sign out" : undefined}
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4 shrink-0 transition group-hover:text-red-400" />

            {!collapsed && <span>Sign out</span>}
          </button>
        </div>
      </div>
    </>
  );
};

export default AdminSidebar;
