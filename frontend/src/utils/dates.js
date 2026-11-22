/** Intl-formatted date part, or "" when the value is missing or invalid. */
export const fmtDate = (value, opts) => {
  if (!value) return "";
  try {
    return new Intl.DateTimeFormat("en", opts).format(new Date(value));
  } catch {
    return "";
  }
};

export const monthShort = (v) => fmtDate(v, { month: "short" });
export const dayOfMonth = (v) => fmtDate(v, { day: "numeric" });
export const weekdayTime = (v) => {
  const day = fmtDate(v, { weekday: "short" });
  const time = fmtDate(v, { hour: "numeric", minute: "2-digit" });
  return day && time ? `${day}, ${time}` : day || time;
};

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

/**
 * How far away an event is, in the words a person would use: "Today",
 * "Tomorrow", "In 5 days", "In 3 weeks". Returns "" for past or invalid dates
 * so callers can simply skip rendering it.
 */
export const relativeDay = (value, now = new Date()) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const days = Math.round((startOfDay(date) - startOfDay(now)) / 86400000);
  if (days < 0) return "";
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days < 14) return `In ${days} days`;
  if (days < 60) return `In ${Math.round(days / 7)} weeks`;
  return `In ${Math.round(days / 30)} months`;
};

export const hasEnded = (event, now = new Date()) =>
  new Date(event.endDateTime || event.startDateTime) < now;
