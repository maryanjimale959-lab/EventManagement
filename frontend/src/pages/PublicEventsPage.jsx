import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import client from "../api/client.js";
import EmptyState from "../components/ui/EmptyState.jsx";
import Loading from "../components/ui/Loading.jsx";
import PublicLayout from "../components/layout/PublicLayout.jsx";
import Hero from "../components/Hero.jsx";
import EventCard from "../components/EventCard.jsx";
import { EVENT_CATEGORIES, getCategoryMeta } from "../utils/categories.js";

const STEPS = [
  { n: "01", title: "Find", desc: "Browse by topic, city or price and open the event that fits." },
  { n: "02", title: "Register", desc: "Reserve a place. The organizer approves it and your QR pass is issued." },
  { n: "03", title: "Attend", desc: "Scan at the door. Slides and photos unlock only for people who were there." },
];

const TOPICS = EVENT_CATEGORIES.filter((c) => c !== "All");

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
  const shown = filtered.slice(0, 8);

  const pick = (c) => {
    setCategory((cur) => (cur === c ? "All" : c));
    document.getElementById("agenda")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <PublicLayout>
      <Hero />

      {/* Agenda */}
      <section className="shell-wrap section" id="agenda">
        <div className="flex flex-wrap items-end justify-between gap-4 pb-6">
          <div>
            <p className="eyebrow m-0 text-slate-900 dark:text-slate-300">[ Agenda ]</p>
            <h2 className="display m-0 mt-3 text-5xl uppercase text-slate-900 dark:text-white sm:text-7xl">
              {category === "All" ? "Coming up" : category}
            </h2>
          </div>
          <div className="font-mono text-sm uppercase tracking-wider text-slate-900 dark:text-slate-200">
            {filtered.length} event{filtered.length === 1 ? "" : "s"}
            {category !== "All" && (
              <button type="button" onClick={() => setCategory("All")} className="ml-4 underline underline-offset-4 hover:bg-accent-400 hover:text-slate-900">
                Clear
              </button>
            )}
          </div>
        </div>

        <div>
          {loading && <Loading label="Loading events..." />}
          {error && <p className="font-semibold text-rose-600">{error}</p>}
          {!loading && !error && shown.length === 0 && (
            <EmptyState title="Nothing here yet" description="Try another topic or check back soon." />
          )}
          {shown.length > 0 && (
            <div key={category} className="border-b-2 border-slate-900 dark:border-slate-700 animate-[fadeUp_0.5s_ease-out]">
              {shown.map((e) => (
                <EventCard key={e._id} event={e} />
              ))}
            </div>
          )}
          <div className="mt-8">
            <Link to="/events" className="btn btn-primary">All events →</Link>
          </div>
        </div>
      </section>

      {/* Topics as a typographic index */}
      <section className="bg-slate-900 py-16 text-white sm:py-24 dark:bg-slate-900">
        <div className="shell-wrap">
          <p className="eyebrow m-0 text-accent-400">[ Topics ]</p>
          <h2 className="display m-0 mt-3 text-5xl uppercase sm:text-7xl">Pick a track</h2>
          <ul className="mt-10 m-0 list-none border-b border-slate-700 p-0">
            {TOPICS.map((c, i) => (
              <li key={c}>
                <button
                  type="button"
                  onClick={() => pick(c)}
                  className={`group flex w-full items-baseline gap-4 border-t border-slate-700 px-2 py-4 text-left transition-colors hover:bg-accent-400 hover:text-slate-900 sm:gap-8 sm:px-4 ${
                    category === c ? "bg-accent-400 text-slate-900" : ""
                  }`}
                >
                  <span className="font-mono text-sm opacity-60">{String(i + 1).padStart(2, "0")}</span>
                  <span className="display flex-1 text-3xl sm:text-5xl">{c}</span>
                  <span className="font-mono text-sm">{counts[c] || 0}</span>
                  <span className="translate-x-0 transition-transform group-hover:translate-x-1" aria-hidden="true">→</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Steps */}
      <section className="shell-wrap section">
        <p className="eyebrow m-0 text-slate-900 dark:text-slate-300">[ How it works ]</p>
        <div className="mt-8 grid border-2 border-slate-900 dark:border-slate-700 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <div key={s.n} className={`p-8 ${i > 0 ? "border-t-2 border-slate-900 md:border-l-2 md:border-t-0 dark:border-slate-700" : ""}`}>
              <span className="display block text-7xl text-slate-900 dark:text-white">{s.n}</span>
              <h3 className="mt-6 mb-0 text-2xl font-bold uppercase text-slate-900 dark:text-white">{s.title}</h3>
              <p className="mt-2 mb-0 text-slate-600 dark:text-slate-400">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Organizer CTA */}
      <section className="bg-accent-400">
        <div className="shell-wrap grid gap-8 py-16 sm:py-24 lg:grid-cols-[1.4fr_1fr] lg:items-end">
          <div>
            <p className="eyebrow m-0 text-slate-900">[ Organizers · Abaabule ]</p>
            <h2 className="display m-0 mt-3 text-5xl uppercase text-slate-900 sm:text-7xl lg:text-8xl">Host an event.</h2>
          </div>
          <div>
            <p className="m-0 text-lg text-slate-900">
              Publish, approve registrations, scan QR passes at the door and share materials privately.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/organizer/signup" className="btn !bg-slate-900 !text-white hover:!bg-white hover:!text-slate-900 !border-slate-900">Become an organizer</Link>
              <Link to="/organizer/login" className="btn !bg-transparent !text-slate-900 !border-slate-900 hover:!bg-slate-900 hover:!text-white">Sign in</Link>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
