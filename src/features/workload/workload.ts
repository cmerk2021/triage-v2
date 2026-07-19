import { addDays, startOfDay } from "date-fns";
import type { AssignmentWithSubtasks } from "@/lib/types";
import { parseDate } from "@/lib/time";
import { estimateRemaining } from "@/features/recommendations/engine";

export interface WorkloadDay {
  date: Date;
  minutes: number;
  count: number;
}

/**
 * Forecast upcoming workload by attributing each assignment's remaining work
 * to the day it's due. This surfaces crunch periods before they arrive.
 */
export function computeWorkload(
  assignments: AssignmentWithSubtasks[],
  days = 14,
  now: Date = new Date(),
): WorkloadDay[] {
  const start = startOfDay(now);
  const buckets: WorkloadDay[] = Array.from({ length: days }, (_, i) => ({
    date: addDays(start, i),
    minutes: 0,
    count: 0,
  }));

  for (const a of assignments) {
    if (a.archived || a.status === "done") continue;
    const due = parseDate(a.dueDate);
    if (!due) continue;
    const dayIndex = Math.round(
      (startOfDay(due).getTime() - start.getTime()) / 86400000,
    );
    if (dayIndex < 0 || dayIndex >= days) continue;
    buckets[dayIndex].minutes += estimateRemaining(a);
    buckets[dayIndex].count += 1;
  }

  return buckets;
}

export function peakWorkload(days: WorkloadDay[]): number {
  return days.reduce((max, d) => Math.max(max, d.minutes), 0);
}
