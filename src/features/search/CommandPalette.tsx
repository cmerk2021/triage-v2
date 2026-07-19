import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  CornerDownLeft,
  GraduationCap,
  LayoutList,
  type LucideIcon,
  Plus,
  Search,
  Settings,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { shortDueDate } from "@/lib/time";
import { useUIStore } from "@/stores/ui.store";
import { useDataStore } from "@/stores/data.store";
import { Kbd } from "@/design-system";

interface Item {
  id: string;
  group: string;
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  keywords: string;
  run: () => void;
}

export function CommandPalette() {
  const open = useUIStore((s) => s.commandOpen);
  const close = useUIStore((s) => s.closeCommand);
  const openQuickAdd = useUIStore((s) => s.openQuickAdd);
  const openAssignment = useUIStore((s) => s.openAssignment);
  const openCourse = useUIStore((s) => s.openCourse);
  const navigate = useNavigate();

  const courses = useDataStore((s) => s.courses);
  const assignments = useDataStore((s) => s.assignments);
  const getCourse = useDataStore((s) => s.getCourse);

  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const items = useMemo<Item[]>(() => {
    const actions: Item[] = [
      {
        id: "act-quickadd",
        group: "Actions",
        icon: Plus,
        title: "Quick add assignment",
        keywords: "new create add assignment task",
        run: () => {
          close();
          openQuickAdd();
        },
      },
      {
        id: "nav-today",
        group: "Go to",
        icon: Sparkles,
        title: "Today",
        keywords: "today home plan",
        run: () => go("/"),
      },
      {
        id: "nav-assignments",
        group: "Go to",
        icon: LayoutList,
        title: "Assignments",
        keywords: "assignments tasks work",
        run: () => go("/assignments"),
      },
      {
        id: "nav-calendar",
        group: "Go to",
        icon: Calendar,
        title: "Calendar",
        keywords: "calendar schedule deadlines",
        run: () => go("/calendar"),
      },
      {
        id: "nav-courses",
        group: "Go to",
        icon: GraduationCap,
        title: "Courses",
        keywords: "courses classes",
        run: () => go("/courses"),
      },
      {
        id: "nav-settings",
        group: "Go to",
        icon: Settings,
        title: "Settings",
        keywords: "settings preferences about version",
        run: () => go("/settings"),
      },
    ];

    const assignmentItems: Item[] = assignments
      .filter((a) => !a.archived)
      .map((a) => {
        const course = getCourse(a.course);
        return {
          id: `a-${a.id}`,
          group: "Assignments",
          icon: LayoutList,
          title: a.title,
          subtitle: [course?.code || course?.name, shortDueDate(a.dueDate)]
            .filter(Boolean)
            .join(" · "),
          keywords: `${a.title} ${a.notes} ${course?.name ?? ""} ${course?.professor ?? ""}`,
          run: () => {
            close();
            openAssignment(a.id);
          },
        };
      });

    const courseItems: Item[] = courses
      .filter((c) => !c.archived)
      .map((c) => ({
        id: `c-${c.id}`,
        group: "Courses",
        icon: GraduationCap,
        title: c.name,
        subtitle: [c.code, c.professor].filter(Boolean).join(" · "),
        keywords: `${c.name} ${c.code} ${c.professor} ${c.location}`,
        run: () => {
          close();
          openCourse(c.id);
        },
      }));

    return [...actions, ...assignmentItems, ...courseItems];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignments, courses]);

  function go(path: string) {
    close();
    navigate(path);
  }

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items.filter((i) => i.group === "Actions" || i.group === "Go to");
    return items
      .filter((i) => (i.title + " " + i.keywords).toLowerCase().includes(q))
      .slice(0, 24);
  }, [items, query]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => setActive(0), [query]);

  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(
      `[data-index="${active}"]`,
    );
    el?.scrollIntoView({ block: "nearest" });
  }, [active]);

  if (!open) return null;

  const grouped = groupBy(results);

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-start justify-center px-4 pt-[12vh]">
      <div className="absolute inset-0 animate-fade-in bg-black/50 backdrop-blur-[2px]" onClick={close} />
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 w-full max-w-xl animate-scale-in overflow-hidden rounded-2xl border border-border bg-bg-elevated shadow-popover"
        onKeyDown={(e) => {
          if (e.key === "Escape") close();
          else if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((i) => Math.min(i + 1, results.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((i) => Math.max(i - 1, 0));
          } else if (e.key === "Enter") {
            e.preventDefault();
            results[active]?.run();
          }
        }}
      >
        <div className="flex items-center gap-3 border-b border-border px-4">
          <Search className="h-4 w-4 text-fg-subtle" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search assignments, courses, professors…"
            className="h-12 flex-1 bg-transparent text-[15px] text-fg placeholder:text-fg-faint focus:outline-none"
          />
          <Kbd>Esc</Kbd>
        </div>

        <div ref={listRef} className="scrollbar-thin max-h-[52vh] overflow-y-auto p-2">
          {results.length === 0 && (
            <div className="px-3 py-10 text-center text-[13px] text-fg-subtle">
              No results for “{query}”.
            </div>
          )}
          {grouped.map(([group, groupItems]) => (
            <div key={group} className="mb-1">
              <div className="px-2 py-1.5 text-2xs font-medium uppercase tracking-wide text-fg-faint">
                {group}
              </div>
              {groupItems.map((item) => {
                const index = results.indexOf(item);
                const isActive = index === active;
                return (
                  <button
                    key={item.id}
                    data-index={index}
                    onMouseMove={() => setActive(index)}
                    onClick={() => item.run()}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors",
                      isActive ? "bg-accent/12" : "hover:bg-bg-inset",
                    )}
                  >
                    <item.icon
                      className={cn(
                        "h-4 w-4 shrink-0",
                        isActive ? "text-accent" : "text-fg-subtle",
                      )}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-fg">
                        {item.title}
                      </span>
                      {item.subtitle && (
                        <span className="block truncate text-xs text-fg-faint">
                          {item.subtitle}
                        </span>
                      )}
                    </span>
                    {isActive && (
                      <CornerDownLeft className="h-3.5 w-3.5 text-fg-subtle" />
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body,
  );
}

function groupBy(items: Item[]): [string, Item[]][] {
  const map = new Map<string, Item[]>();
  for (const item of items) {
    const list = map.get(item.group) ?? [];
    list.push(item);
    map.set(item.group, list);
  }
  return [...map.entries()];
}
