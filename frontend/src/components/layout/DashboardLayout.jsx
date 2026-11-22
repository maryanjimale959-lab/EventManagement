import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import Avatar from "../Avatar.jsx";
import Logo from "../Logo.jsx";
import ThemeToggle from "../ThemeToggle.jsx";
import CommandPalette, { openPalette } from "../CommandPalette.jsx";

const NAV = [
  {
    to: "/dashboard",
    end: true,
    label: "Explore & Overview",
    icon: <path d="M4 13h6V4H4v9Zm10 7h6V4h-6v16ZM4 20h6v-5H4v5Z" strokeLinecap="round" strokeLinejoin="round" />,
  },
  {
    to: "/dashboard/events",
    label: "My registrations",
    icon: <path d="M8 2v4M16 2v4M3 10h18M5 6h14a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z" strokeLinecap="round" strokeLinejoin="round" />,
  },
  {
    to: "/dashboard/profile",
    label: "Profile",
    icon: <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" strokeLinecap="round" strokeLinejoin="round" />,
  },
];

/**
 * Standalone workspace shell for logged-in attendees. Keeps the public site's
 * marketing navbar, Portals dropdown, and marketing footer out of the account
 * area so the workspace stays clean and focused.
 */
export default function DashboardLayout({ title, subtitle, actions, children }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const onDown = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    const onKey = (e) => e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const handleLogout = async () => {
    setMenuOpen(false);
    setSidebarOpen(false);
    await logout();
    navigate("/login", { replace: true });
  };

  const linkClass = ({ isActive }) => `console-link ${isActive ? "is-active" : ""}`;

  // Overview has its own detailed completion card, and Profile is where the
  // user is already fixing it, so only show the compact banner elsewhere.
  const showIncompleteBanner =
    !user?.profileComplete && pathname !== "/dashboard" && pathname !== "/dashboard/profile";

  return (
    <div className="console-shell">
      <CommandPalette />
      {sidebarOpen && <div className="console-overlay" onClick={() => setSidebarOpen(false)} />}

      <aside className={`console-sidebar ${sidebarOpen ? "is-open" : ""}`}>
        <div className="console-logo">
          <Link to="/dashboard" onClick={() => setSidebarOpen(false)} aria-label="Kulan dashboard">
            <Logo size={26} />
          </Link>
        </div>

        <nav className="console-nav" aria-label="Account navigation">
          <div className="console-nav-group">Menu</div>
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={linkClass}
              onClick={() => setSidebarOpen(false)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                {item.icon}
              </svg>
              <span className="truncate">{item.label}</span>
              {item.to === "/dashboard/profile" && !user?.profileComplete && (
                <span className="dash-dot" title="Profile incomplete" />
              )}
            </NavLink>
          ))}
        </nav>

        <div className="console-sidebar-footer">
          <NavLink to="/dashboard/profile" className={linkClass} onClick={() => setSidebarOpen(false)}>
            <Avatar user={user} size="sm" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-slate-900 dark:text-white">
                {user?.firstName || user?.fullName || "Account"}
              </div>
              <div className="text-muted truncate text-xs">{user?.email}</div>
            </div>
          </NavLink>
        </div>
      </aside>

      <div className="console-main">
        <header className="console-topbar">
          <button
            type="button"
            className="theme-toggle lg:hidden"
            onClick={() => setSidebarOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
            </svg>
          </button>

          <div className="min-w-0 flex-1">
            {title && <h1 className="text-xl m-0 truncate">{title}</h1>}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button type="button" onClick={openPalette} className="search-trigger !px-3 sm:!px-3.5" aria-label="Search events">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <circle cx="11" cy="11" r="7.5" />
                <path d="m20.5 20.5-4.2-4.2" strokeLinecap="round" />
              </svg>
              <span className="hidden md:inline">Search</span>
              <kbd className="kbd hidden lg:inline-flex">Ctrl K</kbd>
            </button>

            <ThemeToggle />

            <div className="relative" ref={menuRef}>
              <button
                type="button"
                className={`avatar-button ${menuOpen ? "is-open" : ""}`}
                onClick={() => setMenuOpen((o) => !o)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                <Avatar user={user} size="sm" />
                <span className="hidden sm:inline max-w-[8rem] truncate text-sm font-medium">
                  {user?.firstName || user?.email}
                </span>
              </button>
              {menuOpen && (
                <div className="menu" role="menu">
                  <div className="px-3 py-2">
                    <div className="font-semibold text-sm truncate text-slate-900 dark:text-white">{user?.fullName}</div>
                    <div className="text-muted text-xs truncate">{user?.email}</div>
                  </div>
                  <div className="menu-divider" />
                  <NavLink to="/dashboard/profile" onClick={() => setMenuOpen(false)} role="menuitem">
                    Profile &amp; password
                  </NavLink>
                  <div className="menu-divider" />
                  <button type="button" onClick={handleLogout} role="menuitem">Sign out</button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="console-body">
          {(subtitle || actions) && (
            <div className="page-header mb-5">
              {subtitle ? <p className="text-muted m-0">{subtitle}</p> : <div />}
              {actions && <div className="header-actions">{actions}</div>}
            </div>
          )}

          {showIncompleteBanner && (
            <div className="alert alert-warn mb-5">
              Your profile is incomplete, so you cannot register for events yet.{" "}
              <NavLink to="/dashboard/profile" className="underline font-bold">
                Complete it now
              </NavLink>
              .
            </div>
          )}

          {children}
        </main>
      </div>
    </div>
  );
}
