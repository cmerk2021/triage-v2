import { ArrowRight, Clock } from "lucide-react";
import { cn, formatDuration } from "@/lib/utils";
import { describeDueDate } from "@/lib/time";
import type { Recommendation } from "./engine";
import { useDataStore } from "@/stores/data.store";
import { useUIStore } from "@/stores/ui.store";
import { CourseGlyph } from "@/features/courses/CourseGlyph";
import { courseHsl } from "@/design-system/courseColor";

export function RecommendationCard({
  rec,
  primary = false,
}: {
  rec: Recommendation;
  primary?: boolean;
}) {
  const getCourse = useDataStore((s) => s.getCourse);
  const setStatus = useDataStore((s) => s.setStatus);
  const openAssignment = useUIStore((s) => s.openAssignment);

  const a = rec.assignment;
  const course = getCourse(a.course);
  const color = course?.color ?? "indigo";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => openAssignment(a.id)}
      onKeyDown={(e) => e.key === "Enter" && openAssignment(a.id)}
      className={cn(
        "group relative cursor-pointer overflow-hidden rounded-xl border border-border bg-bg-subtle transition-all duration-150 ease-swift hover:border-border-strong",
        primary ? "p-4" : "p-3.5",
      )}
    >
      <div
        className="absolute inset-y-0 left-0 w-[3px]"
        style={{ backgroundColor: courseHsl(color) }}
      />

      <div className="flex items-start gap-3 pl-1.5">
        {course && <CourseGlyph course={course} size={primary ? "md" : "sm"} />}
        <div className="min-w-0 flex-1">
          <div
            className={cn(
              "font-medium text-fg",
              primary ? "text-[15px]" : "text-sm",
            )}
          >
            {a.title}
          </div>

          <p
            className="mt-0.5 text-[13px]"
            style={{ color: courseHsl(color) }}
          >
            {rec.reason}
          </p>

          {primary && rec.nextSubtask && (
            <p className="mt-2 text-[13px] text-fg-muted">
              Next: {rec.nextSubtask.title}
            </p>
          )}

          <div className="mt-2.5 flex items-center gap-3 text-2xs text-fg-subtle">
            {rec.remainingMinutes > 0 && (
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDuration(rec.remainingMinutes)}
              </span>
            )}
            {a.dueDate && <span>{describeDueDate(a.dueDate)}</span>}
          </div>
        </div>

        {primary && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setStatus(a.id, "in_progress");
              openAssignment(a.id);
            }}
            className="flex shrink-0 items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-[13px] font-medium text-accent-fg transition-colors hover:bg-accent/90"
          >
            Start
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
