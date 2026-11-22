import { Link } from "react-router-dom";
import { getCategoryMeta } from "../utils/categories.js";
import { dayOfMonth, hasEnded, monthShort, weekdayTime } from "../utils/dates.js";

/** Lowest listed price, or null when the event is free. */
export const eventPriceLabel = (event) => {
  const prices = (event.plans || []).map((p) => p.price).filter((n) => Number.isFinite(n));
  const paid = event.isPremium && prices.some((p) => p > 0);
  return paid ? `From ${event.currency || "USD"} ${Math.min(...prices)}` : "Free";
};

/** One card for free and paid events so grids stay uniform. */
export default function EventCard({ event, basePath = "/events", statusBadge = null }) {
  const meta = getCategoryMeta(event.category);
  const ended = hasEnded(event);

  return (
    <article className="event-card group">
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-100 dark:bg-slate-800">
        {event.coverImageUrl ? (
          <img
            src={event.coverImageUrl}
            alt=""
            loading="lazy"
            className={`card-img h-full w-full object-cover ${ended ? "grayscale" : ""}`}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-brand-50 font-display text-2xl font-semibold text-brand-300 dark:bg-brand-950 dark:text-brand-700">
            {meta.shortLabel}
          </div>
        )}
        {ended && <span className="badge badge-neutral absolute left-3 top-3">Ended</span>}
        {!ended && event.seatsLeft === 0 && <span className="badge badge-neutral absolute left-3 top-3">Fully booked</span>}
        {!ended && event.seatsLeft > 0 && event.seatsLeft <= 10 && (
          <span className="badge badge-warn absolute left-3 top-3">{event.seatsLeft} seats left</span>
        )}
        {statusBadge && (
          <span className={`badge badge-${statusBadge.variant} absolute right-3 top-3`}>{statusBadge.label}</span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start gap-3.5">
          <div className="date-tile" aria-hidden="true">
            <span className="date-tile-month">{monthShort(event.startDateTime)}</span>
            <span className="date-tile-day">{dayOfMonth(event.startDateTime)}</span>
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="m-0 text-[1.05rem] leading-snug text-slate-900 line-clamp-2 dark:text-white">
              {/* The stretched link makes the whole card one target. */}
              <Link
                to={`${basePath}/${event._id}`}
                className="outline-none after:absolute after:inset-0 after:content-[''] "
              >
                {event.title}
              </Link>
            </h3>
            <p className="m-0 mt-1 truncate text-sm text-slate-500 dark:text-slate-400">
              {weekdayTime(event.startDateTime)}
              <span className="mx-1.5 text-slate-300 dark:text-slate-600" aria-hidden="true">/</span>
              {event.location || "Online"}
            </p>
          </div>
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 pt-4 text-sm">
          <span className="inline-flex min-w-0 items-center gap-2 text-slate-600 dark:text-slate-300">
            <span className={`h-2 w-2 shrink-0 rounded-full ${meta.dotClass}`} aria-hidden="true" />
            <span className="truncate">{event.category || "General"}</span>
          </span>
          <span className="flex shrink-0 items-center gap-2.5 font-medium text-slate-900 dark:text-white">
            {eventPriceLabel(event)}
            <span className="card-arrow" aria-hidden="true">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17 17 7M8 7h9v9" /></svg>
            </span>
          </span>
        </div>
      </div>
    </article>
  );
}

/** Compact single-line version for the list view. */
export function EventRow({ event }) {
  const ended = hasEnded(event);
  return (
    <article className={`group event-row ${ended ? "opacity-60" : ""}`}>
      <div className="date-tile" aria-hidden="true">
        <span className="date-tile-month">{monthShort(event.startDateTime)}</span>
        <span className="date-tile-day">{dayOfMonth(event.startDateTime)}</span>
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="m-0 truncate text-base text-slate-900 dark:text-white">
          <Link to={`/events/${event._id}`} className="outline-none after:absolute after:inset-0 after:content-['']">{event.title}</Link>
        </h3>
        <p className="m-0 mt-0.5 truncate text-sm text-slate-500 dark:text-slate-400">
          {weekdayTime(event.startDateTime)} / {event.location || "Online"}
        </p>
      </div>
      <span className="hidden shrink-0 text-sm text-slate-500 sm:block dark:text-slate-400">{event.category || "General"}</span>
      <span className="w-24 shrink-0 text-right text-sm font-medium text-slate-900 dark:text-white">{eventPriceLabel(event)}</span>
    </article>
  );
}
