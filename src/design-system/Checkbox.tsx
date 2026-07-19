import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function Checkbox({
  checked,
  onChange,
  className,
  label,
  colorStyle,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
  label?: string;
  colorStyle?: React.CSSProperties;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[6px] border transition-all duration-150 ease-swift",
        checked
          ? "border-transparent bg-accent text-accent-fg"
          : "border-border-strong text-transparent hover:border-fg-subtle",
        className,
      )}
      style={checked ? colorStyle : undefined}
    >
      <Check className="h-3 w-3" strokeWidth={3} />
    </button>
  );
}
