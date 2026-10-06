"use client";
import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";
import { PlannerProvider } from "@/lib/planner";

/** Providers shared by the Next.js app and the single-file preview. */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <PlannerProvider>{children}</PlannerProvider>
    </MotionConfig>
  );
}
