import { useMemo } from "react";
import { useDataStore } from "@/stores/data.store";
import { useAuthStore } from "@/stores/auth.store";
import { timeToMinutes } from "@/lib/time";
import type { Preferences } from "@/lib/types";
import { createEngine } from "./engine";

/** Minutes the student can realistically study today, from their windows. */
export function availableMinutesToday(
  prefs: Preferences,
  now: Date = new Date(),
): number {
  const todays = prefs.studyWindows.filter((w) => w.day === now.getDay());
  if (todays.length === 0) return prefs.dailyGoalMinutes;

  const nowMin = now.getHours() * 60 + now.getMinutes();
  let total = 0;
  for (const w of todays) {
    const start = Math.max(timeToMinutes(w.start), nowMin);
    const end = timeToMinutes(w.end);
    total += Math.max(0, end - start);
  }
  return total > 0 ? total : prefs.dailyGoalMinutes;
}

/**
 * Build a recommendation engine from current workspace data. Recomputes only
 * when the underlying assignments/subtasks/preferences change.
 */
export function useEngine(availableMinutesOverride?: number) {
  const assignments = useDataStore((s) => s.assignments);
  const subtasks = useDataStore((s) => s.subtasks);
  const preferences = useAuthStore((s) => s.preferences());

  return useMemo(() => {
    const withSubtasks = assignments.map((a) => ({
      ...a,
      subtasks: subtasks
        .filter((s) => s.assignment === a.id)
        .sort((x, y) => x.position - y.position),
    }));
    const now = new Date();
    const availableMinutes =
      availableMinutesOverride ?? availableMinutesToday(preferences, now);

    return createEngine({
      assignments: withSubtasks,
      now,
      availableMinutes,
      preferences,
    });
  }, [assignments, subtasks, preferences, availableMinutesOverride]);
}
