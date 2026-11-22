import { Link } from "react-router-dom";
import Navbar from "../Navbar.jsx";
import Logo from "../Logo.jsx";
import CommandPalette from "../CommandPalette.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

function FooterColumn({ title, children }) {
  return (
    <div>
      <h3 className="m-0 mb-3 font-sans text-sm font-semibold tracking-normal text-slate-900 dark:text-white">{title}</h3>
      <ul className="m-0 list-none space-y-2 p-0">{children}</ul>
    </div>
  );
}

function FooterLink({ to, children }) {
  return (
    <li>
      <Link to={to} className="text-sm text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
        {children}
      </Link>
    </li>
  );
}

export default function PublicLayout({ children }) {
  const { isAuthed } = useAuth();

  return (
    <div className="app-shell">
      <Navbar />
      <CommandPalette />
      <main className="flex-1">{children}</main>

      <footer className="mt-20 border-t border-slate-200 dark:border-slate-800">
        <div className={`shell-wrap grid grid-cols-2 gap-10 py-12 ${isAuthed ? "lg:grid-cols-[1.6fr_1fr_1fr]" : "lg:grid-cols-[1.6fr_1fr_1fr_1fr]"}`}>
          <div className="col-span-2 lg:col-span-1">
            <Logo />
            <p className="m-0 mt-3 max-w-xs text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              Events for students, developers, founders and scholars. Register, check in at the door, keep the materials.
            </p>
          </div>

          <FooterColumn title="Tracks">
            <FooterLink to="/events?category=Artificial+Intelligence">Artificial Intelligence</FooterLink>
            <FooterLink to="/events?category=Technology">Technology</FooterLink>
            <FooterLink to="/events?category=Workshops">Workshops</FooterLink>
            <FooterLink to="/events?category=Hackathons">Hackathons</FooterLink>
            <FooterLink to="/events?category=Islamic+Studies">Islamic Studies</FooterLink>
            <FooterLink to="/events?category=Business">Business</FooterLink>
          </FooterColumn>

          <FooterColumn title="Attend">
            <FooterLink to={isAuthed ? "/dashboard" : "/events"}>All events</FooterLink>
            <FooterLink to="/how-it-works">How it works</FooterLink>
            <FooterLink to="/contact">Contact</FooterLink>
            {isAuthed ? (
              <>
                <FooterLink to="/dashboard">My dashboard</FooterLink>
                <FooterLink to="/dashboard/events">My registrations</FooterLink>
                <FooterLink to="/dashboard/profile">Profile</FooterLink>
              </>
            ) : (
              <>
                <FooterLink to="/register">Sign up</FooterLink>
                <FooterLink to="/login">Log in</FooterLink>
              </>
            )}
          </FooterColumn>

          {!isAuthed && (
            <FooterColumn title="Host">
              <FooterLink to="/organizer/signup">Become an organizer</FooterLink>
              <FooterLink to="/organizer/login">Organizer login</FooterLink>
              <FooterLink to="/maamul/login">Admin login</FooterLink>
              <FooterLink to="/photographer/login">Photographer portal</FooterLink>
            </FooterColumn>
          )}
        </div>

        <div className="border-t border-slate-200 dark:border-slate-800">
          <div className="shell-wrap py-5 text-sm text-slate-500 dark:text-slate-400">
            © {new Date().getFullYear()} Kulan Events
          </div>
        </div>
      </footer>
    </div>
  );
}
