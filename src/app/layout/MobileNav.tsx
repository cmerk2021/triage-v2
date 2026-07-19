import { NavLink } from "react-router-dom";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui.store";
import { NAV_ITEMS } from "./nav";

/** Bottom tab bar for mobile, with a centered quick-add action. */
export function MobileNav() {
  const openQuickAdd = useUIStore((s) => s.openQuickAdd);
  const left = NAV_ITEMS.slice(0, 2);
  const right = NAV_ITEMS.slice(2);

  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-30 flex items-stretch border-t border-border bg-bg-subtle/95 backdrop-blur md:hidden">
      {left.map((item) => (
        <Tab key={item.to} item={item} />
      ))}
      <div className="flex flex-1 items-start justify-center">
        <button
          onClick={openQuickAdd}
          aria-label="Quick add"
          className="-mt-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent text-accent-fg shadow-elevated transition-transform active:scale-95"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>
      {right.map((item) => (
        <Tab key={item.to} item={item} />
      ))}
    </nav>
  );
}

function Tab({ item }: { item: (typeof NAV_ITEMS)[number] }) {
  return (
    <NavLink
      to={item.to}
      end={item.to === "/"}
      className={({ isActive }) =>
        cn(
          "flex flex-1 flex-col items-center gap-1 py-2.5 text-2xs transition-colors",
          isActive ? "text-accent" : "text-fg-subtle",
        )
      }
    >
      <item.icon className="h-5 w-5" />
      {item.label}
    </NavLink>
  );
}
