import { BarChart3, Bot, LayoutDashboard, Workflow, type LucideIcon } from "lucide-react";

export type DashboardNavigationItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  count?: string;
};

export const dashboardNavigation: DashboardNavigationItem[] = [
  { label: "Overview", href: "/dashboard/overview", icon: LayoutDashboard },
  { label: "AI Employees", href: "/dashboard/employees", icon: Bot, count: "3" },
  { label: "Workflows", href: "/dashboard/workflows", icon: Workflow },
  { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
];

export function isDashboardRouteActive(pathname: string, href: string) {
  if (href === "/dashboard/overview") {
    return pathname === "/dashboard" || pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}
