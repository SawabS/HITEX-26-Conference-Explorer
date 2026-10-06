"use client";
/**
 * Navigation contract shared by every view. Two adapters implement it:
 *  - components/providers/next-nav.tsx: Next.js App Router (real URLs, deep links)
 *  - preview/memory-nav.tsx: in-memory state for the single-file preview build
 * Views never import next/navigation directly.
 */
import { createContext, useCallback, useContext, useMemo } from "react";
import { days } from "./data";
import { erbilNow } from "./format";

export type View = "overview" | "schedule" | "speakers" | "explore" | "my-schedule";
export type ParamPatch = Record<string, string | undefined | null>;

export type NavApi = {
  view: View;
  params: URLSearchParams;
  /** False during server render and the first client render; URL state is applied after mount. */
  ready: boolean;
  /** Navigate to a view; params replace the current query (day is carried over unless overridden). */
  go: (view: View, params?: ParamPatch, opts?: { replace?: boolean }) => void;
  /** Patch the current view's query parameters. */
  set: (patch: ParamPatch, opts?: { replace?: boolean }) => void;
  href: (view: View, params?: ParamPatch) => string;
};

export const VIEW_PATH: Record<View, string> = {
  overview: "/",
  schedule: "/schedule",
  speakers: "/speakers",
  explore: "/explore",
  "my-schedule": "/my-schedule",
};

export const pathToView = (path: string): View => {
  const p = path.replace(/\/+$/, "") || "/";
  const hit = (Object.entries(VIEW_PATH) as [View, string][]).find(([, v]) => v === p);
  return hit ? hit[0] : "overview";
};

export const NavContext = createContext<NavApi | null>(null);

export function useNav(): NavApi {
  const ctx = useContext(NavContext);
  if (!ctx) throw new Error("useNav must be used inside a navigation provider");
  return ctx;
}

export const mergeParams = (base: URLSearchParams, patch: ParamPatch) => {
  const next = new URLSearchParams(base);
  for (const [k, v] of Object.entries(patch)) {
    if (v === undefined || v === null || v === "") next.delete(k);
    else next.set(k, v);
  }
  return next;
};

/**
 * Day shown by default: during the conference, the first day from today that has timed
 * sessions (on opening day that is Oct 7); outside the conference, the Technology day.
 */
export const defaultDay = () => {
  const today = erbilNow().date;
  if (today < days[0].date || today > days[days.length - 1].date) return "2026-10-08";
  const next = days.find((d) => d.date >= today && d.track !== "opening");
  return next?.date ?? "2026-10-08";
};

export function useDay(): [string, (d: string) => void] {
  const { params, set, ready } = useNav();
  const raw = params.get("day");
  const day = raw && days.some((d) => d.date === raw) ? raw : ready ? defaultDay() : "2026-10-08";
  const setDay = useCallback((d: string) => set({ day: d, session: undefined, at: undefined }, { replace: true }), [set]);
  return useMemo(() => [day, setDay], [day, setDay]);
}

/** Open a session or speaker sheet on top of whatever view is active. */
export function useDetail() {
  const { set, params } = useNav();
  return useMemo(
    () => ({
      session: params.get("session"),
      speaker: params.get("speaker"),
      openSession: (slug: string) => set({ session: slug, speaker: undefined }),
      openSpeaker: (slug: string) => set({ speaker: slug, session: undefined }),
      close: () => set({ session: undefined, speaker: undefined }),
    }),
    [params, set],
  );
}
