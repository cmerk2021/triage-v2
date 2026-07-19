import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Checkbox } from "@/design-system";
import { cn } from "@/lib/utils";
import type { CourseColor, Subtask } from "@/lib/types";
import { courseHsl } from "@/design-system/courseColor";
import { useDataStore } from "@/stores/data.store";

export function SubtaskList({
  assignmentId,
  subtasks,
  color = "indigo",
}: {
  assignmentId: string;
  subtasks: Subtask[];
  color?: CourseColor;
}) {
  const [title, setTitle] = useState("");
  const toggleSubtask = useDataStore((s) => s.toggleSubtask);
  const createSubtask = useDataStore((s) => s.createSubtask);
  const deleteSubtask = useDataStore((s) => s.deleteSubtask);

  const done = subtasks.filter((s) => s.done).length;

  async function add() {
    const value = title.trim();
    if (!value) return;
    setTitle("");
    await createSubtask(assignmentId, value);
  }

  return (
    <div className="space-y-1">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-[13px] font-medium text-fg-muted">Subtasks</span>
        {subtasks.length > 0 && (
          <span className="text-2xs tabular-nums text-fg-faint">
            {done} / {subtasks.length} complete
          </span>
        )}
      </div>

      <ul className="space-y-0.5">
        {subtasks.map((s) => (
          <li
            key={s.id}
            className="group flex items-center gap-2.5 rounded-md px-1 py-1.5 hover:bg-bg-inset"
          >
            <Checkbox
              checked={s.done}
              onChange={() => toggleSubtask(s.id)}
              colorStyle={{ backgroundColor: courseHsl(color) }}
            />
            <span
              className={cn(
                "flex-1 text-sm transition-colors",
                s.done ? "text-fg-faint line-through" : "text-fg",
              )}
            >
              {s.title}
            </span>
            <button
              onClick={() => deleteSubtask(s.id)}
              className="opacity-0 transition-opacity group-hover:opacity-100"
              aria-label="Delete subtask"
            >
              <X className="h-3.5 w-3.5 text-fg-faint hover:text-danger" />
            </button>
          </li>
        ))}
      </ul>

      <div className="flex items-center gap-2.5 px-1 py-1">
        <Plus className="h-[18px] w-[18px] text-fg-faint" />
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          onBlur={add}
          placeholder="Add a subtask"
          className="flex-1 bg-transparent text-sm text-fg placeholder:text-fg-faint focus:outline-none"
        />
      </div>
    </div>
  );
}
