import { useEffect, useMemo, useState } from "react";
import { Navigate, useLocation, useSearchParams } from "react-router-dom";
import client from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import PublicLayout from "../components/layout/PublicLayout.jsx";
import EventCard, { EventRow } from "../components/EventCard.jsx";
import Segmented from "../components/ui/Segmented.jsx";
import { EventCardSkeleton } from "../components/ui/Skeleton.jsx";
import PremiumEventCard from "../components/PremiumEventCard.jsx";
import { EVENT_CATEGORIES, getCategoryMeta } from "../utils/categories.js";

const REGIONS = [
  { id: "all", label: "All locations" },
  { id: "mogadishu", label: "Mogadishu" },
  { id: "hargeisa", label: "Hargeisa" },
  { id: "garowe", label: "Garowe" },
  { id: "nairobi", label: "Nairobi" },
  { id: "london", label: "London" },
  { id: "minneapolis", label: "Minneapolis" },
  { id: "online", label: "Online or hybrid" },
];

export default function EventsPage() {
  const { isAuthed } = useAuth();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [view, setView] = useState(() => {
    try { return localStorage.getItem("ems_events_view") === "list" ? "list" : "grid"; } catch { return "grid"; }
  });
  const changeView = (v) => {
    setView(v);
    try { localStorage.setItem("ems_events_view", v); } catch { /* storage unavailable */ }
  };

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

  if (isAuthed) {
    return <Navigate to={`/dashboard${location.search}`} replace />;
  }

  const renderCard = (e, i) => (
    <div key={e._id} className="rise h-full" style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}>
      {view === "list" ? <EventRow event={e} /> : e.isPremium ? <PremiumEventCard event={e} /> : <EventCard event={e} />}
    </div>
  );

  const hasFilters = search || activeCategory !== "All" || activeRegion !== "all" || pricingFilter !== "all";

  const resetFilters = () => {
    setSearch("");
    setActiveCategory("All");
    setActiveRegion("all");
    setPricingFilter("all");
    setSearchParams({});
  };

  return (
    <PublicLayout>
      <div className="shell-wrap pt-10 sm:pt-14">
        <h1 className="display m-0 text-4xl text-slate-900 sm:text-5xl dark:text-white">Events</h1>
        <p className="mt-3 text-lg text-slate-600 dark:text-slate-400">
          Conferences, workshops, AI summits, hackathons and seminars. Filter down to what fits you.
        </p>

        {/* Filters stay pinned under the navbar while the list scrolls */}
        <div className="sticky top-16 z-30 -mx-4 mt-6 border-b border-slate-200 bg-slate-50/90 px-4 pb-3 pt-3 backdrop-blur-md sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 dark:border-slate-800 dark:bg-slate-950/90">
        <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
          <div className="input-wrapper">
            <span className="input-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <circle cx="11" cy="11" r="7.5" />
                <path d="m20.5 20.5-4.2-4.2" strokeLinecap="round" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search by topic, speaker or city"
              aria-label="Search events"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input with-icon"
            />
          </div>
          <select
            className="select md:w-48"
            aria-label="Location"
            value={activeRegion}
            onChange={(e) => setActiveRegion(e.target.value)}
          >
            {REGIONS.map((r) => (
              <option key={r.id} value={r.id}>{r.label}</option>
            ))}
          </select>
          <select
            className="select md:w-40"
            aria-label="Price"
            value={pricingFilter}
            onChange={(e) => setPricingFilter(e.target.value)}
          >
            <option value="all">Any price</option>
            <option value="free">Free</option>
            <option value="ticketed">Paid</option>
          </select>
        </div>

        <div className="no-scrollbar chip-scroller -mx-4 mt-4 flex items-center gap-2 overflow-x-auto px-4 pb-1" role="tablist" aria-label="Filter by track">
          {EVENT_CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => handleCategoryChange(cat)}
                className={`category-chip shrink-0 ${isActive ? "is-active" : ""}`}
              >
                {cat !== "All" && (
                  <span className={`h-2 w-2 rounded-full ${getCategoryMeta(cat).dotClass}`} aria-hidden="true" />
                )}
                {cat}
              </button>
            );
          })}
        </div>
        </div>

        <div className="mt-6 flex items-center justify-between gap-4">
          <p className="m-0 text-sm text-slate-600 dark:text-slate-400">
            <span className="font-semibold text-slate-900 dark:text-white">{filtered.length}</span> event{filtered.length === 1 ? "" : "s"}
            {activeCategory !== "All" && ` in ${activeCategory}`}
            {search && ` matching “${search}”`}
          </p>
          <div className="flex items-center gap-3">
            {hasFilters && (
              <button type="button" onClick={resetFilters} className="text-sm font-medium text-slate-700 hover:underline dark:text-slate-300">
                Clear filters
              </button>
            )}
            <Segmented
              label="Layout"
              value={view}
              onChange={changeView}
              options={[{ value: "grid", label: "Grid" }, { value: "list", label: "List" }]}
            />
          </div>
        </div>

        <div className="mt-6">
          {loading && (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3" aria-busy="true">
              {[0, 1, 2].map((i) => <EventCardSkeleton key={i} />)}
            </div>
          )}
          {error && <p className="text-sm font-medium text-slate-900 dark:text-white">{error}</p>}

          {!loading && !error && (
            filtered.length === 0 ? (
              <EmptyState
                title="No events match these filters"
                description="Change the search, pick another track, or clear the filters."
                action={
                  <button type="button" onClick={resetFilters} className="btn btn-secondary mt-4">
                    Clear filters
                  </button>
                }
              />
            ) : (
              <div
                key={`${view}-${filtered.map((e) => e._id).join("")}`}
                className={view === "list" ? "border-t border-slate-200 dark:border-slate-800" : "grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3"}
              >
                {filtered.map(renderCard)}
              </div>
            )
          )}
        </div>
      </div>
    </PublicLayout>
  );
}
