import { cn } from "@/lib/utils";
import type { Course } from "@/lib/types";
import { courseTintStyle } from "@/design-system/courseColor";

/** A compact, color-tinted glyph representing a course (emoji or initial). */
export function CourseGlyph({
  course,
  size = "md",
  className,
}: {
  course: Pick<Course, "name" | "code" | "color" | "icon">;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const dims =
    size === "sm"
      ? "h-6 w-6 text-xs rounded-md"
      : size === "lg"
        ? "h-11 w-11 text-lg rounded-xl"
        : "h-8 w-8 text-sm rounded-lg";

  const label = course.icon || (course.code || course.name).charAt(0).toUpperCase();

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center font-semibold",
        dims,
        className,
      )}
      style={courseTintStyle(course.color)}
    >
      {label}
    </div>
  );
}
