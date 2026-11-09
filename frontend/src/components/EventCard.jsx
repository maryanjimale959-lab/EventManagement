import { Link } from "react-router-dom";

const fmtDate = (v) => {
  if (!v) return "";
  try {
    return new Intl.DateTimeFormat("en", { weekday: "short", month: "short", day: "numeric" }).format(new Date(v));
  } catch {
    return "";
  }
};
const fmtTime = (v) => {
  if (!v) return "";
  try {
    return new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" }).format(new Date(v));
  } catch {
    return "";
  }
};

function Cover({ event }) {
  if (event.coverImageUrl) {
    return (
      <img
        src={event.coverImageUrl}
        alt=""
        loading="lazy"
        className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
      />
    );
  }
  return (
    <div className="h-full w-full flex items-center justify-center bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300">
      <span className="display text-3xl">{event.category || "Event"}</span>
    </div>
  );
}

/**
 * Shared card for free and paid events. `paid` only changes the price line,
 * so every card in a grid keeps the same shape and height.
 */
export default function EventCard({ event }) {
  const ended = new Date(event.endDateTime || event.startDateTime) < new Date();
  const prices = (event.plans || []).map((p) => p.price).filter((n) => Number.isFinite(n));
  const paid = event.isPremium && prices.some((p) => p > 0);
  const price = paid ? `From ${event.currency || "USD"} ${Math.min(...prices)}` : "Free";

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition-colors duration-300 hover:border-brand-600 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-brand-400">
      <Link to={`/events/${event._id}`} className="block aspect-[16/10] overflow-hidden bg-slate-100 dark:bg-slate-800" tabIndex={-1} aria-hidden="true">
        <Cover event={event} />
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center justify-between gap-3 text-xs">
          <span className="inline-flex items-center gap-1.5 font-semibold uppercase tracking-wider text-brand-700 dark:text-brand-300">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
            {event.category || "General"}
          </span>
          {ended && <span className="text-slate-400">Ended</span>}
        </div>

        <h3 className="mt-3 mb-0 text-xl font-semibold leading-snug text-slate-900 dark:text-white line-clamp-2">
          <Link to={`/events/${event._id}`} className="hover:text-brand-700 dark:hover:text-brand-300">
            {event.title}
          </Link>
        </h3>

        {event.description && (
          <p className="mt-2 mb-0 text-sm leading-relaxed text-slate-600 dark:text-slate-400 line-clamp-2">
            {event.description}
          </p>
        )}

        <dl className="mt-4 mb-5 space-y-1.5 text-sm text-slate-600 dark:text-slate-300">
          <div className="flex gap-2">
            <dt className="w-16 shrink-0 text-slate-400">When</dt>
            <dd className="m-0">
              {fmtDate(event.startDateTime)}
              {fmtTime(event.startDateTime) && ` · ${fmtTime(event.startDateTime)}`}
            </dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-16 shrink-0 text-slate-400">Where</dt>
            <dd className="m-0 truncate">{event.location || "Online"}</dd>
          </div>
        </dl>

        <div className="mt-auto flex items-center justify-between border-t border-slate-200 pt-4 dark:border-slate-800">
          <span className="text-sm font-semibold text-slate-900 dark:text-white">{price}</span>
          <Link
            to={`/events/${event._id}`}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:gap-2.5 transition-all dark:text-brand-300"
          >
            {paid ? "View plans" : "Register"}
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
      </div>
    </article>
  );
}
