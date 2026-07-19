import { NavLink } from "react-router-dom";
import { Plus, Search, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { APP_VERSION } from "@/lib/version";
import { useUIStore } from "@/stores/ui.store";
import { useAuthStore } from "@/stores/auth.store";
import { Kbd } from "@/design-system";
import { NAV_ITEMS } from "./nav";

export function Sidebar() {
  const openCommand = useUIStore((s) => s.openCommand);
  const openQuickAdd = useUIStore((s) => s.openQuickAdd);
  const user = useAuthStore((s) => s.user);

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-bg-subtle md:flex">
      <div className="flex h-14 items-center gap-2 px-5">
        <TriageMark />
        <span className="text-[15px] font-semibold tracking-tight">Triage</span>
      </div>

      <div className="space-y-1 px-3">
        <button
          onClick={openQuickAdd}
          className="group flex w-full items-center gap-2 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-fg transition-colors hover:bg-accent/90"
        >
          <Plus className="h-4 w-4" />
          Quick add
          <Kbd className="ml-auto border-white/20 bg-white/10 text-accent-fg/80">
            Q
          </Kbd>
        </button>
        <button
          onClick={openCommand}
          className="group flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-fg-muted transition-colors hover:bg-bg-elevated hover:text-fg"
        >
          <Search className="h-4 w-4" />
          Search
          <Kbd className="ml-auto">⌘K</Kbd>
        </button>
      </div>

      <nav className="mt-4 flex-1 space-y-0.5 px-3">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              cn(
                "group flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors duration-150",
                isActive
                  ? "bg-bg-elevated font-medium text-fg"
                  : "text-fg-muted hover:bg-bg-elevated/60 hover:text-fg",
              )
            }
          >
            <item.icon className="h-[18px] w-[18px]" />
            {item.label}
            <Kbd className="ml-auto opacity-0 transition-opacity group-hover:opacity-100">
              G {item.goKey.toUpperCase()}
            </Kbd>
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-border p-3">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            cn(
              "flex items-center gap-2.5 rounded-lg px-2.5 py-2 transition-colors",
              isActive ? "bg-bg-elevated" : "hover:bg-bg-elevated/60",
            )
          }
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/15 text-xs font-semibold text-accent">
            {(user?.name || user?.email || "?").charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-medium text-fg">
              {user?.name || "Student"}
            </div>
            <div className="truncate text-2xs text-fg-faint">
              v{APP_VERSION}
            </div>
          </div>
          <Settings className="h-4 w-4 text-fg-subtle" />
        </NavLink>
      </div>
    </aside>
  );
}

function TriageMark() {
  return (
    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-accent">
      <div className="h-2.5 w-2.5 rounded-[3px] bg-accent-fg" />
    </div>
  );
}
