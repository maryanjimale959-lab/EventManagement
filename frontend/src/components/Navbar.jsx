import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import Avatar from "./Avatar.jsx";
import Logo from "./Logo.jsx";
import ThemeToggle from "./ThemeToggle.jsx";
import { openPalette } from "./CommandPalette.jsx";

const linkClass = ({ isActive }) => `nav-link ${isActive ? "is-active" : ""}`;

const mobileLinkClass = ({ isActive }) =>
  `block rounded-lg px-3 py-2.5 text-base font-medium transition-colors ${
    isActive
      ? "bg-slate-200/70 text-slate-900 dark:bg-slate-800 dark:text-white"
      : "text-slate-700 hover:bg-slate-200/50 dark:text-slate-200 dark:hover:bg-slate-800/70"
  }`;

export default function Navbar() {
  const navigate = useNavigate();
  const { user, isAuthed, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [portalsOpen, setPortalsOpen] = useState(false);
  const menuRef = useRef(null);
  const portalsRef = useRef(null);

  // Same outside-click / Escape behaviour as the account menu.
  useEffect(() => {
    if (!portalsOpen) return undefined;
    const onPointerDown = (e) => {
      if (portalsRef.current && !portalsRef.current.contains(e.target)) setPortalsOpen(false);
    };
    const onKeyDown = (e) => {
      if (e.key === "Escape") setPortalsOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [portalsOpen]);

  // Close the account menu on outside click or Escape.
  useEffect(() => {
    if (!menuOpen) return undefined;
    const onPointerDown = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    const onKeyDown = (e) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!mobileOpen) return undefined;
    const onKeyDown = (e) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen]);

  const closeMobile = () => setMobileOpen(false);

  const handleLogout = async () => {
    setMenuOpen(false);
    setMobileOpen(false);
    await logout();
    navigate("/login");
  };

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <>
          <Link to="/" className="nav-brand" aria-label="Kulan home">
            <Logo />
          </Link>

          <nav className="nav-links" aria-label="Main">
            <NavLink to={isAuthed ? "/dashboard" : "/events"} className={linkClass}>
              Events
            </NavLink>
            <NavLink to="/how-it-works" className={linkClass}>
              How it works
            </NavLink>
            <NavLink to="/contact" className={linkClass}>
              Contact
            </NavLink>
            {isAuthed && (
              <NavLink to="/dashboard/events" className={linkClass}>
                My registrations
              </NavLink>
            )}
            {!isAuthed && (
              <div className="relative hidden md:block" ref={portalsRef}>
                <button
                  type="button"
                  className={`nav-link ${portalsOpen ? "is-active" : ""}`}
                  onClick={() => setPortalsOpen((o) => !o)}
                  aria-haspopup="menu"
                  aria-expanded={portalsOpen}
                >
                  Portals
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true" className={`ml-1 transition-transform ${portalsOpen ? "rotate-180" : ""}`}>
                    <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                {portalsOpen && (
                  <div className="menu" role="menu" style={{ left: 0, right: "auto", minWidth: "15rem" }}>
                    <div className="px-3 pb-1 pt-2 text-xs font-medium text-slate-500 dark:text-slate-400">Organizers</div>
                    <Link to="/organizer/login" onClick={() => setPortalsOpen(false)} role="menuitem">Organizer login</Link>
                    <Link to="/organizer/signup" onClick={() => setPortalsOpen(false)} role="menuitem">Become an organizer</Link>
                    <div className="menu-divider" />
                    <div className="px-3 pb-1 pt-2 text-xs font-medium text-slate-500 dark:text-slate-400">Staff</div>
                    <Link to="/maamul/login" onClick={() => setPortalsOpen(false)} role="menuitem">Admin login</Link>
                    <Link to="/photographer/login" onClick={() => setPortalsOpen(false)} role="menuitem">Photographer login</Link>
                  </div>
                )}
              </div>
            )}
          </nav>
        </>

        <div className="flex items-center gap-1.5 md:justify-self-end">
          <button type="button" onClick={openPalette} className="search-trigger !px-3 sm:!px-3.5" aria-label="Search events">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="11" cy="11" r="7.5" /><path d="m20.5 20.5-4.2-4.2" strokeLinecap="round" /></svg>
            <span className="hidden lg:inline">Search</span>
            <kbd className="kbd hidden xl:inline-flex">Ctrl K</kbd>
          </button>

          <ThemeToggle />

          {isAuthed ? (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                className={`avatar-button ${menuOpen ? "is-open" : ""}`}
                onClick={() => setMenuOpen((open) => !open)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                <Avatar user={user} size="sm" />
                <span className="hidden max-w-[8rem] truncate text-sm font-medium sm:inline">
                  {user?.firstName || user?.email}
                </span>
              </button>

              {menuOpen && (
                <div className="menu" role="menu">
                  <div className="px-3 py-2">
                    <div className="truncate text-sm font-semibold text-slate-900 dark:text-white">{user?.fullName}</div>
                    <div className="text-muted truncate text-xs">{user?.email}</div>
                  </div>
                  <div className="menu-divider" />
                  <Link to="/dashboard" onClick={() => setMenuOpen(false)} role="menuitem">
                    My registrations
                  </Link>
                  <Link to="/dashboard/profile" onClick={() => setMenuOpen(false)} role="menuitem">
                    Profile
                    {!user?.profileComplete && <span className="badge badge-warn ml-auto">Incomplete</span>}
                  </Link>
                  <div className="menu-divider" />
                  <button type="button" onClick={handleLogout} role="menuitem">
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <Link to="/login" className="nav-link text-sm">
                Log in
              </Link>
              <Link to="/register" className="btn btn-primary !px-3.5 !py-2 sm:!px-4">
                Sign up
              </Link>
            </div>
          )}

          <button
            type="button"
            className="theme-toggle md:hidden"
            onClick={() => setMobileOpen((open) => !open)}
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {mobileOpen ? (
                <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav className="border-t border-slate-200 bg-slate-50 px-3 py-3 md:hidden dark:border-slate-800 dark:bg-slate-950" aria-label="Mobile">
          <div className="flex flex-col gap-0.5">
            <NavLink to={isAuthed ? "/dashboard" : "/events"} className={mobileLinkClass} onClick={closeMobile}>
              Events
            </NavLink>
            <NavLink to="/how-it-works" className={mobileLinkClass} onClick={closeMobile}>
              How it works
            </NavLink>
            <NavLink to="/contact" className={mobileLinkClass} onClick={closeMobile}>
              Contact
            </NavLink>
            {isAuthed && (
              <NavLink to="/dashboard/events" className={mobileLinkClass} onClick={closeMobile}>
                My registrations
              </NavLink>
            )}
          </div>

          {!isAuthed && (
            <div className="mt-2 flex flex-col gap-0.5 border-t border-slate-200 pt-2 dark:border-slate-800">
              <NavLink to="/organizer/login" className={mobileLinkClass} onClick={closeMobile}>
                Organizer login
              </NavLink>
              <NavLink to="/organizer/signup" className={mobileLinkClass} onClick={closeMobile}>
                Become an organizer
              </NavLink>
              <NavLink to="/maamul/login" className={mobileLinkClass} onClick={closeMobile}>
                Admin login
              </NavLink>
              <NavLink to="/photographer/login" className={mobileLinkClass} onClick={closeMobile}>
                Photographer login
              </NavLink>
            </div>
          )}

          <div className="mt-2 border-t border-slate-200 pt-3 dark:border-slate-800">
            {isAuthed ? (
              <button
                type="button"
                onClick={handleLogout}
                className="block w-full rounded-lg px-3 py-2.5 text-left text-base font-medium text-rose-600 dark:text-rose-400"
              >
                Sign out
              </button>
            ) : null}
          </div>
        </nav>
      )}
    </header>
  );
}
