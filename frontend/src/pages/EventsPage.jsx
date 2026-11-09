import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import client from "../api/client.js";
import EmptyState from "../components/ui/EmptyState.jsx";
import Loading from "../components/ui/Loading.jsx";
import Input from "../components/ui/Input.jsx";
import PublicLayout from "../components/layout/PublicLayout.jsx";
import EventCard from "../components/EventCard.jsx";
import PremiumEventCard from "../components/PremiumEventCard.jsx";

/**
 * A mosaic of the events actually on this page, so it changes as real events
 * are published instead of being decoration unrelated to the content. Only
 * events with a cover qualify. When none have one, the panel says so plainly
 * rather than filling the space with an icon.
 */
function EventMosaic({ events }) {
  const tiles = events.filter((e) => e.coverImageUrl).slice(0, 3);

  if (tiles.length === 0) {
    return (
      <div className="flex aspect-[4/3] flex-col justify-end rounded-3xl bg-slate-900 p-8">
        <p className="display m-0 text-3xl text-white">Nothing published yet.</p>
        <p className="mt-3 text-slate-400">When an organiser publishes an event, its photograph lands here.</p>
        <Link to="/register" className="btn btn-primary mt-6 self-start">
          Publish your event
        </Link>
      </div>
    );
  }

  // Three tiles make one tall panel beside two stacked ones, which fills the
  // rectangle exactly. Any other count stays an even row rather than leaving a
  // hole in the grid.
  const tall = tiles.length === 3;

  return (
    <div className="grid grid-cols-2 gap-3">
      {tiles.map((e, i) => (
        <Link
          key={e._id}
          to={`/events/${e._id}`}
          className={`group relative overflow-hidden rounded-2xl bg-slate-800 ${
            tall && i === 0 ? "row-span-2" : "aspect-square"
          }`}
        >
          <img
            src={e.coverImageUrl}
            alt={`Cover photograph for ${e.title}`}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
            loading="lazy"
          />
          <span className="photo-scrim-b opacity-90" />
          <span className="absolute inset-x-0 bottom-0 z-10 p-4 text-sm font-semibold text-white">
            {e.title}
          </span>
        </Link>
      ))}
    </div>
  );
}

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [activeCity, setActiveCity] = useState("all");
  const [activeCategory, setActiveCategory] = useState("all");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await client.get("/api/events/public");
        setEvents(res.data);
      } catch (err) {
        setError(err.response?.data?.error?.message || "Failed to load events");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return events.filter((e) => {
      const matchText = e.title.toLowerCase().includes(q) || (e.location || "").toLowerCase().includes(q);
      if (!matchText) return false;

      if (activeCity !== "all") {
        if (!e.location?.toLowerCase().includes(activeCity.toLowerCase())) return false;
      }

      if (activeCategory === "tech" && !/tech|summit|business|launch/i.test(e.title + e.description)) return false;
      if (activeCategory === "wedding" && !/wedding|aroos|reception/i.test(e.title + e.description)) return false;
      if (activeCategory === "culture" && !/book|dhaanto|culture|market|arts/i.test(e.title + e.description)) return false;
      if (activeCategory === "youth" && !/youth|leadership|innovation|forum/i.test(e.title + e.description)) return false;

      return true;
    });
  }, [events, search, activeCity, activeCategory]);

  return (
    <PublicLayout>
      <section className="border-b border-slate-200/70 dark:border-slate-800">
        <div className="shell-wrap grid gap-12 py-16 sm:py-24 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <p className="eyebrow mb-4 text-brand-600 dark:text-brand-400">What's on</p>
            <h1 className="display m-0 text-5xl sm:text-6xl text-slate-900 dark:text-white">
              Every public event, in one place.
            </h1>
            <p className="mt-6 text-lg text-slate-600 dark:text-slate-300 max-w-lg">
              Browse what is open, register in a minute, and your gallery unlocks the moment you are
              checked in at the door.
            </p>

            <div className="max-w-md mt-9">
              <Input
                className="!mb-0"
                placeholder="Search by title or location"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <EventMosaic events={events} />
        </div>
      </section>

      <div className="shell-wrap">
        <div className="section">
          {/* Somali Categories & Cities Filter Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-200/80 dark:border-slate-800">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase text-slate-400 mr-1">Category:</span>
              {[
                { id: "all", label: "All (Dhammaan)" },
                { id: "tech", label: "⚡ Tech & Business" },
                { id: "wedding", label: "💍 Aroos & Galas" },
                { id: "culture", label: "📚 Culture & Arts" },
                { id: "youth", label: "🌟 Youth & Forums" },
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveCategory(c.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                    activeCategory === c.id
                      ? "bg-brand-600 text-white shadow-sm"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase text-slate-400 mr-1">City:</span>
              {[
                { id: "all", label: "Everywhere" },
                { id: "mogadishu", label: "Mogadishu" },
                { id: "hargeisa", label: "Hargeisa" },
                { id: "garowe", label: "Garowe" },
                { id: "nairobi", label: "Nairobi" },
              ].map((city) => (
                <button
                  key={city.id}
                  onClick={() => setActiveCity(city.id)}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                    activeCity === city.id
                      ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900"
                      : "bg-transparent text-slate-600 dark:text-slate-400 hover:underline"
                  }`}
                >
                  {city.label}
                </button>
              ))}
            </div>
          </div>

          {loading && <Loading label="Loading Somali events..." />}
          {error && <p className="text-rose-600">{error}</p>}
          {!loading && !error && (
            filtered.length === 0 ? (
              <EmptyState
                title={events.length === 0 ? "No events published yet" : "No events match your search"}
                description={events.length === 0 ? "Check back soon, or log in as an organizer to create one." : "Try a different title or location."}
              />
            ) : (
              <div className="grid grid-3">
                {filtered.map((e) => (
                  e.isPremium ? <PremiumEventCard key={e._id} event={e} /> : <EventCard key={e._id} event={e} />
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </PublicLayout>
  );
}
