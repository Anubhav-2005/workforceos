"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { agents, initialWorkItems, isWorkItemList, type WorkItem } from "@/lib/dashboard-data";
import { useLocalStorageState } from "@/lib/useLocalStorageState";
import Sidebar from "@/components/dashboard/Sidebar";
import TaskModal from "@/components/dashboard/TaskModal";
import Toast from "@/components/dashboard/Toast";
import Topbar from "@/components/dashboard/Topbar";
import type { TaskDraft } from "@/components/dashboard/shell-types";

type DashboardContextValue = {
  tasks: WorkItem[];
  openTaskModal: (prefill?: Partial<TaskDraft>) => void;
  notify: (message: string) => void;
};

const DashboardContext = createContext<DashboardContextValue | null>(null);
const tasksStorageKey = "workforceos-work-items";
const blankTask: TaskDraft = { name: "", assignTo: "recruiter", priority: "Medium", description: "" };

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) throw new Error("useDashboard must be used inside DashboardShell");
  return context;
}

export default function DashboardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const toastTimer = useRef<number | null>(null);
  const [tasks, setTasks] = useLocalStorageState<WorkItem[]>(tasksStorageKey, initialWorkItems, {
    validate: isWorkItemList,
  });
  const [draft, setDraft] = useState<TaskDraft>(blankTask);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [unread, setUnread] = useState(1);

  const dismissToast = useCallback(() => {
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = null;
    setToast(null);
  }, []);

  const notify = useCallback((message: string) => {
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = window.setTimeout(() => {
      setToast(null);
      toastTimer.current = null;
    }, 2_800);
  }, []);

  useEffect(
    () => () => {
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
    },
    [],
  );

  const openTaskModal = useCallback((prefill: Partial<TaskDraft> = {}) => {
    setDraft({ ...blankTask, ...prefill });
    setTaskModalOpen(true);
  }, []);

  const closeTaskModal = useCallback(() => setTaskModalOpen(false), []);
  const closeMobileNavigation = useCallback(() => setMobileNavigationOpen(false), []);
  const openMobileNavigation = useCallback(() => setMobileNavigationOpen(true), []);

  const createTask = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const taskName = draft.name.trim();
      const assignee = agents.find((agent) => agent.id === draft.assignTo);
      if (!assignee || !taskName) return;

      setTasks((current) => [
        {
          id: crypto.randomUUID(),
          agent: assignee.name,
          action: `Started “${taskName}” (${draft.priority.toLowerCase()} priority)`,
          time: "Just now",
          tone: assignee.id === "recruiter" ? "violet" : assignee.id === "theo" ? "amber" : "cyan",
        },
        ...current,
      ]);
      closeTaskModal();
      setDraft(blankTask);
      notify(`${taskName} has been assigned to ${assignee.name}.`);
    },
    [closeTaskModal, draft, notify, setTasks],
  );

  const contextValue = useMemo(() => ({ tasks, openTaskModal, notify }), [notify, openTaskModal, tasks]);

  return (
    <DashboardContext.Provider value={contextValue}>
      <main className="min-h-screen bg-[#f6f7fb] text-slate-950">
        <Sidebar
          pathname={pathname}
          mobileOpen={mobileNavigationOpen}
          onClose={closeMobileNavigation}
          onNewWork={() => openTaskModal()}
          onNotify={notify}
        />

        <section className="min-w-0 lg:pl-[252px]">
          <Topbar unread={unread} onUnreadChange={setUnread} onMenuOpen={openMobileNavigation} onNotify={notify} />
          {children}
        </section>

        {taskModalOpen && (
          <TaskModal draft={draft} setDraft={setDraft} onClose={closeTaskModal} onSubmit={createTask} />
        )}
        {toast && <Toast message={toast} onDismiss={dismissToast} />}
      </main>
    </DashboardContext.Provider>
  );
}
