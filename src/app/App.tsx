import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuthStore } from "@/stores/auth.store";
import { useDataStore } from "@/stores/data.store";
import { FullPageSpinner } from "@/design-system";
import { syncPushSubscription } from "@/lib/push";
import { useTheme } from "./theme";
import { AppShell } from "./layout/AppShell";
import { AuthPage } from "@/features/auth/AuthPage";
import { OnboardingFlow } from "@/features/onboarding/OnboardingFlow";
import { TodayPage } from "@/features/today/TodayPage";
import { AssignmentsPage } from "@/features/assignments/AssignmentsPage";
import { CoursesPage } from "@/features/courses/CoursesPage";
import { CalendarPage } from "@/features/calendar/CalendarPage";
import { SettingsPage } from "@/features/settings/SettingsPage";

export default function App() {
  const user = useAuthStore((s) => s.user);
  const ready = useAuthStore((s) => s.ready);
  const init = useAuthStore((s) => s.init);
  const preferences = useAuthStore((s) => s.preferences());

  const load = useDataStore((s) => s.load);
  const loaded = useDataStore((s) => s.loaded);
  const reset = useDataStore((s) => s.reset);

  useTheme(preferences.theme);

  useEffect(() => {
    void init();
  }, [init]);

  useEffect(() => {
    if (user) void load();
    else reset();
  }, [user, load, reset]);

  // Keep this device's push subscription fresh (no-ops if not subscribed).
  useEffect(() => {
    if (user) void syncPushSubscription();
  }, [user]);

  if (!ready) return <FullPageSpinner />;
  if (!user) return <AuthPage />;
  if (!user.onboardingComplete) return <OnboardingFlow />;
  if (!loaded) return <FullPageSpinner />;

  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<TodayPage />} />
        <Route path="/assignments" element={<AssignmentsPage />} />
        <Route path="/courses" element={<CoursesPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}
