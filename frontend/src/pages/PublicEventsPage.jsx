import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import client from "../api/client.js";
import EmptyState from "../components/ui/EmptyState.jsx";
import Loading from "../components/ui/Loading.jsx";
import PublicLayout from "../components/layout/PublicLayout.jsx";
import Hero from "../components/Hero.jsx";
import EventCard from "../components/EventCard.jsx";
import { EVENT_CATEGORIES, CATEGORY_METADATA, getCategoryMeta } from "../utils/categories.js";

const STEPS = [
  { n: 1, title: "Find an event", desc: "Browse by track, city or price and open the one that fits." },
  { n: 2, title: "Register", desc: "Reserve your place. The organizer approves it and your QR pass is issued." },
  { n: 3, title: "Check in and learn", desc: "Scan at the door. Slides and photos unlock only for people who attended." },
];

const TILE_CATEGORIES = EVENT_CATEGORIES.filter((c) => c !== "All");

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
    const c = {};
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

      {/* Categories as tiles */}
      <section className="shell-wrap section" id="categories">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="display m-0 text-3xl sm:text-4xl text-slate-900 dark:text-white">Browse by topic</h2>
          <p className="mt-3 text-slate-500 dark:text-slate-400">Pick a track to see only the events that matter to you.</p>
        </div>
        <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
          {TILE_CATEGORIES.map((c) => {
            const active = category === c;
            return (
              <button
                key={c}
                type="button"
                onClick={() => {
                  setCategory(active ? "All" : c);
                  document.getElementById("events")?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                aria-pressed={active}
                className={`group rounded-3xl p-5 text-left transition-all duration-300 hover:-translate-y-1 ${
                  active
                    ? "bg-brand-600 text-white shadow-xl shadow-brand-600/25"
                    : "bg-slate-50 text-slate-900 ring-1 ring-slate-200 hover:bg-white hover:shadow-xl hover:shadow-brand-900/10 dark:bg-slate-900 dark:text-white dark:ring-slate-800"
                }`}
              >
                <span className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl text-sm font-extrabold ${active ? "bg-white/20 text-white" : "bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300"}`}>
                  {(counts[c] || 0).toString()}
                </span>
                <span className="mt-4 block text-base font-bold leading-snug">{c}</span>
                <span className={`mt-1 block text-xs leading-relaxed line-clamp-2 ${active ? "text-brand-100" : "text-slate-500 dark:text-slate-400"}`}>
                  {CATEGORY_METADATA[c]?.description}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Events */}
      <section className="bg-slate-50 py-16 sm:py-24 dark:bg-slate-900/40" id="events">
        <div className="shell-wrap">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="display m-0 text-3xl sm:text-4xl text-slate-900 dark:text-white">
                {category === "All" ? "Upcoming events" : category}
              </h2>
              <p className="mt-2 mb-0 text-slate-500 dark:text-slate-400">
                {filtered.length} event{filtered.length === 1 ? "" : "s"}
                {category !== "All" && (
                  <button type="button" onClick={() => setCategory("All")} className="ml-3 font-semibold text-brand-600 hover:underline dark:text-brand-400">
                    Clear filter
                  </button>
                )}
              </p>
            </div>
            <Link to="/events" className="btn btn-ghost">View all events</Link>
          </div>

          <div className="mt-8">
            {loading && <Loading label="Loading events..." />}
            {error && <p className="text-rose-600 text-sm font-semibold">{error}</p>}
            {!loading && !error && shown.length === 0 && (
              <EmptyState title="No events here yet" description="Try another topic or check back soon." />
            )}
            {shown.length > 0 && (
              <div key={category} className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 animate-[fadeUp_0.5s_ease-out]">
                {shown.map((e) => (
                  <EventCard key={e._id} event={e} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="shell-wrap section">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="display m-0 text-3xl sm:text-4xl text-slate-900 dark:text-white">How it works</h2>
          <p className="mt-3 text-slate-500 dark:text-slate-400">Three simple steps from discovery to learning.</p>
        </div>
        <ol className="mt-10 grid list-none gap-6 p-0 md:grid-cols-3">
          {STEPS.map((s) => (
            <li key={s.n} className="rounded-3xl bg-slate-50 p-7 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-600 text-lg font-extrabold text-white">{s.n}</span>
              <h3 className="mt-5 mb-0 text-xl font-bold text-slate-900 dark:text-white">{s.title}</h3>
              <p className="mt-2 mb-0 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{s.desc}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Organizer CTA */}
      <section className="shell-wrap pb-16 sm:pb-24">
        <div className="grid overflow-hidden rounded-3xl bg-brand-600 text-white lg:grid-cols-2">
          <div className="p-8 sm:p-14 flex flex-col justify-center">
            <p className="m-0 text-sm font-semibold text-brand-200">For organizers · Abaabule</p>
            <h2 className="display m-0 mt-3 text-3xl sm:text-4xl text-white">Host your own workshop, lecture or conference.</h2>
            <p className="mt-4 text-brand-100 leading-relaxed">
              Publish events, approve registrations, scan QR passes at the door and share materials privately.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link to="/organizer/signup" className="btn bg-white !text-brand-700 hover:bg-brand-50">Become an organizer</Link>
              <Link to="/organizer/login" className="btn !text-white ring-1 ring-white/40 hover:bg-white/10">Sign in</Link>
            </div>
          </div>
          <img src="/images/edu-library.jpg" alt="Students studying in a library" loading="lazy" className="h-64 w-full object-cover lg:h-full" />
        </div>
      </section>
    </PublicLayout>
  );
}
