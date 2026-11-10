import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import client from "../api/client.js";
import EmptyState from "../components/ui/EmptyState.jsx";
import Loading from "../components/ui/Loading.jsx";
import PublicLayout from "../components/layout/PublicLayout.jsx";
import EventCard from "../components/EventCard.jsx";
import PremiumEventCard from "../components/PremiumEventCard.jsx";
import { EVENT_CATEGORIES, getCategoryMeta } from "../utils/categories.js";

const REGIONS = [
  { id: "all", label: "All Locations" },
  { id: "mogadishu", label: "Mogadishu" },
  { id: "hargeisa", label: "Hargeisa" },
  { id: "garowe", label: "Garowe" },
  { id: "nairobi", label: "Nairobi" },
  { id: "london", label: "London" },
  { id: "minneapolis", label: "Minneapolis" },
  { id: "online", label: "Online / Hybrid" },
];

export default function EventsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const initialSearch = searchParams.get("search") || "";
  const initialCategory = searchParams.get("category") || "All";

  const [search, setSearch] = useState(initialSearch);
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [activeRegion, setActiveRegion] = useState("all");
  const [pricingFilter, setPricingFilter] = useState("all"); // "all" | "free" | "ticketed"

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

  // Sync state if URL search query changes
  useEffect(() => {
    const cat = searchParams.get("category");
    if (cat && cat !== activeCategory) {
      setActiveCategory(cat);
    }
    const q = searchParams.get("search");
    if (q !== null && q !== search) {
      setSearch(q);
    }
  }, [searchParams]);

  const handleCategoryChange = (cat) => {
    setActiveCategory(cat);
    const nextParams = new URLSearchParams(searchParams);
    if (cat === "All") {
      nextParams.delete("category");
    } else {
      nextParams.set("category", cat);
    }
    setSearchParams(nextParams);
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return events.filter((e) => {
      // Search matching title, description, location
      if (q) {
        const textToMatch = `${e.title || ""} ${e.description || ""} ${e.location || ""}`.toLowerCase();
        if (!textToMatch.includes(q)) return false;
      }

      // Region / Location filter
      if (activeRegion !== "all") {
        const loc = (e.location || "").toLowerCase();
        if (activeRegion === "online") {
          if (!loc.includes("online") && !loc.includes("hybrid") && !loc.includes("virtual")) {
            return false;
          }
        } else if (!loc.includes(activeRegion.toLowerCase())) {
          return false;
        }
      }

      // Category filter
      if (activeCategory !== "All") {
        if (e.category && e.category.toLowerCase() === activeCategory.toLowerCase()) {
          // match
        } else {
          const meta = getCategoryMeta(e.category);
          if (meta.label.toLowerCase() !== activeCategory.toLowerCase()) {
            return false;
          }
        }
      }

      // Pricing filter
      if (pricingFilter === "free") {
        if (e.isPremium) return false;
      } else if (pricingFilter === "ticketed") {
        if (!e.isPremium) return false;
      }

      return true;
    });
  }, [events, search, activeCategory, activeRegion, pricingFilter]);

  const renderCard = (e) =>
    e.isPremium ? <PremiumEventCard key={e._id} event={e} /> : <EventCard key={e._id} event={e} />;

  return (
    <PublicLayout>
      {/* Header section */}
      <section className="bg-slate-900 text-white border-b border-slate-800 py-14 sm:py-20 relative overflow-hidden">
        <div className="absolute top-0 right-1/4 w-[500px] h-[300px] bg-brand-500/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="shell-wrap relative z-10">
          <div className="max-w-2xl">
            <span className="eyebrow text-brand-400">Discover Opportunities</span>
            <h1 className="display text-4xl sm:text-5xl font-extrabold text-white mt-2">
              Educational &amp; Tech Programs
            </h1>
            <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed">
              Explore upcoming academic conferences, hands-on development workshops, AI summits, competitive hackathons, and Islamic knowledge seminars.
            </p>
          </div>

          {/* Search bar inside header */}
          <div className="mt-8 max-w-xl">
            <div className="relative">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <input
                type="text"
                placeholder="Search by topic, speaker, university, or city..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-slate-800/90 border border-slate-700/80 rounded-2xl text-white placeholder-slate-400 text-sm focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/20 transition-all"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs font-semibold px-2 py-1 rounded bg-slate-700/50"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="shell-wrap py-10">
        {/* Interactive Filters Area */}
        <div className="space-y-5 pb-8 border-b border-slate-200/80 dark:border-slate-800">
          {/* Category Chips Bar */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Academic &amp; Professional Tracks:
              </span>
              {activeCategory !== "All" && (
                <button
                  type="button"
                  onClick={() => handleCategoryChange("All")}
                  className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline"
                >
                  Reset track
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none no-scrollbar">
              {EVENT_CATEGORIES.map((cat) => {
                const isActive = activeCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleCategoryChange(cat)}
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

          {/* Secondary Filters: Location & Access Type */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 text-xs">
            {/* Regions / Cities */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-slate-400 font-semibold mr-1">Location:</span>
              {REGIONS.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setActiveRegion(r.id)}
                  className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                    activeRegion === r.id
                      ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-bold"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>

            {/* Access Type (Free vs Ticketed) */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-semibold mr-1">Access:</span>
              {[
                { id: "all", label: "All" },
                { id: "free", label: "Free Admission" },
                { id: "ticketed", label: "Certified / VIP" },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPricingFilter(p.id)}
                  className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                    pricingFilter === p.id
                      ? "bg-brand-600 text-white font-bold"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results stats */}
        <div className="flex items-center justify-between py-6">
          <p className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 m-0">
            Showing <span className="text-slate-900 dark:text-white font-bold">{filtered.length}</span> event{filtered.length === 1 ? "" : "s"}
            {activeCategory !== "All" && ` in ${activeCategory}`}
            {search && ` matching "${search}"`}
          </p>

          {(search || activeCategory !== "All" || activeRegion !== "all" || pricingFilter !== "all") && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setActiveCategory("All");
                setActiveRegion("all");
                setPricingFilter("all");
                setSearchParams({});
              }}
              className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline"
            >
              Clear all filters
            </button>
          )}
        </div>

        {/* Content list */}
        {loading && <Loading label="Loading verified events..." />}
        {error && <p className="text-rose-600 text-sm font-semibold">{error}</p>}

        {!loading && !error && (
          filtered.length === 0 ? (
            <EmptyState
              title="No events match your current filters"
              description="Try adjusting your search criteria, selecting another discipline track, or clearing filters."
              action={
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setActiveCategory("All");
                    setActiveRegion("all");
                    setPricingFilter("all");
                    setSearchParams({});
                  }}
                  className="btn btn-secondary mt-4"
                >
                  Reset all filters
                </button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map(renderCard)}
            </div>
          )
        )}
      </div>
    </PublicLayout>
  );
}
