export default function PageHero({ eyebrow, title, subtitle, image }) {
  return (
    <section className="border-b border-slate-200 dark:border-slate-800">
      <div className="shell-wrap py-12 sm:py-16 grid gap-10 lg:grid-cols-2 items-center">
        <div>
          {eyebrow && <p className="eyebrow text-brand-700 dark:text-brand-300 m-0">{eyebrow}</p>}
          <h1 className="display mt-3 mb-0 text-3xl sm:text-4xl lg:text-5xl text-slate-900 dark:text-white">{title}</h1>
          {subtitle && <p className="mt-5 text-lg text-slate-600 dark:text-slate-300 max-w-lg leading-relaxed">{subtitle}</p>}
        </div>
        {image && (
          <div className="rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 aspect-[4/3]">
            <img src={image} alt="" className="w-full h-full object-cover" />
          </div>
        )}
      </div>
    </section>
  );
}
