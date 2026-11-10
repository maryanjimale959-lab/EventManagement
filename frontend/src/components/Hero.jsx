import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import client from "../api/client.js";
import { CountUp } from "../hooks/useMotion.jsx";

const WORDS = ["workshops", "AI summits", "hackathons", "lectures", "startups"];
const QUICK_TRACKS = [
  { label: "Artificial Intelligence", query: "Artificial Intelligence" },
  { label: "Workshops", query: "Workshops" },
  { label: "Hackathons", query: "Hackathons" },
  { label: "Islamic Studies", query: "Islamic Studies" },
  { label: "Business", query: "Business" },
];

export default function Hero() {
  const [term, setTerm] = useState("");
  const [open, setOpen] = useState(false);
  const [events, setEvents] = useState([]);
  const [wordIdx, setWordIdx] = useState(0);
  const boxRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    client.get("/api/events/public").then((r) => setEvents(r.data)).catch(() => {});
  }, []);

  // Rotate the headline word slowly; no rotation for reduced-motion users.
  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return undefined;
    const id = setInterval(() => setWordIdx((i) => (i + 1) % WORDS.length), 2800);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const onDown = (e) => boxRef.current && !boxRef.current.contains(e.target) && setOpen(false);
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const matches = useMemo(() => {
    const q = term.trim().toLowerCase();
    if (!q) return [];
    return events
      .filter((e) => `${e.title} ${e.category || ""} ${e.location || ""}`.toLowerCase().includes(q))
      .slice(0, 5);
  }, [events, term]);

  const stats = useMemo(() => {
    const cats = new Set(events.map((e) => e.category).filter(Boolean));
    const places = new Set(
      events.map((e) => (e.location || "").split(",").pop().trim().toLowerCase()).filter(Boolean)
    );
    return { events: events.length, tracks: cats.size, places: places.size };
  }, [events]);

  const submit = (e) => {
    e.preventDefault();
    setOpen(false);
    const q = term.trim();
    navigate(q ? `/events?search=${encodeURIComponent(q)}` : "/events");
  };

  return (
    <section className="relative overflow-hidden bg-slate-950 text-white">
      {/* Slow ambient background */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <img src="/images/edu-hero.jpg" alt="" className="h-full w-full object-cover opacity-20 mix-blend-luminosity" />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950/90 to-slate-950" />
        <div className="blob-a absolute -top-24 left-[8%] h-[420px] w-[420px] rounded-full bg-brand-600/25 blur-[120px]" />
        <div className="blob-b absolute top-1/3 right-[6%] h-[360px] w-[360px] rounded-full bg-sky-500/15 blur-[120px]" />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            maskImage: "radial-gradient(ellipse at 50% 30%, black 20%, transparent 70%)",
            WebkitMaskImage: "radial-gradient(ellipse at 50% 30%, black 20%, transparent 70%)",
          }}
        />
      </div>

      <div className="shell-wrap relative z-10 py-20 sm:py-28 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-brand-300">
          <span className="h-2 w-2 animate-pulse rounded-full bg-brand-400" />
          Education · Technology · AI · Islamic Studies
        </span>

        <h1 className="display mx-auto mt-6 mb-0 max-w-4xl text-4xl font-extrabold leading-[1.08] sm:text-6xl lg:text-7xl">
          Discover{" "}
          <span key={wordIdx} className="word-swap bg-gradient-to-r from-brand-300 to-sky-300 bg-clip-text text-transparent">
            {WORDS[wordIdx]}
          </span>
          <br />
          worth showing up for.
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
          Find lectures, practical workshops, competitions and conferences. Register in a minute,
          check in with a QR pass, and keep the materials afterwards.
        </p>

        {/* Live search */}
        <div ref={boxRef} className="relative mx-auto mt-9 max-w-2xl text-left">
          <form
            onSubmit={submit}
            className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-2 backdrop-blur-md transition-colors focus-within:border-brand-400/60 focus-within:bg-white/10"
          >
            <svg className="ml-3 shrink-0 text-slate-400" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              value={term}
              onChange={(e) => {
                setTerm(e.target.value);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              placeholder="Try “AI”, “workshop” or “Hargeisa”"
              aria-label="Search events"
              className="min-w-0 flex-1 bg-transparent px-1 py-3 text-base text-white placeholder-slate-400 focus:outline-none"
            />
            <button type="submit" className="btn btn-primary shrink-0 !px-6 !py-3">Search</button>
          </form>

          {open && term.trim() && (
            <ul className="absolute left-0 right-0 top-full z-20 mt-2 list-none overflow-hidden rounded-2xl border border-white/10 bg-slate-900/95 p-1.5 shadow-2xl backdrop-blur-xl animate-[fadeUp_0.25s_ease-out]">
              {matches.length === 0 && <li className="px-4 py-3 text-sm text-slate-400">No matching events yet.</li>}
              {matches.map((e) => (
                <li key={e._id}>
                  <Link to={`/events/${e._id}`} className="flex items-center justify-between gap-4 rounded-xl px-4 py-3 transition-colors hover:bg-white/10">
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-white">{e.title}</span>
                      <span className="block truncate text-xs text-slate-400">{e.category || "General"} · {e.location || "Online"}</span>
                    </span>
                    <span className="text-brand-300">→</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-xs">
          {QUICK_TRACKS.map((t) => (
            <Link
              key={t.query}
              to={`/events?category=${encodeURIComponent(t.query)}`}
              className="rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-slate-300 transition-all hover:-translate-y-0.5 hover:border-brand-400/60 hover:bg-brand-500/15 hover:text-white"
            >
              {t.label}
            </Link>
          ))}
        </div>

        <div className="mx-auto mt-14 grid max-w-xl grid-cols-3 gap-4 border-t border-white/10 pt-8">
          {[
            { v: stats.events, l: "Live events" },
            { v: stats.tracks, l: "Learning tracks" },
            { v: stats.places, l: "Locations" },
          ].map((s) => (
            <div key={s.l}>
              <div className="display text-3xl font-extrabold text-white sm:text-4xl">
                <CountUp value={s.v} />
              </div>
              <div className="mt-1 text-xs text-slate-400">{s.l}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
