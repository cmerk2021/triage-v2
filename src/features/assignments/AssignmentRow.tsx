import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { describeDueDate, parseDate, daysUntil } from "@/lib/time";
import type { Assignment } from "@/lib/types";
import { useDataStore } from "@/stores/data.store";
import { useUIStore } from "@/stores/ui.store";
import { CourseGlyph } from "@/features/courses/CourseGlyph";
import { courseHsl } from "@/design-system/courseColor";

export function AssignmentRow({
  assignment,
  showCourse = true,
}: {
  assignment: Assignment;
  showCourse?: boolean;
}) {
  const subtasks = useDataStore((s) =>
    s.subtasks.filter((st) => st.assignment === assignment.id),
  );
  const getCourse = useDataStore((s) => s.getCourse);
  const setStatus = useDataStore((s) => s.setStatus);
  const openAssignment = useUIStore((s) => s.openAssignment);

  const course = getCourse(assignment.course);
  const done = assignment.status === "done";
  const doneSubtasks = subtasks.filter((s) => s.done).length;
  const due = parseDate(assignment.dueDate);
  const overdue = due ? daysUntil(due) < 0 && !done : false;
  const soon = due ? daysUntil(due) <= 1 && daysUntil(due) >= 0 && !done : false;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => openAssignment(assignment.id)}
      onKeyDown={(e) => e.key === "Enter" && openAssignment(assignment.id)}
      className="group flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-bg-subtle"
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          setStatus(assignment.id, done ? "todo" : "done");
        }}
        aria-label={done ? "Mark as not done" : "Mark as done"}
        className={cn(
          "flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border transition-all duration-150",
          done
            ? "border-transparent text-accent-fg"
            : "border-border-strong text-transparent hover:border-fg-subtle",
        )}
        style={
          done && course ? { backgroundColor: courseHsl(course.color) } : done ? { backgroundColor: courseHsl("indigo") } : undefined
        }
      >
        <Check className="h-3 w-3" strokeWidth={3} />
      </button>

      {showCourse && course && <CourseGlyph course={course} size="sm" />}

      <div className="min-w-0 flex-1">
        <div
          className={cn(
            "truncate text-sm",
            done ? "text-fg-faint line-through" : "text-fg",
          )}
        >
          {assignment.title}
        </div>
        <div className="mt-0.5 flex items-center gap-1.5 text-2xs text-fg-faint">
          {course && showCourse && (
            <span className="truncate">{course.code || course.name}</span>
          )}
          {subtasks.length > 0 && (
            <>
              {course && showCourse && <span>·</span>}
              <span className="tabular-nums">
                {doneSubtasks}/{subtasks.length} subtasks
              </span>
            </>
          )}
        </div>
      </div>

      <span
        className={cn(
          "shrink-0 text-xs tabular-nums",
          overdue ? "text-danger" : soon ? "text-warning" : "text-fg-subtle",
        )}
      >
        {due ? describeDueDate(assignment.dueDate) : ""}
      </span>
    </div>
  );
}
