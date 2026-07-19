import {
  differenceInCalendarDays,
  differenceInMinutes,
  format,
  formatDistanceToNowStrict,
  isToday,
  isTomorrow,
  isValid,
  parseISO,
  startOfDay,
} from "date-fns";

/** Parse a PocketBase/ISO date string, returning null when unset/invalid. */
export function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const parsed = typeof value === "string" ? parseISO(value) : value;
  return isValid(parsed) ? parsed : null;
}

/** Whole calendar days from now until `date` (negative = overdue). */
export function daysUntil(date: Date, now: Date = new Date()): number {
  return differenceInCalendarDays(startOfDay(date), startOfDay(now));
}

export function minutesUntil(date: Date, now: Date = new Date()): number {
  return differenceInMinutes(date, now);
}

/** Warm, human phrasing of a due date. */
export function describeDueDate(value: string, now: Date = new Date()): string {
  const date = parseDate(value);
  if (!date) return "No due date";

  const days = daysUntil(date, now);
  if (days < 0) {
    const overdue = Math.abs(days);
    return overdue === 1 ? "Overdue by 1 day" : `Overdue by ${overdue} days`;
  }
  if (isToday(date)) return "Due today";
  if (isTomorrow(date)) return "Due tomorrow";
  if (days <= 6) return `Due ${format(date, "EEEE")}`;
  return `Due ${format(date, "MMM d")}`;
}

export function shortDueDate(value: string): string {
  const date = parseDate(value);
  if (!date) return "—";
  if (isToday(date)) return "Today";
  if (isTomorrow(date)) return "Tomorrow";
  return format(date, "MMM d");
}

export function relativeTime(value: string): string {
  const date = parseDate(value);
  if (!date) return "";
  return formatDistanceToNowStrict(date, { addSuffix: true });
}

export function greeting(now: Date = new Date()): string {
  const hour = now.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export function dayLabel(day: number): string {
  return DAY_LABELS[((day % 7) + 7) % 7];
}

const DAY_LABELS_FULL = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
export function dayLabelFull(day: number): string {
  return DAY_LABELS_FULL[((day % 7) + 7) % 7];
}

export function formatClock(time: string): string {
  const [h, m] = time.split(":").map(Number);
  if (Number.isNaN(h)) return time;
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m ?? 0).padStart(2, "0")} ${period}`;
}

/** Convert an "HH:mm" string to minutes since midnight. */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

export { format, isToday, isTomorrow, startOfDay };
