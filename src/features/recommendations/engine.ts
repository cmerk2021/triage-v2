import type {
  AssignmentWithSubtasks,
  Preferences,
  Subtask,
} from "@/lib/types";
import { clamp } from "@/lib/utils";
import { daysUntil, parseDate } from "@/lib/time";

/**
 * The Triage recommendation engine.
 *
 * This module is intentionally isolated and pure: it takes facts in and
 * returns recommendations out. It has no knowledge of React, PocketBase, or
 * the DOM, which keeps prioritization logic in exactly one place and makes it
 * trivial to test and evolve.
 *
 * Guiding rules:
 *   • The student never sorts anything — the engine decides.
 *   • Every recommendation explains WHY in plain language.
 *   • The internal score is never exposed outside this module.
 */

export type Urgency = "overdue" | "today" | "soon" | "upcoming" | "later";

export interface Recommendation {
  assignment: AssignmentWithSubtasks;
  /** Plain-language justification shown to the student. Never a number. */
  reason: string;
  /** Estimated minutes of work remaining on this assignment. */
  remainingMinutes: number;
  /** The most sensible next subtask to tackle, when one exists. */
  nextSubtask: Subtask | null;
  urgency: Urgency;
  completion: number;
}

export interface TodayPlan {
  availableMinutes: number;
  plannedMinutes: number;
  items: Recommendation[];
  /** Ranked items that didn't fit today's available time. */
  overflow: Recommendation[];
}

export interface StudySession {
  budgetMinutes: number;
  plannedMinutes: number;
  items: Recommendation[];
}

export interface NotificationSummary {
  recommendedMinutes: number;
  assignmentsNeedingAttention: number;
  morning: string;
  evening: string;
}

export interface EngineContext {
  assignments: AssignmentWithSubtasks[];
  now: Date;
  availableMinutes: number;
  preferences: Preferences;
}

const DEFAULT_ASSIGNMENT_MINUTES = 30;
const LARGE_ASSIGNMENT_MINUTES = 90;

interface Analysis {
  assignment: AssignmentWithSubtasks;
  remainingMinutes: number;
  completion: number;
  started: boolean;
  overdue: boolean;
  dueInDays: number | null;
  pressure: number;
  urgency: Urgency;
  nextSubtask: Subtask | null;
  score: number;
}

function isActive(a: AssignmentWithSubtasks): boolean {
  return !a.archived && a.status !== "done";
}

/** Estimate remaining work using subtasks when available, else the estimate. */
export function estimateRemaining(a: AssignmentWithSubtasks): number {
  const subtasks = a.subtasks ?? [];
  if (subtasks.length > 0) {
    const remaining = subtasks.filter((s) => !s.done);
    const haveEstimates = subtasks.some((s) => s.estimatedMinutes > 0);
    if (haveEstimates) {
      const sum = remaining.reduce(
        (t, s) => t + (s.estimatedMinutes || 0),
        0,
      );
      if (sum > 0) return sum;
    }
    // Fall back to proportioning the assignment estimate by subtask count.
    const base = a.estimatedMinutes || DEFAULT_ASSIGNMENT_MINUTES;
    return Math.round((remaining.length / subtasks.length) * base);
  }
  const base = a.estimatedMinutes || DEFAULT_ASSIGNMENT_MINUTES;
  if (a.status === "in_progress") return Math.round(base * 0.6);
  return base;
}

function completionRatio(a: AssignmentWithSubtasks): number {
  const subtasks = a.subtasks ?? [];
  if (subtasks.length === 0) {
    if (a.status === "done") return 1;
    if (a.status === "in_progress") return 0.4;
    return 0;
  }
  const done = subtasks.filter((s) => s.done).length;
  return done / subtasks.length;
}

function pickNextSubtask(a: AssignmentWithSubtasks): Subtask | null {
  const open = (a.subtasks ?? [])
    .filter((s) => !s.done)
    .sort((x, y) => x.position - y.position);
  return open[0] ?? null;
}

function urgencyFrom(dueInDays: number | null, overdue: boolean): Urgency {
  if (overdue) return "overdue";
  if (dueInDays === null) return "later";
  if (dueInDays <= 0) return "today";
  if (dueInDays <= 2) return "soon";
  if (dueInDays <= 6) return "upcoming";
  return "later";
}

function analyze(a: AssignmentWithSubtasks, ctx: EngineContext): Analysis {
  const due = parseDate(a.dueDate);
  const dueInDays = due ? daysUntil(due, ctx.now) : null;
  const overdue = dueInDays !== null && dueInDays < 0;
  const remainingMinutes = estimateRemaining(a);
  const completion = completionRatio(a);
  const started =
    a.status === "in_progress" ||
    !!a.startedAt ||
    (a.subtasks ?? []).some((s) => s.done);

  // Daily capacity the student realistically has to spend on this work.
  const dailyCapacity = Math.max(ctx.preferences.dailyGoalMinutes || 120, 30);
  const daysLeft = dueInDays === null ? 14 : Math.max(dueInDays, 0) + 1;
  const capacityUntilDue = dailyCapacity * daysLeft;
  const pressure = capacityUntilDue > 0 ? remainingMinutes / capacityUntilDue : 0;

  const urgency = urgencyFrom(dueInDays, overdue);

  // ── Internal score (never surfaced) ────────────────────────────────
  let score = 0;

  if (overdue) {
    score += 900 + Math.min(Math.abs(dueInDays!), 14) * 18;
  } else if (dueInDays !== null) {
    score += Math.max(0, 210 - dueInDays * 24);
  } else {
    score += 20; // undated work has a gentle baseline pull
  }

  score += clamp(pressure, 0, 2.5) * 130;

  const large = remainingMinutes >= LARGE_ASSIGNMENT_MINUTES;
  if (!started && large && dueInDays !== null && dueInDays <= 7) {
    score += 65 + Math.min(remainingMinutes, 300) / 5;
  }

  if (started && completion >= 0.5 && completion < 1) {
    score += 45 + completion * 70;
  }

  if (remainingMinutes <= ctx.availableMinutes) score += 30;
  if (remainingMinutes <= 25) score += 18;

  return {
    assignment: a,
    remainingMinutes,
    completion,
    started,
    overdue,
    dueInDays,
    pressure,
    urgency,
    nextSubtask: pickNextSubtask(a),
    score,
  };
}

/** Choose the single dominant reason a student should care about this now. */
function reasonFor(x: Analysis): string {
  const subtaskCount = x.assignment.subtasks?.length ?? 0;
  const doneCount = (x.assignment.subtasks ?? []).filter((s) => s.done).length;
  const almost = x.completion >= 0.7 && x.completion < 1;

  if (x.overdue) return "Overdue — worth clearing first.";
  if (almost && subtaskCount > 0) {
    return `${doneCount} of ${subtaskCount} done — almost there.`;
  }
  if (almost) return "Almost complete.";
  if (x.dueInDays === 0) return "Due today.";
  if (x.dueInDays === 1) return "Due tomorrow.";
  if (x.pressure >= 1) return "Heavy workload before it's due.";
  if (
    !x.started &&
    x.remainingMinutes >= LARGE_ASSIGNMENT_MINUTES &&
    x.dueInDays !== null &&
    x.dueInDays <= 7
  ) {
    return "Large assignment worth starting early.";
  }
  if (x.remainingMinutes <= 25) return "Quick win you can finish fast.";
  if (x.dueInDays !== null && x.dueInDays <= 3) return "Due soon.";
  if (x.remainingMinutes <= 0) return "Ready to wrap up.";
  return "Fits your available study time.";
}

function toRecommendation(x: Analysis): Recommendation {
  return {
    assignment: x.assignment,
    reason: reasonFor(x),
    remainingMinutes: x.remainingMinutes,
    nextSubtask: x.nextSubtask,
    urgency: x.urgency,
    completion: x.completion,
  };
}

export function createEngine(ctx: EngineContext) {
  const analyses = ctx.assignments
    .filter(isActive)
    .map((a) => analyze(a, ctx))
    .sort((a, b) => b.score - a.score);

  function getRecommendedAssignments(limit?: number): Recommendation[] {
    const items = analyses.map(toRecommendation);
    return typeof limit === "number" ? items.slice(0, limit) : items;
  }

  function getNextBestTask(): Recommendation | null {
    return analyses.length ? toRecommendation(analyses[0]) : null;
  }

  /**
   * Fill the available time with the highest-value work. Always keeps the top
   * pick (even if it exceeds the budget — sometimes the right move is the big
   * one), then greedily fits smaller high-value tasks around it.
   */
  function getStudySession(budgetMinutes = ctx.availableMinutes): StudySession {
    const items: Recommendation[] = [];
    let planned = 0;

    for (const x of analyses) {
      const rec = toRecommendation(x);
      if (items.length === 0) {
        items.push(rec);
        planned += Math.min(x.remainingMinutes, budgetMinutes);
        continue;
      }
      if (planned + x.remainingMinutes <= budgetMinutes) {
        items.push(rec);
        planned += x.remainingMinutes;
      }
      if (planned >= budgetMinutes) break;
    }

    return { budgetMinutes, plannedMinutes: planned, items };
  }

  function getTodayPlan(): TodayPlan {
    const session = getStudySession(ctx.availableMinutes);
    const includedIds = new Set(session.items.map((i) => i.assignment.id));
    const overflow = analyses
      .filter((x) => !includedIds.has(x.assignment.id))
      .slice(0, 4)
      .map(toRecommendation);

    return {
      availableMinutes: ctx.availableMinutes,
      plannedMinutes: session.plannedMinutes,
      items: session.items,
      overflow,
    };
  }

  function getNotificationSummary(): NotificationSummary {
    const attention = analyses.filter(
      (x) => x.overdue || (x.dueInDays !== null && x.dueInDays <= 2),
    );
    const recommendedMinutes = getStudySession(
      ctx.preferences.dailyGoalMinutes || ctx.availableMinutes,
    ).plannedMinutes;

    const morning =
      analyses.length === 0
        ? "You're all caught up. Enjoy the clear day."
        : `Good morning. About ${describeHours(
            recommendedMinutes,
          )} of recommended work today.`;

    const evening =
      attention.length === 0
        ? "Nothing urgent tonight. A little progress still goes a long way."
        : attention.length === 1
          ? "It's time to study. One assignment deserves attention tonight."
          : `It's time to study. ${attention.length} assignments deserve attention tonight.`;

    return {
      recommendedMinutes,
      assignmentsNeedingAttention: attention.length,
      morning,
      evening,
    };
  }

  return {
    getRecommendedAssignments,
    getNextBestTask,
    getStudySession,
    getTodayPlan,
    getNotificationSummary,
  };
}

export type Engine = ReturnType<typeof createEngine>;

function describeHours(minutes: number): string {
  if (minutes <= 0) return "no";
  if (minutes < 75) return "an hour";
  const h = Math.round((minutes / 60) * 2) / 2;
  return h === 1 ? "an hour" : `${h} hours`;
}
