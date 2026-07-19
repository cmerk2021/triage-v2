/**
 * Shared domain model for Triage.
 *
 * These mirror the PocketBase collections but are the *application's* view
 * of the data. The student owns every field here; Triage never writes
 * priority or ordering back into these records.
 */

export type ID = string;
/** ISO-8601 timestamp, or "" when unset (PocketBase convention). */
export type ISODate = string;

export type AssignmentStatus = "todo" | "in_progress" | "done";

export type CourseColor =
  | "indigo"
  | "blue"
  | "cyan"
  | "emerald"
  | "amber"
  | "rose"
  | "violet"
  | "orange"
  | "teal"
  | "pink";

export const COURSE_COLORS: CourseColor[] = [
  "indigo",
  "blue",
  "cyan",
  "emerald",
  "amber",
  "rose",
  "violet",
  "orange",
  "teal",
  "pink",
];

export interface BaseRecord {
  id: ID;
  created: ISODate;
  updated: ISODate;
}

export interface Semester extends BaseRecord {
  owner: ID;
  name: string;
  startDate: ISODate;
  endDate: ISODate;
  archived: boolean;
}

/** A recurring class meeting. `day` is 0 (Sun) – 6 (Sat); times are "HH:mm". */
export interface MeetingBlock {
  day: number;
  start: string;
  end: string;
}

export interface Course extends BaseRecord {
  owner: ID;
  semester: ID;
  name: string;
  code: string;
  professor: string;
  location: string;
  meetingSchedule: MeetingBlock[];
  color: CourseColor;
  icon: string;
  archived: boolean;
}

export interface Assignment extends BaseRecord {
  owner: ID;
  course: ID;
  title: string;
  dueDate: ISODate;
  estimatedMinutes: number;
  notes: string;
  attachments: string[];
  status: AssignmentStatus;
  startedAt: ISODate;
  completedAt: ISODate;
  archived: boolean;
}

export interface Subtask extends BaseRecord {
  owner: ID;
  assignment: ID;
  title: string;
  done: boolean;
  position: number;
  estimatedMinutes: number;
}

/** Assignment enriched with its subtasks — the unit the engine reasons about. */
export interface AssignmentWithSubtasks extends Assignment {
  subtasks: Subtask[];
}

/** Recurring window where the student is typically free to study. */
export interface StudyWindow {
  /** 0 (Sun) – 6 (Sat) */
  day: number;
  start: string;
  end: string;
}

export type ThemePreference = "system" | "dark" | "light";

export interface Preferences {
  activeSemesterId: ID | null;
  studyWindows: StudyWindow[];
  dailyGoalMinutes: number;
  morningBriefingTime: string;
  eveningReminderTime: string;
  notificationsEnabled: boolean;
  weekStartsOn: 0 | 1;
  theme: ThemePreference;
}

export interface TriageUser extends BaseRecord {
  email: string;
  name: string;
  onboardingComplete: boolean;
  preferences: Preferences | null;
}

export const DEFAULT_PREFERENCES: Preferences = {
  activeSemesterId: null,
  studyWindows: [],
  dailyGoalMinutes: 120,
  morningBriefingTime: "08:00",
  eveningReminderTime: "19:00",
  notificationsEnabled: false,
  weekStartsOn: 0,
  theme: "dark",
};
