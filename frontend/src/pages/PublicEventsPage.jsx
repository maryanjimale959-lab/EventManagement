import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import client from "../api/client.js";
import EmptyState from "../components/ui/EmptyState.jsx";
import Loading from "../components/ui/Loading.jsx";
import SectionHeader from "../components/ui/SectionHeader.jsx";
import PublicLayout from "../components/layout/PublicLayout.jsx";
import Hero from "../components/Hero.jsx";
import EventCard from "../components/EventCard.jsx";
import PremiumEventCard from "../components/PremiumEventCard.jsx";

const valueProps = [
  {
    title: "Secure by default",
    desc: "Every gallery is gated behind check-in, so no public link ever exposes your photos.",
  },
  {
    title: "Zero setup for guests",
    desc: "No app and no downloads. Register, show up, and your gallery is simply there.",
  },
  {
    title: "Built for any event",
    desc: "Weddings, conferences, launches, community nights — publish yours in minutes.",
  },
];

export default function PublicEventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await client.get("/api/events/public");
        setEvents(res.data);
      } catch (err) {
        setError(err.response?.data?.error?.message || "Failed to load events");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const featured = events.slice(0, 3);
  const renderCard = (e) =>
    e.isPremium ? <PremiumEventCard key={e._id} event={e} /> : <EventCard key={e._id} event={e} />;
  const lead = featured[0];
  const rest = featured.slice(1);

  return (
    <PublicLayout>
      <Hero />

      <div className="shell-wrap">
        <div className="section">
          <SectionHeader
            title="Why EventMedia"
            subtitle="The short version"
            actions={
              <Link to="/how-it-works" className="font-semibold text-brand-600 hover:text-brand-700 text-sm">
                See the full walkthrough →
              </Link>
            }
          />

          {/* A numbered list beside a photograph rather than three identical
              cards: the three points are not equal-weight features, and the
              row of matching boxes is the pattern that makes a site look
              generated. */}
          <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-10 lg:gap-14 items-center">
            <ol className="m-0 p-0 list-none">
              {valueProps.map((v, i) => (
                <li
                  key={v.title}
                  className="grid grid-cols-[auto_1fr] gap-5 sm:gap-7 py-7 border-t border-slate-200 last:border-b dark:border-slate-800"
                >
                  <span className="display text-2xl sm:text-3xl text-brand-500 tabular-nums leading-none pt-1">
                    0{i + 1}
                  </span>
                  <div className="min-w-0">
                    <h3 className="m-0 text-xl font-bold text-slate-900 dark:text-white">{v.title}</h3>
                    <p className="text-muted mt-2 mb-0">{v.desc}</p>
                  </div>
                </li>
              ))}
            </ol>

            <figure className="relative m-0 overflow-hidden rounded-3xl aspect-[4/5] max-h-[560px]">
              <img
                src="/images/photographer-at-work.jpg"
                alt="A photographer reviewing pictures on the back of a camera at an evening event"
                className="absolute inset-0 w-full h-full object-cover"
                loading="lazy"
              />
              <div className="photo-scrim-b" />
              <figcaption className="absolute inset-x-0 bottom-0 p-7">
                <p className="m-0 text-sm text-brand-300 eyebrow">Who it is for</p>
                <p className="m-0 mt-2 text-xl text-white font-semibold leading-snug">
                  Organisers who want the photos to reach the room, not the internet.
                </p>
              </figcaption>
            </figure>
          </div>
        </div>

        <div className="section">
          <SectionHeader title="Happening soon" subtitle="Open to anyone with a ticket" />
          {loading && <Loading label="Loading events..." />}
          {error && <p className="text-rose-600">{error}</p>}
          {!loading && !error && (
            featured.length === 0 ? (
              <EmptyState title="No events published yet" description="Check back soon, or log in as an organizer to create one." />
            ) : (
              <div className="grid gap-5 lg:grid-cols-3">
                {/* One wide card beside two stacked ones, so the row reads as a
                    featured event plus the rest instead of three equals. */}
                <div className="lg:col-span-2">{renderCard(lead)}</div>
                {rest.length > 0 && <div className="grid gap-5 content-start">{rest.map(renderCard)}</div>}
              </div>
            )
          )}
          <div className="mt-9">
            <Link to="/events" className="btn btn-primary">
              Explore all events
            </Link>
          </div>
        </div>

        <div className="section mb-4">
          <section className="relative overflow-hidden rounded-3xl bg-slate-900">
            <img
              src="/images/gallery-strip-dance.jpg"
              alt=""
              aria-hidden="true"
              className="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
            />
            <div className="photo-scrim" />
            <div className="relative z-10 px-8 py-16 sm:px-14 sm:py-20 max-w-2xl">
              <h2 className="display m-0 text-4xl sm:text-5xl text-white">Have an event to run?</h2>
              <p className="mt-4 text-lg text-slate-200">
                Publish it in minutes, check guests in on-site, and give every attendee a private
                gallery of the moment.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-5">
                <Link className="btn btn-primary text-base px-7 py-4" to="/register">
                  Create account
                </Link>
                <Link
                  className="inline-flex items-center gap-2 text-base font-semibold text-white/90 hover:text-brand-300 transition-colors"
                  to="/login"
                >
                  I already have one
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    </PublicLayout>
  );
}
