import { Link } from "react-router-dom";
import { getCategoryMeta } from "../utils/categories.js";

const formatDate = (value) => {
  if (!value) return "";
  try {
    return new Intl.DateTimeFormat("en", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return String(value);
  }
};

function CoverFallback({ title, category }) {
  const meta = getCategoryMeta(category);
  const initials = (title || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center bg-slate-900 relative overflow-hidden"
      aria-hidden="true"
    >
      <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-900 to-slate-800" />
      <div className="relative z-10 flex flex-col items-center">
        <span className="font-display font-extrabold text-4xl text-slate-600 tracking-wider">
          {initials || "EV"}
        </span>
        <span className="text-[10px] uppercase font-semibold tracking-widest text-slate-400 mt-1">
          {meta.shortLabel}
        </span>
      </div>
    </div>
  );
}

export default function EventCard({ event }) {
  const categoryMeta = getCategoryMeta(event.category);
  const ended = new Date(event.endDateTime || event.startDateTime) < new Date();
  const prices = (event.plans || []).map((p) => p.price).filter((n) => Number.isFinite(n));
  const isFree = !event.isPremium || prices.length === 0 || prices.every((p) => p === 0);
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const currency = event.currency || "USD";

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl bg-white border border-slate-200/90 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/10 hover:border-brand-500/30 dark:bg-slate-900/90 dark:border-slate-800/80 dark:hover:border-brand-500/40 dark:hover:shadow-black/40">
      {/* Cover Image Area */}
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-900">
        {event.coverImageUrl ? (
          <img
            src={event.coverImageUrl}
            alt={event.title}
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <CoverFallback title={event.title} category={event.category} />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />

        {/* Category Pill Tag */}
        <span
          className={`absolute top-3.5 left-3.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold backdrop-blur-md shadow-sm border ${categoryMeta.badgeClass}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${categoryMeta.dotClass}`} />
          <span>{event.category || "General"}</span>
        </span>

        {/* Pricing tag */}
        <span className="absolute top-3.5 right-3.5 inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold tracking-wide backdrop-blur-md bg-slate-950/80 text-white border border-white/10">
          {isFree ? "Free Entry" : `From ${currency} ${minPrice}`}
        </span>

        {/* Date line over bottom of image */}
        <div className="absolute bottom-3 left-3.5 right-3.5 flex items-center justify-between text-xs text-white/90 font-medium">
          <span className="inline-flex items-center gap-1.5 drop-shadow-sm">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            {formatDate(event.startDateTime)}
          </span>
          {ended && (
            <span className="px-1.5 py-0.5 rounded bg-slate-800/80 text-[10px] uppercase font-bold text-slate-300">
              Concluded
            </span>
          )}
        </div>
      </div>

      {/* Card Content Area */}
      <div className="flex flex-1 flex-col p-5">
        <h3 className="m-0 text-lg font-bold text-slate-900 group-hover:text-brand-600 transition-colors line-clamp-2 leading-snug dark:text-white dark:group-hover:text-brand-400">
          {event.title}
        </h3>

        {event.description && (
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
            {event.description}
          </p>
        )}

        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span className="inline-flex items-center gap-1 truncate max-w-[190px]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-slate-400">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 1 1 16 0Z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <span className="truncate">{event.location || "Online / To be announced"}</span>
          </span>

          <span className="shrink-0 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
            {event.capacity ? `${event.capacity} seats` : "Open registration"}
          </span>
        </div>

        {/* Interactive Action Link */}
        <div className="mt-4 pt-2">
          <Link
            to={`/events/${event._id}`}
            className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold bg-slate-50 text-slate-700 hover:bg-brand-600 hover:text-white transition-all duration-200 border border-slate-200/80 dark:bg-slate-800/60 dark:text-slate-200 dark:border-slate-700/80 dark:hover:bg-brand-500 dark:hover:text-white"
          >
            <span>View Details &amp; Register</span>
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
      </div>
    </article>
  );
}
