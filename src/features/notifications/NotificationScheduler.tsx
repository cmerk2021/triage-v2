import { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/auth.store";
import { useEngine } from "@/features/recommendations/useEngine";
import { isPushSubscribed } from "@/lib/push";
import {
  markOncePerDay,
  msUntilTime,
  notificationsSupported,
  showNotification,
} from "./notifications";

/**
 * While the app is open, schedule the morning briefing and evening study
 * reminder from the engine's summary. Mounted once at the app shell level.
 */
export function NotificationScheduler() {
  const preferences = useAuthStore((s) => s.preferences());
  const engine = useEngine();

  // If this device has server push, the worker owns morning/evening nudges.
  const [pushOn, setPushOn] = useState(false);
  useEffect(() => {
    isPushSubscribed().then(setPushOn).catch(() => setPushOn(false));
  }, []);

  useEffect(() => {
    if (!preferences.notificationsEnabled || !notificationsSupported()) return;
    if (Notification.permission !== "granted") return;
    // When server push is on for this device, the push worker owns the
    // morning/evening nudges (they fire even when the app is closed); skip the
    // in-app timers to avoid duplicate notifications.
    if (pushOn) return;

    const timers: number[] = [];

    const schedule = (
      kind: "morning" | "evening",
      time: string,
      title: string,
    ) => {
      const fire = () => {
        const summary = engine.getNotificationSummary();
        if (markOncePerDay(kind)) {
          showNotification(title, kind === "morning" ? summary.morning : summary.evening);
        }
        // Re-arm for the following day.
        timers.push(window.setTimeout(fire, msUntilTime(time)));
      };
      timers.push(window.setTimeout(fire, msUntilTime(time)));
    };

    schedule("morning", preferences.morningBriefingTime, "Good morning");
    schedule("evening", preferences.eveningReminderTime, "Time to study");

    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [
    preferences.notificationsEnabled,
    preferences.morningBriefingTime,
    preferences.eveningReminderTime,
    pushOn,
    engine,
  ]);

  return null;
}
