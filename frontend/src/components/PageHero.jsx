export default function PageHero({ eyebrow, title, subtitle, image }) {
  return (
    <section className="border-b-2 border-slate-900 dark:border-slate-700">
      <div className="shell-wrap py-12 sm:py-16 grid gap-10 lg:grid-cols-2 items-end">
        <div>
          {eyebrow && <p className="eyebrow m-0 text-slate-900 dark:text-slate-300">[ {eyebrow} ]</p>}
          <h1 className="display mt-4 mb-0 text-4xl sm:text-6xl uppercase leading-[0.92] text-slate-900 dark:text-white">{title}</h1>
          {subtitle && <p className="mt-6 text-lg text-slate-700 dark:text-slate-300 max-w-lg leading-snug">{subtitle}</p>}
        </div>
        {image && (
          <img src={image} alt="" className="w-full aspect-[4/3] object-cover border-2 border-slate-900 grayscale hover:grayscale-0 transition-all duration-700 dark:border-slate-600" />
        )}
      </div>
    </section>
  );
}
