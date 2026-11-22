import { useEffect, useState } from "react";

/** Counts up to a number the first time it appears; strings render as given. */
function useCountUp(target) {
  const numeric = typeof target === "number" && Number.isFinite(target);
  const [n, setN] = useState(numeric ? 0 : target);
  useEffect(() => {
    if (!numeric) { setN(target); return undefined; }
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) { setN(target); return undefined; }
    let raf; const t0 = performance.now(); const dur = 700;
    const tick = (t) => {
      const p = Math.min((t - t0) / dur, 1);
      setN(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, numeric]);
  return n;
}

export default function StatCard({ label, value, hint }) {
  const shown = useCountUp(value);
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{typeof shown === "number" ? shown.toLocaleString() : shown}</div>
      {hint && <div className="text-muted" style={{ fontSize: "0.9rem", marginTop: "0.25rem" }}>{hint}</div>}
    </div>
  );
}
