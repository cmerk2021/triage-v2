import { useMemo } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, CheckCircle2, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { EmptyState } from "@/design-system";
import { formatDurationLong } from "@/lib/utils";
import { greeting } from "@/lib/time";
import { useEngine } from "@/features/recommendations/useEngine";
import { RecommendationCard } from "@/features/recommendations/RecommendationCard";
import { WorkloadForecast } from "@/features/workload/WorkloadForecast";
import { useDataStore } from "@/stores/data.store";
import { useUIStore } from "@/stores/ui.store";
import { useAuthStore } from "@/stores/auth.store";

export function TodayPage() {
  const engine = useEngine();
  const openQuickAdd = useUIStore((s) => s.openQuickAdd);
  const name = useAuthStore((s) => s.user?.name?.split(" ")[0]);
  const hasAssignments = useDataStore((s) =>
    s.assignments.some((a) => !a.archived),
  );

  const plan = useMemo(() => engine.getTodayPlan(), [engine]);
  const [primary, ...rest] = plan.items;

  const availabilityLine =
    plan.availableMinutes > 0
      ? `You have ${formatDurationLong(plan.availableMinutes)} available today.`
      : "Here's where your attention matters most.";

  return (
    <div className="animate-fade-in">
      <header className="mb-8">
        <p className="text-2xs font-medium uppercase tracking-wide text-fg-faint">
          {format(new Date(), "EEEE, MMMM d")}
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-fg">
          {greeting()}
          {name ? `, ${name}.` : "."}
        </h1>
        <p className="mt-1.5 text-sm text-fg-subtle">{availabilityLine}</p>
      </header>

      {!hasAssignments ? (
        <EmptyState
          icon={<Sparkles className="h-5 w-5" />}
          title="Let's get your semester in here"
          description="Add your first assignment and Triage will start telling you what to work on."
          action={
            <button
              onClick={openQuickAdd}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-fg transition-colors hover:bg-accent/90"
            >
              Add an assignment
            </button>
          }
        />
      ) : plan.items.length === 0 ? (
        <EmptyState
          icon={<CheckCircle2 className="h-5 w-5 text-success" />}
          title="You're all caught up"
          description="Nothing needs your attention right now. Enjoy the clear runway."
        />
      ) : (
        <div className="space-y-6">
          <section className="space-y-2.5">
            <h2 className="text-[13px] font-medium text-fg-muted">Recommended</h2>
            {primary && <RecommendationCard rec={primary} primary />}
            {rest.length > 0 && (
              <div className="space-y-2">
                {rest.map((rec) => (
                  <RecommendationCard key={rec.assignment.id} rec={rec} />
                ))}
              </div>
            )}
          </section>

          {plan.overflow.length > 0 && (
            <section className="space-y-2.5">
              <h2 className="text-[13px] font-medium text-fg-muted">
                Worth a look later
              </h2>
              <div className="space-y-2">
                {plan.overflow.map((rec) => (
                  <RecommendationCard key={rec.assignment.id} rec={rec} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {hasAssignments && (
        <section className="mt-10 rounded-xl border border-border bg-bg-subtle/50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[13px] font-medium text-fg-muted">
              Workload ahead
            </h2>
            <Link
              to="/calendar"
              className="flex items-center gap-1 text-2xs text-fg-subtle transition-colors hover:text-fg"
            >
              <CalendarDays className="h-3.5 w-3.5" />
              Calendar
            </Link>
          </div>
          <WorkloadForecast days={14} />
        </section>
      )}
    </div>
  );
}
