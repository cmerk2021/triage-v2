import { useState } from "react";
import { Download, Share, X } from "lucide-react";
import { Button } from "@/design-system";
import { usePWAInstall } from "@/lib/pwa";

const DISMISS_KEY = "triage:installBannerDismissed";

/**
 * A dismissible, mobile-first banner nudging the student to install Triage to
 * their home screen — the prerequisite for reliable push notifications on
 * phones and Chromebooks. Hidden once installed or dismissed.
 */
export function InstallPrompt() {
  const { canInstall, installed, isIOS, promptInstall } = usePWAInstall();
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem(DISMISS_KEY) === "1",
  );

  if (installed || dismissed) return null;
  // Only show when we can actually install (Android/Chromebook) or on iOS where
  // manual instructions are required.
  if (!canInstall && !isIOS) return null;

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  }

  return (
    <div className="fixed inset-x-3 bottom-20 z-40 md:bottom-4 md:left-auto md:right-4 md:max-w-sm">
      <div className="animate-fade-in rounded-2xl border border-border bg-bg-elevated/95 p-4 shadow-lg backdrop-blur">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent">
            <Download className="h-4 w-4 text-accent-fg" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-fg">Install Triage</div>
            {isIOS && !canInstall ? (
              <p className="mt-0.5 text-[13px] text-fg-subtle">
                Tap <Share className="inline h-3.5 w-3.5 align-text-bottom" /> then{" "}
                <span className="font-medium text-fg">Add to Home Screen</span> to get
                reminders anywhere.
              </p>
            ) : (
              <p className="mt-0.5 text-[13px] text-fg-subtle">
                Add it to your home screen for study reminders — even when it's closed.
              </p>
            )}
            {canInstall && (
              <Button
                size="sm"
                variant="primary"
                className="mt-3"
                onClick={async () => {
                  const ok = await promptInstall();
                  if (ok) dismiss();
                }}
              >
                Install app
              </Button>
            )}
          </div>
          <button
            onClick={dismiss}
            aria-label="Dismiss"
            className="text-fg-faint hover:text-fg"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
