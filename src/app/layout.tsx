import type { Metadata } from "next";
import { getAppUrl } from "@/lib/env";
import "./globals.css";

const title = "WorkforceOS — Your AI workforce, in sync";
const description =
  "Recruit, automate, and coordinate an AI workforce with human approvals, live workflows, and clear performance insights.";

export const metadata: Metadata = {
  metadataBase: getAppUrl(),
  title: {
    default: title,
    template: "%s | WorkforceOS",
  },
  description,
  applicationName: "WorkforceOS",
  authors: [{ name: "WorkforceOS" }],
  creator: "WorkforceOS",
  category: "productivity",
  keywords: ["AI workforce", "AI employees", "workflow automation", "AI recruiter", "human approval"],
  manifest: "/manifest.webmanifest",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "WorkforceOS",
    title,
    description,
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "WorkforceOS AI collaboration workflow" }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/og.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
