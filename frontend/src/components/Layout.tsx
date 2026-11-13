import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AnimatedGradientBackground from "./ui/animated-gradient-background";
import GlitchWordmark from "./GlitchWordmark";
import Footer from "./Footer";

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 6h16M4 12h16M4 18h16" />}
    </svg>
  );
}

function CollapseIcon({ collapsed }: { collapsed: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`w-4 h-4 transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 5l-7 7 7 7" />
    </svg>
  );
}

const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const navIcons: Record<string, React.ReactNode> = {
  Dashboard: (
    <svg {...iconProps}>
      <rect x="3.5" y="3.5" width="7.5" height="7.5" rx="1.5" />
      <rect x="13" y="3.5" width="7.5" height="7.5" rx="1.5" />
      <rect x="3.5" y="13" width="7.5" height="7.5" rx="1.5" />
      <rect x="13" y="13" width="7.5" height="7.5" rx="1.5" />
    </svg>
  ),
  Cameras: (
    <svg {...iconProps}>
      <path d="M3 8a2 2 0 0 1 2-2h2.5l1-1.5h7l1 1.5H19a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <circle cx="12" cy="13" r="3.5" />
    </svg>
  ),
  "Video Library": (
    <svg {...iconProps}>
      <rect x="3" y="4.5" width="18" height="15" rx="2" />
      <path d="M10 9l6 3-6 3z" fill="currentColor" stroke="none" />
    </svg>
  ),
  Incidents: (
    <svg {...iconProps}>
      <path d="M12 3.5l9.5 16.5H2.5z" />
      <path d="M12 10v4.5" />
      <circle cx="12" cy="17.2" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  ),
  Analytics: (
    <svg {...iconProps}>
      <path d="M4 20V11" />
      <path d="M12 20V4" />
      <path d="M20 20v-7" />
    </svg>
  ),
  Performance: (
    <svg {...iconProps}>
      <path d="M3 13a9 9 0 0 1 18 0" />
      <path d="M12 13l4-4.5" />
      <path d="M3 20h18" />
    </svg>
  ),
  "Audit Logs": (
    <svg {...iconProps}>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M9 8h6M9 12h6M9 16h3" />
    </svg>
  ),
};

function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);
  return now;
}

function useCollapsed() {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem("sentinelai-sidebar-collapsed") === "1";
    } catch {
      return false;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem("sentinelai-sidebar-collapsed", collapsed ? "1" : "0");
    } catch {
      // Private browsing / storage disabled: collapse state just won't
      // persist across reloads, which is harmless.
    }
  }, [collapsed]);
  return [collapsed, setCollapsed] as const;
}

const navItems = [
  { to: "/", label: "Dashboard" },
  { to: "/cameras", label: "Cameras" },
  { to: "/videos", label: "Video Library" },
  { to: "/incidents", label: "Incidents" },
  { to: "/analytics", label: "Analytics" },
  { to: "/performance", label: "Performance" },
  { to: "/audit-logs", label: "Audit Logs", adminOnly: true },
];

const roleColor: Record<string, string> = {
  admin: "text-status-critical border-status-critical/40",
  analyst: "text-ops-accent border-ops-accent/40",
  viewer: "text-status-ok border-status-ok/40",
};

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const clock = useClock();
  const [navOpen, setNavOpen] = useState(false);
  const [collapsed, setCollapsed] = useCollapsed();
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  useEffect(() => {
    if (!navOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setNavOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [navOpen]);

  const visibleNavItems = navItems.filter((item) => !item.adminOnly || user?.role === "admin");

  const sidebarFooter = (
    <div className={`px-5 py-5 ${collapsed ? "lg:px-0 lg:flex lg:flex-col lg:items-center lg:gap-3" : ""}`}>
      <div className={`flex items-center justify-between mb-3 ${collapsed ? "lg:flex-col lg:gap-2 lg:mb-0" : ""}`}>
        <span className={`tabular text-xs text-ops-muted ${collapsed ? "lg:hidden" : ""}`}>
          {clock.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
        </span>
        <span
          title={user?.role}
          className={`text-xs font-medium capitalize px-2.5 py-0.5 rounded-full border ${
            roleColor[user?.role ?? ""] ?? "text-slate-400 border-ops-border"
          } ${collapsed ? "lg:px-0 lg:py-0 lg:w-7 lg:h-7 lg:flex lg:items-center lg:justify-center lg:rounded-full" : ""}`}
        >
          <span className={collapsed ? "lg:hidden" : ""}>{user?.role}</span>
          <span className={collapsed ? "hidden lg:inline" : "hidden"}>{(user?.role ?? "?").charAt(0).toUpperCase()}</span>
        </span>
      </div>
      <div className={`flex items-center justify-between gap-2 ${collapsed ? "lg:flex-col lg:gap-2" : ""}`}>
        <span className={`text-xs text-slate-400 truncate ${collapsed ? "lg:hidden" : ""}`}>{user?.email}</span>
        <button
          onClick={handleLogout}
          title="Log out"
          className="shrink-0 flex items-center gap-1.5 text-xs text-ops-muted hover:text-status-critical transition-colors -m-2 p-2"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <path d="M16 17l5-5-5-5" />
            <path d="M21 12H9" />
          </svg>
          <span className={collapsed ? "lg:hidden" : ""}>Log out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="relative min-h-screen bg-ops-bg text-slate-100">
      <AnimatedGradientBackground gradientColors={["#0A0A0A", "#22D3EE", "#3c2cff", "#8B3DFF", "#FF3DA5", "#FFB800", "#7CFF5B"]} />
      <div className="relative z-10 min-h-screen lg:flex">
      {/* Mobile top bar: the permanent sidebar below doesn't fit a phone
          viewport, so narrow screens get this bar plus a spring-in drawer
          instead of a squeezed-down copy of the desktop rail. */}
      <header className="lg:hidden chrome-material border-b flex items-center justify-between px-4 py-3 sticky top-0 z-50">
        <GlitchWordmark iconClassName="w-6 h-6" textClassName="text-base" gap="gap-2.5" />
        <button
          ref={menuButtonRef}
          onClick={() => setNavOpen((o) => !o)}
          aria-label={navOpen ? "Close navigation" : "Open navigation"}
          aria-expanded={navOpen}
          className="-mr-2.5 flex items-center justify-center w-11 h-11 text-slate-300 hover:text-ops-accent transition-colors press"
        >
          <MenuIcon open={navOpen} />
        </button>
      </header>

      {navOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-30 animate-fadeIn"
          onClick={() => setNavOpen(false)}
          aria-hidden="true"
        />
      )}

      {navOpen && (
        <aside className="lg:hidden fixed inset-y-0 left-0 z-40 w-72 sheet-material drawer-sheet flex flex-col animate-sheetIn">
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {visibleNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                onClick={() => setNavOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-4 py-3 rounded-2xl font-display text-[0.95rem] font-medium transition-colors ${
                    isActive ? "bg-ops-accent text-ops-bg" : "text-slate-400 hover:bg-white/[0.06] hover:text-slate-200"
                  }`
                }
              >
                <span className="w-5 h-5 shrink-0">{navIcons[item.label]}</span>
                {item.label}
              </NavLink>
            ))}
          </nav>
          {sidebarFooter}
        </aside>
      )}

      {/* Desktop sidebar: a fixed-size rail (never fluid with content) that
          toggles between two explicit widths -- 18rem expanded, 5rem
          collapsed -- instead of auto-sizing, so the rest of the layout
          never jitters as content changes. */}
      <aside
        className={`hidden lg:flex lg:static shrink-0 chrome-material border-r flex-col transition-[width] duration-300 ease-spring overflow-hidden ${
          collapsed ? "w-20" : "w-72"
        }`}
      >
        <div className={`px-6 py-6 flex items-center ${collapsed ? "lg:justify-center lg:px-0" : "justify-between"}`}>
          {!collapsed && <GlitchWordmark iconClassName="w-6 h-6" textClassName="text-xl" subtitle="Edge Video Intelligence" />}
          {collapsed && <GlitchWordmark iconClassName="w-7 h-7" textClassName="hidden" gap="gap-0" />}
        </div>
        <button
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!collapsed}
          className={`mx-3 mb-2 flex items-center gap-2 text-xs text-ops-muted hover:text-slate-200 transition-colors press rounded-xl px-2 py-1.5 hover:bg-white/[0.06] ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <CollapseIcon collapsed={collapsed} />
          {!collapsed && <span>Collapse</span>}
        </button>
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto overflow-x-hidden">
          {visibleNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              title={collapsed ? item.label : undefined}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-4 py-3 rounded-2xl font-display text-[0.95rem] font-medium transition-colors whitespace-nowrap ${
                  collapsed ? "justify-center px-0" : ""
                } ${isActive ? "bg-ops-accent text-ops-bg" : "text-slate-400 hover:bg-white/[0.06] hover:text-slate-200"}`
              }
            >
              <span className="w-5 h-5 shrink-0">{navIcons[item.label]}</span>
              {!collapsed && item.label}
            </NavLink>
          ))}
        </nav>
        {sidebarFooter}
      </aside>
      <main className="flex-1 overflow-y-auto flex flex-col">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 w-full flex-1">
          <Outlet />
        </div>
        <Footer />
      </main>
      </div>
    </div>
  );
}
