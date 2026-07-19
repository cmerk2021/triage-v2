import { useEffect, useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import {
  Button,
  Dialog,
  Field,
  Input,
  Select,
} from "@/design-system";
import { cn } from "@/lib/utils";
import { dayLabel } from "@/lib/time";
import {
  COURSE_COLORS,
  type CourseColor,
  type MeetingBlock,
} from "@/lib/types";
import { courseHsl } from "@/design-system/courseColor";
import { useDataStore } from "@/stores/data.store";
import { useUIStore } from "@/stores/ui.store";
import { useAuthStore } from "@/stores/auth.store";

interface FormState {
  name: string;
  code: string;
  professor: string;
  location: string;
  icon: string;
  color: CourseColor;
  semester: string;
  meetingSchedule: MeetingBlock[];
}

const EMPTY: FormState = {
  name: "",
  code: "",
  professor: "",
  location: "",
  icon: "",
  color: "indigo",
  semester: "",
  meetingSchedule: [],
};

export function CourseEditor() {
  const editingId = useUIStore((s) => s.detailCourseId);
  const creating = useUIStore((s) => s.courseCreating);
  const close = useUIStore((s) => s.closeCourse);
  const toast = useUIStore((s) => s.toast);

  const course = useDataStore((s) =>
    s.courses.find((c) => c.id === editingId),
  );
  const semesters = useDataStore((s) =>
    s.semesters.filter((sm) => !sm.archived),
  );
  const activeSemesterId = useAuthStore(
    (s) => s.preferences().activeSemesterId,
  );
  const createCourse = useDataStore((s) => s.createCourse);
  const updateCourse = useDataStore((s) => s.updateCourse);
  const deleteCourse = useDataStore((s) => s.deleteCourse);

  const open = creating || !!editingId;
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (course) {
      setForm({
        name: course.name,
        code: course.code,
        professor: course.professor,
        location: course.location,
        icon: course.icon,
        color: course.color,
        semester: course.semester,
        meetingSchedule: course.meetingSchedule,
      });
    } else {
      setForm({
        ...EMPTY,
        semester: activeSemesterId ?? semesters[0]?.id ?? "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editingId]);

  if (!open) return null;

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function addMeeting() {
    set("meetingSchedule", [
      ...form.meetingSchedule,
      { day: 1, start: "09:00", end: "10:00" },
    ]);
  }

  function updateMeeting(i: number, patch: Partial<MeetingBlock>) {
    set(
      "meetingSchedule",
      form.meetingSchedule.map((m, idx) => (idx === i ? { ...m, ...patch } : m)),
    );
  }

  async function save() {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (course) {
        await updateCourse(course.id, form);
        toast("Course updated", "success");
      } else {
        await createCourse(form);
        toast("Course added", "success");
      }
      close();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={close}
      title={course ? "Edit course" : "New course"}
      size="md"
      footer={
        <>
          {course && (
            <Button
              variant="danger"
              icon={<Trash2 className="h-4 w-4" />}
              className="mr-auto"
              onClick={async () => {
                await deleteCourse(course.id);
                toast("Course deleted");
                close();
              }}
            >
              Delete
            </Button>
          )}
          <Button variant="ghost" onClick={close}>
            Cancel
          </Button>
          <Button
            variant="primary"
            loading={saving}
            disabled={!form.name.trim()}
            onClick={save}
          >
            {course ? "Save" : "Add course"}
          </Button>
        </>
      }
    >
      <div className="space-y-4 pb-1">
        <div className="flex gap-3">
          <div className="w-16">
            <Field label="Icon">
              <Input
                value={form.icon}
                onChange={(e) => set("icon", e.target.value.slice(0, 2))}
                placeholder="📘"
                className="text-center text-lg"
              />
            </Field>
          </div>
          <div className="flex-1">
            <Field label="Course name">
              <Input
                autoFocus
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Organic Chemistry"
              />
            </Field>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Code">
            <Input
              value={form.code}
              onChange={(e) => set("code", e.target.value)}
              placeholder="CHEM 201"
            />
          </Field>
          <Field label="Professor">
            <Input
              value={form.professor}
              onChange={(e) => set("professor", e.target.value)}
              placeholder="Dr. Lin"
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Location">
            <Input
              value={form.location}
              onChange={(e) => set("location", e.target.value)}
              placeholder="Science Hall 204"
            />
          </Field>
          {semesters.length > 0 && (
            <Field label="Semester">
              <Select
                value={form.semester}
                onChange={(e) => set("semester", e.target.value)}
              >
                <option value="">No semester</option>
                {semesters.map((sm) => (
                  <option key={sm.id} value={sm.id}>
                    {sm.name}
                  </option>
                ))}
              </Select>
            </Field>
          )}
        </div>

        <Field label="Color">
          <div className="flex flex-wrap gap-2">
            {COURSE_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => set("color", c)}
                aria-label={c}
                className={cn(
                  "h-6 w-6 rounded-full ring-offset-2 ring-offset-bg-elevated transition-all",
                  form.color === c && "ring-2 ring-fg",
                )}
                style={{ backgroundColor: courseHsl(c) }}
              />
            ))}
          </div>
        </Field>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-fg-muted">
              Meeting schedule
            </span>
            <button
              onClick={addMeeting}
              className="flex items-center gap-1 text-[13px] text-accent hover:underline"
            >
              <Plus className="h-3.5 w-3.5" />
              Add
            </button>
          </div>
          {form.meetingSchedule.length === 0 ? (
            <p className="text-xs text-fg-faint">No recurring meetings.</p>
          ) : (
            <div className="space-y-2">
              {form.meetingSchedule.map((m, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Select
                    value={m.day}
                    onChange={(e) =>
                      updateMeeting(i, { day: Number(e.target.value) })
                    }
                    className="w-28"
                  >
                    {[1, 2, 3, 4, 5, 6, 0].map((d) => (
                      <option key={d} value={d}>
                        {dayLabel(d)}
                      </option>
                    ))}
                  </Select>
                  <Input
                    type="time"
                    value={m.start}
                    onChange={(e) => updateMeeting(i, { start: e.target.value })}
                  />
                  <Input
                    type="time"
                    value={m.end}
                    onChange={(e) => updateMeeting(i, { end: e.target.value })}
                  />
                  <button
                    onClick={() =>
                      set(
                        "meetingSchedule",
                        form.meetingSchedule.filter((_, idx) => idx !== i),
                      )
                    }
                    aria-label="Remove meeting"
                  >
                    <X className="h-4 w-4 text-fg-faint hover:text-danger" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Dialog>
  );
}
