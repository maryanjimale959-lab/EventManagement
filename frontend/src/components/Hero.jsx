import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const TRACKS = [
  "Artificial Intelligence",
  "Technology",
  "Hackathons",
  "Workshops",
  "Islamic Studies",
  "Business",
  "Education",
  "Professional Development",
];

function Marquee() {
  const items = [...TRACKS, ...TRACKS];
  return (
    <div className="overflow-hidden border-y-2 border-slate-900 bg-slate-900 py-3 text-accent-400 dark:border-slate-700" aria-hidden="true">
      <div className="flex w-max gap-10 whitespace-nowrap font-mono text-sm uppercase tracking-widest animate-[marquee_45s_linear_infinite] motion-reduce:animate-none">
        {items.concat(items).map((t, i) => (
          <span key={i} className="flex items-center gap-10">
            {t}
            <span>✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}

export default function Hero() {
  const [term, setTerm] = useState("");
  const navigate = useNavigate();

  const submit = (e) => {
    e.preventDefault();
    const q = term.trim();
    navigate(q ? `/events?search=${encodeURIComponent(q)}` : "/events");
  };

  return (
    <section>
      <div className="shell-wrap pt-12 sm:pt-16">
        <p className="eyebrow m-0 text-slate-900 dark:text-slate-200">[ Education · Tech · AI · Business · Islamic Studies ]</p>

        <h1 className="display mt-6 mb-0 text-[clamp(3.25rem,12vw,10.5rem)] uppercase leading-[0.95] text-slate-900 dark:text-white">
          <span className="block">Learn.</span>
          <span className="my-1 inline-block bg-accent-400 px-3 pb-1 leading-[0.9] text-slate-900">Build.</span>
          <span className="block">Gather.</span>
        </h1>

        <div className="mt-12 grid gap-10 border-t-2 border-slate-900 pt-8 dark:border-slate-700 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <p className="m-0 text-xl leading-snug text-slate-900 dark:text-slate-100">
              Workshops, lectures, hackathons and conferences. Register, scan a QR at the door,
              keep the materials.
            </p>

            <form onSubmit={submit} className="mt-8 flex border-2 border-slate-900 bg-white focus-within:shadow-[5px_5px_0_0_#121212] dark:border-slate-500 dark:bg-slate-900 dark:focus-within:shadow-[5px_5px_0_0_#d4ff3a]">
              <input
                type="text"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="Search a topic, speaker or city"
                aria-label="Search events"
                className="min-w-0 flex-1 bg-transparent px-4 py-3.5 text-base text-slate-900 placeholder-slate-500 focus:outline-none dark:text-white"
              />
              <button type="submit" className="bg-slate-900 px-6 font-mono text-sm font-bold uppercase tracking-wider text-white transition-colors hover:bg-accent-400 hover:text-slate-900 dark:bg-accent-400 dark:text-slate-900 dark:hover:bg-white">
                Search
              </button>
            </form>

            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 font-mono text-sm uppercase tracking-wider">
              <Link to="/events" className="font-bold underline underline-offset-4 decoration-2 hover:bg-accent-400 hover:text-slate-900 dark:text-white">All events →</Link>
              <Link to="/organizer/signup" className="underline underline-offset-4 hover:bg-accent-400 hover:text-slate-900 dark:text-white">Host one →</Link>
            </div>
          </div>

          <div className="relative lg:col-span-7">
            <img
              src="/images/edu-hero.jpg"
              alt="Students and a teacher working together at a study space"
              className="aspect-[16/10] w-full border-2 border-slate-900 object-cover grayscale transition-all duration-700 hover:grayscale-0 dark:border-slate-600"
            />
            <span className="absolute -top-5 right-4 rotate-6 bg-accent-400 px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-slate-900 border-2 border-slate-900">
              8 tracks open
            </span>
          </div>
        </div>
      </div>

      <div className="mt-16">
        <Marquee />
      </div>
    </section>
  );
}
