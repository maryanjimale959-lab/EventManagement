import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import client from "../api/client.js";
import EmptyState from "../components/ui/EmptyState.jsx";
import Loading from "../components/ui/Loading.jsx";
import SectionHeader from "../components/ui/SectionHeader.jsx";
import PublicLayout from "../components/layout/PublicLayout.jsx";
import Hero from "../components/Hero.jsx";
import EventCard from "../components/EventCard.jsx";
import PremiumEventCard from "../components/PremiumEventCard.jsx";
import { EVENT_CATEGORIES, getCategoryMeta } from "../utils/categories.js";

const PLATFORM_PILLARS = [
  {
    number: "01",
    title: "Academic Excellence & Fellowships",
    desc: "Connect with university faculties, academic researchers, and educational symposia across the homeland and global diaspora.",
    badge: "Academics",
  },
  {
    number: "02",
    title: "Practical Labs & Technical Workshops",
    desc: "Hands-on engineering masterclasses, cloud infrastructure bootcamps, and certified technical training with industry mentors.",
    badge: "Practical Skills",
  },
  {
    number: "03",
    title: "AI Summits & Hackathon Competitions",
    desc: "Competitive hackathons, artificial intelligence breakthroughs, machine learning demos, and startup pitch showdowns.",
    badge: "Innovation",
  },
  {
    number: "04",
    title: "Islamic Studies & Ethical Leadership",
    desc: "Classical Islamic sciences, youth tafseer conferences, ethical leadership seminars, and community intellectual heritage.",
    badge: "Values & Ethics",
  },
];

export default function PublicEventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

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

  const filteredEvents = useMemo(() => {
    if (selectedCategory === "All") return events;
    return events.filter((e) => {
      if (e.category && e.category.toLowerCase() === selectedCategory.toLowerCase()) {
        return true;
      }
      // Fallback matching
      const meta = getCategoryMeta(e.category);
      return meta.label.toLowerCase() === selectedCategory.toLowerCase();
    });
  }, [events, selectedCategory]);

  const displayList = filteredEvents.slice(0, 6);

  const renderCard = (e) =>
    e.isPremium ? <PremiumEventCard key={e._id} event={e} /> : <EventCard key={e._id} event={e} />;

  return (
    <PublicLayout>
      <Hero />

      <div className="shell-wrap">
        {/* Interactive Category Filter Bar */}
        <div className="section pt-6" id="categories">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800">
            <div>
              <span className="eyebrow text-brand-600 dark:text-brand-400">Curated Disciplines</span>
              <h2 className="display text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
                Explore by Specialization
              </h2>
            </div>
            <Link
              to="/events"
              className="text-xs sm:text-sm font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 inline-flex items-center gap-1.5"
            >
              <span>View complete schedule</span>
              <span>→</span>
            </Link>
          </div>

          <div className="mt-5 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none no-scrollbar">
            {EVENT_CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`category-chip shrink-0 ${isActive ? "is-active" : ""}`}
                >
                  {cat !== "All" && (
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isActive ? "bg-white" : getCategoryMeta(cat).dotClass
                      }`}
                    />
                  )}
                  <span>{cat}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Featured Events Grid */}
        <div className="section mt-10">
          <SectionHeader
            title={
              selectedCategory === "All"
                ? "Upcoming Gatherings & Programs"
                : `${selectedCategory} Events`
            }
            subtitle={
              selectedCategory === "All"
                ? "Conferences, workshops, and symposiums open for registration"
                : `Showing verified programs in ${selectedCategory}`
            }
            actions={
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {filteredEvents.length} program{filteredEvents.length === 1 ? "" : "s"} found
              </span>
            }
          />

          {loading && <Loading label="Loading verified events..." />}
          {error && <p className="text-rose-600 text-sm font-semibold">{error}</p>}

          {!loading && !error && (
            displayList.length === 0 ? (
              <EmptyState
                title={`No events found in ${selectedCategory}`}
                description="Be the first to organize a conference or workshop in this track."
                action={
                  <Link to="/organizer/dashboard/events" className="btn btn-primary mt-4">
                    Create Event in this Track
                  </Link>
                }
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayList.map(renderCard)}
              </div>
            )
          )}

          {displayList.length > 0 && (
            <div className="mt-10 text-center">
              <Link to="/events" className="btn btn-primary px-8 py-3 text-sm">
                Explore All {events.length} Programs
              </Link>
            </div>
          )}
        </div>

        {/* Platform Pillars Section */}
        <div className="section">
          <div className="max-w-2xl mb-10">
            <span className="eyebrow text-brand-600 dark:text-brand-400">Our Mission</span>
            <h2 className="display text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mt-1">
              Engineered for intellectual and professional advancement.
            </h2>
            <p className="text-muted mt-3 text-sm sm:text-base leading-relaxed">
              Kulan is intentionally constructed to elevate educational access, accelerate tech innovation, and preserve shared values across the Somali community worldwide.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {PLATFORM_PILLARS.map((p) => (
              <div
                key={p.number}
                className="p-7 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-brand-500/40 transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="font-display font-extrabold text-2xl text-brand-600 dark:text-brand-400">
                    {p.number}
                  </span>
                  <span className="px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {p.badge}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white m-0">
                  {p.title}
                </h3>
                <p className="text-muted text-xs sm:text-sm mt-2 mb-0 leading-relaxed">
                  {p.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Check-In and Private Learning Archive Flow */}
        <div className="section">
          <div className="rounded-3xl bg-slate-900 text-white p-8 sm:p-12 relative overflow-hidden border border-slate-800 shadow-xl">
            <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/10 blur-[100px] pointer-events-none rounded-full" />
            <div className="relative z-10 max-w-2xl">
              <span className="eyebrow text-brand-400">Frictionless Experience</span>
              <h2 className="display text-3xl sm:text-4xl text-white font-extrabold mt-2">
                Seamless QR check-in &amp; gated lecture archives.
              </h2>
              <p className="text-slate-300 mt-4 text-sm sm:text-base leading-relaxed">
                Attendees receive a cryptographic digital pass upon registration. Organizers verify badges in milliseconds at the venue entrance. Once checked in, attendees immediately unlock exclusive lecture materials, slides, and private event media galleries.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link to="/events" className="btn btn-primary text-sm px-6 py-3">
                  Find an Event
                </Link>
                <Link
                  to="/how-it-works"
                  className="btn btn-secondary text-sm px-5 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/20"
                >
                  Read Architecture Guide
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Organizer Callout Banner */}
        <div className="section mb-16">
          <div className="rounded-3xl bg-gradient-to-br from-brand-900 via-slate-900 to-slate-950 p-8 sm:p-14 text-white border border-brand-800/40 relative overflow-hidden">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brand-500/20 text-brand-300 border border-brand-500/30 mb-4">
                <span>Organizer Console</span>
                <span className="text-[10px] font-bold">Abaabule</span>
              </span>
              <h2 className="display text-3xl sm:text-4xl font-extrabold text-white m-0">
                Are you hosting an educational workshop, AI summit, or conference?
              </h2>
              <p className="mt-4 text-sm sm:text-base text-slate-300 leading-relaxed">
                Take full control of registration caps, automated approval workflows, rapid QR check-in door scanners, photographer media uploads, and private attendee galleries.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link to="/organizer/signup" className="btn btn-primary text-sm px-6 py-3">
                  Create Organizer Account
                </Link>
                <Link
                  to="/organizer/login"
                  className="text-sm font-semibold text-slate-300 hover:text-white transition-colors px-3 py-2"
                >
                  Organizer Sign In →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
