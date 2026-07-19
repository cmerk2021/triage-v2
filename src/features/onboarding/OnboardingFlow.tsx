import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  CalendarClock,
  Check,
  GraduationCap,
  Plus,
  Sparkles,
  X,
} from "lucide-react";
import { addDays, endOfDay } from "date-fns";
import { Button, Field, Input, Switch } from "@/design-system";
import { cn } from "@/lib/utils";
import { COURSE_COLORS, type CourseColor, type StudyWindow } from "@/lib/types";
import { courseHsl } from "@/design-system/courseColor";
import { useAuthStore } from "@/stores/auth.store";
import { useDataStore } from "@/stores/data.store";
import { requestNotificationPermission } from "@/features/notifications/notifications";

interface DraftCourse {
  name: string;
  code: string;
  color: CourseColor;
  icon: string;
}

const STUDY_PRESETS: { key: string; label: string; start: string; end: string }[] = [
  { key: "morning", label: "Mornings", start: "08:00", end: "11:00" },
  { key: "afternoon", label: "Afternoons", start: "13:00", end: "16:00" },
  { key: "evening", label: "Evenings", start: "18:00", end: "21:00" },
  { key: "night", label: "Late nights", start: "21:00", end: "23:30" },
];

const GOAL_PRESETS = [60, 120, 180, 240];

function defaultSemesterName(now = new Date()): string {
  const m = now.getMonth();
  const term = m >= 7 ? "Fall" : m >= 4 ? "Summer" : "Spring";
  return `${term} ${now.getFullYear()}`;
}

const STEPS = ["welcome", "semester", "courses", "rhythm", "notify", "first", "done"] as const;
type Step = (typeof STEPS)[number];

export function OnboardingFlow() {
  const firstName = useAuthStore((s) => s.user?.name?.split(" ")[0]);
  const patchUser = useAuthStore((s) => s.patchUser);
  const updatePreferences = useAuthStore((s) => s.updatePreferences);
  const createSemester = useDataStore((s) => s.createSemester);
  const createCourse = useDataStore((s) => s.createCourse);
  const createAssignment = useDataStore((s) => s.createAssignment);

  const [step, setStep] = useState<Step>("welcome");
  const [saving, setSaving] = useState(false);

  // Draft state
  const [semesterName, setSemesterName] = useState(defaultSemesterName());
  const [courses, setCourses] = useState<DraftCourse[]>([]);
  const [courseName, setCourseName] = useState("");
  const [presets, setPresets] = useState<Set<string>>(new Set(["evening"]));
  const [goal, setGoal] = useState(120);
  const [notify, setNotify] = useState(false);
  const [morning, setMorning] = useState("08:00");
  const [evening, setEvening] = useState("19:00");
  const [firstTitle, setFirstTitle] = useState("");
  const [firstCourse, setFirstCourse] = useState(0);
  const [firstDue, setFirstDue] = useState<Date | null>(addDays(new Date(), 2));

  const index = STEPS.indexOf(step);

  function addCourse() {
    const name = courseName.trim();
    if (!name) return;
    setCourses((c) => [
      ...c,
      {
        name,
        code: "",
        color: COURSE_COLORS[c.length % COURSE_COLORS.length],
        icon: "",
      },
    ]);
    setCourseName("");
  }

  function togglePreset(key: string) {
    setPresets((p) => {
      const next = new Set(p);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const studyWindows = useMemo<StudyWindow[]>(() => {
    const windows: StudyWindow[] = [];
    for (const preset of STUDY_PRESETS) {
      if (!presets.has(preset.key)) continue;
      for (const day of [1, 2, 3, 4, 5]) {
        windows.push({ day, start: preset.start, end: preset.end });
      }
    }
    return windows;
  }, [presets]);

  function next() {
    setStep(STEPS[Math.min(index + 1, STEPS.length - 1)]);
  }
  function back() {
    setStep(STEPS[Math.max(index - 1, 0)]);
  }

  async function finish() {
    setSaving(true);
    try {
      const semester = await createSemester({
        name: semesterName.trim() || defaultSemesterName(),
      });

      const created = [];
      for (const c of courses) {
        created.push(
          await createCourse({
            name: c.name,
            code: c.code,
            color: c.color,
            icon: c.icon,
            semester: semester.id,
          }),
        );
      }

      if (firstTitle.trim()) {
        await createAssignment({
          title: firstTitle.trim(),
          course: created[firstCourse]?.id ?? "",
          dueDate: firstDue ? firstDue.toISOString() : "",
        });
      }

      if (notify) await requestNotificationPermission();

      await updatePreferences({
        activeSemesterId: semester.id,
        studyWindows,
        dailyGoalMinutes: goal,
        notificationsEnabled: notify,
        morningBriefingTime: morning,
        eveningReminderTime: evening,
      });

      await patchUser({ onboardingComplete: true });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      {step !== "welcome" && (
        <div className="mx-auto flex w-full max-w-lg items-center gap-1.5 px-6 pt-8">
          {STEPS.slice(1, -1).map((s, i) => (
            <div
              key={s}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors duration-300",
                i <= index - 1 ? "bg-accent" : "bg-border",
              )}
            />
          ))}
        </div>
      )}

      <div className="flex flex-1 items-center justify-center px-6 py-10">
        <div key={step} className="w-full max-w-lg animate-slide-up">
          {step === "welcome" && (
            <Welcome name={firstName} onStart={next} />
          )}

          {step === "semester" && (
            <StepShell
              icon={<CalendarClock className="h-5 w-5" />}
              title="Which semester is this?"
              subtitle="We'll group everything under it, then tuck it away when you're done."
            >
              <Field label="Semester name">
                <Input
                  autoFocus
                  value={semesterName}
                  onChange={(e) => setSemesterName(e.target.value)}
                  className="h-11 text-[15px]"
                />
              </Field>
            </StepShell>
          )}

          {step === "courses" && (
            <StepShell
              icon={<GraduationCap className="h-5 w-5" />}
              title="What are you taking?"
              subtitle="Add your classes. You can always add more later."
            >
              <div className="flex gap-2">
                <Input
                  autoFocus
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addCourse()}
                  placeholder="e.g. Organic Chemistry"
                  className="h-11 text-[15px]"
                />
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={addCourse}
                  icon={<Plus className="h-4 w-4" />}
                >
                  Add
                </Button>
              </div>
              <div className="mt-3 space-y-1.5">
                {courses.map((c, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2.5 rounded-lg border border-border bg-bg-subtle px-3 py-2"
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: courseHsl(c.color) }}
                    />
                    <span className="flex-1 text-sm text-fg">{c.name}</span>
                    <button
                      onClick={() =>
                        setCourses((cs) => cs.filter((_, idx) => idx !== i))
                      }
                      aria-label="Remove course"
                    >
                      <X className="h-4 w-4 text-fg-faint hover:text-danger" />
                    </button>
                  </div>
                ))}
              </div>
            </StepShell>
          )}

          {step === "rhythm" && (
            <StepShell
              icon={<CalendarClock className="h-5 w-5" />}
              title="When do you usually study?"
              subtitle="This helps Triage suggest work that fits your day."
            >
              <div className="flex flex-wrap gap-2">
                {STUDY_PRESETS.map((p) => (
                  <PillToggle
                    key={p.key}
                    active={presets.has(p.key)}
                    onClick={() => togglePreset(p.key)}
                  >
                    {p.label}
                  </PillToggle>
                ))}
              </div>
              <div className="mt-6">
                <div className="mb-2 text-[13px] font-medium text-fg-muted">
                  On a typical day, I want to study…
                </div>
                <div className="flex flex-wrap gap-2">
                  {GOAL_PRESETS.map((g) => (
                    <PillToggle
                      key={g}
                      active={goal === g}
                      onClick={() => setGoal(g)}
                    >
                      {g / 60}h
                    </PillToggle>
                  ))}
                </div>
              </div>
            </StepShell>
          )}

          {step === "notify" && (
            <StepShell
              icon={<Bell className="h-5 w-5" />}
              title="Want a gentle nudge?"
              subtitle="A short morning briefing and an evening reminder. No noise."
            >
              <div className="flex items-center justify-between rounded-lg border border-border bg-bg-subtle px-4 py-3">
                <span className="text-sm text-fg">Enable notifications</span>
                <Switch checked={notify} onChange={setNotify} />
              </div>
              {notify && (
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <Field label="Morning briefing">
                    <Input
                      type="time"
                      value={morning}
                      onChange={(e) => setMorning(e.target.value)}
                    />
                  </Field>
                  <Field label="Evening reminder">
                    <Input
                      type="time"
                      value={evening}
                      onChange={(e) => setEvening(e.target.value)}
                    />
                  </Field>
                </div>
              )}
            </StepShell>
          )}

          {step === "first" && (
            <StepShell
              icon={<Sparkles className="h-5 w-5" />}
              title="Anything due soon?"
              subtitle="Add one assignment to see Triage in action. Optional."
            >
              <Field label="Assignment">
                <Input
                  autoFocus
                  value={firstTitle}
                  onChange={(e) => setFirstTitle(e.target.value)}
                  placeholder="e.g. Problem set 1"
                  className="h-11 text-[15px]"
                />
              </Field>
              {courses.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {courses.map((c, i) => (
                    <PillToggle
                      key={i}
                      active={firstCourse === i}
                      onClick={() => setFirstCourse(i)}
                    >
                      {c.name}
                    </PillToggle>
                  ))}
                </div>
              )}
              <div className="mt-4 grid grid-cols-3 gap-2">
                {[
                  { label: "Tomorrow", d: 1 },
                  { label: "In 3 days", d: 3 },
                  { label: "Next week", d: 7 },
                ].map((opt) => {
                  const value = endOfDay(addDays(new Date(), opt.d));
                  const active =
                    firstDue?.toDateString() === value.toDateString();
                  return (
                    <PillToggle
                      key={opt.label}
                      active={active}
                      onClick={() => setFirstDue(active ? null : value)}
                    >
                      {opt.label}
                    </PillToggle>
                  );
                })}
              </div>
            </StepShell>
          )}

          {step === "done" && (
            <div className="text-center">
              <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-success/15 text-success">
                <Check className="h-6 w-6" strokeWidth={2.5} />
              </div>
              <h1 className="text-2xl font-semibold tracking-tight">
                You're all set
              </h1>
              <p className="mx-auto mt-2 max-w-sm text-[13px] leading-relaxed text-fg-subtle">
                Triage now understands your semester. From here on, just tell it
                what's due — it'll tell you what to work on.
              </p>
            </div>
          )}

          {/* Navigation */}
          {step !== "welcome" && (
            <div className="mt-8 flex items-center gap-2">
              <Button
                variant="ghost"
                icon={<ArrowLeft className="h-4 w-4" />}
                onClick={back}
              >
                Back
              </Button>
              <div className="flex-1" />
              {step === "done" ? (
                <Button
                  variant="primary"
                  size="lg"
                  loading={saving}
                  onClick={finish}
                >
                  Enter Triage
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="lg"
                  onClick={next}
                  icon={<ArrowRight className="h-4 w-4" />}
                >
                  Continue
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Welcome({ name, onStart }: { name?: string; onStart: () => void }) {
  return (
    <div className="text-center">
      <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent">
        <div className="h-5 w-5 rounded-[6px] bg-accent-fg" />
      </div>
      <h1 className="text-3xl font-semibold tracking-tight">
        Welcome{name ? `, ${name}` : ""}.
      </h1>
      <p className="mx-auto mt-3 max-w-sm text-[15px] leading-relaxed text-fg-subtle">
        Let's set up your semester. It takes about a minute — like setting up a
        new device.
      </p>
      <Button
        variant="primary"
        size="lg"
        className="mt-8"
        onClick={onStart}
        icon={<ArrowRight className="h-4 w-4" />}
      >
        Get started
      </Button>
    </div>
  );
}

function StepShell({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-6">
        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-bg-inset text-accent">
          {icon}
        </div>
        <h1 className="text-xl font-semibold tracking-tight text-fg">{title}</h1>
        <p className="mt-1.5 text-[13px] leading-relaxed text-fg-subtle">
          {subtitle}
        </p>
      </div>
      {children}
    </div>
  );
}

function PillToggle({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-4 py-2 text-[13px] font-medium transition-colors duration-150",
        active
          ? "border-accent/40 bg-accent/15 text-accent"
          : "border-border bg-bg-subtle text-fg-muted hover:border-border-strong hover:text-fg",
      )}
    >
      {children}
    </button>
  );
}
