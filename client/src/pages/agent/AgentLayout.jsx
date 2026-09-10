import { useState } from "react";
import { Outlet, Link, useNavigate } from "react-router-dom";
import { Menu, Search, Bell, Zap, Circle, X } from "lucide-react";
import AgentSidebar from "./AgentSidebar";

const AgentLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const navigate = useNavigate();

  // =========================================================
  // SEARCH TICKETS
  // =========================================================
  const handleSearch = (e) => {
    e.preventDefault();

    const query = searchQuery.trim();

    if (!query) {
      navigate("/agent/queue");
      return;
    }

    navigate(`/agent/queue?search=${encodeURIComponent(query)}`);
    setSearchOpen(false);
  };

  // =========================================================
  // CLEAR SEARCH
  // =========================================================
  const clearSearch = () => {
    setSearchQuery("");
    navigate("/agent/queue");
    setSearchOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#050b18] text-slate-100">
      <div className="flex min-h-screen">
        {/* =========================================================
            MOBILE OVERLAY
        ========================================================= */}
        {sidebarOpen && (
          <button
            type="button"
            aria-label="Close sidebar"
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          />
        )}

        {/* =========================================================
            SIDEBAR
        ========================================================= */}
        <AgentSidebar
          mobileOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* =========================================================
            MAIN AREA
        ========================================================= */}
        <div className="flex min-w-0 flex-1 flex-col lg:pl-0">
          {/* =======================================================
              TOP HEADER
          ======================================================= */}
          <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-[#050b18]/95 backdrop-blur-xl">
            <div className="flex h-[110px] items-center justify-between px-4 sm:px-6 lg:px-10">
              {/* ===================================================
                  LEFT
              =================================================== */}
              <div className="flex min-w-0 items-center gap-4">
                <button
                  type="button"
                  onClick={() => setSidebarOpen(true)}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/70 text-slate-300 transition hover:border-blue-500/40 hover:text-white lg:hidden"
                >
                  <Menu size={21} />
                </button>

                <div className="min-w-0">
                  <div className="flex items-center gap-3">
                    <h1 className="truncate text-xl font-semibold tracking-tight text-white sm:text-2xl">
                      Agent Operations
                    </h1>

                    <span className="hidden items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400 sm:flex">
                      <Circle
                        size={7}
                        fill="currentColor"
                        className="text-emerald-400"
                      />
                      Live
                    </span>
                  </div>

                  <p className="mt-1 hidden text-sm text-slate-500 sm:block">
                    Manage tickets, customers and support conversations
                  </p>
                </div>
              </div>

              {/* ===================================================
                  RIGHT
              =================================================== */}
              <div className="flex items-center gap-2 sm:gap-3">
                {/* =================================================
                    SEARCH
                ================================================= */}

                {searchOpen ? (
                  <form
                    onSubmit={handleSearch}
                    className="hidden h-12 items-center gap-2 rounded-2xl border border-blue-500/40 bg-slate-900/90 px-3 shadow-lg shadow-blue-500/5 md:flex"
                  >
                    <Search size={19} className="shrink-0 text-slate-500" />

                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      autoFocus
                      placeholder="Search tickets..."
                      className="w-44 bg-transparent text-sm text-white outline-none placeholder:text-slate-600 lg:w-56"
                    />

                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery("")}
                        className="text-slate-500 transition hover:text-white"
                      >
                        <X size={17} />
                      </button>
                    )}

                    <button
                      type="submit"
                      className="rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-500"
                    >
                      Search
                    </button>
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={() => setSearchOpen(true)}
                    className="hidden h-12 items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/70 px-4 text-slate-500 transition hover:border-blue-500/30 hover:text-slate-300 md:flex"
                  >
                    <Search size={20} />
                    <span className="text-sm">Search tickets</span>
                  </button>
                )}

                {/* =================================================
                    NOTIFICATIONS
                ================================================= */}
                <button
                  type="button"
                  className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/70 text-slate-400 transition hover:border-blue-500/30 hover:text-white"
                >
                  <Bell size={20} />

                  <span className="absolute -right-1 -top-1 flex h-6 min-w-6 items-center justify-center rounded-full border-2 border-[#050b18] bg-blue-600 px-1 text-[11px] font-bold text-white">
                    5
                  </span>
                </button>

                {/* =================================================
                    ACTION
                ================================================= */}
                <Link
                  to="/agent/queue"
                  className="hidden h-12 items-center gap-2 rounded-2xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500 sm:flex"
                >
                  <Zap size={19} />
                  Handle Tickets
                </Link>
              </div>
            </div>
          </header>

          {/* =======================================================
              PAGE CONTENT
          ======================================================= */}
          <main className="flex-1">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

export default AgentLayout;
