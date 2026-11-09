import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const TRACKS = [
  "Artificial Intelligence",
  "Workshops",
  "Hackathons",
  "Islamic Studies",
  "Business",
  "Education",
];

export default function Hero() {
  const [term, setTerm] = useState("");
  const navigate = useNavigate();

  const submit = (e) => {
    e.preventDefault();
    const q = term.trim();
    navigate(q ? `/events?search=${encodeURIComponent(q)}` : "/events");
  };

  return (
    <section className="border-b border-slate-200 dark:border-slate-800">
      <div className="shell-wrap py-14 sm:py-20 grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          <p className="eyebrow text-brand-700 dark:text-brand-300 m-0">
            Learn · Build · Grow
          </p>
          <h1 className="display mt-4 mb-0 text-4xl sm:text-5xl lg:text-6xl text-slate-900 dark:text-slate-50">
            Events that make you smarter.
          </h1>
          <p className="mt-5 text-lg text-slate-600 dark:text-slate-300 max-w-xl leading-relaxed">
            Find lectures, workshops, hackathons and conferences in education, technology, AI,
            business and Islamic studies. Register in a minute and check in with a QR code.
          </p>

          <form
            onSubmit={submit}
            className="mt-8 flex max-w-xl items-center gap-2 rounded-xl border border-slate-300 bg-white p-1.5 focus-within:border-brand-600 focus-within:ring-4 focus-within:ring-brand-600/10 dark:bg-slate-900 dark:border-slate-700"
          >
            <input
              type="text"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Search a topic, speaker or city"
              aria-label="Search events"
              className="flex-1 min-w-0 bg-transparent px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none dark:text-slate-100"
            />
            <button type="submit" className="btn btn-primary shrink-0">
              Search
            </button>
          </form>

          <div className="mt-5 flex flex-wrap gap-2">
            {TRACKS.map((t) => (
              <Link
                key={t}
                to={`/events?category=${encodeURIComponent(t)}`}
                className="category-chip !py-1.5"
              >
                {t}
              </Link>
            ))}
          </div>
        </div>

        <figure className="m-0 relative">
          <div className="overflow-hidden rounded-3xl border border-slate-200 aspect-[4/5] sm:aspect-[5/4] lg:aspect-[4/5] bg-slate-200 dark:border-slate-800 dark:bg-slate-800">
            <img
              src="/images/edu-hero.jpg"
              alt="Students and a teacher working together at a university study space"
              className="h-full w-full object-cover"
            />
          </div>
          <figcaption className="absolute -bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-64 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm dark:bg-slate-900 dark:border-slate-700">
            <span className="block font-semibold text-slate-900 dark:text-white">8 learning tracks</span>
            <span className="text-slate-500 dark:text-slate-400">From academics to AI and ethics</span>
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
