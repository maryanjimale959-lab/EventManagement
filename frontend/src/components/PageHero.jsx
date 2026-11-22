export default function PageHero({ eyebrow, title, subtitle, image }) {
  return (
    <section className="border-b border-slate-200 dark:border-slate-800">
      <div className="shell-wrap grid items-center gap-10 py-12 sm:py-16 lg:grid-cols-2">
        <div>
          {eyebrow && <p className="eyebrow m-0 mb-3 text-brand-700 dark:text-brand-300">{eyebrow}</p>}
          <h1 className="display m-0 text-4xl text-slate-900 sm:text-5xl dark:text-white">{title}</h1>
          {subtitle && <p className="mt-4 max-w-lg text-lg text-slate-600 dark:text-slate-400">{subtitle}</p>}
        </div>
        {image && (
          <div className="photo-surface aspect-[4/3] rounded-3xl">
            <img src={image} alt="" />
          </div>
        )}
      </div>
    </section>
  );
}
