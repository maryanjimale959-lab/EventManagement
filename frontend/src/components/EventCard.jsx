import { Link } from "react-router-dom";
import { getCategoryMeta } from "../utils/categories.js";
import { usePointerFx } from "../hooks/useMotion.jsx";

const fmt = (v, opts) => {
  if (!v) return "";
  try {
    return new Intl.DateTimeFormat("en", opts).format(new Date(v));
  } catch {
    return "";
  }
};

/** One card for free and paid events so grids stay uniform. */
export default function EventCard({ event }) {
  const fx = usePointerFx(3);
  const meta = getCategoryMeta(event.category);
  const ended = new Date(event.endDateTime || event.startDateTime) < new Date();
  const prices = (event.plans || []).map((p) => p.price).filter((n) => Number.isFinite(n));
  const paid = event.isPremium && prices.some((p) => p > 0);

  return (
    <article
      {...fx}
      className="interactive-card group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm hover:border-brand-500/40 hover:shadow-xl hover:shadow-brand-500/10 dark:border-slate-800 dark:bg-slate-900/90 dark:hover:border-brand-500/50 dark:hover:shadow-black/40"
    >
      <Link to={`/events/${event._id}`} className="relative block aspect-[16/9] overflow-hidden bg-slate-900" tabIndex={-1} aria-hidden="true">
        {event.coverImageUrl ? (
          <img src={event.coverImageUrl} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-slate-800 font-display text-2xl font-bold text-slate-500">{meta.shortLabel}</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/10 to-transparent" />
        <span className="absolute left-3.5 top-3.5 inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-slate-950/70 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-md">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-400" />
          {event.category || "General"}
        </span>
        <span className="absolute right-3.5 top-3.5 rounded-md bg-white/95 px-2 py-0.5 text-[11px] font-bold text-slate-900">
          {paid ? `From ${event.currency || "USD"} ${Math.min(...prices)}` : "Free"}
        </span>
        <span className="absolute bottom-3 left-3.5 text-xs font-medium text-white/90">
          {fmt(event.startDateTime, { weekday: "short", month: "short", day: "numeric" })} · {fmt(event.startDateTime, { hour: "numeric", minute: "2-digit" })}
          {ended && <span className="ml-2 rounded bg-slate-800/80 px-1.5 py-0.5 text-[10px] uppercase text-slate-300">Ended</span>}
        </span>
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="m-0 text-lg font-bold leading-snug text-slate-900 transition-colors line-clamp-2 group-hover:text-brand-600 dark:text-white dark:group-hover:text-brand-400">
          <Link to={`/events/${event._id}`}>{event.title}</Link>
        </h3>
        {event.description && (
          <p className="mt-2 mb-0 text-sm leading-relaxed text-slate-500 line-clamp-2 dark:text-slate-400">{event.description}</p>
        )}
        <div className="mt-4 flex items-center gap-1.5 border-t border-slate-100 pt-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0" aria-hidden="true">
            <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="3" />
          </svg>
          <span className="truncate">{event.location || "Online"}</span>
        </div>
        <Link
          to={`/events/${event._id}`}
          className="btn-ripple mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-700 transition-all duration-200 hover:border-brand-600 hover:bg-brand-600 hover:text-white dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200 dark:hover:border-brand-500 dark:hover:bg-brand-500"
        >
          {paid ? "View plans & register" : "View details & register"}
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">
            <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </div>
    </article>
  );
}
