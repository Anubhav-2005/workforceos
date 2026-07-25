"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Bell, ChevronDown, CircleUserRound, Menu, Search, Sparkles } from "lucide-react";

type TopbarProps = {
  unread: number;
  onUnreadChange: (value: number) => void;
  onMenuOpen: () => void;
  onNotify: (message: string) => void;
};

export default function Topbar({ unread, onUnreadChange, onMenuOpen, onNotify }: TopbarProps) {
  const router = useRouter();
  const menusRef = useRef<HTMLDivElement>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [search, setSearch] = useState("");
  const menuOpen = notificationsOpen || profileOpen || workspaceOpen;

  useEffect(() => {
    if (!menuOpen) return;

    const dismiss = (event: PointerEvent) => {
      if (!menusRef.current?.contains(event.target as Node)) {
        setNotificationsOpen(false);
        setProfileOpen(false);
        setWorkspaceOpen(false);
      }
    };
    const dismissWithKeyboard = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setNotificationsOpen(false);
        setProfileOpen(false);
        setWorkspaceOpen(false);
      }
    };

    document.addEventListener("pointerdown", dismiss);
    document.addEventListener("keydown", dismissWithKeyboard);
    return () => {
      document.removeEventListener("pointerdown", dismiss);
      document.removeEventListener("keydown", dismissWithKeyboard);
    };
  }, [menuOpen]);

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = search.trim();
    router.push(query ? `/dashboard/overview?search=${encodeURIComponent(query)}` : "/dashboard/overview");
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
        <Link href="/dashboard/overview" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-600 text-white">
            <Sparkles size={18} />
          </span>
          <span className="hidden font-bold min-[375px]:block">workforceOS</span>
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
            }}
            aria-expanded={workspaceOpen}
            className="flex items-center gap-2 rounded-lg px-2 py-1 text-sm text-slate-400 transition hover:bg-white hover:text-slate-700"
          >
            <span>Acme Studio</span>
            <ChevronDown size={15} />
          </button>
          {workspaceOpen && (
            <div className="absolute left-0 mt-3 w-52 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
              <button
                type="button"
                onClick={() => {
                  setWorkspaceOpen(false);
                  onNotify("Acme Studio is the active workspace.");
                }}
                className="w-full rounded-lg px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Acme Studio <span className="float-right text-indigo-600">Active</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setWorkspaceOpen(false);
                  onNotify("Workspace switching is available locally in this MVP.");
                }}
                className="w-full rounded-lg px-3 py-2 text-left text-xs font-medium text-slate-500 hover:bg-slate-50"
              >
                Switch workspace
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <form
            onSubmit={submitSearch}
            className="hidden h-10 w-56 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-slate-400 md:flex xl:w-64"
          >
            <Search size={16} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
              placeholder="Search activity..."
              aria-label="Search work activity"
            />
          </form>

          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setNotificationsOpen((value) => !value);
                setProfileOpen(false);
                setWorkspaceOpen(false);
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
                    onClick={() => onUnreadChange(0)}
                    className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
                  >
                    Mark all read
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setNotificationsOpen(false);
                    router.push("/dashboard/employees/recruiter");
                  }}
                  className="mt-3 w-full rounded-xl bg-indigo-50 p-3 text-left text-xs leading-5 text-slate-600 transition hover:bg-indigo-100"
                >
                  <strong className="text-slate-800">Maya needs your review.</strong>
                  <br />6 candidates are ready for approval.
                </button>
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
              }}
              aria-label="Open profile menu"
              aria-expanded={profileOpen}
              className="flex items-center gap-2 rounded-xl py-1 text-left transition hover:opacity-80"
            >
              <span className="grid h-9 w-9 place-items-center rounded-full bg-slate-900 text-xs font-bold text-white">
                AP
              </span>
              <span className="hidden sm:block">
                <span className="block text-xs font-semibold">Anubhav Pandey</span>
                <span className="block text-[10px] text-slate-400">Workspace admin</span>
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
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false);
                    onNotify("You are already using the local MVP workspace.");
                  }}
                  className="w-full rounded-lg px-3 py-2 text-left text-xs font-medium text-slate-500 hover:bg-slate-50"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
