import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useUIStore } from "@/stores/ui.store";
import { NAV_ITEMS } from "./layout/nav";

function isTyping(): boolean {
  const el = document.activeElement as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    el.isContentEditable
  );
}

/**
 * Linear-style global keyboard shortcuts.
 *   ⌘/Ctrl+K   Command palette (search + actions)
 *   Q          Quick add assignment
 *   G then …   Navigate (t/a/l/c/s)
 */
export function useGlobalShortcuts() {
  const navigate = useNavigate();
  const toggleCommand = useUIStore((s) => s.toggleCommand);
  const openQuickAdd = useUIStore((s) => s.openQuickAdd);
  const pendingGo = useRef(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const key = e.key.toLowerCase();

      if ((e.metaKey || e.ctrlKey) && key === "k") {
        e.preventDefault();
        toggleCommand();
        return;
      }

      if (isTyping() || e.metaKey || e.ctrlKey || e.altKey) return;

      if (pendingGo.current) {
        pendingGo.current = false;
        if (key === "s") {
          navigate("/settings");
          return;
        }
        const item = NAV_ITEMS.find((n) => n.goKey === key);
        if (item) navigate(item.to);
        return;
      }

      if (key === "g") {
        pendingGo.current = true;
        window.setTimeout(() => (pendingGo.current = false), 800);
        return;
      }

      if (key === "q") {
        e.preventDefault();
        openQuickAdd();
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate, toggleCommand, openQuickAdd]);
}
