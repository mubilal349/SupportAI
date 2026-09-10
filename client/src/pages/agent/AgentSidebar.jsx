import { useEffect, useRef, useState } from "react";
import {
  Bot,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Circle,
  LayoutDashboard,
  Loader2,
  Settings,
  ShieldAlert,
  Ticket,
  UserRound,
  X,
} from "lucide-react";

import { Link, NavLink } from "react-router-dom";

import {
  getAgentAvailability,
  updateAgentAvailability,
} from "../../services/agentService";

const availabilityOptions = [
  {
    value: "online",
    label: "Online",
    description: "Ready for tickets",
  },
  {
    value: "away",
    label: "Away",
    description: "Temporarily unavailable",
  },
  {
    value: "busy",
    label: "Busy",
    description: "Handling a high workload",
  },
  {
    value: "offline",
    label: "Offline",
    description: "Not accepting tickets",
  },
];

const availabilityStyles = {
  online: {
    dot: "bg-emerald-400",
    text: "text-emerald-400",
  },
  away: {
    dot: "bg-amber-400",
    text: "text-amber-400",
  },
  busy: {
    dot: "bg-red-400",
    text: "text-red-400",
  },
  offline: {
    dot: "bg-slate-500",
    text: "text-slate-400",
  },
};

const workspaceItems = [
  {
    label: "Overview",
    to: "/agent",
    icon: LayoutDashboard,
    end: true,
  },
  {
    label: "Ticket Queue",
    to: "/agent/queue",
    icon: Ticket,
    end: true,
  },
  {
    label: "My Tickets",
    to: "/agent/my-tickets",
    icon: ClipboardList,
    end: true,
  },
  {
    label: "Escalated Tickets",
    to: "/agent/escalated",
    icon: ShieldAlert,
    end: true,
  },
];

const quickAccessItems = [
  {
    label: "Open Tickets",
    to: "/agent/my-tickets",
    icon: Ticket,
  },
  {
    label: "Assigned Tickets",
    to: "/agent/assigned-tickets",
    icon: ClipboardList,
  },
];

function getInitials(name = "") {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || "A"
  );
}

export default function AgentSidebar({
  mobileOpen = false,
  onClose = () => {},
  user = null,
}) {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem("agent_sidebar_collapsed") === "true";
    } catch {
      return false;
    }
  });

  const [availability, setAvailability] = useState(
    user?.availability || "offline",
  );

  const [availabilityOpen, setAvailabilityOpen] = useState(false);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);

  const availabilityRef = useRef(null);

  /*
   * =======================================================
   * SAVE COLLAPSED STATE
   * =======================================================
   */

  useEffect(() => {
    try {
      localStorage.setItem("agent_sidebar_collapsed", String(collapsed));
    } catch {
      // Ignore localStorage errors
    }
  }, [collapsed]);

  /*
   * =======================================================
   * LOAD AVAILABILITY
   * =======================================================
   */

  useEffect(() => {
    let mounted = true;

    const loadAvailability = async () => {
      try {
        const response = await getAgentAvailability();

        if (!mounted) return;

        if (response?.availability) {
          setAvailability(response.availability);
        }
      } catch (error) {
        console.error("Failed to load agent availability:", error);
      }
    };

    loadAvailability();

    return () => {
      mounted = false;
    };
  }, []);

  /*
   * =======================================================
   * CLOSE AVAILABILITY DROPDOWN WHEN CLICKING OUTSIDE
   * =======================================================
   */

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        availabilityRef.current &&
        !availabilityRef.current.contains(event.target)
      ) {
        setAvailabilityOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  /*
   * =======================================================
   * AVAILABILITY UPDATE
   * =======================================================
   */

  const handleAvailabilityChange = async (nextAvailability) => {
    if (nextAvailability === availability) {
      setAvailabilityOpen(false);
      return;
    }

    try {
      setAvailabilityLoading(true);

      const response = await updateAgentAvailability(nextAvailability);

      if (response?.availability) {
        setAvailability(response.availability);
      } else {
        setAvailability(nextAvailability);
      }

      setAvailabilityOpen(false);
    } catch (error) {
      console.error("Failed to update agent availability:", error);
    } finally {
      setAvailabilityLoading(false);
    }
  };

  /*
   * =======================================================
   * SIDEBAR TOGGLE
   * =======================================================
   */

  const toggleSidebar = () => {
    setCollapsed((previous) => !previous);
    setAvailabilityOpen(false);
  };

  const currentAvailability =
    availabilityStyles[availability] || availabilityStyles.offline;

  const displayName = user?.name || user?.username || "Agent";

  const email = user?.email || "";

  const initials = getInitials(displayName);

  return (
    <>
      {/* ===================================================
          MOBILE OVERLAY
      =================================================== */}

      {mobileOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={onClose}
          className="
            fixed
            inset-0
            z-40
            bg-black/60
            backdrop-blur-sm
            lg:hidden
          "
        />
      )}

      {/* ===================================================
          SIDEBAR
      =================================================== */}

      <aside
        className={`
          fixed
          left-0
          top-0
          z-50
          flex
          h-screen
          flex-col
          border-r
          border-slate-800/80
          bg-[#050b18]
          shadow-2xl
          transition-all
          duration-300
          ease-in-out

          w-[88vw]
          max-w-[356px]

          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}

          lg:sticky
          lg:top-0
          lg:z-30
          lg:h-screen
          lg:max-w-none
          lg:translate-x-0

          ${collapsed ? "lg:w-[88px]" : "lg:w-[356px]"}
        `}
      >
        {/* =================================================
            HEADER
        ================================================= */}

        <div
          className={`
            relative
            flex
            shrink-0
            border-b
            border-slate-800/80
            transition-all
            duration-300

            ${
              collapsed
                ? "min-h-[124px] flex-col items-center justify-center gap-3 px-2 py-4"
                : "min-h-[96px] items-center justify-between gap-3 px-5 py-4"
            }
          `}
        >
          {/* -----------------------------------------------
              BRAND
          ------------------------------------------------ */}

          <Link
            to="/agent"
            onClick={() => {
              onClose();
              setAvailabilityOpen(false);
            }}
            className={`
              flex
              shrink-0
              items-center
              transition-all
              duration-300

              ${collapsed ? "justify-center" : "min-w-0 gap-3"}
            `}
          >
            {/* LOGO */}
            <div
              className="
                flex
                h-10
                w-10
                shrink-0
                items-center
                justify-center
                rounded-xl
                bg-gradient-to-br
                from-blue-500
                to-indigo-600
                shadow-lg
                shadow-blue-500/20
              "
            >
              <Bot size={22} className="text-white" />
            </div>

            {/* BRAND TEXT */}
            {!collapsed && (
              <div className="min-w-0">
                <h1
                  className="
                    truncate
                    text-sm
                    font-bold
                    tracking-wide
                    text-white
                  "
                >
                  SupportAI
                </h1>

                <p
                  className="
                    truncate
                    text-xs
                    text-slate-500
                  "
                >
                  Agent Platform
                </p>
              </div>
            )}
          </Link>

          {/* -----------------------------------------------
              AVAILABILITY
          ------------------------------------------------ */}

          <div ref={availabilityRef} className="relative shrink-0">
            <button
              type="button"
              onClick={() => setAvailabilityOpen((previous) => !previous)}
              disabled={availabilityLoading}
              aria-label={`Availability: ${availability}`}
              title={collapsed ? `Availability: ${availability}` : undefined}
              className={`
                flex
                items-center
                rounded-xl
                border
                border-slate-800
                bg-slate-900/70
                text-slate-300
                transition-all
                duration-300
                hover:border-slate-700
                hover:bg-slate-900
                disabled:cursor-not-allowed
                disabled:opacity-60

                ${collapsed ? "h-9 w-9 justify-center p-0" : "gap-2 px-3 py-2"}
              `}
            >
              {/* STATUS DOT */}
              <span
                className={`
                  h-2.5
                  w-2.5
                  shrink-0
                  rounded-full
                  ${currentAvailability.dot}
                  ${
                    availability === "online"
                      ? "shadow-[0_0_8px_rgba(52,211,153,0.55)]"
                      : ""
                  }
                `}
              />

              {/* STATUS TEXT */}
              {!collapsed && (
                <span
                  className={`
                    text-xs
                    font-medium
                    capitalize
                    ${currentAvailability.text}
                  `}
                >
                  {availability}
                </span>
              )}

              {/* CHEVRON */}
              {!collapsed && (
                <ChevronDown
                  size={14}
                  className={`
                    transition-transform
                    duration-200
                    ${availabilityOpen ? "rotate-180" : ""}
                  `}
                />
              )}
            </button>

            {/* -------------------------------------------
                AVAILABILITY DROPDOWN
            -------------------------------------------- */}

            {availabilityOpen && (
              <div
                className={`
                  absolute
                  z-[100]
                  w-52
                  rounded-xl
                  border
                  border-slate-800
                  bg-[#0b1728]
                  p-1.5
                  shadow-2xl
                  shadow-black/40

                  ${collapsed ? "left-12 top-0" : "right-0 top-full mt-2"}
                `}
              >
                {availabilityOptions.map((option) => {
                  const optionStyle = availabilityStyles[option.value];

                  const isActive = availability === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleAvailabilityChange(option.value)}
                      disabled={availabilityLoading}
                      className="
                        flex
                        w-full
                        items-center
                        justify-between
                        rounded-lg
                        px-3
                        py-2.5
                        text-left
                        transition
                        hover:bg-slate-800/80
                        disabled:cursor-not-allowed
                        disabled:opacity-50
                      "
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`
                            h-2.5
                            w-2.5
                            rounded-full
                            ${optionStyle.dot}
                          `}
                        />

                        <div>
                          <p
                            className="
                              text-sm
                              font-medium
                              text-slate-200
                            "
                          >
                            {option.label}
                          </p>

                          <p
                            className="
                              mt-0.5
                              text-[10px]
                              text-slate-500
                            "
                          >
                            {option.description}
                          </p>
                        </div>
                      </div>

                      {isActive && (
                        <Check size={15} className="shrink-0 text-blue-400" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* -----------------------------------------------
              MOBILE CLOSE
          ------------------------------------------------ */}

          <button
            type="button"
            onClick={onClose}
            aria-label="Close sidebar"
            className="
              absolute
              right-4
              top-4
              flex
              h-9
              w-9
              items-center
              justify-center
              rounded-xl
              border
              border-slate-800
              bg-slate-900
              text-slate-400
              transition
              hover:border-slate-700
              hover:bg-slate-800
              hover:text-white
              lg:hidden
            "
          >
            <X size={18} />
          </button>
        </div>

        {/* =================================================
            NAVIGATION
        ================================================= */}

        <div
          className="
            min-h-0
            flex-1
            overflow-y-auto
            overflow-x-hidden
            px-3
            py-5
          "
        >
          {/* -----------------------------------------------
              WORKSPACE
          ------------------------------------------------ */}

          <div>
            {!collapsed && (
              <p
                className="
                  mb-3
                  px-3
                  text-[10px]
                  font-semibold
                  uppercase
                  tracking-[0.18em]
                  text-slate-600
                "
              >
                Workspace
              </p>
            )}

            <nav className="space-y-1">
              {workspaceItems.map((item) => {
                const Icon = item.icon;

                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={onClose}
                    title={collapsed ? item.label : undefined}
                    className={({ isActive }) =>
                      `
                        group
                        flex
                        h-11
                        items-center
                        rounded-xl
                        transition-all
                        duration-200

                        ${collapsed ? "justify-center px-0" : "gap-3 px-3"}

                        ${
                          isActive
                            ? "bg-blue-500/10 text-blue-400"
                            : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                        }
                      `
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon
                          size={19}
                          className={`
                            shrink-0
                            transition-colors
                            ${
                              isActive
                                ? "text-blue-400"
                                : "text-slate-500 group-hover:text-slate-300"
                            }
                          `}
                        />

                        {!collapsed && (
                          <span
                            className="
                              truncate
                              text-sm
                              font-medium
                            "
                          >
                            {item.label}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* -----------------------------------------------
              QUICK ACCESS
          ------------------------------------------------ */}

          <div className="mt-8">
            {!collapsed && (
              <p
                className="
                  mb-3
                  px-3
                  text-[10px]
                  font-semibold
                  uppercase
                  tracking-[0.18em]
                  text-slate-600
                "
              >
                Quick Access
              </p>
            )}

            <nav className="space-y-1">
              {quickAccessItems.map((item) => {
                const Icon = item.icon;

                return (
                  <NavLink
                    key={item.to + item.label}
                    to={item.to}
                    onClick={onClose}
                    title={collapsed ? item.label : undefined}
                    className={({ isActive }) =>
                      `
                        group
                        flex
                        h-11
                        items-center
                        rounded-xl
                        transition-all
                        duration-200

                        ${collapsed ? "justify-center px-0" : "gap-3 px-3"}

                        ${
                          isActive
                            ? "bg-slate-800/80 text-slate-200"
                            : "text-slate-500 hover:bg-slate-900 hover:text-slate-300"
                        }
                      `
                    }
                  >
                    <Icon
                      size={18}
                      className="
                        shrink-0
                        text-slate-500
                        transition-colors
                        group-hover:text-slate-300
                      "
                    />

                    {!collapsed && (
                      <span
                        className="
                          truncate
                          text-sm
                          font-medium
                        "
                      >
                        {item.label}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </div>
        </div>

        {/* =================================================
            PROFILE
        ================================================= */}

        <div
          className={`
            shrink-0
            border-t
            border-slate-800/80
            transition-all
            duration-300

            ${collapsed ? "flex justify-center p-3" : "p-4"}
          `}
        >
          <div
            className={`
              flex
              items-center
              ${collapsed ? "justify-center" : "gap-3"}
            `}
          >
            {/* AVATAR */}
            <div
              className="
                flex
                h-10
                w-10
                shrink-0
                items-center
                justify-center
                rounded-xl
                bg-slate-800
                text-xs
                font-semibold
                text-slate-300
                ring-1
                ring-slate-700
              "
            >
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={displayName}
                  className="
                    h-full
                    w-full
                    rounded-xl
                    object-cover
                  "
                />
              ) : (
                initials
              )}
            </div>

            {/* PROFILE DETAILS */}
            {!collapsed && (
              <>
                <div className="min-w-0 flex-1">
                  <p
                    className="
                      truncate
                      text-sm
                      font-semibold
                      text-slate-200
                    "
                  >
                    {displayName}
                  </p>

                  <p
                    className="
                      truncate
                      text-xs
                      text-slate-500
                    "
                  >
                    {email || "Support Agent"}
                  </p>
                </div>

                <Link
                  to="/agent/profile"
                  onClick={onClose}
                  title="Settings"
                  className="
                    flex
                    h-9
                    w-9
                    shrink-0
                    items-center
                    justify-center
                    rounded-lg
                    text-slate-500
                    transition
                    hover:bg-slate-800
                    hover:text-slate-200
                  "
                >
                  <Settings size={17} />
                </Link>
              </>
            )}
          </div>
        </div>

        {/* =================================================
            DESKTOP COLLAPSE / EXPAND BUTTON
        ================================================= */}

        <button
          type="button"
          onClick={toggleSidebar}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="
            absolute
            -right-3
            top-[104px]
            z-[80]
            hidden
            h-7
            w-7
            items-center
            justify-center
            rounded-full
            border
            border-slate-700
            bg-[#0b1728]
            text-slate-400
            shadow-lg
            transition-all
            hover:border-blue-500/40
            hover:bg-blue-600
            hover:text-white
            lg:flex
          "
        >
          {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
        </button>
      </aside>
    </>
  );
}
