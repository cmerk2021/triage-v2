import { create } from "zustand";
import type { RecordModel } from "pocketbase";
import { pb } from "@/lib/pocketbase";
import { hashString } from "@/lib/utils";
import {
  COURSE_COLORS,
  type Assignment,
  type AssignmentStatus,
  type AssignmentWithSubtasks,
  type Course,
  type CourseColor,
  type MeetingBlock,
  type Semester,
  type Subtask,
} from "@/lib/types";

// ── Record mappers ─────────────────────────────────────────────────────
function mapSemester(r: RecordModel): Semester {
  return {
    id: r.id,
    created: r.created,
    updated: r.updated,
    owner: r.owner,
    name: r.name ?? "",
    startDate: r.startDate ?? "",
    endDate: r.endDate ?? "",
    archived: !!r.archived,
  };
}

function mapCourse(r: RecordModel): Course {
  return {
    id: r.id,
    created: r.created,
    updated: r.updated,
    owner: r.owner,
    semester: r.semester ?? "",
    name: r.name ?? "",
    code: r.code ?? "",
    professor: r.professor ?? "",
    location: r.location ?? "",
    meetingSchedule: Array.isArray(r.meetingSchedule)
      ? (r.meetingSchedule as MeetingBlock[])
      : [],
    color: (r.color || COURSE_COLORS[hashString(r.id) % COURSE_COLORS.length]) as CourseColor,
    icon: r.icon ?? "",
    archived: !!r.archived,
  };
}

function mapAssignment(r: RecordModel): Assignment {
  return {
    id: r.id,
    created: r.created,
    updated: r.updated,
    owner: r.owner,
    course: r.course ?? "",
    title: r.title ?? "",
    dueDate: r.dueDate ?? "",
    estimatedMinutes: r.estimatedMinutes ?? 0,
    notes: r.notes ?? "",
    attachments: Array.isArray(r.attachments) ? r.attachments : [],
    status: (r.status || "todo") as AssignmentStatus,
    startedAt: r.startedAt ?? "",
    completedAt: r.completedAt ?? "",
    archived: !!r.archived,
  };
}

function mapSubtask(r: RecordModel): Subtask {
  return {
    id: r.id,
    created: r.created,
    updated: r.updated,
    owner: r.owner,
    assignment: r.assignment,
    title: r.title ?? "",
    done: !!r.done,
    position: r.position ?? 0,
    estimatedMinutes: r.estimatedMinutes ?? 0,
  };
}

function owner(): string {
  return pb.authStore.record?.id ?? "";
}

interface DataState {
  loaded: boolean;
  loading: boolean;
  semesters: Semester[];
  courses: Course[];
  assignments: Assignment[];
  subtasks: Subtask[];

  load: () => Promise<void>;
  reset: () => void;

  // Derived
  assignmentsWithSubtasks: () => AssignmentWithSubtasks[];
  getCourse: (id: string) => Course | undefined;
  courseColor: (id: string) => CourseColor;

  // Semesters
  createSemester: (data: Partial<Semester>) => Promise<Semester>;
  updateSemester: (id: string, data: Partial<Semester>) => Promise<void>;
  archiveSemester: (id: string) => Promise<void>;

  // Courses
  createCourse: (data: Partial<Course>) => Promise<Course>;
  updateCourse: (id: string, data: Partial<Course>) => Promise<void>;
  deleteCourse: (id: string) => Promise<void>;

  // Assignments
  createAssignment: (data: Partial<Assignment>) => Promise<Assignment>;
  updateAssignment: (id: string, data: Partial<Assignment>) => Promise<void>;
  setStatus: (id: string, status: AssignmentStatus) => Promise<void>;
  deleteAssignment: (id: string) => Promise<void>;
  uploadAttachments: (id: string, files: File[]) => Promise<void>;
  removeAttachment: (id: string, filename: string) => Promise<void>;

  // Subtasks
  createSubtask: (assignmentId: string, title: string, estimatedMinutes?: number) => Promise<void>;
  updateSubtask: (id: string, data: Partial<Subtask>) => Promise<void>;
  toggleSubtask: (id: string) => Promise<void>;
  deleteSubtask: (id: string) => Promise<void>;
}

export const useDataStore = create<DataState>((set, get) => ({
  loaded: false,
  loading: false,
  semesters: [],
  courses: [],
  assignments: [],
  subtasks: [],

  load: async () => {
    if (!owner()) return;
    set({ loading: true });
    try {
      const [semesters, courses, assignments, subtasks] = await Promise.all([
        pb.collection("semesters").getFullList({ sort: "-created" }),
        pb.collection("courses").getFullList({ sort: "name" }),
        pb.collection("assignments").getFullList({ sort: "dueDate" }),
        pb.collection("subtasks").getFullList({ sort: "position" }),
      ]);
      set({
        semesters: semesters.map(mapSemester),
        courses: courses.map(mapCourse),
        assignments: assignments.map(mapAssignment),
        subtasks: subtasks.map(mapSubtask),
        loaded: true,
        loading: false,
      });
    } catch {
      set({ loading: false });
    }
  },

  reset: () =>
    set({
      loaded: false,
      semesters: [],
      courses: [],
      assignments: [],
      subtasks: [],
    }),

  assignmentsWithSubtasks: () => {
    const { assignments, subtasks } = get();
    return assignments.map((a) => ({
      ...a,
      subtasks: subtasks
        .filter((s) => s.assignment === a.id)
        .sort((x, y) => x.position - y.position),
    }));
  },

  getCourse: (id) => get().courses.find((c) => c.id === id),

  courseColor: (id) => {
    const course = get().courses.find((c) => c.id === id);
    return course?.color ?? "indigo";
  },

  // ── Semesters ────────────────────────────────────────────────────────
  createSemester: async (data) => {
    const record = await pb
      .collection("semesters")
      .create({ ...data, owner: owner(), archived: false });
    const semester = mapSemester(record);
    set((s) => ({ semesters: [semester, ...s.semesters] }));
    return semester;
  },

  updateSemester: async (id, data) => {
    const record = await pb.collection("semesters").update(id, data);
    const semester = mapSemester(record);
    set((s) => ({
      semesters: s.semesters.map((x) => (x.id === id ? semester : x)),
    }));
  },

  archiveSemester: async (id) => {
    await get().updateSemester(id, { archived: true });
    // Archive all courses and assignments in the semester.
    const courseIds = get()
      .courses.filter((c) => c.semester === id)
      .map((c) => c.id);
    await Promise.all(
      courseIds.map((cid) =>
        pb.collection("courses").update(cid, { archived: true }),
      ),
    );
    const assignmentIds = get()
      .assignments.filter((a) => courseIds.includes(a.course))
      .map((a) => a.id);
    await Promise.all(
      assignmentIds.map((aid) =>
        pb.collection("assignments").update(aid, { archived: true }),
      ),
    );
    set((s) => ({
      courses: s.courses.map((c) =>
        courseIds.includes(c.id) ? { ...c, archived: true } : c,
      ),
      assignments: s.assignments.map((a) =>
        assignmentIds.includes(a.id) ? { ...a, archived: true } : a,
      ),
    }));
  },

  // ── Courses ──────────────────────────────────────────────────────────
  createCourse: async (data) => {
    const record = await pb
      .collection("courses")
      .create({ ...data, owner: owner(), archived: false });
    const course = mapCourse(record);
    set((s) => ({ courses: [...s.courses, course] }));
    return course;
  },

  updateCourse: async (id, data) => {
    const record = await pb.collection("courses").update(id, data);
    const course = mapCourse(record);
    set((s) => ({ courses: s.courses.map((c) => (c.id === id ? course : c)) }));
  },

  deleteCourse: async (id) => {
    await pb.collection("courses").delete(id);
    set((s) => ({
      courses: s.courses.filter((c) => c.id !== id),
      assignments: s.assignments.filter((a) => a.course !== id),
    }));
  },

  // ── Assignments ────────────────────────────────────────────────────────
  createAssignment: async (data) => {
    const record = await pb.collection("assignments").create({
      status: "todo",
      archived: false,
      estimatedMinutes: 0,
      ...data,
      owner: owner(),
    });
    const assignment = mapAssignment(record);
    set((s) => ({ assignments: [...s.assignments, assignment] }));
    return assignment;
  },

  updateAssignment: async (id, data) => {
    const record = await pb.collection("assignments").update(id, data);
    const assignment = mapAssignment(record);
    set((s) => ({
      assignments: s.assignments.map((a) => (a.id === id ? assignment : a)),
    }));
  },

  setStatus: async (id, status) => {
    const now = new Date().toISOString();
    const patch: Partial<Assignment> = { status };
    if (status === "in_progress") {
      const current = get().assignments.find((a) => a.id === id);
      if (!current?.startedAt) patch.startedAt = now;
    }
    patch.completedAt = status === "done" ? now : "";
    await get().updateAssignment(id, patch);
  },

  deleteAssignment: async (id) => {
    await pb.collection("assignments").delete(id);
    set((s) => ({
      assignments: s.assignments.filter((a) => a.id !== id),
      subtasks: s.subtasks.filter((st) => st.assignment !== id),
    }));
  },

  uploadAttachments: async (id, files) => {
    const form = new FormData();
    for (const file of files) form.append("attachments", file);
    const record = await pb.collection("assignments").update(id, form);
    const assignment = mapAssignment(record);
    set((s) => ({
      assignments: s.assignments.map((a) => (a.id === id ? assignment : a)),
    }));
  },

  removeAttachment: async (id, filename) => {
    const record = await pb
      .collection("assignments")
      .update(id, { "attachments-": [filename] });
    const assignment = mapAssignment(record);
    set((s) => ({
      assignments: s.assignments.map((a) => (a.id === id ? assignment : a)),
    }));
  },

  // ── Subtasks ─────────────────────────────────────────────────────────
  createSubtask: async (assignmentId, title, estimatedMinutes = 0) => {
    const position =
      get().subtasks.filter((s) => s.assignment === assignmentId).length;
    const record = await pb.collection("subtasks").create({
      owner: owner(),
      assignment: assignmentId,
      title,
      done: false,
      position,
      estimatedMinutes,
    });
    set((s) => ({ subtasks: [...s.subtasks, mapSubtask(record)] }));
  },

  updateSubtask: async (id, data) => {
    const record = await pb.collection("subtasks").update(id, data);
    const subtask = mapSubtask(record);
    set((s) => ({
      subtasks: s.subtasks.map((x) => (x.id === id ? subtask : x)),
    }));
  },

  toggleSubtask: async (id) => {
    const current = get().subtasks.find((s) => s.id === id);
    if (!current) return;
    await get().updateSubtask(id, { done: !current.done });
  },

  deleteSubtask: async (id) => {
    await pb.collection("subtasks").delete(id);
    set((s) => ({ subtasks: s.subtasks.filter((x) => x.id !== id) }));
  },
}));
