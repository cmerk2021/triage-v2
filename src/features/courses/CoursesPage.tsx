import { GraduationCap, Plus } from "lucide-react";
import { Button, EmptyState, PageHeader } from "@/design-system";
import { dayLabel, formatClock, shortDueDate } from "@/lib/time";
import { courseHsl } from "@/design-system/courseColor";
import type { Course } from "@/lib/types";
import { useDataStore } from "@/stores/data.store";
import { useUIStore } from "@/stores/ui.store";
import { useAuthStore } from "@/stores/auth.store";
import { CourseGlyph } from "./CourseGlyph";

function meetingSummary(course: Course): string {
  if (course.meetingSchedule.length === 0) return "";
  const days = [...new Set(course.meetingSchedule.map((m) => m.day))]
    .map((d) => dayLabel(d))
    .join(", ");
  const first = course.meetingSchedule[0];
  return `${days} · ${formatClock(first.start)}`;
}

export function CoursesPage() {
  const activeSemesterId = useAuthStore(
    (s) => s.preferences().activeSemesterId,
  );
  const courses = useDataStore((s) =>
    s.courses.filter(
      (c) =>
        !c.archived &&
        (!activeSemesterId || !c.semester || c.semester === activeSemesterId),
    ),
  );
  const assignments = useDataStore((s) => s.assignments);
  const openNewCourse = useUIStore((s) => s.openNewCourse);
  const openCourse = useUIStore((s) => s.openCourse);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Courses"
        subtitle="Your classes this semester."
        actions={
          <Button
            variant="primary"
            size="sm"
            icon={<Plus className="h-4 w-4" />}
            onClick={openNewCourse}
          >
            New course
          </Button>
        }
      />

      {courses.length === 0 ? (
        <EmptyState
          icon={<GraduationCap className="h-5 w-5" />}
          title="No courses yet"
          description="Add the classes you're taking so assignments can be organized by course."
          action={
            <Button variant="secondary" onClick={openNewCourse}>
              Add a course
            </Button>
          }
        />
      ) : (
        <div className="grid gap-2.5 sm:grid-cols-2">
          {courses.map((course) => {
            const active = assignments.filter(
              (a) => a.course === course.id && !a.archived && a.status !== "done",
            );
            const nextDue = active
              .filter((a) => a.dueDate)
              .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];
            const summary = meetingSummary(course);

            return (
              <button
                key={course.id}
                onClick={() => openCourse(course.id)}
                className="group relative overflow-hidden rounded-xl border border-border bg-bg-subtle p-4 text-left transition-all duration-150 hover:border-border-strong"
              >
                <div
                  className="absolute inset-x-0 top-0 h-[3px]"
                  style={{ backgroundColor: courseHsl(course.color) }}
                />
                <div className="flex items-start gap-3">
                  <CourseGlyph course={course} size="lg" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-fg">
                      {course.name}
                    </div>
                    <div className="mt-0.5 truncate text-xs text-fg-subtle">
                      {[course.code, course.professor]
                        .filter(Boolean)
                        .join(" · ") || "—"}
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-2xs text-fg-faint">
                  <span>{summary || "No meetings set"}</span>
                  <span className="tabular-nums">
                    {active.length} active
                    {nextDue ? ` · due ${shortDueDate(nextDue.dueDate)}` : ""}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
