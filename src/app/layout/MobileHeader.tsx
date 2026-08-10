import { NavLink } from "react-router-dom";
import { Search, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui.store";

/**
 * Top bar for mobile only. Provides the app mark plus search and settings —
 * the only way to reach Settings without the (desktop-only) sidebar — and its
 * `safe-top` padding keeps content clear of the status bar / notch.
 */
export function MobileHeader() {
  const openCommand = useUIStore((s) => s.openCommand);

  return (
    <header className="safe-top sticky top-0 z-20 flex items-center gap-2 border-b border-border bg-bg-subtle/95 px-4 backdrop-blur md:hidden">
      <div className="flex h-14 flex-1 items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-accent">
          <div className="h-2.5 w-2.5 rounded-[3px] bg-accent-fg" />
        </div>
        <span className="text-[15px] font-semibold tracking-tight">Triage</span>
      </div>

      <button
        onClick={openCommand}
        aria-label="Search"
        className="flex h-9 w-9 items-center justify-center rounded-lg text-fg-subtle transition-colors hover:bg-bg-elevated hover:text-fg"
      >
        <Search className="h-5 w-5" />
      </button>
      <NavLink
        to="/settings"
        aria-label="Settings"
        className={({ isActive }) =>
          cn(
            "flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
            isActive
              ? "bg-bg-elevated text-fg"
              : "text-fg-subtle hover:bg-bg-elevated hover:text-fg",
          )
        }
      >
        <Settings className="h-5 w-5" />
      </NavLink>
    </header>
  );
}
