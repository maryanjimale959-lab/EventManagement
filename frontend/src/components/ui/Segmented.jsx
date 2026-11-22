import { useLayoutEffect, useRef, useState } from "react";

/**
 * A row of options with a thumb that slides to the selected one.
 * options: [{ value, label, count? }]
 */
export default function Segmented({ options, value, onChange, label, className = "" }) {
  const refs = useRef({});
  const [thumb, setThumb] = useState(null);

  useLayoutEffect(() => {
    const measure = () => {
      const el = refs.current[value];
      if (el) setThumb({ left: el.offsetLeft, width: el.offsetWidth });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [value, options]);

  return (
    <div className={`segmented ${className}`} role="tablist" aria-label={label}>
      {thumb && <span className="segmented-thumb" style={{ transform: `translateX(${thumb.left}px)`, width: thumb.width }} aria-hidden="true" />}
      {options.map((o) => (
        <button
          key={o.value}
          ref={(el) => (refs.current[o.value] = el)}
          type="button"
          role="tab"
          aria-selected={o.value === value}
          className={`segmented-item ${o.value === value ? "is-active" : ""}`}
          onClick={() => onChange(o.value)}
        >
          {o.label}
          {o.count !== undefined && <span className="segmented-count">{o.count}</span>}
        </button>
      ))}
    </div>
  );
}
