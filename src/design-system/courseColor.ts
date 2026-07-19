import type { CSSProperties } from "react";
import type { CourseColor } from "@/lib/types";

/** Resolve a course color token to a usable `hsl(...)` string. */
export function courseHsl(color: CourseColor, alpha = 1): string {
  return `hsl(var(--course-${color}) / ${alpha})`;
}

/** Inline styles for a course-colored dot / accent. */
export function courseDotStyle(color: CourseColor): CSSProperties {
  return { backgroundColor: courseHsl(color) };
}

export function courseTintStyle(color: CourseColor): CSSProperties {
  return {
    backgroundColor: courseHsl(color, 0.14),
    color: courseHsl(color),
  };
}

export function courseAccentStyle(color: CourseColor): CSSProperties {
  return { color: courseHsl(color) };
}

export const COURSE_COLOR_LABELS: Record<CourseColor, string> = {
  indigo: "Indigo",
  blue: "Blue",
  cyan: "Cyan",
  emerald: "Emerald",
  amber: "Amber",
  rose: "Rose",
  violet: "Violet",
  orange: "Orange",
  teal: "Teal",
  pink: "Pink",
};
