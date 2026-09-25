"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { BarChart3, Bell, ChevronDown, CircleUserRound, Menu, Search, Sparkles, X } from "lucide-react";
import type { ConnectedShellData } from "@/components/dashboard/DashboardShell";

type TopbarProps = {
  workspaceName: string;
  unread: number;
  onUnreadChange: (value: number) => void;
  onMenuOpen: () => void;
  connected?: ConnectedShellData;
  onNotify?: (message: string, tone?: "success" | "error" | "info") => void;
};

type InboxNotification = { id: string; title: string; body: string | null; href: string | null; readAt: string | null };

export default function Topbar({
  workspaceName,
  unread,
  onUnreadChange,
  onMenuOpen,
  connected,
  onNotify,
}: TopbarProps) {
  const router = useRouter();
  const menusRef = useRef<HTMLDivElement>(null);
  const mobileSearchTriggerRef = useRef<HTMLButtonElement>(null);
  const mobileSearchRef = useRef<HTMLInputElement>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [notifications, setNotifications] = useState<InboxNotification[]>([]);
  const [notificationError, setNotificationError] = useState("");
  const menuOpen = notificationsOpen || profileOpen || workspaceOpen || mobileSearchOpen;

  useEffect(() => {
    if (!connected) return;
    let active = true;
    fetch("/api/notifications", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Notifications could not be loaded.");
        return response.json();
      })
      .then((data: { notifications: InboxNotification[]; unread: number }) => {
        if (!active) return;
        setNotifications(data.notifications);
        onUnreadChange(data.unread);
        setNotificationError("");
      })
      .catch(() => {
        if (active) setNotificationError("Notifications could not be loaded.");
      });
    return () => {
      active = false;
    };
  }, [connected, onUnreadChange]);

  const markAllRead = async () => {
    if (connected) {
      try {
        const response = await fetch("/api/notifications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ all: true }),
        });
        if (!response.ok) throw new Error();
        setNotifications((current) => current.map((item) => ({ ...item, readAt: new Date().toISOString() })));
      } catch {
        setNotificationError("Could not mark notifications as read.");
        return;
      }
    }
    onUnreadChange(0);
  };

  const signOut = async () => {
    try {
      const response = await fetch("/api/auth/sign-out", { method: "POST" });
      if (!response.ok) throw new Error();
      router.replace("/sign-in");
      router.refresh();
    } catch {
      onNotify?.("Could not sign out. Please try again.", "error");
    }
  };

  useEffect(() => {
    if (mobileSearchOpen) mobileSearchRef.current?.focus();
  }, [mobileSearchOpen]);

  useEffect(() => {
    if (!menuOpen) return;

    const dismiss = (event: PointerEvent) => {
      if (!menusRef.current?.contains(event.target as Node)) {
        setNotificationsOpen(false);
        setProfileOpen(false);
        setWorkspaceOpen(false);
        setMobileSearchOpen(false);
      }
    };
    const dismissWithKeyboard = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (mobileSearchOpen) mobileSearchTriggerRef.current?.focus();
        setNotificationsOpen(false);
        setProfileOpen(false);
        setWorkspaceOpen(false);
        setMobileSearchOpen(false);
      }
    };

    document.addEventListener("pointerdown", dismiss);
    document.addEventListener("keydown", dismissWithKeyboard);
    return () => {
      document.removeEventListener("pointerdown", dismiss);
      document.removeEventListener("keydown", dismissWithKeyboard);
    };
  }, [menuOpen, mobileSearchOpen]);

  const navigateToSearch = () => {
    const query = search.trim();
    setMobileSearchOpen(false);
    router.push(query ? `/dashboard/overview?search=${encodeURIComponent(query)}` : "/dashboard/overview");
  };

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    navigateToSearch();
  };

  return (
    <header className="sticky top-0 z-30 flex h-[68px] items-center justify-between border-b border-slate-200/80 bg-[#f6f7fb]/90 px-4 backdrop-blur-xl sm:h-[76px] sm:px-8 lg:px-10">
      <div className="flex items-center gap-2 lg:hidden">
        <button
          type="button"
          onClick={onMenuOpen}
          aria-label="Open navigation"
          className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
        >
          <Menu size={19} />
        </button>
        <Link href="/dashboard/overview" aria-label="WorkforceOS overview" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-600 text-white">
            <Sparkles size={18} />
          </span>
          <span className="hidden font-bold min-[460px]:block">workforceOS</span>
        </Link>
      </div>

      <div ref={menusRef} className="contents">
        <div className="relative hidden lg:block">
          <button
            type="button"
            onClick={() => {
              setWorkspaceOpen((value) => !value);
              setNotificationsOpen(false);
              setProfileOpen(false);
              setMobileSearchOpen(false);
            }}
            aria-expanded={workspaceOpen}
            className="flex items-center gap-2 rounded-lg px-2 py-1 text-sm text-slate-400 transition hover:bg-white hover:text-slate-700"
          >
            <span>{workspaceName}</span>
            <ChevronDown size={15} />
          </button>
          {workspaceOpen && (
            <div className="absolute left-0 mt-3 w-52 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
              <Link
                href="/dashboard/settings"
                onClick={() => setWorkspaceOpen(false)}
                className="block w-full rounded-lg px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                {workspaceName} <span className="float-right text-indigo-600">Active</span>
              </Link>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <form
            onSubmit={submitSearch}
            role="search"
            className="hidden h-10 w-56 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-slate-400 md:flex xl:w-64"
          >
            <button
              type="submit"
              aria-label="Submit activity search"
              title="Search"
              className="shrink-0 transition hover:text-indigo-600 focus-visible:rounded focus-visible:ring-2 focus-visible:ring-indigo-200 focus-visible:outline-none"
            >
              <Search size={16} />
            </button>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(event) => {
                if (event.key !== "Enter") return;
                event.preventDefault();
                navigateToSearch();
              }}
              className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
              placeholder="Search activity..."
              aria-label="Search work activity"
            />
          </form>

          <button
            ref={mobileSearchTriggerRef}
            type="button"
            onClick={() => {
              setMobileSearchOpen((value) => !value);
              setNotificationsOpen(false);
              setProfileOpen(false);
              setWorkspaceOpen(false);
            }}
            aria-label="Search activity"
            aria-expanded={mobileSearchOpen}
            aria-controls="mobile-activity-search"
            className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:text-slate-900 md:hidden"
          >
            <Search size={18} />
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setNotificationsOpen((value) => !value);
                setProfileOpen(false);
                setWorkspaceOpen(false);
                setMobileSearchOpen(false);
              }}
              aria-label="Notifications"
              aria-expanded={notificationsOpen}
              className="relative grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:text-slate-900"
            >
              <Bell size={18} />
              {unread > 0 && (
                <span className="absolute top-2 right-2.5 h-1.5 w-1.5 rounded-full bg-rose-500 ring-2 ring-white" />
              )}
            </button>
            {notificationsOpen && (
              <div className="absolute right-0 mt-3 w-[min(288px,calc(100vw-24px))] rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl shadow-slate-300/50">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">Notifications</p>
                  <button
                    type="button"
                    onClick={markAllRead}
                    className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
                  >
                    Mark all read
                  </button>
                </div>
                {notificationError && (
                  <p role="alert" className="mt-3 text-xs text-rose-600">
                    {notificationError}
                  </p>
                )}
                {connected ? (
                  notifications.length ? (
                    notifications.slice(0, 5).map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setNotificationsOpen(false);
                          router.push(item.href?.startsWith("/dashboard/") ? item.href : "/dashboard/overview");
                        }}
                        className={`mt-3 w-full rounded-xl p-3 text-left text-xs leading-5 transition hover:bg-indigo-100 ${item.readAt ? "bg-slate-50" : "bg-indigo-50"}`}
                      >
                        <strong className="text-slate-800">{item.title}</strong>
                        {item.body && <span className="block text-slate-600">{item.body}</span>}
                      </button>
                    ))
                  ) : (
                    <p className="mt-3 text-xs text-slate-500">No notifications yet.</p>
                  )
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setNotificationsOpen(false);
                      router.push("/dashboard/employees/recruiter");
                    }}
                    className="mt-3 w-full rounded-xl bg-indigo-50 p-3 text-left text-xs leading-5 text-slate-600 transition hover:bg-indigo-100"
                  >
                    <strong className="text-slate-800">Maya needs your review.</strong>
                    <br />
                    Candidates are ready for approval.
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="relative border-l border-slate-200 pl-2 sm:pl-3">
            <button
              type="button"
              onClick={() => {
                setProfileOpen((value) => !value);
                setNotificationsOpen(false);
                setWorkspaceOpen(false);
                setMobileSearchOpen(false);
              }}
              aria-label="Open profile menu"
              aria-expanded={profileOpen}
              className="flex items-center gap-2 rounded-xl py-1 text-left transition hover:opacity-80"
            >
              <span className="grid h-9 w-9 place-items-center rounded-full bg-slate-900 text-xs font-bold text-white">
                {connected
                  ? connected.userName
                      .split(/\s+/)
                      .map((part) => part[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()
                  : "AP"}
              </span>
              <span className="hidden sm:block">
                <span className="block text-xs font-semibold">{connected?.userName ?? "Anubhav Pandey"}</span>
                <span className="block text-[10px] text-slate-400">{connected?.role ?? "Workspace admin"}</span>
              </span>
              <ChevronDown size={15} className="hidden text-slate-400 sm:block" />
            </button>
            {profileOpen && (
              <div className="absolute right-0 mt-3 w-48 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
                <Link
                  onClick={() => setProfileOpen(false)}
                  href="/dashboard/settings"
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  <CircleUserRound size={15} /> Profile preferences
                </Link>
                <Link
                  onClick={() => setProfileOpen(false)}
                  href="/dashboard/analytics"
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-500 hover:bg-slate-50"
                >
                  <BarChart3 size={15} /> Workspace analytics
                </Link>
                {connected && (
                  <button
                    type="button"
                    onClick={signOut}
                    className="w-full rounded-lg px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Sign out
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {mobileSearchOpen && (
          <form
            id="mobile-activity-search"
            role="search"
            onSubmit={submitSearch}
            className="absolute inset-x-3 top-full z-50 mt-2 flex h-12 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-slate-500 shadow-xl md:hidden"
          >
            <Search size={17} className="shrink-0" />
            <input
              ref={mobileSearchRef}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Search work activity"
              placeholder="Search activity..."
              className="min-w-0 flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
            />
            <button type="submit" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800">
              Search
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileSearchOpen(false);
                mobileSearchTriggerRef.current?.focus();
              }}
              aria-label="Close search"
              className="grid h-7 w-7 place-items-center rounded-lg hover:bg-slate-100"
            >
              <X size={16} />
            </button>
          </form>
        )}
      </div>
    </header>
  );
}
