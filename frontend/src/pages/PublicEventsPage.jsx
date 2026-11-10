import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import client from "../api/client.js";
import EmptyState from "../components/ui/EmptyState.jsx";
import Loading from "../components/ui/Loading.jsx";
import PublicLayout from "../components/layout/PublicLayout.jsx";
import Hero from "../components/Hero.jsx";
import EventCard from "../components/EventCard.jsx";
import { Reveal, usePointerFx } from "../hooks/useMotion.jsx";
import { EVENT_CATEGORIES, CATEGORY_METADATA, getCategoryMeta } from "../utils/categories.js";

const PILLARS = [
  { n: "01", title: "Academics & research", desc: "Symposiums, fellowships and lectures with universities and researchers." },
  { n: "02", title: "Practical workshops", desc: "Hands-on labs and bootcamps led by working engineers and trainers." },
  { n: "03", title: "AI & hackathons", desc: "Summits, build weekends and demo days for people making new things." },
  { n: "04", title: "Islamic studies & ethics", desc: "Lectures and seminars on knowledge, character and leadership." },
];

const STEPS = [
  { n: 1, title: "Find an event", desc: "Search or filter by track, city and price." },
  { n: 2, title: "Register", desc: "Reserve a place. The organizer approves it and your QR pass is issued." },
  { n: 3, title: "Check in & learn", desc: "Scan at the door. Slides and photos unlock only for attendees." },
];

function Pillar({ p }) {
  const fx = usePointerFx(2.5);
  return (
    <div
      {...fx}
      className="interactive-card h-full rounded-2xl border border-slate-200/90 bg-white p-7 shadow-sm hover:border-brand-500/40 dark:border-slate-800 dark:bg-slate-900"
    >
      <span className="font-display text-3xl font-extrabold text-brand-600 dark:text-brand-400">{p.n}</span>
      <h3 className="mt-4 mb-0 text-lg font-bold text-slate-900 dark:text-white">{p.title}</h3>
      <p className="mt-2 mb-0 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{p.desc}</p>
    </div>
  );
}

export default function PublicEventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [category, setCategory] = useState("All");

  useEffect(() => {
    client
      .get("/api/events/public")
      .then((res) => setEvents(res.data))
      .catch((err) => setError(err.response?.data?.error?.message || "Failed to load events"))
      .finally(() => setLoading(false));
  }, []);

  const counts = useMemo(() => {
    const c = { All: events.length };
    events.forEach((e) => {
      const k = getCategoryMeta(e.category).label;
      c[k] = (c[k] || 0) + 1;
    });
    return c;
  }, [events]);

  const filtered = useMemo(
    () => (category === "All" ? events : events.filter((e) => getCategoryMeta(e.category).label === category)),
    [events, category]
  );
  const shown = filtered.slice(0, 6);

  return (
    <PublicLayout>
      <Hero />

      <div className="shell-wrap">
        {/* Filter + grid */}
        <section className="section pt-4" id="events">
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-200/80 pb-4 dark:border-slate-800">
              <div>
                <span className="eyebrow text-brand-600 dark:text-brand-400">Explore</span>
                <h2 className="display m-0 mt-1 text-2xl font-extrabold text-slate-900 dark:text-white sm:text-3xl">
                  {category === "All" ? "Upcoming events" : category}
                </h2>
              </div>
              <Link to="/events" className="text-sm font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400">
                View full schedule →
              </Link>
            </div>

            <div className="no-scrollbar mt-5 flex items-center gap-2 overflow-x-auto pb-2" role="tablist" aria-label="Filter by category">
              {EVENT_CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  role="tab"
                  aria-selected={category === c}
                  onClick={() => setCategory(c)}
                  className={`category-chip shrink-0 ${category === c ? "is-active" : ""}`}
                >
                  {c}
                  <span className={`rounded-full px-1.5 text-[10px] font-bold ${category === c ? "bg-white/25" : "bg-slate-100 text-slate-500 dark:bg-slate-800"}`}>
                    {counts[c] || 0}
                  </span>
                </button>
              ))}
            </div>
          </Reveal>

          <div className="mt-8">
            {loading && <Loading label="Loading events..." />}
            {error && <p className="text-sm font-semibold text-rose-600">{error}</p>}
            {!loading && !error && shown.length === 0 && (
              <EmptyState title={`No ${category} events yet`} description="Try another track or check back soon." />
            )}
            {shown.length > 0 && (
              <div key={category} className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {shown.map((e, i) => (
                  <Reveal key={e._id} delay={i * 70} className="h-full">
                    <EventCard event={e} />
                  </Reveal>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Pillars */}
        <section className="section">
          <Reveal className="max-w-2xl">
            <span className="eyebrow text-brand-600 dark:text-brand-400">Our focus</span>
            <h2 className="display m-0 mt-1 text-3xl font-extrabold text-slate-900 dark:text-white sm:text-4xl">
              Built for people who want to keep learning.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-500 dark:text-slate-400 sm:text-base">
              Every event belongs to a track, so you can find what fits your goals and skip the rest.
            </p>
          </Reveal>
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {PILLARS.map((p, i) => (
              <Reveal key={p.n} delay={i * 80} className="h-full">
                <Pillar p={p} />
              </Reveal>
            ))}
          </div>
        </section>

        {/* Steps */}
        <section className="section">
          <Reveal>
            <div className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-8 dark:border-slate-800 dark:bg-slate-900 sm:p-12">
              <h2 className="display m-0 text-2xl font-extrabold text-slate-900 dark:text-white sm:text-3xl">How it works</h2>
              <ol className="relative m-0 mt-8 grid list-none gap-8 p-0 md:grid-cols-3">
                <span className="absolute left-0 right-0 top-5 hidden h-px bg-gradient-to-r from-transparent via-brand-300 to-transparent dark:via-brand-700 md:block" aria-hidden="true" />
                {STEPS.map((s) => (
                  <li key={s.n} className="relative">
                    <span className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 font-bold text-white ring-8 ring-white dark:ring-slate-900">
                      {s.n}
                    </span>
                    <h3 className="mt-4 mb-0 text-lg font-bold text-slate-900 dark:text-white">{s.title}</h3>
                    <p className="mt-1 mb-0 text-sm text-slate-500 dark:text-slate-400">{s.desc}</p>
                  </li>
                ))}
              </ol>
            </div>
          </Reveal>
        </section>

        {/* Organizer CTA */}
        <section className="section mb-16">
          <Reveal>
            <div className="relative grid overflow-hidden rounded-3xl bg-slate-950 text-white lg:grid-cols-2">
              <div className="blob-a pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-brand-600/30 blur-[100px]" aria-hidden="true" />
              <div className="relative z-10 flex flex-col justify-center p-8 sm:p-12">
                <span className="eyebrow text-brand-300">Organizers · Abaabule</span>
                <h2 className="display m-0 mt-2 text-3xl font-extrabold text-white sm:text-4xl">
                  Hosting a workshop, lecture or conference?
                </h2>
                <p className="mt-4 text-slate-300">
                  Publish events, approve registrations, scan QR passes at the door and share materials privately.
                </p>
                <div className="mt-7 flex flex-wrap items-center gap-4">
                  <Link to="/organizer/signup" className="btn btn-primary">Create organizer account</Link>
                  <Link to="/organizer/login" className="text-sm font-semibold text-slate-300 hover:text-white">Sign in →</Link>
                </div>
              </div>
              <img src="/images/edu-lecture.jpg" alt="A speaker presenting in a lecture hall" loading="lazy" className="relative h-64 w-full object-cover lg:h-full" />
            </div>
          </Reveal>
        </section>
      </div>
    </PublicLayout>
  );
}
