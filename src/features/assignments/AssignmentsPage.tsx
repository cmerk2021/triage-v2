import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import {
  Button,
  EmptyState,
  PageHeader,
  SegmentedControl,
  Select,
} from "@/design-system";
import { LayoutList } from "lucide-react";
import { daysUntil, parseDate } from "@/lib/time";
import type { Assignment } from "@/lib/types";
import { useDataStore } from "@/stores/data.store";
import { useUIStore } from "@/stores/ui.store";
import { AssignmentRow } from "./AssignmentRow";

type StatusFilter = "active" | "all" | "done";

const GROUP_ORDER = [
  "Overdue",
  "Today",
  "This week",
  "Upcoming",
  "No date",
  "Completed",
] as const;

function bucketOf(a: Assignment): (typeof GROUP_ORDER)[number] {
  if (a.status === "done") return "Completed";
  const due = parseDate(a.dueDate);
  if (!due) return "No date";
  const d = daysUntil(due);
  if (d < 0) return "Overdue";
  if (d === 0) return "Today";
  if (d <= 6) return "This week";
  return "Upcoming";
}

export function AssignmentsPage() {
  const assignments = useDataStore((s) =>
    s.assignments.filter((a) => !a.archived),
  );
  const courses = useDataStore((s) => s.courses.filter((c) => !c.archived));
  const openQuickAdd = useUIStore((s) => s.openQuickAdd);

  const [status, setStatus] = useState<StatusFilter>("active");
  const [courseId, setCourseId] = useState("");

  const groups = useMemo(() => {
    const filtered = assignments.filter((a) => {
      if (status === "active" && a.status === "done") return false;
      if (status === "done" && a.status !== "done") return false;
      if (courseId && a.course !== courseId) return false;
      return true;
    });

    const map = new Map<string, Assignment[]>();
    for (const a of filtered) {
      const key = bucketOf(a);
      const list = map.get(key) ?? [];
      list.push(a);
      map.set(key, list);
    }
    for (const list of map.values()) {
      list.sort((x, y) => {
        const dx = parseDate(x.dueDate)?.getTime() ?? Infinity;
        const dy = parseDate(y.dueDate)?.getTime() ?? Infinity;
        return dx - dy;
      });
    }
    return GROUP_ORDER.map((key) => [key, map.get(key) ?? []] as const).filter(
      ([, list]) => list.length > 0,
    );
  }, [assignments, status, courseId]);

  const total = groups.reduce((n, [, list]) => n + list.length, 0);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Assignments"
        subtitle="Everything you're tracking this semester."
        actions={
          <Button
            variant="primary"
            size="sm"
            icon={<Plus className="h-4 w-4" />}
            onClick={openQuickAdd}
          >
            Add
          </Button>
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <SegmentedControl<StatusFilter>
          size="sm"
          value={status}
          onChange={setStatus}
          options={[
            { value: "active", label: "Active" },
            { value: "all", label: "All" },
            { value: "done", label: "Done" },
          ]}
        />
        <Select
          value={courseId}
          onChange={(e) => setCourseId(e.target.value)}
          className="h-8 w-auto text-[13px]"
        >
          <option value="">All courses</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.code || c.name}
            </option>
          ))}
        </Select>
      </div>

      {total === 0 ? (
        <EmptyState
          icon={<LayoutList className="h-5 w-5" />}
          title="Nothing here yet"
          description="Add an assignment and it will show up here, grouped by when it's due."
          action={
            <Button variant="secondary" onClick={openQuickAdd}>
              Add assignment
            </Button>
          }
        />
      ) : (
        <div className="space-y-6">
          {groups.map(([group, list]) => (
            <section key={group}>
              <div className="mb-1 flex items-center gap-2 px-2">
                <h2 className="text-[13px] font-medium text-fg-muted">
                  {group}
                </h2>
                <span className="text-2xs tabular-nums text-fg-faint">
                  {list.length}
                </span>
              </div>
              <div className="divide-y divide-border/60">
                {list.map((a) => (
                  <AssignmentRow key={a.id} assignment={a} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
