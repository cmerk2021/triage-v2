import { useMemo } from "react";
import { isToday } from "date-fns";
import { cn, formatDuration } from "@/lib/utils";
import { dayLabel } from "@/lib/time";
import { useDataStore } from "@/stores/data.store";
import { computeWorkload, peakWorkload } from "./workload";

export function WorkloadForecast({
  days = 14,
  className,
}: {
  days?: number;
  className?: string;
}) {
  const assignmentsWithSubtasks = useDataStore((s) =>
    s.assignmentsWithSubtasks(),
  );

  const buckets = useMemo(
    () => computeWorkload(assignmentsWithSubtasks, days),
    [assignmentsWithSubtasks, days],
  );
  const peak = Math.max(peakWorkload(buckets), 60);
  const busiest = buckets.reduce(
    (max, d) => (d.minutes > max.minutes ? d : max),
    buckets[0],
  );

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-end gap-1">
        {buckets.map((d, i) => {
          const height = Math.max(4, Math.round((d.minutes / peak) * 100));
          const today = isToday(d.date);
          return (
            <div
              key={i}
              className="group flex flex-1 flex-col items-center gap-1.5"
              title={`${d.count} due · ${formatDuration(d.minutes)}`}
            >
              <div className="flex h-24 w-full items-end">
                <div
                  className={cn(
                    "w-full rounded-md transition-all duration-300 ease-swift",
                    d.minutes === 0
                      ? "bg-bg-inset"
                      : today
                        ? "bg-accent"
                        : "bg-accent/35 group-hover:bg-accent/55",
                  )}
                  style={{ height: `${height}%` }}
                />
              </div>
              <span
                className={cn(
                  "text-2xs",
                  today ? "font-semibold text-accent" : "text-fg-faint",
                )}
              >
                {dayLabel(d.date.getDay()).charAt(0)}
              </span>
            </div>
          );
        })}
      </div>
      {busiest && busiest.minutes > 0 && (
        <p className="text-2xs text-fg-subtle">
          Busiest ahead:{" "}
          <span className="text-fg-muted">
            {dayLabel(busiest.date.getDay())} · {formatDuration(busiest.minutes)}
          </span>
        </p>
      )}
    </div>
  );
}
