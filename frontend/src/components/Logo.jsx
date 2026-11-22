/**
 * The one mark and wordmark used wherever the product names itself, so the
 * public site and the consoles share one identity.
 */
export function LogoMark({ size = 28, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true" className={`shrink-0 ${className}`}>
      <rect width="32" height="32" rx="9" className="fill-slate-950 dark:fill-white" />
      <path d="M11.5 8.5v15M21.5 8.5 13 16l8.5 7.5" className="stroke-white dark:stroke-slate-950" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Logo({ size = 28, label, className = "" }) {
  return (
    <span className={`inline-flex items-center gap-2.5 text-slate-900 dark:text-white ${className}`}>
      <LogoMark size={size} />
      <span className="brand-word">Kulan</span>
      {label && <span className="badge badge-neutral">{label}</span>}
    </span>
  );
}
