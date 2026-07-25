import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "WorkforceOS",
    short_name: "WorkforceOS",
    description: "The operating system for an AI workforce that works together.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#f6f7fb",
    theme_color: "#4f46e5",
    icons: [{ src: "/favicon.ico", sizes: "any", type: "image/x-icon" }],
  };
}
