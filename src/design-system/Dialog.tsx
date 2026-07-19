import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  className,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const width =
    size === "sm" ? "max-w-sm" : size === "lg" ? "max-w-2xl" : "max-w-md";

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div
        className="absolute inset-0 animate-fade-in bg-black/50 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "relative z-10 flex max-h-[90vh] w-full flex-col rounded-t-2xl border border-border bg-bg-elevated shadow-popover",
          "animate-slide-up sm:rounded-2xl safe-bottom",
          width,
          className,
        )}
      >
        {(title || description) && (
          <div className="flex items-start justify-between gap-4 px-5 pb-3 pt-5">
            <div className="min-w-0">
              {title && (
                <h2 className="text-[15px] font-semibold text-fg">{title}</h2>
              )}
              {description && (
                <p className="mt-0.5 text-[13px] text-fg-subtle">{description}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="-mr-1.5 -mt-1 rounded-md p-1.5 text-fg-subtle transition-colors hover:bg-bg-inset hover:text-fg"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto px-5 py-2">
          {children}
        </div>
        {footer && (
          <div className="flex items-center justify-end gap-2 px-5 pb-5 pt-3">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
