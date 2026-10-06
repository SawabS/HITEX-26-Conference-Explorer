import type { Metadata, Viewport } from "next";
import { GeistMono } from "geist/font/mono";
import type { ReactNode } from "react";
import { AppShell } from "@/components/conference/app-shell";
import { AppProviders } from "@/components/providers/app-providers";
import { NextNavProvider } from "@/components/providers/next-nav";
import "@fontsource-variable/outfit";
import "@fontsource-variable/plus-jakarta-sans";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "HITEX 2026 Conference Explorer", template: "%s · HITEX 2026 Explorer" },
  description:
    "Interactive explorer for the HITEX 2026 conference programme in Erbil, October 6–9: proportional timeline, speakers, themes, relationships and a personal planner.",
  applicationName: "HITEX 2026 Explorer",
  openGraph: { title: "HITEX 2026 Conference Explorer", type: "website" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0b0b15",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={GeistMono.variable} style={{ colorScheme: "dark" }}>
      <body>
        <AppProviders>
          <NextNavProvider>
            <AppShell>{children}</AppShell>
          </NextNavProvider>
        </AppProviders>
      </body>
    </html>
  );
}
