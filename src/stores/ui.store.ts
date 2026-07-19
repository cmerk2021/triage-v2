import { create } from "zustand";

export interface Toast {
  id: string;
  message: string;
  tone: "neutral" | "success" | "danger";
}

interface UIState {
  commandOpen: boolean;
  quickAddOpen: boolean;
  detailAssignmentId: string | null;
  detailCourseId: string | null;
  courseCreating: boolean;
  toasts: Toast[];
  openCommand: () => void;
  closeCommand: () => void;
  toggleCommand: () => void;
  openQuickAdd: () => void;
  closeQuickAdd: () => void;
  openAssignment: (id: string) => void;
  closeAssignment: () => void;
  openCourse: (id: string) => void;
  closeCourse: () => void;
  openNewCourse: () => void;
  toast: (message: string, tone?: Toast["tone"]) => void;
  dismissToast: (id: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  commandOpen: false,
  quickAddOpen: false,
  detailAssignmentId: null,
  detailCourseId: null,
  courseCreating: false,
  toasts: [],

  openCommand: () => set({ commandOpen: true }),
  closeCommand: () => set({ commandOpen: false }),
  toggleCommand: () => set((s) => ({ commandOpen: !s.commandOpen })),

  openQuickAdd: () => set({ quickAddOpen: true }),
  closeQuickAdd: () => set({ quickAddOpen: false }),

  openAssignment: (id) => set({ detailAssignmentId: id }),
  closeAssignment: () => set({ detailAssignmentId: null }),
  openCourse: (id) => set({ detailCourseId: id, courseCreating: false }),
  closeCourse: () => set({ detailCourseId: null, courseCreating: false }),
  openNewCourse: () => set({ courseCreating: true, detailCourseId: null }),

  toast: (message, tone = "neutral") => {
    const id = Math.random().toString(36).slice(2, 9);
    set((s) => ({ toasts: [...s.toasts, { id, message, tone }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 3200);
  },

  dismissToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
