import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const TRACKS = ["Artificial Intelligence", "Workshops", "Hackathons", "Islamic Studies", "Business", "Education"];

export default function Hero() {
  const [term, setTerm] = useState("");
  const navigate = useNavigate();

  const submit = (e) => {
    e.preventDefault();
    const q = term.trim();
    navigate(q ? `/events?search=${encodeURIComponent(q)}` : "/events");
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-brand-50 via-white to-white dark:from-slate-900 dark:via-slate-950 dark:to-slate-950">
      <div className="shell-wrap pt-14 sm:pt-20 pb-6 text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-brand-700 shadow-sm ring-1 ring-brand-100 dark:bg-slate-900 dark:text-brand-300 dark:ring-slate-800">
          <span className="h-2 w-2 rounded-full bg-accent-500" />
          Education · Technology · AI · Business · Islamic Studies
        </span>

        <h1 className="display mx-auto mt-6 mb-0 max-w-4xl text-5xl sm:text-6xl lg:text-7xl text-slate-900 dark:text-white">
          Learn something new at your next{" "}
          <span className="text-brand-600 dark:text-brand-400">event.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
          Discover workshops, lectures, hackathons and conferences. Register in a minute, check in
          with a QR code, and keep the materials afterwards.
        </p>

        <form
          onSubmit={submit}
          className="mx-auto mt-9 flex max-w-2xl items-center gap-2 rounded-full bg-white p-2 shadow-xl shadow-brand-900/10 ring-1 ring-slate-200 focus-within:ring-2 focus-within:ring-brand-500 dark:bg-slate-900 dark:ring-slate-800"
        >
          <svg className="ml-3 shrink-0 text-slate-400" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Search events, topics or cities"
            aria-label="Search events"
            className="min-w-0 flex-1 bg-transparent px-1 py-3 text-base text-slate-900 placeholder-slate-400 focus:outline-none dark:text-white"
          />
          <button type="submit" className="btn btn-primary shrink-0 !px-7 !py-3">
            Search
          </button>
        </form>

        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {TRACKS.map((t) => (
            <Link key={t} to={`/events?category=${encodeURIComponent(t)}`} className="category-chip">
              {t}
            </Link>
          ))}
        </div>
      </div>

      {/* Image bento */}
      <div className="shell-wrap pb-14 sm:pb-20 pt-10">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-6 sm:grid-rows-2 sm:h-[460px]">
          <div className="col-span-2 sm:col-span-3 sm:row-span-2 overflow-hidden rounded-3xl h-64 sm:h-auto">
            <img src="/images/edu-hero.jpg" alt="Students collaborating at a study space" className="h-full w-full object-cover" />
          </div>
          <div className="sm:col-span-3 overflow-hidden rounded-3xl h-40 sm:h-auto relative">
            <img src="/images/edu-lecture.jpg" alt="Speaker at a lecture hall" className="h-full w-full object-cover" />
          </div>
          <div className="sm:col-span-2 overflow-hidden rounded-3xl h-40 sm:h-auto">
            <img src="/images/edu-workshop.jpg" alt="Hands-on coding workshop" className="h-full w-full object-cover" />
          </div>
          <div className="sm:col-span-1 flex flex-col justify-center rounded-3xl bg-brand-600 p-5 text-white h-40 sm:h-auto">
            <span className="display text-4xl">8</span>
            <span className="mt-1 text-sm text-brand-100">learning tracks</span>
          </div>
        </div>
      </div>
    </section>
  );
}
