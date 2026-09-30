/**
 * Due dates are calendar days, not moments in time. Storing them as
 * `YYYY-MM-DD` read from the *local* clock — rather than an ISO timestamp —
 * keeps "is this due today?" from drifting a day either side of UTC.
 */
export function toLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function today(): string {
  return toLocalDateString(new Date());
}

/** Days from `from` to `to`, both `YYYY-MM-DD`. Negative means `to` is past. */
export function dayDelta(from: string, to: string): number {
  const a = Date.parse(`${from}T00:00:00`);
  const b = Date.parse(`${to}T00:00:00`);
  if (Number.isNaN(a) || Number.isNaN(b)) return 0;
  return Math.round((b - a) / 86_400_000);
}

const dueFormatter = new Intl.DateTimeFormat(undefined, {
  weekday: "short",
  day: "numeric",
  month: "short",
});

/** "Today", "Tomorrow", "Yesterday", else "Mon 5 Oct". */
export function formatDueDate(dueDate: string, todayDate: string): string {
  const delta = dayDelta(todayDate, dueDate);
  if (delta === 0) return "Today";
  if (delta === 1) return "Tomorrow";
  if (delta === -1) return "Yesterday";

  const parsed = new Date(`${dueDate}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return dueDate;
  return dueFormatter.format(parsed);
}

const relativeFormatter = new Intl.RelativeTimeFormat(undefined, {
  numeric: "auto",
});

/** "just now", "5 minutes ago", "last week" — for note timestamps. */
export function formatRelativeTime(isoTimestamp: string): string {
  const then = Date.parse(isoTimestamp);
  if (Number.isNaN(then)) return "";

  const seconds = Math.round((then - Date.now()) / 1000);
  const magnitude = Math.abs(seconds);
  if (magnitude < 45) return "just now";

  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31_536_000],
    ["month", 2_592_000],
    ["week", 604_800],
    ["day", 86_400],
    ["hour", 3_600],
    ["minute", 60],
  ];

  for (const [unit, secondsPerUnit] of units) {
    if (magnitude >= secondsPerUnit) {
      return relativeFormatter.format(Math.round(seconds / secondsPerUnit), unit);
    }
  }
  return "just now";
}
