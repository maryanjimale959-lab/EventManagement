/**
 * The one empty view every list falls back to. It carries a drawn mark rather
 * than an emoji: a pictograph in a bordered box reads as a broken image, and
 * the mark is the only thing on the page besides the words.
 */
export default function EmptyState({ title = "Nothing here", description = "No data available", action }) {
  return (
    <div className="empty-state">
      <svg
        className="mx-auto mb-3 h-10 w-10 text-slate-300 dark:text-slate-600"
        viewBox="0 0 40 40"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M6 15.5 20 7l14 8.5v13A2.5 2.5 0 0 1 31.5 31h-23A2.5 2.5 0 0 1 6 28.5v-13Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path d="M6 15.5 20 24l14-8.5M20 24v10" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      </svg>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}
