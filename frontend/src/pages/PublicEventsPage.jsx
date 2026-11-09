import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import client from "../api/client.js";
import EmptyState from "../components/ui/EmptyState.jsx";
import Loading from "../components/ui/Loading.jsx";
import PublicLayout from "../components/layout/PublicLayout.jsx";
import Hero from "../components/Hero.jsx";
import EventCard from "../components/EventCard.jsx";
import { EVENT_CATEGORIES, getCategoryMeta } from "../utils/categories.js";

const TRACKS = [
  { n: "01", title: "Academics & research", desc: "Symposiums, fellowships and lectures with universities and researchers." },
  { n: "02", title: "Practical workshops", desc: "Hands-on labs and bootcamps led by working engineers and trainers." },
  { n: "03", title: "AI & hackathons", desc: "Summits, build weekends and demo days for people making new things." },
  { n: "04", title: "Islamic studies & ethics", desc: "Lectures and seminars on knowledge, character and leadership." },
];

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

  const filtered = useMemo(() => {
    if (category === "All") return events;
    return events.filter((e) => getCategoryMeta(e.category).label === category);
  }, [events, category]);

  const shown = filtered.slice(0, 6);

  return (
    <PublicLayout>
      <Hero />

      <div className="shell-wrap">
        {/* Upcoming events */}
        <section className="section" id="events">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="eyebrow text-brand-700 dark:text-brand-300 m-0">What's on</p>
              <h2 className="display m-0 mt-2 text-3xl sm:text-4xl text-slate-900 dark:text-white">Upcoming events</h2>
            </div>
            <Link to="/events" className="text-sm font-semibold text-brand-700 dark:text-brand-300 hover:underline">
              See all events →
            </Link>
          </div>

          <div className="mt-6 flex gap-2 overflow-x-auto pb-2" role="tablist" aria-label="Filter by category">
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
              </button>
            ))}
          </div>

          <div className="mt-6">
            {loading && <Loading label="Loading events..." />}
            {error && <p className="text-rose-600 text-sm font-semibold">{error}</p>}
            {!loading && !error && shown.length === 0 && (
              <EmptyState title={`No ${category === "All" ? "" : category + " "}events yet`} description="Check back soon or try another category." />
            )}
            {shown.length > 0 && (
              <div key={category} className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 animate-[fadeUp_0.5s_ease-out]">
                {shown.map((e) => (
                  <EventCard key={e._id} event={e} />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Tracks: a ruled list, not a grid of boxes */}
        <section className="section">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="eyebrow text-brand-700 dark:text-brand-300 m-0">Our focus</p>
              <h2 className="display m-0 mt-2 text-3xl sm:text-4xl text-slate-900 dark:text-white">
                Four ways to keep learning.
              </h2>
              <p className="mt-4 text-slate-600 dark:text-slate-400 leading-relaxed">
                Every event on the platform belongs to a track, so you can find what fits your goals
                and skip the rest.
              </p>
            </div>
            <ol className="m-0 p-0 list-none">
              {TRACKS.map((t) => (
                <li key={t.n} className="grid grid-cols-[auto_1fr] gap-5 border-t border-slate-200 py-6 last:border-b dark:border-slate-800">
                  <span className="display text-2xl text-brand-600 dark:text-brand-300 tabular-nums">{t.n}</span>
                  <div>
                    <h3 className="m-0 text-lg font-semibold text-slate-900 dark:text-white">{t.title}</h3>
                    <p className="m-0 mt-1 text-sm text-slate-600 dark:text-slate-400">{t.desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* How attending works */}
        <section className="section">
          <div className="grid overflow-hidden rounded-3xl border border-slate-200 bg-brand-50 dark:border-slate-800 dark:bg-brand-950/40 lg:grid-cols-2">
            <div className="p-8 sm:p-12 flex flex-col justify-center">
              <p className="eyebrow text-brand-700 dark:text-brand-300 m-0">For attendees</p>
              <h2 className="display m-0 mt-2 text-3xl text-slate-900 dark:text-white">
                Register, show your QR, keep the materials.
              </h2>
              <p className="mt-4 text-slate-700 dark:text-slate-300 leading-relaxed">
                After the organizer approves you, a personal QR pass is ready. Scan it at the door,
                and slides and event photos unlock just for you.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link to="/register" className="btn btn-primary">Create an account</Link>
                <Link to="/how-it-works" className="btn btn-ghost">How it works</Link>
              </div>
            </div>
            <img
              src="/images/edu-lecture.jpg"
              alt="A speaker presenting to an audience in a lecture hall"
              loading="lazy"
              className="h-64 w-full object-cover lg:h-full"
            />
          </div>
        </section>

        {/* Organizers */}
        <section className="section mb-16">
          <div className="grid items-center gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <img
              src="/images/edu-workshop.jpg"
              alt="An instructor helping students during a coding workshop"
              loading="lazy"
              className="aspect-[16/10] w-full rounded-3xl border border-slate-200 object-cover dark:border-slate-800"
            />
            <div>
              <p className="eyebrow text-brand-700 dark:text-brand-300 m-0">For organizers · Abaabule</p>
              <h2 className="display m-0 mt-2 text-3xl sm:text-4xl text-slate-900 dark:text-white">
                Hosting a workshop, lecture or conference?
              </h2>
              <p className="mt-4 text-slate-600 dark:text-slate-400 leading-relaxed">
                Publish your event, approve registrations, scan QR passes at the door and share
                materials privately with the people who attended.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-4">
                <Link to="/organizer/signup" className="btn btn-primary">Become an organizer</Link>
                <Link to="/organizer/login" className="text-sm font-semibold text-brand-700 dark:text-brand-300 hover:underline">
                  Organizer sign in →
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </PublicLayout>
  );
}
