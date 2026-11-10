import { Link } from "react-router-dom";
import { getCategoryMeta } from "../utils/categories.js";

const parts = (v) => {
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return {
    day: String(d.getDate()).padStart(2, "0"),
    month: new Intl.DateTimeFormat("en", { month: "short" }).format(d),
    time: new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" }).format(d),
  };
};

/**
 * One row in the event agenda. A whole-row link, so there is a single
 * obvious target and no nested interactive elements.
 */
export default function EventCard({ event }) {
  const when = parts(event.startDateTime);
  const meta = getCategoryMeta(event.category);
  const ended = new Date(event.endDateTime || event.startDateTime) < new Date();
  const prices = (event.plans || []).map((p) => p.price).filter((n) => Number.isFinite(n));
  const paid = event.isPremium && prices.some((p) => p > 0);

  return (
    <Link
      to={`/events/${event._id}`}
      className="group grid grid-cols-[64px_1fr_auto] items-center gap-x-4 gap-y-2 border-t-2 border-slate-900 px-2 py-5 transition-colors hover:bg-accent-400 sm:grid-cols-[80px_128px_1fr_auto] sm:gap-x-6 sm:px-4 dark:border-slate-700 dark:hover:bg-slate-800"
    >
      <div className="font-mono leading-none text-slate-900 group-hover:text-slate-900 dark:group-hover:text-white dark:text-white">
        <span className="block text-4xl font-bold">{when?.day || "--"}</span>
        <span className="mt-1 block text-xs uppercase tracking-widest">{when?.month || "TBA"}</span>
      </div>

      <div className="hidden h-20 w-32 overflow-hidden border-2 border-slate-900 bg-slate-200 sm:block dark:border-slate-600">
        {event.coverImageUrl ? (
          <img src={event.coverImageUrl} alt="" loading="lazy" className="h-full w-full object-cover grayscale transition-all duration-500 group-hover:grayscale-0" />
        ) : (
          <div className="flex h-full items-center justify-center font-mono text-xs uppercase">{meta.shortLabel}</div>
        )}
      </div>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-3 font-mono text-xs uppercase tracking-wider text-slate-600 group-hover:text-slate-900 dark:group-hover:text-white dark:text-slate-400">
          <span className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-slate-900 dark:group-hover:text-white">{event.category || "General"}</span>
          <span>{when ? when.time : ""}</span>
          <span className="truncate">{event.location || "Online"}</span>
          {ended && <span className="bg-slate-900 px-1.5 text-white dark:bg-slate-200 dark:text-slate-900">Ended</span>}
        </div>
        <h3 className="mt-1.5 mb-0 text-2xl font-bold leading-tight text-slate-900 group-hover:text-slate-900 dark:group-hover:text-white dark:text-white sm:text-3xl">
          {event.title}
        </h3>
        {event.description && (
          <p className="mt-1.5 mb-0 hidden text-sm text-slate-600 line-clamp-1 group-hover:text-slate-900 dark:group-hover:text-white dark:text-slate-400 md:block">
            {event.description}
          </p>
        )}
      </div>

      <div className="flex flex-col items-end gap-2 text-right">
        <span className="font-mono text-sm font-bold uppercase text-slate-900 dark:text-white group-hover:text-slate-900 dark:group-hover:text-white">
          {paid ? `${event.currency || "USD"} ${Math.min(...prices)}+` : "Free"}
        </span>
        <span className="flex h-10 w-10 items-center justify-center border-2 border-slate-900 text-slate-900 transition-all group-hover:bg-slate-900 group-hover:text-accent-400 dark:border-slate-500 dark:text-white" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
            <path d="M3 13 13 3M5 3h8v8" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
          </svg>
        </span>
      </div>
    </Link>
  );
}

