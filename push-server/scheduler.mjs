/**
 * Pure scheduling helpers for the Triage push worker.
 *
 * All time reasoning happens in each subscription's own timezone so a student's
 * "8:00 AM" reminder lands at their local 8 AM regardless of server location.
 */

const WEEKDAY = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

/** Break `date` into local calendar parts for `tz`. */
export function localParts(date, tz) {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: tz || "UTC",
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
  });
  const p = Object.fromEntries(fmt.formatToParts(date).map((x) => [x.type, x.value]));
  let hour = parseInt(p.hour, 10);
  if (hour === 24) hour = 0; // some ICU builds emit 24 at midnight
  return {
    ymd: `${p.year}-${p.month}-${p.day}`,
    weekday: WEEKDAY[p.weekday] ?? 0,
    minutes: hour * 60 + parseInt(p.minute, 10),
  };
}

export function timeToMinutes(t) {
  if (!t || typeof t !== "string") return null;
  const [h, m] = t.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

/**
 * Decide which reminders are due for a subscription right now.
 * Returns a list of { kind, patch, window? }. `patch` records the de-dup marker
 * to persist once the notification is actually sent.
 */
export function decideSends(prefs, parts, record) {
  const sends = [];
  // Catch-up window: fire if we're within N minutes past the target so a worker
  // that (re)starts mid-morning still delivers today's briefing, but never at 11pm.
  const CATCHUP = 120;

  const morning = timeToMinutes(prefs.morningBriefingTime);
  if (
    morning !== null &&
    parts.minutes >= morning &&
    parts.minutes < morning + CATCHUP &&
    record.lastMorning !== parts.ymd
  ) {
    sends.push({ kind: "morning", patch: { lastMorning: parts.ymd } });
  }

  const evening = timeToMinutes(prefs.eveningReminderTime);
  if (
    evening !== null &&
    parts.minutes >= evening &&
    parts.minutes < evening + CATCHUP &&
    record.lastEvening !== parts.ymd
  ) {
    sends.push({ kind: "evening", patch: { lastEvening: parts.ymd } });
  }

  const windows = Array.isArray(prefs.studyWindows) ? prefs.studyWindows : [];
  for (let i = 0; i < windows.length; i++) {
    const w = windows[i];
    if (w.day !== parts.weekday) continue;
    const start = timeToMinutes(w.start);
    if (start === null) continue;
    if (parts.minutes >= start && parts.minutes < start + 5) {
      const key = `${parts.ymd}:${i}`;
      if (record.lastStudyKey !== key) {
        sends.push({ kind: "study", patch: { lastStudyKey: key }, window: w });
        break; // at most one study nudge per tick
      }
    }
  }

  return sends;
}

/** Summarize a user's open assignments into counts used for message copy. */
export function summarize(assignments, now = new Date()) {
  const soon = now.getTime() + 7 * 24 * 60 * 60 * 1000;
  let overdue = 0;
  let dueSoon = 0;
  let nextTitle = null;
  let nextDue = Infinity;

  for (const a of assignments) {
    const t = a.dueDate ? new Date(a.dueDate).getTime() : NaN;
    if (Number.isNaN(t)) continue;
    if (t < now.getTime()) overdue++;
    else if (t <= soon) dueSoon++;
    if (t < nextDue) {
      nextDue = t;
      nextTitle = a.title;
    }
  }

  return { total: assignments.length, overdue, dueSoon, nextTitle };
}

/** Build the notification title/body for a reminder kind. */
export function buildMessage(kind, summary) {
  const { total, dueSoon, overdue, nextTitle } = summary;

  if (kind === "morning") {
    if (total === 0)
      return { title: "Good morning", body: "You're all caught up. Enjoy the clear day." };
    const bits = [];
    if (overdue > 0) bits.push(`${overdue} overdue`);
    if (dueSoon > 0) bits.push(`${dueSoon} due soon`);
    const detail = bits.length ? ` — ${bits.join(", ")}` : "";
    return {
      title: "Good morning",
      body: `You have ${total} open assignment${total === 1 ? "" : "s"}${detail}. A good time to plan your day.`,
    };
  }

  if (kind === "evening") {
    const attention = overdue + dueSoon;
    if (attention === 0)
      return {
        title: "Time to study",
        body: "Nothing urgent tonight. A little progress still goes a long way.",
      };
    return {
      title: "Time to study",
      body:
        attention === 1
          ? "One assignment deserves attention tonight."
          : `${attention} assignments deserve attention tonight.`,
    };
  }

  // study window
  if (total === 0)
    return {
      title: "Study block starting",
      body: "You're all caught up — a great time to get ahead.",
    };
  return {
    title: "Study block starting",
    body: nextTitle
      ? `Next up: ${nextTitle}.`
      : `${total} assignment${total === 1 ? "" : "s"} waiting when you're ready.`,
  };
}
