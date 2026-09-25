"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type FormEvent,
  type ReactNode,
  type SetStateAction,
} from "react";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { agents, initialWorkItems, isWorkItemList, type WorkItem } from "@/lib/dashboard-data";
import { useLocalStorageState } from "@/lib/useLocalStorageState";
import Sidebar from "@/components/dashboard/Sidebar";
import TaskModal from "@/components/dashboard/TaskModal";
import Toast from "@/components/dashboard/Toast";
import Topbar from "@/components/dashboard/Topbar";
import {
  defaultWorkspaceSettings,
  isWorkspaceSettings,
  type TaskDraft,
  type WorkspaceSettings,
} from "@/components/dashboard/shell-types";

type DashboardContextValue = {
  tasks: WorkItem[];
  settings: WorkspaceSettings;
  settingsHydrated: boolean;
  setSettings: Dispatch<SetStateAction<WorkspaceSettings>>;
  openTaskModal: (prefill?: Partial<TaskDraft>) => void;
  notify: (message: string, tone?: ToastTone) => void;
  connected: boolean;
  workspaceRole?: string;
};

export type ConnectedShellData = {
  userName: string;
  role: string;
  workspaceName: string;
  employees: { id: string; name: string; role: string }[];
};

export type ToastTone = "success" | "error" | "info";

type ToastState = {
  message: string;
  tone: ToastTone;
};

const DashboardContext = createContext<DashboardContextValue | null>(null);
const tasksStorageKey = "workforceos-work-items";
const settingsStorageKey = "workforceos-settings";
const blankTask: TaskDraft = { name: "", assignTo: "recruiter", priority: "Medium", description: "" };

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) throw new Error("useDashboard must be used inside DashboardShell");
  return context;
}

export default function DashboardShell({
  children,
  connected,
}: {
  children: ReactNode;
  connected?: ConnectedShellData;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const toastTimer = useRef<number | null>(null);
  const [tasks, setTasks] = useLocalStorageState<WorkItem[]>(tasksStorageKey, initialWorkItems, {
    validate: isWorkItemList,
  });
  const [settings, setSettings, settingsHydrated] = useLocalStorageState<WorkspaceSettings>(
    settingsStorageKey,
    defaultWorkspaceSettings,
    { validate: isWorkspaceSettings },
  );
  const [draft, setDraft] = useState<TaskDraft>(blankTask);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [unread, setUnread] = useState(connected ? 0 : 1);

  const dismissToast = useCallback(() => {
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = null;
    setToast(null);
  }, []);

  const notify = useCallback((message: string, tone: ToastTone = "success") => {
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    setToast({ message, tone });
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

  const openTaskModal = useCallback(
    (prefill: Partial<TaskDraft> = {}) => {
      setDraft({ ...blankTask, assignTo: connected?.employees[0]?.id ?? blankTask.assignTo, ...prefill });
      setTaskModalOpen(true);
    },
    [connected],
  );

  const closeTaskModal = useCallback(() => setTaskModalOpen(false), []);
  const closeMobileNavigation = useCallback(() => setMobileNavigationOpen(false), []);
  const openMobileNavigation = useCallback(() => setMobileNavigationOpen(true), []);

  const createTask = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const taskName = draft.name.trim();
      if (connected) {
        if (!taskName || !draft.assignTo) return;
        try {
          const response = await fetch("/api/tasks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: taskName,
              assignedEmployeeId: draft.assignTo,
              priority: draft.priority,
              description: draft.description,
            }),
          });
          const result = await response.json();
          if (!response.ok) throw new Error(result.error || "Could not create the task.");
          closeTaskModal();
          setDraft(blankTask);
          window.dispatchEvent(new Event("workforceos:task-created"));
          notify(`${taskName} is queued. Open Tasks to run it.`);
          router.refresh();
        } catch (error) {
          notify(error instanceof Error ? error.message : "Could not create the task.", "error");
        }
        return;
      }
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
    [closeTaskModal, connected, draft, notify, router, setTasks],
  );

  const contextValue = useMemo(
    () => ({
      tasks: connected ? [] : tasks,
      settings: connected ? { ...settings, workspaceName: connected.workspaceName } : settings,
      settingsHydrated: connected ? true : settingsHydrated,
      setSettings,
      openTaskModal,
      notify,
      connected: Boolean(connected),
      workspaceRole: connected?.role,
    }),
    [connected, notify, openTaskModal, setSettings, settings, settingsHydrated, tasks],
  );

  return (
    <DashboardContext.Provider value={contextValue}>
      <main className="min-h-screen bg-[#f6f7fb] text-slate-950">
        <Sidebar
          pathname={pathname}
          mobileOpen={mobileNavigationOpen}
          onClose={closeMobileNavigation}
          onNewWork={() => openTaskModal()}
          onNotify={notify}
          connected={Boolean(connected)}
        />

        <section className="min-w-0 lg:pl-[252px]">
          <Topbar
            workspaceName={connected?.workspaceName ?? settings.workspaceName}
            connected={connected}
            unread={unread}
            onUnreadChange={setUnread}
            onMenuOpen={openMobileNavigation}
            onNotify={notify}
          />
          {children}
        </section>

        {taskModalOpen && (
          <TaskModal
            draft={draft}
            setDraft={setDraft}
            onClose={closeTaskModal}
            onSubmit={createTask}
            employees={connected?.employees}
          />
        )}
        {toast && <Toast message={toast.message} tone={toast.tone} onDismiss={dismissToast} />}
      </main>
    </DashboardContext.Provider>
  );
}
