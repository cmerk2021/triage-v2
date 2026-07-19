import { useMemo, useState } from "react";
import {
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Button,
  EmptyState,
  PageHeader,
  SegmentedControl,
} from "@/design-system";
import { CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import { parseDate } from "@/lib/time";
import { courseHsl } from "@/design-system/courseColor";
import type { Assignment } from "@/lib/types";
import { useDataStore } from "@/stores/data.store";
import { useUIStore } from "@/stores/ui.store";
import { useAuthStore } from "@/stores/auth.store";
import { AssignmentRow } from "@/features/assignments/AssignmentRow";

type View = "agenda" | "week" | "month";

export function CalendarPage() {
  const [view, setView] = useState<View>("agenda");
  const [cursor, setCursor] = useState(new Date());
  const [selected, setSelected] = useState<Date>(new Date());

  const assignments = useDataStore((s) =>
    s.assignments.filter((a) => !a.archived && a.dueDate),
  );
  const weekStartsOn = useAuthStore((s) => s.preferences().weekStartsOn);

  const byDay = useMemo(() => {
    const map = new Map<string, Assignment[]>();
    for (const a of assignments) {
      const d = parseDate(a.dueDate);
      if (!d) continue;
      const key = format(d, "yyyy-MM-dd");
      const list = map.get(key) ?? [];
      list.push(a);
      map.set(key, list);
    }
    return map;
  }, [assignments]);

  const dayAssignments = (date: Date) =>
    (byDay.get(format(date, "yyyy-MM-dd")) ?? []).sort((a, b) =>
      a.dueDate.localeCompare(b.dueDate),
    );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Calendar"
        subtitle="See your deadlines land."
        actions={
          <SegmentedControl<View>
            size="sm"
            value={view}
            onChange={setView}
            options={[
              { value: "agenda", label: "Agenda" },
              { value: "week", label: "Week" },
              { value: "month", label: "Month" },
            ]}
          />
        }
      />

      {view === "agenda" && <AgendaView assignments={assignments} />}

      {view === "week" && (
        <PeriodView
          label={format(cursor, "MMMM yyyy")}
          onPrev={() => setCursor((c) => addWeeks(c, -1))}
          onNext={() => setCursor((c) => addWeeks(c, 1))}
          onToday={() => setCursor(new Date())}
        >
          <WeekView
            cursor={cursor}
            weekStartsOn={weekStartsOn}
            dayAssignments={dayAssignments}
          />
        </PeriodView>
      )}

      {view === "month" && (
        <PeriodView
          label={format(cursor, "MMMM yyyy")}
          onPrev={() => setCursor((c) => addMonths(c, -1))}
          onNext={() => setCursor((c) => addMonths(c, 1))}
          onToday={() => {
            setCursor(new Date());
            setSelected(new Date());
          }}
        >
          <MonthView
            cursor={cursor}
            weekStartsOn={weekStartsOn}
            selected={selected}
            onSelect={setSelected}
            dayAssignments={dayAssignments}
          />
          <div className="mt-5">
            <h3 className="mb-1 px-2 text-[13px] font-medium text-fg-muted">
              {format(selected, "EEEE, MMMM d")}
            </h3>
            {dayAssignments(selected).length === 0 ? (
              <p className="px-2 py-4 text-[13px] text-fg-faint">
                Nothing due this day.
              </p>
            ) : (
              <div className="divide-y divide-border/60">
                {dayAssignments(selected).map((a) => (
                  <AssignmentRow key={a.id} assignment={a} />
                ))}
              </div>
            )}
          </div>
        </PeriodView>
      )}
    </div>
  );
}

function AgendaView({ assignments }: { assignments: Assignment[] }) {
  const grouped = useMemo(() => {
    const sorted = [...assignments].sort((a, b) =>
      a.dueDate.localeCompare(b.dueDate),
    );
    const map = new Map<string, Assignment[]>();
    for (const a of sorted) {
      const d = parseDate(a.dueDate)!;
      const key = format(d, "yyyy-MM-dd");
      const list = map.get(key) ?? [];
      list.push(a);
      map.set(key, list);
    }
    return [...map.entries()];
  }, [assignments]);

  if (grouped.length === 0) {
    return (
      <EmptyState
        icon={<CalendarDays className="h-5 w-5" />}
        title="No deadlines yet"
        description="Assignments with a due date will appear here in order."
      />
    );
  }

  return (
    <div className="space-y-5">
      {grouped.map(([key, list]) => {
        const date = new Date(key);
        return (
          <section key={key}>
            <div className="mb-1 flex items-baseline gap-2 px-2">
              <h2 className="text-[13px] font-medium text-fg">
                {isToday(date) ? "Today" : format(date, "EEEE")}
              </h2>
              <span className="text-2xs text-fg-faint">
                {format(date, "MMM d")}
              </span>
            </div>
            <div className="divide-y divide-border/60">
              {list.map((a) => (
                <AssignmentRow key={a.id} assignment={a} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function PeriodView({
  label,
  onPrev,
  onNext,
  onToday,
  children,
}: {
  label: string;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <h2 className="text-sm font-medium text-fg">{label}</h2>
        <div className="ml-auto flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={onToday}>
            Today
          </Button>
          <Button variant="ghost" size="icon" onClick={onPrev} aria-label="Previous">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onNext} aria-label="Next">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      {children}
    </div>
  );
}

function WeekView({
  cursor,
  weekStartsOn,
  dayAssignments,
}: {
  cursor: Date;
  weekStartsOn: 0 | 1;
  dayAssignments: (d: Date) => Assignment[];
}) {
  const start = startOfWeek(cursor, { weekStartsOn });
  const days = eachDayOfInterval({ start, end: endOfWeek(cursor, { weekStartsOn }) });
  const getCourse = useDataStore((s) => s.getCourse);
  const openAssignment = useUIStore((s) => s.openAssignment);

  return (
    <div className="grid grid-cols-7 gap-1.5">
      {days.map((day) => (
        <div key={day.toISOString()} className="min-h-[120px]">
          <div
            className={cn(
              "mb-1 flex flex-col items-center rounded-md py-1",
              isToday(day) ? "bg-accent/12" : "",
            )}
          >
            <span className="text-2xs text-fg-faint">{format(day, "EEE")}</span>
            <span
              className={cn(
                "text-sm font-medium tabular-nums",
                isToday(day) ? "text-accent" : "text-fg",
              )}
            >
              {format(day, "d")}
            </span>
          </div>
          <div className="space-y-1">
            {dayAssignments(day).map((a) => {
              const course = getCourse(a.course);
              const color = course?.color ?? "indigo";
              return (
                <button
                  key={a.id}
                  onClick={() => openAssignment(a.id)}
                  className="block w-full truncate rounded px-1.5 py-1 text-left text-2xs transition-colors hover:opacity-80"
                  style={{
                    backgroundColor: courseHsl(color, 0.14),
                    color: courseHsl(color),
                  }}
                >
                  {a.title}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function MonthView({
  cursor,
  weekStartsOn,
  selected,
  onSelect,
  dayAssignments,
}: {
  cursor: Date;
  weekStartsOn: 0 | 1;
  selected: Date;
  onSelect: (d: Date) => void;
  dayAssignments: (d: Date) => Assignment[];
}) {
  const getCourse = useDataStore((s) => s.getCourse);
  const start = startOfWeek(startOfMonth(cursor), { weekStartsOn });
  const end = endOfWeek(endOfMonth(cursor), { weekStartsOn });
  const days = eachDayOfInterval({ start, end });
  const weekdays = eachDayOfInterval({
    start,
    end: endOfWeek(start, { weekStartsOn }),
  });

  return (
    <div>
      <div className="mb-1 grid grid-cols-7">
        {weekdays.map((d) => (
          <div
            key={d.toISOString()}
            className="py-1 text-center text-2xs font-medium text-fg-faint"
          >
            {format(d, "EEEEE")}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const items = dayAssignments(day);
          const inMonth = isSameMonth(day, cursor);
          const isSel = isSameDay(day, selected);
          return (
            <button
              key={day.toISOString()}
              onClick={() => onSelect(day)}
              className={cn(
                "flex aspect-square flex-col items-center gap-1 rounded-lg p-1 transition-colors",
                isSel ? "bg-bg-elevated ring-1 ring-border-strong" : "hover:bg-bg-subtle",
              )}
            >
              <span
                className={cn(
                  "text-xs tabular-nums",
                  isToday(day)
                    ? "flex h-5 w-5 items-center justify-center rounded-full bg-accent font-semibold text-accent-fg"
                    : inMonth
                      ? "text-fg"
                      : "text-fg-faint",
                )}
              >
                {format(day, "d")}
              </span>
              <div className="flex flex-wrap items-center justify-center gap-0.5">
                {items.slice(0, 4).map((a) => {
                  const course = getCourse(a.course);
                  return (
                    <span
                      key={a.id}
                      className="h-1 w-1 rounded-full"
                      style={{ backgroundColor: courseHsl(course?.color ?? "indigo") }}
                    />
                  );
                })}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
