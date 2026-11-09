import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import Avatar from "./Avatar.jsx";
import ThemeToggle from "./ThemeToggle.jsx";

function Logo() {
  const [hasLogo, setHasLogo] = useState(false);

  return (
    <Link
      to="/"
      className="nav-brand flex items-center gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-lg py-1 px-1.5 -mx-1"
      aria-label="Kulan Events - Home"
    >
      {/* Clean logo placement container designed to accommodate an uploaded official logo */}
      <div className="flex items-center min-h-[38px] max-h-[44px]">
        <img
          src="/logo.svg"
          alt="Platform Logo"
          className={`h-8 sm:h-9 w-auto max-w-[180px] object-contain ${hasLogo ? "block" : "hidden"}`}
          onLoad={() => setHasLogo(true)}
          onError={() => setHasLogo(false)}
        />
        {!hasLogo && (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-700 text-white flex items-center justify-center font-semibold text-sm">
              K
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold tracking-tight text-base sm:text-lg text-slate-900 dark:text-white leading-none">
                Kulan<span className="text-brand-600 dark:text-brand-400">Events</span>
              </span>
              <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400 dark:text-slate-500 mt-0.5">
                Education &amp; Tech
              </span>
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}

const linkClass = ({ isActive }) =>
  `transition-colors font-medium text-sm hover:text-brand-600 dark:hover:text-brand-400 ${
    isActive ? "text-brand-600 dark:text-brand-400 font-bold" : "text-slate-600 dark:text-slate-300"
  }`;

const mobileLinkClass = ({ isActive }) =>
  `block py-2.5 text-base font-semibold transition-colors ${
    isActive ? "text-brand-600 dark:text-brand-300 font-bold" : "text-slate-700 dark:text-slate-200"
  }`;

export default function Navbar() {
  const navigate = useNavigate();
  const { user, isAuthed, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuRef = useRef(null);

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

  const handleLogout = async () => {
    setMenuOpen(false);
    setMobileOpen(false);
    await logout();
    navigate("/login");
  };

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Logo />

        <nav className="nav-links">
          <NavLink to="/" end className={linkClass}>
            Home
          </NavLink>
          <NavLink to="/events" className={linkClass}>
            Events &amp; Programs
          </NavLink>
          <NavLink to="/events?category=Workshops" className={linkClass}>
            Workshops
          </NavLink>
          <NavLink to="/events?category=Hackathons" className={linkClass}>
            Hackathons
          </NavLink>
          <NavLink to="/how-it-works" className={linkClass}>
            How it works
          </NavLink>
          {isAuthed && (
            <NavLink to="/dashboard" className={linkClass}>
              My Registrations
            </NavLink>
          )}
        </nav>

        <div className="flex items-center gap-2.5">
          <Link
            to="/organizer/dashboard"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-brand-200 dark:border-brand-800/80 bg-brand-50/50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 hover:bg-brand-100/70 dark:hover:bg-brand-900/50 transition-all duration-200"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
            <span>Host an Event</span>
            <span className="text-[10px] text-brand-500 font-bold uppercase tracking-wider">Abaabule</span>
          </Link>

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
                <span className="hidden sm:inline text-sm font-semibold max-w-[8rem] truncate">
                  {user?.firstName || user?.email}
                </span>
              </button>

              {menuOpen && (
                <div className="menu" role="menu">
                  <div className="px-3.5 py-2.5">
                    <div className="font-bold text-sm text-slate-900 dark:text-white truncate">{user?.fullName}</div>
                    <div className="text-muted text-xs truncate">{user?.email}</div>
                    <span className="badge badge-info mt-2 capitalize text-[10px]">{user?.role || "Attendee"}</span>
                  </div>
                  <div className="menu-divider" />
                  <Link to="/dashboard" onClick={() => setMenuOpen(false)} role="menuitem">
                    Registered Events
                  </Link>
                  <Link to="/dashboard/profile" onClick={() => setMenuOpen(false)} role="menuitem">
                    Student / Pro Profile
                    {!user?.profileComplete && (
                      <span className="badge badge-warn ml-auto text-[10px]">Incomplete</span>
                    )}
                  </Link>
                  <div className="menu-divider" />
                  <button type="button" onClick={handleLogout} role="menuitem" className="text-rose-600 dark:text-rose-400">
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Link
                to="/login"
                className="text-sm font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white px-2.5 py-1.5"
              >
                Log in
              </Link>
              <Link to="/register" className="btn btn-primary text-xs px-4 py-2">
                Join Platform
              </Link>
            </div>
          )}

          {/* Mobile hamburger menu toggle */}
          <button
            type="button"
            className="md:hidden w-9 h-9 inline-flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            onClick={() => setMobileOpen((open) => !open)}
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {mobileOpen ? (
                <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav className="md:hidden border-t border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-3 shadow-lg" aria-label="Mobile">
          <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800/80">
            <div className="pb-2 space-y-1">
              <NavLink to="/" end className={mobileLinkClass} onClick={() => setMobileOpen(false)}>
                Home
              </NavLink>
              <NavLink to="/events" className={mobileLinkClass} onClick={() => setMobileOpen(false)}>
                All Events &amp; Programs
              </NavLink>
              <NavLink to="/events?category=Workshops" className={mobileLinkClass} onClick={() => setMobileOpen(false)}>
                Workshops &amp; Labs
              </NavLink>
              <NavLink to="/events?category=Hackathons" className={mobileLinkClass} onClick={() => setMobileOpen(false)}>
                Hackathons &amp; AI
              </NavLink>
              <NavLink to="/how-it-works" className={mobileLinkClass} onClick={() => setMobileOpen(false)}>
                How it works
              </NavLink>
            </div>

            <div className="py-2.5 space-y-1">
              <NavLink to="/organizer/dashboard" className={mobileLinkClass} onClick={() => setMobileOpen(false)}>
                Organizer Portal (Abaabule) â†’
              </NavLink>
              <NavLink to="/maamul/dashboard" className={mobileLinkClass} onClick={() => setMobileOpen(false)}>
                Admin Console (Maamul) â†’
              </NavLink>
            </div>

            {isAuthed ? (
              <div className="pt-2.5">
                <NavLink to="/dashboard" className={mobileLinkClass} onClick={() => setMobileOpen(false)}>
                  My Registrations &amp; Passes
                </NavLink>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full text-left py-2.5 text-base font-semibold text-rose-600 dark:text-rose-400"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <div className="pt-3 flex flex-col gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="btn btn-ghost w-full justify-center"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileOpen(false)}
                  className="btn btn-primary w-full justify-center"
                >
                  Join Platform
                </Link>
              </div>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}

