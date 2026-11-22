import { Link, Navigate } from "react-router-dom";
import PublicLayout from "../components/layout/PublicLayout.jsx";
import Hero from "../components/Hero.jsx";
import AboutSection from "../components/AboutSection.jsx";
import { Reveal } from "../hooks/useMotion.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const TRACKS = [
  { title: "Academics and research", desc: "Symposiums, fellowships and research sessions with universities and researchers.", category: "Education" },
  { title: "Practical workshops", desc: "Hands-on labs and bootcamps led by working engineers and trainers.", category: "Workshops" },
  { title: "AI and hackathons", desc: "Summits, build weekends and demo days for people making new things.", category: "Hackathons" },
  { title: "Islamic studies and ethics", desc: "Seminars and sessions on knowledge, character and leadership.", category: "Islamic Studies" },
];

const MARQUEE = [
  "Artificial Intelligence", "Technology", "Workshops", "Hackathons", "Education", "Business",
  "Islamic Studies", "Professional Development",
];

const STEPS = [
  { title: "Find an event", desc: "Search or filter by track, city and price." },
  { title: "Register", desc: "Reserve a place. Once the organizer approves it, your QR pass is issued." },
  { title: "Check in and learn", desc: "Scan your pass at the door. Slides and photos unlock for attendees only." },
];

function TrackLink({ track, index }) {
  return (
    <Reveal delay={index * 80}>
      <Link
        to={`/events?category=${encodeURIComponent(track.category)}`}
        className="group block h-full border-t border-slate-300 py-6 transition-colors hover:border-slate-900 dark:border-slate-700 dark:hover:border-white"
      >
        <h3 className="m-0 flex items-center justify-between gap-3 text-lg text-slate-900 dark:text-white">
          {track.title}
          <span className="opacity-0 transition-all duration-200 group-hover:translate-x-1 group-hover:opacity-100" aria-hidden="true">→</span>
        </h3>
        <p className="m-0 mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{track.desc}</p>
      </Link>
    </Reveal>
  );
}

/** A real sequence, so it is numbered. The photo fills the band but stays faint. */
function HowItWorks() {
  return (
    <section className="band relative isolate overflow-hidden" id="how-it-works">
      <div className="absolute inset-0 -z-10" aria-hidden="true">
        <img
          src="/images/kulan-networking.jpg"
          alt=""
          loading="lazy"
          className="h-full w-full object-cover object-[center_45%] opacity-[0.4] saturate-[0.6] dark:opacity-[0.28]"
        />
        <div className="absolute inset-0 bg-slate-50/45 dark:bg-slate-950/60" />
        <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-slate-50/90 to-transparent dark:from-slate-950/90" />
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-slate-50/90 to-transparent dark:from-slate-950/90" />
      </div>

      <div className="band-inner">
        <Reveal className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="display m-0 max-w-xl text-4xl text-slate-900 sm:text-5xl dark:text-white">How it works</h2>
          <Link to="/events" className="btn btn-primary">Browse events</Link>
        </Reveal>

        <ol className="m-0 mt-10 grid list-none gap-4 p-0 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <Reveal as="li" key={s.title} delay={i * 110} className="step-panel">
              <span className="step-panel-num">{i + 1}</span>
              <h3 className="m-0 mt-8 text-xl text-slate-900 dark:text-white">{s.title}</h3>
              <p className="m-0 mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-300">{s.desc}</p>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}

export default function PublicEventsPage() {
  const { isAuthed } = useAuth();

  // Signed-in attendees live inside their dashboard workspace, not the public landing page.
  if (isAuthed) return <Navigate to="/dashboard" replace />;

  return (
    <PublicLayout>
      <Hero />

      {/* Categories drift past; hovering pauses them. Not events, just what the platform covers. */}
      <div className="band py-5" aria-hidden="true">
        <div className="marquee">
          <div className="marquee-track">
            {[...MARQUEE, ...MARQUEE].map((m, i) => (
              <span
                key={`${m}-${i}`}
                className="whitespace-nowrap rounded-full border border-slate-200 px-4 py-1.5 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300"
              >
                {m}
              </span>
            ))}
          </div>
        </div>
      </div>

      <AboutSection />
      <HowItWorks />

      {/* Attendees are who the home page is for. Staff/host links stay hidden once signed in as an attendee. */}
      <section className="band" id="get-started">
        <div className="band-inner">
          <Reveal>
            <div className="grid items-center gap-8 rounded-3xl border border-slate-200 bg-white p-8 sm:p-12 lg:grid-cols-[1.4fr_1fr] dark:border-slate-800 dark:bg-slate-900">
              <div>
                <h2 className="display-serif m-0 text-4xl text-slate-950 sm:text-5xl dark:text-white">
                  {isAuthed ? "You are signed in." : "Ready to join an event?"}
                </h2>
                <p className="mt-3 max-w-lg text-slate-600 dark:text-slate-400">
                  {isAuthed
                    ? "Head to your dashboard to browse all upcoming events, track your approvals, and open your QR passes."
                    : "Create a free account to register, keep your QR pass in one place and open the galleries from events you attended."}
                </p>
              </div>
              <div className="flex flex-col gap-3">
                {isAuthed ? (
                  <>
                    <Link to="/dashboard" className="btn btn-primary justify-center !py-3 text-base">Go to my dashboard</Link>
                    <Link to="/dashboard/events" className="btn btn-ghost justify-center !py-3 text-base">My registrations</Link>
                  </>
                ) : (
                  <>
                    <Link to="/register" className="btn btn-primary justify-center !py-3 text-base">Create account</Link>
                    <Link to="/login" className="btn btn-ghost justify-center !py-3 text-base">Log in</Link>
                  </>
                )}
              </div>
            </div>
          </Reveal>
          {!isAuthed && (
            <p className="mt-6 text-sm text-slate-500 dark:text-slate-400">
              Running events or working at one?{" "}
              <Link to="/organizer/login" className="font-medium text-slate-900 underline decoration-slate-300 underline-offset-4 hover:decoration-slate-900 dark:text-white dark:decoration-slate-600 dark:hover:decoration-white">Organizer sign in</Link>
              {" · "}
              <Link to="/maamul/login" className="font-medium text-slate-900 underline decoration-slate-300 underline-offset-4 hover:decoration-slate-900 dark:text-white dark:decoration-slate-600 dark:hover:decoration-white">Admin</Link>
              {" · "}
              <Link to="/photographer/login" className="font-medium text-slate-900 underline decoration-slate-300 underline-offset-4 hover:decoration-slate-900 dark:text-white dark:decoration-slate-600 dark:hover:decoration-white">Photographer</Link>
            </p>
          )}
        </div>
      </section>

      {/* Tracks */}
      <section className={isAuthed ? "" : "band"}>
        <div className="band-inner">
          <Reveal className="max-w-2xl">
            <h2 className="display-serif m-0 text-4xl text-slate-950 sm:text-5xl dark:text-white">Every event belongs to a track</h2>
            <p className="mt-3 text-slate-600 dark:text-slate-400">Follow the ones that fit your goals and skip the rest.</p>
          </Reveal>
          <div className="mt-8 grid grid-cols-1 gap-x-8 sm:grid-cols-2 lg:grid-cols-4">
            {TRACKS.map((t, i) => (
              <TrackLink key={t.title} track={t} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Organizers — only shown to logged-out visitors */}
      {!isAuthed && (
        <section>
          <div className="band-inner">
            <Reveal>
              <div className="rounded-3xl bg-slate-950 px-8 py-12 text-white sm:px-14 sm:py-16 dark:bg-white dark:text-slate-950">
                <h2 className="display-serif m-0 max-w-2xl text-4xl sm:text-5xl">Hosting a workshop, seminar or conference?</h2>
                <p className="mt-4 max-w-xl text-lg text-slate-300 dark:text-slate-600">
                  Publish events, approve registrations, scan QR passes at the door and share materials privately.
                </p>
                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <Link to="/organizer/signup" className="btn bg-white text-slate-950 hover:bg-slate-200 dark:bg-slate-950 dark:text-white dark:hover:bg-slate-800">Create organizer account</Link>
                  <Link to="/organizer/login" className="btn border border-slate-600 text-white hover:border-white dark:border-slate-300 dark:text-slate-950 dark:hover:border-slate-950">Organizer login</Link>
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      )}
    </PublicLayout>
  );
}
