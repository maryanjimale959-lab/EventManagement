import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { EVENT_CATEGORIES, getCategoryMeta } from "../utils/categories.js";
import { dayOfMonth, hasEnded, monthShort, relativeDay } from "../utils/dates.js";

/** Anything can open the palette without owning its state. */
export const openPalette = () => window.dispatchEvent(new Event("kulan:palette"));

const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <circle cx="11" cy="11" r="7.5" />
    <path d="m20.5 20.5-4.2-4.2" strokeLinecap="round" />
  </svg>
);

/**
 * Ctrl/Cmd+K (or "/") search over events and pages. Arrow keys move, Enter
 * opens, Escape closes. Events load the first time it opens.
 */
export default function CommandPalette() {
  const navigate = useNavigate();
  const { isAuthed } = useAuth();
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("");
  const [events, setEvents] = useState(null);
  const [active, setActive] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => {
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target?.tagName) || e.target?.isContentEditable;
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === "/" && !typing && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setOpen(true);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("kulan:palette", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("kulan:palette", onOpen);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    setTerm("");
    setActive(0);
    requestAnimationFrame(() => inputRef.current?.focus());
    if (events === null) {
      client.get("/api/events/public").then((r) => setEvents(Array.isArray(r.data) ? r.data : [])).catch(() => setEvents([]));
    }
  }, [open, events]);

  const pages = useMemo(
    () =>
      isAuthed
        ? [
            { id: "p-events", label: "Explore all events", hint: "Dashboard", to: "/dashboard" },
            { id: "p-mine", label: "My registrations", hint: "Dashboard", to: "/dashboard/events" },
            { id: "p-profile", label: "Profile & password", hint: "Dashboard", to: "/dashboard/profile" },
          ]
        : [
            { id: "p-events", label: "Browse all events", hint: "Page", to: "/events" },
            { id: "p-how", label: "How it works", hint: "Page", to: "/how-it-works" },
            { id: "p-login", label: "Log in", hint: "Page", to: "/login" },
            { id: "p-contact", label: "Contact support", hint: "Page", to: "/contact" },
            { id: "p-host", label: "Host an event", hint: "Page", to: "/organizer/signup" },
          ],
    [isAuthed]
  );

  const items = useMemo(() => {
    const q = term.trim().toLowerCase();
    const eventsBase = isAuthed ? "/dashboard/events" : "/events";
    const listBase = isAuthed ? "/dashboard" : "/events";
    const counts = {};
    (events || []).forEach((e) => {
      const k = getCategoryMeta(e.category).label;
      counts[k] = (counts[k] || 0) + 1;
    });

    const categories = EVENT_CATEGORIES.filter((c) => c !== "All")
      .filter((c) => !q || c.toLowerCase().includes(q) || getCategoryMeta(c).shortLabel.toLowerCase().includes(q))
      .map((c) => ({ id: `c-${c}`, kind: "category", group: "Categories", label: c, meta: getCategoryMeta(c), count: counts[c] || 0, to: `${listBase}?category=${encodeURIComponent(c)}` }));

    const list = (events || [])
      .filter((e) => !q || `${e.title} ${e.category || ""} ${e.location || ""}`.toLowerCase().includes(q))
      .sort((a, b) => {
        const ae = hasEnded(a), be = hasEnded(b);
        if (ae !== be) return ae ? 1 : -1;
        return new Date(a.startDateTime) - new Date(b.startDateTime);
      })
      .slice(0, q ? 6 : 3)
      .map((e) => ({ id: e._id, kind: "event", group: q ? "Events" : "Upcoming", event: e, to: `${eventsBase}/${e._id}` }));

    // Pages only show up when someone searches for them.
    const nav = q ? pages.filter((p) => p.label.toLowerCase().includes(q)).map((p) => ({ ...p, kind: "page", group: "Pages" })) : [];
    const all = q ? [...list, ...categories, ...nav] : [...categories, ...list];
    if (q) all.push({ id: "search-all", kind: "page", group: "Search", label: `Search all events for “${term.trim()}”`, hint: "Enter", to: `${listBase}?search=${encodeURIComponent(term.trim())}` });
    return all;
  }, [events, isAuthed, pages, term]);

  useEffect(() => setActive(0), [term]);
  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const go = (item) => {
    if (!item) return;
    setOpen(false);
    navigate(item.to);
  };

  const onKeyDown = (e) => {
    if (e.key === "Escape") setOpen(false);
    else if (e.key === "ArrowDown") { e.preventDefault(); setActive((i) => Math.min(i + 1, items.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); go(items[active]); }
  };

  if (!open) return null;

  return (
    <div className="palette-overlay" onMouseDown={() => setOpen(false)} role="presentation">
      <div className="palette" role="dialog" aria-modal="true" aria-label="Search" onMouseDown={(e) => e.stopPropagation()} onKeyDown={onKeyDown}>
        <div className="palette-input">
          <span className="text-slate-400"><SearchIcon /></span>
          <input
            ref={inputRef}
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Search events, topics or cities"
            aria-label="Search"
            role="combobox"
            aria-expanded="true"
            aria-controls="palette-list"
          />
          <kbd className="kbd">Esc</kbd>
        </div>

        <ul id="palette-list" ref={listRef} role="listbox" className="palette-list">
          {events === null && <li className="px-4 pb-2 pt-3 text-xs text-slate-500">Loading events…</li>}
          {items.map((item, i) => (
            <li key={item.id} role="option" aria-selected={i === active} data-index={i}>
              {item.group !== items[i - 1]?.group && <div className="palette-group">{item.group}</div>}
              <button
                type="button"
                className={`palette-item ${i === active ? "is-active" : ""}`}
                onMouseMove={() => active !== i && setActive(i)}
                onClick={() => go(item)}
              >
                {item.kind === "category" ? (
                  <>
                    <span className="h-2 w-2 shrink-0 rounded-full bg-slate-900 dark:bg-white" aria-hidden="true" />
                    <span className="min-w-0 flex-1 text-left">
                      <span className="block truncate font-medium">{item.label}</span>
                      <span className="block truncate text-xs text-slate-500 dark:text-slate-400">{item.meta.description}</span>
                    </span>
                    {events !== null && <span className="shrink-0 text-xs text-slate-500 dark:text-slate-400">{item.count} {item.count === 1 ? "event" : "events"}</span>}
                  </>
                ) : item.kind === "event" ? (
                  <>
                    <span className="date-tile !w-10 !py-1" aria-hidden="true">
                      <span className="date-tile-month">{monthShort(item.event.startDateTime)}</span>
                      <span className="date-tile-day !text-base">{dayOfMonth(item.event.startDateTime)}</span>
                    </span>
                    <span className="min-w-0 flex-1 text-left">
                      <span className="block truncate font-medium">{item.event.title}</span>
                      <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
                        {item.event.category || "General"} · {item.event.location || "Online"}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs text-slate-500 dark:text-slate-400">{relativeDay(item.event.startDateTime)}</span>
                  </>
                ) : (
                  <>
                    <span className="min-w-0 flex-1 truncate text-left font-medium">{item.label}</span>
                    <span className="shrink-0 text-xs text-slate-400">{item.hint}</span>
                  </>
                )}
              </button>
            </li>
          ))}
          {events !== null && items.length === 0 && <li className="px-4 py-6 text-center text-sm text-slate-500">Nothing found.</li>}
        </ul>

        <div className="palette-foot">
          <span><kbd className="kbd">↑</kbd> <kbd className="kbd">↓</kbd> to move</span>
          <span><kbd className="kbd">Enter</kbd> to open</span>
        </div>
      </div>
    </div>
  );
}
