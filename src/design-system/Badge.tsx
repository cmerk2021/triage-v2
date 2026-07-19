import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "accent" | "danger" | "warning" | "success";

const TONES: Record<Tone, string> = {
  neutral: "bg-bg-inset text-fg-muted",
  accent: "bg-accent/12 text-accent",
  danger: "bg-danger/14 text-danger",
  warning: "bg-warning/14 text-warning",
  success: "bg-success/14 text-success",
};

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-2xs font-medium",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Kbd({ className, children }: HTMLAttributes<HTMLElement>) {
  return (
    <kbd
      className={cn(
        "inline-flex h-5 min-w-[20px] items-center justify-center rounded border border-border bg-bg-inset px-1.5",
        "font-sans text-2xs font-medium text-fg-subtle",
        className,
      )}
    >
      {children}
    </kbd>
  );
}
