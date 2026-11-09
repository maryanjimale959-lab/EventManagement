import { Link } from "react-router-dom";

const formatDate = (value) =>
  new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));

/**
 * Cover art is optional, so the fallback has to look deliberate rather than
 * like a failed request: warm ink, the event's initials set large, and the same
 * crop as a real photograph. An emoji in this slot read as a broken page.
 */
function CoverFallback({ title }) {
  const initials = (title || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

  return (
    <div
      className="w-full h-full flex items-center justify-center"
      style={{
        background:
          "radial-gradient(120% 90% at 18% 12%, #2f2b25 0%, #12100d 62%), linear-gradient(200deg, rgba(209,156,59,0.16), transparent 55%)",
      }}
      aria-hidden="true"
    >
      <span className="display text-6xl text-brand-400/70">{initials || "EM"}</span>
    </div>
  );
}

export default function EventCard({ event }) {
  const ended = new Date(event.endDateTime || event.startDateTime) < new Date();

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-sm shadow-slate-900/[0.04] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/10 dark:bg-slate-900 dark:shadow-black/30">
      <div className="relative aspect-video overflow-hidden bg-slate-800">
        {event.coverImageUrl ? (
          <img
            src={event.coverImageUrl}
            alt={`Cover photograph for ${event.title}`}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            loading="lazy"
          />
        ) : (
          <CoverFallback title={event.title} />
        )}
        <div className="photo-scrim-b opacity-80" />
        <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-lg bg-slate-950/70 px-2.5 py-1.5 text-xs font-semibold text-brand-200 backdrop-blur-sm">
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M4 2v3m8-3v3M2.5 6.5h11M3.5 3h9a1.5 1.5 0 0 1 1.5 1.5v8A1.5 1.5 0 0 1 12.5 14h-9A1.5 1.5 0 0 1 2 12.5v-8A1.5 1.5 0 0 1 3.5 3Z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {formatDate(event.startDateTime)}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-start justify-between gap-3">
          <h3 className="m-0 text-xl font-bold leading-snug text-slate-900 transition-colors group-hover:text-brand-600 dark:text-white dark:group-hover:text-brand-300">
            {event.title}
          </h3>
          <span className={`shrink-0 text-xs font-semibold uppercase tracking-wider ${ended ? "text-slate-400" : "text-brand-600 dark:text-brand-400"}`}>
            {ended ? "Past" : "Upcoming"}
          </span>
        </div>

        <p className="text-muted mt-3 mb-0 flex-1">
          {event.location || "Location to be announced"}
        </p>

        <Link
          to={`/events/${event._id}`}
          className="mt-5 inline-flex items-center gap-1.5 font-semibold text-brand-600 transition-all hover:gap-3 hover:text-brand-700 dark:text-brand-300 dark:hover:text-brand-200"
        >
          Explore event
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </div>
    </article>
  );
}
