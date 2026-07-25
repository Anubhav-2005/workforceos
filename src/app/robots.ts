import type { MetadataRoute } from "next";
import { getAppUrl } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getAppUrl();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/api/",
    },
    sitemap: new URL("/sitemap.xml", baseUrl).toString(),
  };
}
