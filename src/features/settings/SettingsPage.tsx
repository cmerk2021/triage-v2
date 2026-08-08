import { useState } from "react";
import { Download, LogOut, Plus, Share, X } from "lucide-react";
import {
  Button,
  Field,
  Input,
  PageHeader,
  SegmentedControl,
  Select,
  Switch,
} from "@/design-system";
import { APP_BUILD, APP_BUILD_TIME, APP_VERSION } from "@/lib/version";
import { cn, formatDuration } from "@/lib/utils";
import { dayLabel } from "@/lib/time";
import type { StudyWindow, ThemePreference } from "@/lib/types";
import { useAuthStore } from "@/stores/auth.store";
import { useDataStore } from "@/stores/data.store";
import { useUIStore } from "@/stores/ui.store";
import {
  requestNotificationPermission,
  showNotification,
} from "@/features/notifications/notifications";
import {
  getVapidPublicKey,
  pushSupported,
  subscribeToPush,
  unsubscribeFromPush,
} from "@/lib/push";
import { usePWAInstall } from "@/lib/pwa";

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-border py-6 first:border-t-0 first:pt-0">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-fg">{title}</h2>
        {description && (
          <p className="mt-0.5 text-[13px] text-fg-subtle">{description}</p>
        )}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Row({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <div className="text-[13px] font-medium text-fg">{label}</div>
        {hint && <div className="text-xs text-fg-faint">{hint}</div>}
      </div>
      {children}
    </div>
  );
}

export function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const preferences = useAuthStore((s) => s.preferences());
  const updatePreferences = useAuthStore((s) => s.updatePreferences);
  const patchUser = useAuthStore((s) => s.patchUser);
  const logout = useAuthStore((s) => s.logout);

  const semesters = useDataStore((s) => s.semesters);
  const archiveSemester = useDataStore((s) => s.archiveSemester);
  const toast = useUIStore((s) => s.toast);

  const [name, setName] = useState(user?.name ?? "");
  const install = usePWAInstall();

  const activeSemester = semesters.find(
    (s) => s.id === preferences.activeSemesterId,
  );
  const archived = semesters.filter((s) => s.archived);

  async function toggleNotifications(enabled: boolean) {
    if (enabled) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        toast("Notifications are blocked in your browser", "danger");
        return;
      }
    }
    await updatePreferences({ notificationsEnabled: enabled });
  }

  async function togglePush(enabled: boolean) {
    if (enabled) {
      if (!pushSupported()) {
        toast("Push isn't supported in this browser", "danger");
        return;
      }
      if (!(await getVapidPublicKey())) {
        toast("Push isn't configured on the server yet", "danger");
        return;
      }
      const ok = await subscribeToPush();
      if (!ok) {
        toast("Couldn't enable push. Check notification permissions.", "danger");
        return;
      }
      await updatePreferences({ pushEnabled: true, notificationsEnabled: true });
      toast("Push reminders on — they'll reach you even when Triage is closed", "success");
    } else {
      await unsubscribeFromPush().catch(() => {});
      await updatePreferences({ pushEnabled: false });
    }
  }

  function updateWindow(i: number, patch: Partial<StudyWindow>) {
    const next = preferences.studyWindows.map((w, idx) =>
      idx === i ? { ...w, ...patch } : w,
    );
    updatePreferences({ studyWindows: next });
  }

  return (
    <div className="animate-fade-in">
      <PageHeader title="Settings" subtitle="Tune how Triage works for you." />

      <Section title="Profile">
        <Field label="Name">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => name.trim() && patchUser({ name: name.trim() })}
          />
        </Field>
        <Field label="Email">
          <Input value={user?.email ?? ""} disabled />
        </Field>
      </Section>

      <Section title="Appearance">
        <Row label="Theme">
          <SegmentedControl<ThemePreference>
            size="sm"
            value={preferences.theme}
            onChange={(v) => updatePreferences({ theme: v })}
            options={[
              { value: "system", label: "System" },
              { value: "dark", label: "Dark" },
              { value: "light", label: "Light" },
            ]}
          />
        </Row>
      </Section>

      <Section
        title="Study habits"
        description="Triage uses these to size your daily plan and time recommendations."
      >
        <div>
          <Row
            label="Daily study goal"
            hint="How much you aim to study on a typical day."
          >
            <span className="text-[13px] font-medium tabular-nums text-accent">
              {formatDuration(preferences.dailyGoalMinutes)}
            </span>
          </Row>
          <input
            type="range"
            min={30}
            max={360}
            step={15}
            value={preferences.dailyGoalMinutes}
            onChange={(e) =>
              updatePreferences({ dailyGoalMinutes: Number(e.target.value) })
            }
            className="mt-2 w-full accent-accent"
          />
        </div>

        <Row label="Week starts on">
          <SegmentedControl<"0" | "1">
            size="sm"
            value={String(preferences.weekStartsOn) as "0" | "1"}
            onChange={(v) =>
              updatePreferences({ weekStartsOn: Number(v) as 0 | 1 })
            }
            options={[
              { value: "0", label: "Sunday" },
              { value: "1", label: "Monday" },
            ]}
          />
        </Row>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-fg">
              When you usually study
            </span>
            <button
              onClick={() =>
                updatePreferences({
                  studyWindows: [
                    ...preferences.studyWindows,
                    { day: 1, start: "18:00", end: "20:00" },
                  ],
                })
              }
              className="flex items-center gap-1 text-[13px] text-accent hover:underline"
            >
              <Plus className="h-3.5 w-3.5" />
              Add window
            </button>
          </div>
          {preferences.studyWindows.length === 0 ? (
            <p className="text-xs text-fg-faint">
              No study windows — Triage falls back to your daily goal.
            </p>
          ) : (
            <div className="space-y-2">
              {preferences.studyWindows.map((w, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Select
                    value={w.day}
                    onChange={(e) =>
                      updateWindow(i, { day: Number(e.target.value) })
                    }
                    className="w-28"
                  >
                    {[1, 2, 3, 4, 5, 6, 0].map((d) => (
                      <option key={d} value={d}>
                        {dayLabel(d)}
                      </option>
                    ))}
                  </Select>
                  <Input
                    type="time"
                    value={w.start}
                    onChange={(e) => updateWindow(i, { start: e.target.value })}
                  />
                  <Input
                    type="time"
                    value={w.end}
                    onChange={(e) => updateWindow(i, { end: e.target.value })}
                  />
                  <button
                    onClick={() =>
                      updatePreferences({
                        studyWindows: preferences.studyWindows.filter(
                          (_, idx) => idx !== i,
                        ),
                      })
                    }
                    aria-label="Remove window"
                  >
                    <X className="h-4 w-4 text-fg-faint hover:text-danger" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Section>

      <Section
        title="App & notifications"
        description="Install Triage and let it nudge you toward your work."
      >
        <Row
          label="Install Triage"
          hint={
            install.installed
              ? "Installed — you're all set."
              : install.isIOS
                ? "Tap Share, then Add to Home Screen."
                : "Add to your home screen for reminders anywhere."
          }
        >
          {install.installed ? (
            <span className="text-[13px] font-medium text-accent">Installed</span>
          ) : install.canInstall ? (
            <Button
              variant="secondary"
              size="sm"
              icon={<Download className="h-4 w-4" />}
              onClick={async () => {
                const ok = await install.promptInstall();
                if (ok) toast("Triage installed", "success");
              }}
            >
              Install
            </Button>
          ) : install.isIOS ? (
            <Share className="h-4 w-4 text-fg-faint" />
          ) : (
            <span className="text-xs text-fg-faint">Use browser menu</span>
          )}
        </Row>

        <Row
          label="Push reminders"
          hint="Delivered even when Triage is closed — best on installed apps."
        >
          <Switch
            checked={preferences.pushEnabled}
            onChange={togglePush}
          />
        </Row>

        <Row label="In-app notifications" hint="Shown only while Triage is open.">
          <Switch
            checked={preferences.notificationsEnabled}
            onChange={toggleNotifications}
          />
        </Row>
        {(preferences.notificationsEnabled || preferences.pushEnabled) && (
          <>
            <Row label="Morning briefing">
              <Input
                type="time"
                value={preferences.morningBriefingTime}
                onChange={(e) =>
                  updatePreferences({ morningBriefingTime: e.target.value })
                }
                className="w-32"
              />
            </Row>
            <Row label="Evening reminder">
              <Input
                type="time"
                value={preferences.eveningReminderTime}
                onChange={(e) =>
                  updatePreferences({ eveningReminderTime: e.target.value })
                }
                className="w-32"
              />
            </Row>
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                showNotification(
                  "Triage",
                  "Notifications are working. This is how nudges will look.",
                )
              }
            >
              Send test notification
            </Button>
          </>
        )}
      </Section>

      <Section
        title="Semester"
        description="Archive a finished semester to clear it from active planning."
      >
        <Row
          label={activeSemester?.name ?? "No active semester"}
          hint={activeSemester ? "Current semester" : undefined}
        >
          {activeSemester && (
            <Button
              variant="secondary"
              size="sm"
              onClick={async () => {
                await archiveSemester(activeSemester.id);
                await updatePreferences({ activeSemesterId: null });
                toast("Semester archived", "success");
              }}
            >
              Archive
            </Button>
          )}
        </Row>
        {archived.length > 0 && (
          <div className="space-y-1">
            <div className="text-xs text-fg-faint">Previous semesters</div>
            {archived.map((s) => (
              <button
                key={s.id}
                onClick={() => updatePreferences({ activeSemesterId: s.id })}
                className={cn(
                  "flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-[13px] transition-colors hover:bg-bg-subtle",
                  s.id === preferences.activeSemesterId && "bg-bg-subtle",
                )}
              >
                <span className="text-fg">{s.name}</span>
                <span className="text-2xs text-fg-faint">Browse</span>
              </button>
            ))}
          </div>
        )}
      </Section>

      <Section title="About">
        <div className="rounded-xl border border-border bg-bg-subtle/50 p-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
              <div className="h-3 w-3 rounded-[4px] bg-accent-fg" />
            </div>
            <div>
              <div className="text-sm font-semibold text-fg">Triage</div>
              <div className="text-2xs text-fg-faint">
                Tell Triage what's due. Triage tells you what to work on.
              </div>
            </div>
          </div>
          <dl className="mt-4 space-y-1.5 text-[13px]">
            <div className="flex justify-between">
              <dt className="text-fg-subtle">Version</dt>
              <dd className="tabular-nums text-fg">{APP_VERSION}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-fg-subtle">Build</dt>
              <dd className="tabular-nums text-fg">#{APP_BUILD}</dd>
            </div>
            {APP_BUILD_TIME && (
              <div className="flex justify-between">
                <dt className="text-fg-subtle">Built</dt>
                <dd className="text-fg">
                  {new Date(APP_BUILD_TIME).toLocaleDateString()}
                </dd>
              </div>
            )}
          </dl>
        </div>
      </Section>

      <Section title="Account">
        <Button
          variant="danger"
          icon={<LogOut className="h-4 w-4" />}
          onClick={logout}
        >
          Sign out
        </Button>
      </Section>
    </div>
  );
}
