import type { MetadataRoute } from "next";
import { getAppUrl } from "@/lib/env";

const routes = [
  "/",
  "/dashboard",
  "/dashboard/overview",
  "/dashboard/employees",
  "/dashboard/employees/recruiter",
  "/dashboard/workflows",
  "/dashboard/analytics",
  "/dashboard/settings",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getAppUrl();
  return routes.map((route) => ({
    url: new URL(route, baseUrl).toString(),
    changeFrequency: route.includes("dashboard") ? "weekly" : "monthly",
    priority: route === "/" ? 1 : 0.8,
  }));
}
