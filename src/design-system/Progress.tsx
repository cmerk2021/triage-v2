import { cn } from "@/lib/utils";

/** A thin, calm progress bar. */
export function Progress({
  value,
  className,
  colorStyle,
}: {
  /** 0–1 */
  value: number;
  className?: string;
  colorStyle?: React.CSSProperties;
}) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
  return (
    <div
      className={cn("h-1 w-full overflow-hidden rounded-full bg-bg-inset", className)}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full bg-accent transition-[width] duration-300 ease-swift"
        style={{ width: `${pct}%`, ...colorStyle }}
      />
    </div>
  );
}
