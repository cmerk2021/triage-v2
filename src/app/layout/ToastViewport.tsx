import { createPortal } from "react-dom";
import { CheckCircle2, Info, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui.store";

const ICONS = {
  neutral: Info,
  success: CheckCircle2,
  danger: XCircle,
};

export function ToastViewport() {
  const toasts = useUIStore((s) => s.toasts);
  const dismiss = useUIStore((s) => s.dismissToast);

  return createPortal(
    <div className="pointer-events-none fixed inset-x-0 bottom-20 z-[60] flex flex-col items-center gap-2 px-4 md:bottom-6">
      {toasts.map((t) => {
        const Icon = ICONS[t.tone];
        return (
          <button
            key={t.id}
            onClick={() => dismiss(t.id)}
            className={cn(
              "pointer-events-auto flex animate-slide-up items-center gap-2.5 rounded-lg border border-border bg-bg-elevated px-3.5 py-2.5 text-[13px] shadow-popover",
              t.tone === "success" && "text-success",
              t.tone === "danger" && "text-danger",
              t.tone === "neutral" && "text-fg",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="text-fg">{t.message}</span>
          </button>
        );
      })}
    </div>,
    document.body,
  );
}
