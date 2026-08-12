import { useEffect, useRef, useState } from "react";
import { Paperclip, Trash2, X } from "lucide-react";
import { parseDateInput, toDateInputValue } from "@/lib/time";
import {
  Button,
  Dialog,
  Field,
  Input,
  Select,
  Textarea,
  SegmentedControl,
} from "@/design-system";
import type { AssignmentStatus } from "@/lib/types";
import { fileUrl } from "@/lib/pocketbase";
import { useDataStore } from "@/stores/data.store";
import { useUIStore } from "@/stores/ui.store";
import { SubtaskList } from "@/features/subtasks/SubtaskList";
import { CourseGlyph } from "@/features/courses/CourseGlyph";

const STATUS_OPTIONS = [
  { value: "todo" as const, label: "To do" },
  { value: "in_progress" as const, label: "In progress" },
  { value: "done" as const, label: "Done" },
];

export function AssignmentDetail() {
  const id = useUIStore((s) => s.detailAssignmentId);
  const close = useUIStore((s) => s.closeAssignment);
  const toast = useUIStore((s) => s.toast);

  const assignment = useDataStore((s) =>
    s.assignments.find((a) => a.id === id),
  );
  const subtasks = useDataStore((s) =>
    s.subtasks
      .filter((st) => st.assignment === id)
      .sort((a, b) => a.position - b.position),
  );
  const courses = useDataStore((s) => s.courses.filter((c) => !c.archived));
  const getCourse = useDataStore((s) => s.getCourse);
  const updateAssignment = useDataStore((s) => s.updateAssignment);
  const setStatus = useDataStore((s) => s.setStatus);
  const deleteAssignment = useDataStore((s) => s.deleteAssignment);
  const uploadAttachments = useDataStore((s) => s.uploadAttachments);
  const removeAttachment = useDataStore((s) => s.removeAttachment);

  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (assignment) {
      setTitle(assignment.title);
      setNotes(assignment.notes);
    }
  }, [assignment?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!id || !assignment) return null;

  const course = getCourse(assignment.course);

  async function commit(field: "title" | "notes") {
    if (!assignment) return;
    if (field === "title" && title.trim() && title !== assignment.title) {
      await updateAssignment(assignment.id, { title: title.trim() });
    }
    if (field === "notes" && notes !== assignment.notes) {
      await updateAssignment(assignment.id, { notes });
    }
  }

  return (
    <Dialog
      open
      onClose={close}
      size="lg"
      footer={
        <>
          <Button
            variant="danger"
            icon={<Trash2 className="h-4 w-4" />}
            onClick={async () => {
              await deleteAssignment(assignment.id);
              toast("Assignment deleted");
              close();
            }}
          >
            Delete
          </Button>
          <Button variant="primary" onClick={close}>
            Done
          </Button>
        </>
      }
    >
      <div className="space-y-5 pb-1">
        <div className="flex items-start gap-3">
          {course && <CourseGlyph course={course} size="md" />}
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => commit("title")}
            className="flex-1 bg-transparent text-lg font-semibold text-fg placeholder:text-fg-faint focus:outline-none"
            placeholder="Assignment title"
          />
        </div>

        <SegmentedControl<AssignmentStatus>
          options={STATUS_OPTIONS}
          value={assignment.status}
          onChange={(v) => setStatus(assignment.id, v)}
          className="w-full"
        />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Field label="Course">
            <Select
              value={assignment.course}
              onChange={(e) =>
                updateAssignment(assignment.id, { course: e.target.value })
              }
            >
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
              value={toDateInputValue(assignment.dueDate)}
              onChange={(e) =>
                updateAssignment(assignment.id, {
                  dueDate: parseDateInput(e.target.value)?.toISOString() ?? "",
                })
              }
            />
          </Field>
          <Field label="Estimate (min)">
            <Input
              type="number"
              min={0}
              step={15}
              value={assignment.estimatedMinutes || ""}
              onChange={(e) =>
                updateAssignment(assignment.id, {
                  estimatedMinutes: parseInt(e.target.value || "0", 10),
                })
              }
            />
          </Field>
        </div>

        <div className="rounded-xl border border-border bg-bg-subtle/50 p-3">
          <SubtaskList
            assignmentId={assignment.id}
            subtasks={subtasks}
            color={course?.color ?? "indigo"}
          />
        </div>

        <Field label="Notes">
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={() => commit("notes")}
            placeholder="Details, links, requirements…"
          />
        </Field>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-fg-muted">
              Attachments
            </span>
            <button
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-1.5 text-[13px] text-accent hover:underline"
            >
              <Paperclip className="h-3.5 w-3.5" />
              Add file
            </button>
            <input
              ref={fileRef}
              type="file"
              multiple
              className="hidden"
              onChange={async (e) => {
                const files = Array.from(e.target.files ?? []);
                if (files.length) {
                  await uploadAttachments(assignment.id, files);
                  toast("Attachment added", "success");
                }
                e.target.value = "";
              }}
            />
          </div>
          {assignment.attachments.length === 0 ? (
            <p className="text-xs text-fg-faint">No attachments yet.</p>
          ) : (
            <ul className="space-y-1">
              {assignment.attachments.map((file) => (
                <li
                  key={file}
                  className="group flex items-center gap-2 rounded-md bg-bg-inset px-2.5 py-1.5"
                >
                  <Paperclip className="h-3.5 w-3.5 shrink-0 text-fg-subtle" />
                  <a
                    href={fileUrl("assignments", assignment.id, file)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 truncate text-[13px] text-fg hover:text-accent"
                  >
                    {file.replace(/_\w{10}(\.\w+)?$/, "$1")}
                  </a>
                  <button
                    onClick={() => removeAttachment(assignment.id, file)}
                    className="opacity-0 transition-opacity group-hover:opacity-100"
                    aria-label="Remove attachment"
                  >
                    <X className="h-3.5 w-3.5 text-fg-faint hover:text-danger" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Dialog>
  );
}
