import { Link } from "react-router-dom";
import { getCategoryMeta } from "../utils/categories.js";

const parts = (v) => {
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return {
    day: d.getDate(),
    month: new Intl.DateTimeFormat("en", { month: "short" }).format(d),
    time: new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" }).format(d),
  };
};

/**
 * One card for free and paid events so every grid stays the same shape.
 * Image first, with the date as a small badge, then the facts.
 */
export default function EventCard({ event }) {
  const when = parts(event.startDateTime);
  const meta = getCategoryMeta(event.category);
  const ended = new Date(event.endDateTime || event.startDateTime) < new Date();
  const prices = (event.plans || []).map((p) => p.price).filter((n) => Number.isFinite(n));
  const paid = event.isPremium && prices.some((p) => p > 0);

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-3xl bg-white ring-1 ring-slate-200 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-brand-900/10 hover:ring-brand-200 dark:bg-slate-900 dark:ring-slate-800 dark:hover:ring-brand-500/40">
      <Link to={`/events/${event._id}`} className="relative block aspect-[16/10] overflow-hidden bg-brand-50 dark:bg-slate-800" tabIndex={-1} aria-hidden="true">
        {event.coverImageUrl ? (
          <img src={event.coverImageUrl} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105" />
        ) : (
          <div className="flex h-full w-full items-center justify-center display text-2xl text-brand-600">{meta.shortLabel}</div>
        )}
        {when && (
          <span className="absolute left-4 top-4 flex flex-col items-center rounded-2xl bg-white px-3 py-1.5 text-center leading-none shadow-md dark:bg-slate-900">
            <span className="text-lg font-extrabold text-slate-900 dark:text-white">{when.day}</span>
            <span className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-600">{when.month}</span>
          </span>
        )}
        <span className={`absolute right-4 top-4 rounded-full px-3 py-1 text-xs font-bold shadow-md ${paid ? "bg-accent-400 text-slate-900" : "bg-white text-emerald-700 dark:bg-slate-900 dark:text-emerald-400"}`}>
          {paid ? `From ${event.currency || "USD"} ${Math.min(...prices)}` : "Free"}
        </span>
      </Link>

      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
            {event.category || "General"}
          </span>
          {ended && <span className="text-xs font-medium text-slate-400">Ended</span>}
        </div>

        <h3 className="mt-3 mb-0 text-xl font-bold leading-snug text-slate-900 line-clamp-2 dark:text-white">
          <Link to={`/events/${event._id}`}>{event.title}</Link>
        </h3>

        {event.description && (
          <p className="mt-2 mb-0 text-sm leading-relaxed text-slate-500 line-clamp-2 dark:text-slate-400">{event.description}</p>
        )}

        <ul className="mt-5 mb-5 list-none space-y-2 p-0 text-sm text-slate-600 dark:text-slate-300">
          <li className="flex items-center gap-2.5">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-brand-500" aria-hidden="true">
              <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" strokeLinecap="round" />
            </svg>
            {when ? `${when.month} ${when.day} · ${when.time}` : "Date to be announced"}
          </li>
          <li className="flex items-center gap-2.5">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-brand-500" aria-hidden="true">
              <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="3" />
            </svg>
            <span className="truncate">{event.location || "Online"}</span>
          </li>
        </ul>

        <Link to={`/events/${event._id}`} className="btn btn-primary mt-auto w-full">
          {paid ? "View plans & register" : "Register now"}
        </Link>
      </div>
    </article>
  );
}
