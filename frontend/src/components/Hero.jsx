import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const QUICK_TRACKS = [
  { label: "Artificial Intelligence", query: "Artificial Intelligence" },
  { label: "Practical Workshops", query: "Workshops" },
  { label: "Tech Hackathons", query: "Hackathons" },
  { label: "Islamic Studies", query: "Islamic Studies" },
  { label: "Business & Startups", query: "Business" },
];

export default function Hero() {
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/events?search=${encodeURIComponent(searchTerm.trim())}`);
    } else {
      navigate("/events");
    }
  };

  return (
    <section className="relative overflow-hidden bg-slate-950 text-white min-h-[82dvh] flex items-center">
      {/* Background imagery with subtle atmospheric scrim */}
      <div className="absolute inset-0 z-0">
        <img
          src="/images/hero-crowd.jpg"
          alt="Educational and technology conference audience"
          className="w-full h-full object-cover object-center opacity-30 mix-blend-luminosity scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/85 to-slate-950/90" />
        {/* Subtle tech ambient glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-brand-500/10 blur-[130px] rounded-full pointer-events-none" />
      </div>

      <div className="shell-wrap relative z-10 w-full py-16 sm:py-24">
        <div className="max-w-3xl">
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-semibold uppercase tracking-wider mb-6">
            <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" />
            <span>Academic · Technology · Professional · Islamic Studies</span>
          </div>

          <h1 className="display text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.08] m-0">
            Where knowledge meets <span className="text-brand-400">innovation</span>.
          </h1>

          <p className="mt-6 text-base sm:text-xl text-slate-300 leading-relaxed font-normal max-w-2xl">
            The premier platform for educational symposiums, practical tech workshops, competitive hackathons, business acceleration, and ethical leadership gatherings.
          </p>

          {/* Interactive Hero Search Form */}
          <form
            onSubmit={handleSearchSubmit}
            className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 max-w-2xl bg-white/5 border border-white/10 rounded-2xl p-2 backdrop-blur-md shadow-2xl"
          >
            <div className="relative flex-1 flex items-center">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="absolute left-3.5 text-slate-400 pointer-events-none"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <input
                type="text"
                placeholder="Search AI conferences, Python labs, fellowships..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-transparent text-white placeholder-slate-400 text-sm focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary sm:w-auto w-full px-6 py-3 text-sm font-semibold rounded-xl"
            >
              Search Events
            </button>
          </form>

          {/* Instant Track Filter Pills */}
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-400 font-medium">Popular tracks:</span>
            {QUICK_TRACKS.map((t) => (
              <Link
                key={t.query}
                to={`/events?category=${encodeURIComponent(t.query)}`}
                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-colors"
              >
                {t.label}
              </Link>
            ))}
          </div>

          {/* Primary Action Buttons */}
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link to="/events" className="btn btn-primary text-sm px-6 py-3.5">
              Explore All Programs
            </Link>
            <Link
              to="/organizer/signup"
              className="btn btn-secondary text-sm px-5 py-3.5 bg-slate-900/90 hover:bg-slate-800 text-white border border-slate-700"
            >
              Host an Event (Abaabule)
            </Link>
            <Link
              to="/how-it-works"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-300 hover:text-brand-300 transition-colors py-2 px-3"
            >
              How It Works
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>

          {/* Trust Highlights */}
          <div className="mt-12 pt-8 border-t border-white/10 grid grid-cols-2 sm:grid-cols-3 gap-6 text-left">
            <div>
              <p className="text-xl sm:text-2xl font-extrabold text-white font-display">8+ Disciplines</p>
              <p className="text-xs text-slate-400 mt-1">From AI &amp; Cloud to Islamic Ethics</p>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-extrabold text-brand-400 font-display">Fast QR Check-in</p>
              <p className="text-xs text-slate-400 mt-1">Instant gate verification for attendees</p>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <p className="text-xl sm:text-2xl font-extrabold text-emerald-400 font-display">Private Archives</p>
              <p className="text-xs text-slate-400 mt-1">Secure media &amp; keynote lecture materials</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
