/**
 * Habit-building notifications.
 *
 * A browser PWA can only reliably schedule notifications while a client is
 * running, so Triage schedules the next morning briefing and evening study
 * reminder with timers whenever the app is open, and de-duplicates per day via
 * localStorage. Per-assignment reminders remain an advanced, opt-in extra.
 */

export function notificationsSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!notificationsSupported()) return false;
  if (Notification.permission === "granted") return true;
  const result = await Notification.requestPermission();
  return result === "granted";
}

export function showNotification(title: string, body: string) {
  if (!notificationsSupported() || Notification.permission !== "granted") return;
  const n = new Notification(title, {
    body,
    icon: "/favicon.svg",
    badge: "/favicon.svg",
    tag: "triage",
  });
  n.onclick = () => {
    window.focus();
    window.location.assign("/");
    n.close();
  };
}

/** Milliseconds from `now` until the next occurrence of "HH:mm". */
export function msUntilTime(time: string, now: Date = new Date()): number {
  const [h, m] = time.split(":").map(Number);
  const target = new Date(now);
  target.setHours(h || 0, m || 0, 0, 0);
  if (target.getTime() <= now.getTime()) target.setDate(target.getDate() + 1);
  return target.getTime() - now.getTime();
}

const KEY = "triage:lastNotified";

/** Returns true at most once per calendar day for a given key. */
export function markOncePerDay(kind: "morning" | "evening"): boolean {
  const today = new Date().toDateString();
  const raw = localStorage.getItem(KEY);
  const state = raw ? (JSON.parse(raw) as Record<string, string>) : {};
  if (state[kind] === today) return false;
  state[kind] = today;
  localStorage.setItem(KEY, JSON.stringify(state));
  return true;
}
