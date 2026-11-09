import { Link } from "react-router-dom";

const formatDate = (value) =>
  new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));

/**
 * The paid sibling of EventCard. It shares the card's shape entirely and
 * differs only by the gold flag and the price line, because a premium event is
 * still an event - it should not look like a different product.
 */
export default function PremiumEventCard({ event }) {
  const prices = (event.plans || []).map((p) => p.price).filter((n) => Number.isFinite(n));
  const fromPrice = prices.length ? Math.min(...prices) : null;
  const currency = event.currency || "USD";
  const planCount = (event.plans || []).length;

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
          <div
            className="h-full w-full"
            aria-hidden="true"
            style={{
              background:
                "radial-gradient(120% 90% at 18% 12%, #2f2b25 0%, #12100d 62%), linear-gradient(200deg, rgba(209,156,59,0.16), transparent 55%)",
            }}
          />
        )}
        <div className="photo-scrim-b opacity-80" />
        <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-lg bg-slate-950/70 px-2.5 py-1.5 text-xs font-semibold text-brand-200 backdrop-blur-sm">
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M4 2v3m8-3v3M2.5 6.5h11M3.5 3h9a1.5 1.5 0 0 1 1.5 1.5v8A1.5 1.5 0 0 1 12.5 14h-9A1.5 1.5 0 0 1 2 12.5v-8A1.5 1.5 0 0 1 3.5 3Z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {formatDate(event.startDateTime)}
        </span>
        <span className="absolute right-4 top-4 rounded-lg bg-brand-400 px-2.5 py-1.5 text-xs font-bold uppercase tracking-wide text-slate-950">
          Premium
        </span>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <h3 className="m-0 text-xl font-bold leading-snug text-slate-900 transition-colors group-hover:text-brand-600 dark:text-white dark:group-hover:text-brand-300">
          {event.title}
        </h3>
        <p className="text-muted mt-3 mb-0">{event.location || "Location to be announced"}</p>
        {fromPrice !== null && (
          <p className="mt-3 mb-0 font-semibold text-brand-700 dark:text-brand-300 tabular-nums">
            From {currency} {fromPrice} · {planCount} plan{planCount === 1 ? "" : "s"}
          </p>
        )}
        <Link
          to={`/events/${event._id}`}
          className="mt-auto inline-flex items-center gap-1.5 pt-5 font-semibold text-brand-600 transition-all hover:gap-3 hover:text-brand-700 dark:text-brand-300 dark:hover:text-brand-200"
        >
          View plans and register
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </div>
    </article>
  );
}
