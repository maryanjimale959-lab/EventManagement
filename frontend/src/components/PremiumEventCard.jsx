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

export default function PremiumEventCard({ event }) {
  const categoryMeta = getCategoryMeta(event.category);
  const prices = (event.plans || []).map((p) => p.price).filter((n) => Number.isFinite(n));
  const fromPrice = prices.length ? Math.min(...prices) : null;
  const currency = event.currency || "USD";
  const planCount = (event.plans || []).length;
  const ended = new Date(event.endDateTime || event.startDateTime) < new Date();

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl bg-white border border-brand-500/30 shadow-md shadow-brand-500/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-brand-500/15 hover:border-brand-500/60 dark:bg-slate-900/95 dark:border-brand-500/40 dark:hover:border-brand-400">
      {/* Top Banner Accent */}
      <div className="h-1 w-full bg-gradient-to-r from-brand-600 via-indigo-500 to-brand-400" />

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
          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 relative">
            <span className="font-display font-bold text-3xl text-brand-300/40">VIP</span>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-transparent" />

        {/* Category Pill */}
        <span
          className={`absolute top-3.5 left-3.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold backdrop-blur-md shadow-sm border ${categoryMeta.badgeClass}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${categoryMeta.dotClass}`} />
          <span>{event.category || "Professional"}</span>
        </span>

        {/* Premium Badge */}
        <span className="absolute top-3.5 right-3.5 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold tracking-wider uppercase bg-brand-600 text-white shadow-sm ring-1 ring-white/20">
          <span>★</span>
          <span>Certified Pass</span>
        </span>

        {/* Date Line */}
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

        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-500 dark:text-slate-400 truncate max-w-[170px]">
            {event.location || "Online Masterclass"}
          </span>
          {fromPrice !== null ? (
            <span className="font-bold text-brand-600 dark:text-brand-400">
              From {currency} {fromPrice} <span className="text-[10px] font-normal text-slate-400">({planCount} tier{planCount === 1 ? "" : "s"})</span>
            </span>
          ) : (
            <span className="font-semibold text-brand-600 dark:text-brand-400">Reserved Seats</span>
          )}
        </div>

        {/* Action Button */}
        <div className="mt-4 pt-2">
          <Link
            to={`/events/${event._id}`}
            className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold bg-brand-600 text-white hover:bg-brand-700 transition-all duration-200 shadow-sm shadow-brand-600/20 dark:bg-brand-500 dark:hover:bg-brand-400"
          >
            <span>View Passes &amp; Register</span>
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
      </div>
    </article>
  );
}
