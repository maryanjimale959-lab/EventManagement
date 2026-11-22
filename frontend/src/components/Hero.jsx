import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { CountUp, Reveal } from "../hooks/useMotion.jsx";

const FACTS = [
  { title: "Free and ticketed events", desc: "Choose a plan at registration and see the price before you commit." },
  { title: "A QR pass for the door", desc: "Approved attendees get a personal code that is scanned once at check-in." },
  { title: "Slides and photos afterwards", desc: "Materials from the event unlock for the people who attended." },
];

const STATS = [
  { value: 6, suffix: "", label: "event tracks" },
  { value: 1, suffix: " scan", label: "per pass, never reused" },
  { value: 3, suffix: " roles", label: "attendee, organizer, admin" },
];

const Arrow = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

export default function Hero() {
  const { isAuthed } = useAuth();

  return (
    <section className="relative isolate overflow-hidden border-b border-slate-200 dark:border-slate-800">
      {/* The photo fills the section but stays faint, so the headline reads first. */}
      <div className="absolute inset-0 -z-10" aria-hidden="true">
        <img
          src="/images/kulan-symposium.jpg"
          alt=""
          fetchpriority="high"
          className="h-full w-full object-cover object-[center_40%] opacity-[0.42] saturate-[0.6] dark:opacity-[0.3]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-50/90 via-slate-50/55 to-slate-50/10 dark:from-slate-950/90 dark:via-slate-950/60 dark:to-slate-950/20" />
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-slate-50/80 to-transparent dark:from-slate-950" />
      </div>

      <div className="shell-wrap py-20 sm:py-28 lg:py-32">
        <div className="min-w-0 max-w-4xl">
          <h1
            className="display-serif rise m-0 text-5xl text-slate-950 sm:text-6xl lg:text-7xl dark:text-white"
            style={{ animationDelay: "80ms" }}
          >
            Find your next event and register in minutes.
          </h1>

          <p
            className="rise mt-6 max-w-xl text-lg leading-8 text-slate-700 sm:text-xl sm:leading-9 dark:text-slate-300"
            style={{ animationDelay: "160ms" }}
          >
            Workshops, hackathons, conferences and summits in one place. Get a QR pass for the door, and keep the
            slides and photos afterwards.
          </p>

          <div className="rise mt-10 flex flex-wrap items-center gap-3" style={{ animationDelay: "240ms" }}>
            <Link to={isAuthed ? "/dashboard" : "/events"} className="btn btn-primary link-arrow !px-6 !py-3 text-base">
              Browse events <Arrow />
            </Link>
            {isAuthed ? (
              <Link to="/dashboard" className="btn btn-ghost !px-6 !py-3 text-base">My registrations</Link>
            ) : (
              <>
                <Link to="/register" className="btn btn-ghost !px-6 !py-3 text-base">Create account</Link>
                <Link to="/login" className="btn btn-ghost !px-6 !py-3 text-base">Log in</Link>
              </>
            )}
          </div>

          <dl className="rise m-0 mt-14 grid max-w-2xl grid-cols-3 gap-6" style={{ animationDelay: "320ms" }}>
            {STATS.map((s) => (
              <div key={s.label}>
                <dt className="display text-3xl text-slate-950 sm:text-4xl dark:text-white">
                  <CountUp value={s.value} suffix={s.suffix} />
                </dt>
                <dd className="m-0 mt-1 text-xs text-slate-600 sm:text-sm dark:text-slate-400">{s.label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <div className="border-t border-slate-900/10 bg-slate-50/50 backdrop-blur-sm dark:border-white/10 dark:bg-slate-950/40">
        <div className="shell-wrap">
          <dl className="m-0 grid gap-6 py-8 sm:grid-cols-3 sm:gap-10">
            {FACTS.map((f, i) => (
              <Reveal key={f.title} delay={i * 90}>
                <dt className="text-base font-semibold text-slate-950 dark:text-white">{f.title}</dt>
                <dd className="m-0 mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{f.desc}</dd>
              </Reveal>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
