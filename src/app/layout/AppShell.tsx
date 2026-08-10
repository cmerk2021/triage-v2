import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";
import { MobileHeader } from "./MobileHeader";
import { ToastViewport } from "./ToastViewport";
import { useGlobalShortcuts } from "../useShortcuts";
import { CommandPalette } from "@/features/search/CommandPalette";
import { QuickAddDialog } from "@/features/assignments/QuickAddDialog";
import { AssignmentDetail } from "@/features/assignments/AssignmentDetail";
import { CourseEditor } from "@/features/courses/CourseEditor";
import { NotificationScheduler } from "@/features/notifications/NotificationScheduler";
import { InstallPrompt } from "@/features/pwa/InstallPrompt";

export function AppShell({ children }: { children: ReactNode }) {
  useGlobalShortcuts();

  return (
    <div className="flex h-full">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileHeader />
        <main className="scrollbar-thin flex-1 overflow-y-auto pb-24 md:pb-0">
          <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 md:py-10">
            {children}
          </div>
        </main>
      </div>

      <MobileNav />
      <CommandPalette />
      <QuickAddDialog />
      <AssignmentDetail />
      <CourseEditor />
      <ToastViewport />
      <NotificationScheduler />
      <InstallPrompt />
    </div>
  );
}
