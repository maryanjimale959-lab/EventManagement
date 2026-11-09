import { Link } from "react-router-dom";

/**
 * The hero is the photograph, not an illustration of one. The crowd shot does
 * the talking, so the type sits inside it with a warm scrim rather than beside
 * a picture in a rounded box.
 */
export default function Hero() {
  return (
    <section className="relative min-h-[86dvh] flex items-end photo-surface">
      <img src="/images/hero-crowd.jpg" alt="" aria-hidden="true" />
      <div className="photo-scrim" />

      <div className="shell-wrap relative z-10 w-full pt-32 pb-16 sm:pb-20">
        <p className="eyebrow text-brand-300 mb-5 flex items-center gap-2">
          <span>★</span>
          <span>Hoyga Dhacdooyinka Soomaaliyeed · Registration · Door Check-in · Private Memories</span>
        </p>
        <h1 className="display m-0 text-5xl sm:text-6xl lg:text-7xl text-white max-w-4xl">
          Every Somali gathering, celebrated &amp; captured.
          <span className="block text-brand-400 mt-2">Shared privately with the people who were there.</span>
        </h1>
        <p className="mt-7 text-lg sm:text-xl text-slate-200 max-w-2xl leading-relaxed">
          From the Mogadishu Tech Summit to traditional Aroos weddings and diaspora business forums across London, Nairobi, and Minneapolis. Register in seconds, verify your ticket at the entrance, and unlock an exclusive photo &amp; video gallery.
        </p>

        <div className="mt-9 flex flex-wrap items-center gap-4">
          <Link to="/events" className="btn btn-primary text-base px-7 py-4">
            Explore Somali Events
          </Link>
          <Link to="/organizer/signup" className="btn btn-secondary text-base px-6 py-4 bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm border border-white/20">
            Host an Event (Abaabule)
          </Link>
          <Link
            to="/how-it-works"
            className="inline-flex items-center gap-2 text-base font-semibold text-white/90 hover:text-brand-300 transition-colors ml-2"
          >
            See how it works
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M3 8h10M9 4l4 4-4 4"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
