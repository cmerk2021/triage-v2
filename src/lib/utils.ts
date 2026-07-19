import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge conditional class names with Tailwind conflict resolution. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Format a duration in minutes as a compact human string ("1h 30m"). */
export function formatDuration(minutes: number): string {
  if (!minutes || minutes <= 0) return "0m";
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/** Format a duration for prose ("about an hour", "2 hours 30 minutes"). */
export function formatDurationLong(minutes: number): string {
  if (minutes <= 0) return "no time";
  if (minutes < 45) return `${Math.round(minutes)} minutes`;
  if (minutes < 75) return "about an hour";
  const h = Math.round((minutes / 60) * 2) / 2;
  return h === 1 ? "about an hour" : `about ${h} hours`;
}

/** Stable pseudo-random pick used for deterministic defaults (e.g. colors). */
export function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Non-cryptographic id for optimistic/local records. */
export function tempId(): string {
  return `tmp_${Math.random().toString(36).slice(2, 10)}`;
}
