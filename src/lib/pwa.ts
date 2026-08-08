/**
 * PWA install + service-worker registration helpers.
 *
 * Chrome/Edge/Chromebook fire `beforeinstallprompt`, which we capture so the UI
 * can offer an in-app "Install" button. iOS/iPadOS has no such event, so we
 * detect it and surface the manual "Add to Home Screen" instructions instead.
 */
import { useEffect, useState } from "react";
import { registerSW } from "virtual:pwa-register";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    listeners.forEach((fn) => fn());
  });
  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    listeners.forEach((fn) => fn());
  });
}

/** Register the service worker once, keeping the app up to date automatically. */
export function registerServiceWorker() {
  if (typeof window === "undefined") return;
  registerSW({ immediate: true });
}

export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

export function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return (
    /iPhone|iPad|iPod/i.test(navigator.userAgent) &&
    !("MSStream" in window)
  );
}

export interface PWAInstall {
  /** A native install prompt is available (Android/Chromebook/desktop Chrome). */
  canInstall: boolean;
  /** The app is already running as an installed PWA. */
  installed: boolean;
  /** iOS requires manual "Add to Home Screen" — show instructions instead. */
  isIOS: boolean;
  /** Trigger the native install prompt; resolves true if the user accepted. */
  promptInstall: () => Promise<boolean>;
}

export function usePWAInstall(): PWAInstall {
  const [canInstall, setCanInstall] = useState(!!deferredPrompt);
  const [installed, setInstalled] = useState(isStandalone());

  useEffect(() => {
    const update = () => {
      setCanInstall(!!deferredPrompt);
      setInstalled(isStandalone());
    };
    listeners.add(update);
    const mq = window.matchMedia("(display-mode: standalone)");
    mq.addEventListener?.("change", update);
    return () => {
      listeners.delete(update);
      mq.removeEventListener?.("change", update);
    };
  }, []);

  async function promptInstall(): Promise<boolean> {
    if (!deferredPrompt) return false;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    deferredPrompt = null;
    listeners.forEach((fn) => fn());
    return choice.outcome === "accepted";
  }

  return { canInstall, installed, isIOS: isIOS(), promptInstall };
}
