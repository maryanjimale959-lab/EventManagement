import { Link } from "react-router-dom";
import Navbar from "../Navbar.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

function FooterLink({ to, children }) {
  return (
    <li>
      <Link to={to} className="text-slate-400 hover:text-white transition-colors text-xs font-medium">
        {children}
      </Link>
    </li>
  );
}

function FooterHeading({ children }) {
  return (
    <h3 className="text-white font-bold text-xs uppercase tracking-wider mb-4 pb-2 border-b border-white/10">
      {children}
    </h3>
  );
}

export default function PublicLayout({ children }) {
  const { isAuthed } = useAuth();

  return (
    <div className="app-shell min-h-screen flex flex-col bg-white dark:bg-slate-950 transition-colors">
      <Navbar />
      <main className="flex-1">{children}</main>

      <footer className="bg-slate-950 text-slate-400 mt-20">
        <div className="shell-wrap py-14 grid gap-10 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold text-sm">
                K
              </div>
              <span className="font-extrabold tracking-tight text-lg text-white">
                Kulan<span className="text-brand-400">Events</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm m-0">
              The premier platform connecting students, developers, founders, and scholars with academic conferences, hands-on coding workshops, AI hackathons, and Islamic knowledge symposiums.
            </p>
            <div className="mt-5 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] text-slate-400 font-medium">
                Verified Door Check-in &amp; Private Keynote Archives
              </span>
            </div>
          </div>

          <div>
            <FooterHeading>Disciplines &amp; Tracks</FooterHeading>
            <ul className="space-y-2.5 list-none p-0 m-0">
              <FooterLink to="/events?category=Artificial+Intelligence">Artificial Intelligence</FooterLink>
              <FooterLink to="/events?category=Technology">Technology &amp; Cloud</FooterLink>
              <FooterLink to="/events?category=Workshops">Technical Workshops</FooterLink>
              <FooterLink to="/events?category=Hackathons">Hackathons &amp; Demos</FooterLink>
              <FooterLink to="/events?category=Islamic+Studies">Islamic Studies</FooterLink>
              <FooterLink to="/events?category=Business">Business &amp; Startups</FooterLink>
            </ul>
          </div>

          <div>
            <FooterHeading>Platform Navigation</FooterHeading>
            <ul className="space-y-2.5 list-none p-0 m-0">
              <FooterLink to="/">Home Overview</FooterLink>
              <FooterLink to="/events">All Programs</FooterLink>
              <FooterLink to="/how-it-works">How It Works</FooterLink>
              <FooterLink to="/contact">Support &amp; Inquiries</FooterLink>
              {isAuthed ? (
                <>
                  <FooterLink to="/dashboard">My Registrations</FooterLink>
                  <FooterLink to="/dashboard/profile">Attendee Profile</FooterLink>
                </>
              ) : (
                <>
                  <FooterLink to="/register">Student &amp; Pro Signup</FooterLink>
                  <FooterLink to="/login">Sign In</FooterLink>
                </>
              )}
            </ul>
          </div>

          <div>
            <FooterHeading>Host &amp; Administration</FooterHeading>
            <ul className="space-y-2.5 list-none p-0 m-0">
              <FooterLink to="/organizer/dashboard">Organizer Portal (Abaabule)</FooterLink>
              <FooterLink to="/organizer/signup">Register as Event Organizer</FooterLink>
              <FooterLink to="/organizer/login">Organizer Login</FooterLink>
              <FooterLink to="/maamul/dashboard">Admin Console (Maamul)</FooterLink>
              <FooterLink to="/sawirqaade/login">Photographer Portal</FooterLink>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 py-6">
          <div className="shell-wrap flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <span>Â© {new Date().getFullYear()} Kulan Events. All rights reserved.</span>
            <div className="flex items-center gap-4">
              <Link to="/how-it-works" className="hover:text-slate-400 transition-colors">
                Architecture
              </Link>
              <Link to="/contact" className="hover:text-slate-400 transition-colors">
                Contact
              </Link>
              <span className="text-slate-600">Â·</span>
              <span className="text-slate-400 font-medium">Knowledge &amp; Innovation</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}


