"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Settings, Sparkles, Users, X, Zap } from "lucide-react";
import { dashboardNavigation, isDashboardRouteActive } from "@/constants/navigation";

type SidebarProps = {
  pathname: string;
  mobileOpen: boolean;
  onClose: () => void;
  onNewWork: () => void;
  onNotify: (message: string) => void;
};

export default function Sidebar({ pathname, mobileOpen, onClose, onNewWork, onNotify }: SidebarProps) {
  useEffect(() => {
    if (!mobileOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeWithKeyboard = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", closeWithKeyboard);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeWithKeyboard);
    };
  }, [mobileOpen, onClose]);

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-[252px] flex-col border-r border-slate-200 bg-white px-4 py-5 lg:flex">
        <SidebarContent pathname={pathname} onNavigate={onClose} onNewWork={onNewWork} onNotify={onNotify} />
      </aside>

      <div
        aria-hidden={!mobileOpen}
        className={`fixed inset-0 z-40 bg-slate-950/25 backdrop-blur-sm transition-opacity lg:hidden ${
          mobileOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) onClose();
        }}
      >
        <aside
          aria-label="Mobile dashboard navigation"
          aria-hidden={!mobileOpen}
          className={`flex h-full w-[min(292px,88vw)] flex-col bg-white px-4 py-5 shadow-2xl transition-transform duration-200 ${
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="absolute top-5 right-4 grid h-9 w-9 place-items-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <X size={18} />
          </button>
          <SidebarContent
            pathname={pathname}
            onNavigate={onClose}
            onNewWork={() => {
              onClose();
              onNewWork();
            }}
            onNotify={onNotify}
          />
        </aside>
      </div>
    </>
  );
}

function SidebarContent({
  pathname,
  onNavigate,
  onNewWork,
  onNotify,
}: Omit<SidebarProps, "mobileOpen" | "onClose"> & { onNavigate: () => void }) {
  return (
    <>
      <Link
        href="/dashboard/overview"
        onClick={onNavigate}
        className="flex items-center gap-3 px-2"
        aria-label="WorkforceOS overview"
      >
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#4f46e5] text-white shadow-lg shadow-indigo-200">
          <Sparkles size={18} strokeWidth={2.7} />
        </span>
        <span className="text-lg font-bold tracking-[-0.04em]">
          workforce<span className="text-indigo-600">OS</span>
        </span>
      </Link>

      <button
        type="button"
        onClick={onNewWork}
        className="mt-8 flex h-11 items-center justify-center gap-2 rounded-xl bg-[#171b31] text-sm font-semibold text-white shadow-xl shadow-slate-200 transition hover:bg-slate-800 active:translate-y-px"
      >
        <span className="text-lg leading-none">+</span> New work
      </button>

      <nav className="mt-7 space-y-1.5" aria-label="Dashboard navigation">
        <p className="px-3 pb-2 text-[10px] font-bold tracking-[0.16em] text-slate-400 uppercase">Workspace</p>
        {dashboardNavigation.map((item) => {
          const Icon = item.icon;
          const active = isDashboardRouteActive(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                active ? "bg-indigo-50 text-indigo-700" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Icon size={18} strokeWidth={active ? 2.5 : 2} />
              <span>{item.label}</span>
              {item.count && (
                <span className="ml-auto rounded-md bg-indigo-100 px-1.5 py-0.5 text-[10px] font-bold text-indigo-700">
                  {item.count}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-8 border-t border-slate-100 pt-6">
        <p className="px-3 pb-2 text-[10px] font-bold tracking-[0.16em] text-slate-400 uppercase">Manage</p>
        <button
          type="button"
          onClick={() => onNotify("Your local team has 4 active members.")}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
        >
          <Users size={18} /> Team
        </button>
        <Link
          href="/dashboard/settings"
          onClick={onNavigate}
          aria-current={pathname === "/dashboard/settings" ? "page" : undefined}
          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
            pathname === "/dashboard/settings"
              ? "bg-indigo-50 text-indigo-700"
              : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
          }`}
        >
          <Settings size={18} /> Settings
        </Link>
      </div>

      <div className="mt-auto rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 p-4 text-white shadow-lg shadow-indigo-100">
        <Zap size={18} className="mb-3 text-indigo-100" />
        <p className="text-sm font-bold">Your workforce is active</p>
        <p className="mt-1 text-xs leading-5 text-indigo-100">72 tasks automated this week.</p>
        <Link
          href="/dashboard/analytics"
          onClick={onNavigate}
          className="mt-3 inline-block text-xs font-semibold underline underline-offset-4 transition hover:text-indigo-100"
        >
          View weekly report
        </Link>
      </div>
    </>
  );
}
