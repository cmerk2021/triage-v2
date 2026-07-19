import { useEffect, useState } from "react";
import { addDays, endOfDay, nextSaturday } from "date-fns";
import { Button, Dialog, Field, Input, Select } from "@/design-system";
import { cn } from "@/lib/utils";
import { useDataStore } from "@/stores/data.store";
import { useUIStore } from "@/stores/ui.store";

const DUE_CHIPS: { label: string; build: () => Date }[] = [
  { label: "Today", build: () => endOfDay(new Date()) },
  { label: "Tomorrow", build: () => endOfDay(addDays(new Date(), 1)) },
  { label: "This weekend", build: () => endOfDay(nextSaturday(new Date())) },
  { label: "Next week", build: () => endOfDay(addDays(new Date(), 7)) },
];

const ESTIMATE_CHIPS = [15, 30, 60, 120];

export function QuickAddDialog() {
  const open = useUIStore((s) => s.quickAddOpen);
  const close = useUIStore((s) => s.closeQuickAdd);
  const toast = useUIStore((s) => s.toast);
  const courses = useDataStore((s) => s.courses.filter((c) => !c.archived));
  const createAssignment = useDataStore((s) => s.createAssignment);

  const [title, setTitle] = useState("");
  const [course, setCourse] = useState("");
  const [due, setDue] = useState<Date | null>(null);
  const [estimate, setEstimate] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle("");
      setCourse(courses[0]?.id ?? "");
      setDue(null);
      setEstimate(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function save(addAnother = false) {
    if (!title.trim()) return;
    setSaving(true);
    try {
      await createAssignment({
        title: title.trim(),
        course: course || "",
        dueDate: due ? due.toISOString() : "",
        estimatedMinutes: estimate,
      });
      toast("Assignment added", "success");
      if (addAnother) {
        setTitle("");
        setDue(null);
        setEstimate(0);
      } else {
        close();
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={close}
      title="Quick add"
      description="Capture it now. Organize later."
      footer={
        <>
          <Button variant="ghost" onClick={close}>
            Cancel
          </Button>
          <Button
            variant="primary"
            loading={saving}
            disabled={!title.trim()}
            onClick={() => save(false)}
          >
            Add assignment
          </Button>
        </>
      }
    >
      <div className="space-y-4 pb-1">
        <Input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) save(true);
            else if (e.key === "Enter") save(false);
          }}
          placeholder="What needs to get done?"
          className="h-11 text-[15px]"
        />

        <div className="grid grid-cols-2 gap-3">
          <Field label="Course">
            <Select value={course} onChange={(e) => setCourse(e.target.value)}>
              <option value="">No course</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code || c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Due date">
            <Input
              type="date"
              value={due ? due.toISOString().slice(0, 10) : ""}
              onChange={(e) =>
                setDue(e.target.value ? endOfDay(new Date(e.target.value)) : null)
              }
            />
          </Field>
        </div>

        <div className="space-y-2">
          <span className="text-[13px] font-medium text-fg-muted">When</span>
          <div className="flex flex-wrap gap-1.5">
            {DUE_CHIPS.map((chip) => {
              const value = chip.build();
              const active =
                due?.toDateString() === value.toDateString();
              return (
                <Chip
                  key={chip.label}
                  active={active}
                  onClick={() => setDue(active ? null : value)}
                >
                  {chip.label}
                </Chip>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <span className="text-[13px] font-medium text-fg-muted">
            Estimated time
          </span>
          <div className="flex flex-wrap gap-1.5">
            {ESTIMATE_CHIPS.map((m) => (
              <Chip
                key={m}
                active={estimate === m}
                onClick={() => setEstimate(estimate === m ? 0 : m)}
              >
                {m < 60 ? `${m}m` : `${m / 60}h`}
              </Chip>
            ))}
          </div>
        </div>
      </div>
    </Dialog>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-[13px] transition-colors duration-150",
        active
          ? "border-accent/40 bg-accent/15 text-accent"
          : "border-border bg-bg-inset text-fg-muted hover:border-border-strong hover:text-fg",
      )}
    >
      {children}
    </button>
  );
}
