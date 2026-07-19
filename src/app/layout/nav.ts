import {
  Calendar,
  GraduationCap,
  LayoutList,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  /** "g then key" shortcut. */
  goKey: string;
}

export const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Today", icon: Sparkles, goKey: "t" },
  { to: "/assignments", label: "Assignments", icon: LayoutList, goKey: "a" },
  { to: "/calendar", label: "Calendar", icon: Calendar, goKey: "l" },
  { to: "/courses", label: "Courses", icon: GraduationCap, goKey: "c" },
];
