import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import client from "../api/client.js";
import DashboardLayout from "../components/layout/DashboardLayout.jsx";
import Card from "../components/ui/Card.jsx";
import Alert from "../components/ui/Alert.jsx";
import Loading from "../components/ui/Loading.jsx";
import Badge from "../components/ui/Badge.jsx";
import EventCard from "../components/EventCard.jsx";
import EventJourney from "../components/EventJourney.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { EVENT_CATEGORIES } from "../utils/categories.js";
import { hasEnded } from "../utils/dates.js";

const REQUIRED_LABELS = {
  phone: "Mobile number",
  location: "Location",
  institution: "Institution",
  educationLevel: "Education level",
  sex: "Sex",
};

const formatDate = (v) =>
  new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(v));

const statusBadgeFor = (reg) => {
  if (!reg) return null;
  if (reg.attended) return { label: "Checked in", variant: "success" };
  if (reg.approvalStatus === "approved") return { label: "Approved", variant: "success" };
  if (reg.approvalStatus === "rejected") return { label: "Not approved", variant: "danger" };
  return { label: "Pending approval", variant: "warn" };
};

function Stat({ label, value, hint, tone = "" }) {
  return (
    <div className="stat-card">
      <div className={`stat-value ${tone}`}>{value}</div>
      <div className="stat-label">{label}</div>
      {hint && <div className="text-muted text-xs mt-1">{hint}</div>}
    </div>
  );
}

export default function DashboardOverviewPage() {
  const { user } = useAuth();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [data, setData] = useState({ registrations: [], stats: null });
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState(() => searchParams.get("search") || "");
  const [category, setCategory] = useState(() => searchParams.get("category") || "All");
  const [timeFilter, setTimeFilter] = useState("upcoming");

  useEffect(() => {
    const q = searchParams.get("search");
    const c = searchParams.get("category");
    if (q !== null) setSearch(q);
    if (c !== null) setCategory(c);
  }, [searchParams]);

  // Greet first-time users with "Welcome", not "Welcome back".
  const isFirstVisit = useMemo(() => {
    if (location.state?.justSignedUp) return true;
    const key = user?.id ? `kulan_seen_${user.id}` : null;
    if (!key || typeof window === "undefined") return false;
    return !window.localStorage.getItem(key);
  }, [location.state?.justSignedUp, user?.id]);

  useEffect(() => {
    if (!user?.id || typeof window === "undefined") return undefined;
    // Mark as seen when they leave this first session so the next visit greets them back.
    const key = `kulan_seen_${user.id}`;
    return () => {
      window.localStorage.setItem(key, "1");
    };
  }, [user?.id]);

  useEffect(() => {
    Promise.all([
      client.get("/api/users/me/registrations"),
      client.get("/api/events/public").catch(() => ({ data: [] })),
    ])
      .then(([regRes, evRes]) => {
        setData(regRes.data);
        setEvents(Array.isArray(evRes.data) ? evRes.data : []);
      })
      .catch((err) => setError(err.response?.data?.error?.message || "Could not load your dashboard"))
      .finally(() => setLoading(false));
  }, []);

  const stats = data.stats;

  const regByEventId = useMemo(
    () => new Map(data.registrations.map((r) => [String(r.event.id), r])),
    [data.registrations]
  );

  const completion = useMemo(() => {
    const missing = user?.missingProfileFields?.length || 0;
    const total = 5;
    return Math.round(((total - missing) / total) * 100);
  }, [user]);

  const nextUp = useMemo(
    () =>
      [...data.registrations]
        .filter((r) => !r.hasEnded && r.approvalStatus !== "rejected")
        .sort((a, b) => new Date(a.event.startDateTime) - new Date(b.event.startDateTime))[0],
    [data.registrations]
  );

  // Filter by time window (upcoming open / all / past), category, and search.
  const visibleEvents = useMemo(() => {
    const q = search.trim().toLowerCase();
    return events
      .filter((e) => {
        const ended = hasEnded(e);
        if (timeFilter === "upcoming" && (ended || e.status === "completed")) return false;
        if (timeFilter === "past" && !ended && e.status !== "completed") return false;
        if (category !== "All" && (e.category || "General") !== category) return false;
        if (!q) return true;
        return [e.title, e.location, e.category, e.description]
          .filter(Boolean)
          .some((s) => s.toLowerCase().includes(q));
      })
      .sort((a, b) => {
        const aEnded = hasEnded(a);
        const bEnded = hasEnded(b);
        if (aEnded !== bEnded) return aEnded ? 1 : -1;
        const diff = new Date(a.startDateTime) - new Date(b.startDateTime);
        return aEnded ? -diff : diff;
      });
  }, [events, search, category, timeFilter]);

  const nextBadge = statusBadgeFor(nextUp);
  const greeting = `${isFirstVisit ? "Welcome" : "Welcome back"}, ${user?.firstName || "there"}`;

  return (
    <DashboardLayout
      title={greeting}
      subtitle="Browse events, track your registrations, and access your passes."
    >
      {loading && <Loading />}
      {error && <Alert variant="error">{error}</Alert>}

      {!loading && stats && (
        <>
          <div className="grid grid-4">
            <Stat label="Events joined" value={stats.total} hint="all time" />
            <Stat label="Attended" value={stats.attended} hint="checked in on site" tone="text-slate-900 dark:text-slate-200" />
            <Stat
              label="Awaiting check-in"
              value={stats.pending}
              hint={stats.awaitingApproval > 0 ? `${stats.awaitingApproval} pending approval` : "approved & upcoming"}
              tone="text-slate-900 dark:text-slate-200"
            />
            <Stat label="Photos available" value={stats.photosAvailable} hint={`${stats.galleriesAvailable} gallery/galleries`} />
          </div>

          {!user?.profileComplete && (
            <div className="section">
              <Card>
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <h3 className="m-0 text-lg font-bold">Complete your profile</h3>
                    <p className="text-muted m-0 mt-1">
                      Organisers need these details before you can register for an event.
                    </p>
                  </div>
                  <Link to="/dashboard/profile" className="btn btn-primary">Complete profile</Link>
                </div>
                <div className="mt-4">
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-semibold">{completion}% complete</span>
                    <span className="text-muted">{user?.missingProfileFields?.length || 0} field(s) left</span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${completion}%` }} />
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {(user?.missingProfileFields || []).map((f) => (
                      <span key={f} className="badge badge-warn">{REQUIRED_LABELS[f] || f}</span>
                    ))}
                  </div>
                </div>
              </Card>
            </div>
          )}

          {nextUp && (
            <div className="section">
              <div className="page-header mb-4">
                <h2 className="text-xl font-semibold m-0">Next up for you</h2>
                <Link to="/dashboard/events" className="btn btn-ghost">Your registrations</Link>
              </div>

              <Card>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="min-w-0">
                    <h3 className="m-0 text-lg font-bold truncate">{nextUp.event.title}</h3>
                    <p className="text-muted m-0 mt-1">
                      {formatDate(nextUp.event.startDateTime)} · {nextUp.event.location || "Location TBA"}
                    </p>
                  </div>
                  {nextBadge && <Badge variant={nextBadge.variant}>{nextBadge.label}</Badge>}
                </div>

                <div className="mt-5">
                  <EventJourney stage={nextUp.stage} />
                </div>

                <div className="flex gap-2 flex-wrap mt-5">
                  <Link to={`/dashboard/events/${nextUp.event.id}/registration`} className="btn btn-primary">
                    {nextUp.approvalStatus === "approved" ? "Show my QR code" : "View status"}
                  </Link>
                  <Link to={`/dashboard/events/${nextUp.event.id}`} className="btn btn-ghost">Event details</Link>
                </div>
              </Card>
            </div>
          )}

          <div className="section">
            <div className="page-header mb-4">
              <div>
                <h2 className="text-xl font-semibold m-0">All events</h2>
                <p className="text-muted m-0 mt-1 text-sm">
                  {visibleEvents.length} {timeFilter === "upcoming" ? "upcoming " : timeFilter === "past" ? "past " : ""}event{visibleEvents.length === 1 ? "" : "s"}
                  {timeFilter === "upcoming" ? " — click any event to register." : "."}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
                <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900">
                  {[
                    { key: "upcoming", label: "Upcoming" },
                    { key: "all", label: "All" },
                    { key: "past", label: "Past" },
                  ].map((t) => (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => setTimeFilter(t.key)}
                      className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
                        timeFilter === t.key
                          ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950"
                          : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
                <div className="w-full sm:w-56">
                  <input
                    type="text"
                    placeholder="Search events..."
                    aria-label="Search events"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="input"
                  />
                </div>
              </div>
            </div>

            <div className="no-scrollbar chip-scroller -mx-2 mb-5 flex items-center gap-2 overflow-x-auto px-2 pb-1">
              {EVENT_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`category-chip shrink-0 ${category === cat ? "is-active" : ""}`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {visibleEvents.length === 0 ? (
              <div className="empty-state">
                <p className="m-0">No events match your filter.</p>
                {(search || category !== "All" || timeFilter !== "all") && (
                  <button
                    type="button"
                    className="btn btn-ghost mt-3"
                    onClick={() => {
                      setSearch("");
                      setCategory("All");
                      setTimeFilter("all");
                    }}
                  >
                    Show all events
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                {visibleEvents.map((ev) => (
                  <EventCard
                    key={ev._id}
                    event={ev}
                    basePath="/dashboard/events"
                    statusBadge={statusBadgeFor(regByEventId.get(String(ev._id)))}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
