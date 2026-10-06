"use client";
/**
 * Navigation adapter for the single-file preview. The view lives in a bare #token (the only
 * URL state a hosted single page can carry); query state lives in memory.
 */
import { useCallback, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { NavContext, mergeParams, type NavApi, type ParamPatch, type View } from "@/lib/nav";
import { useHydrated } from "@/lib/use-hydrated";

const VIEWS: View[] = ["overview", "schedule", "speakers", "explore", "my-schedule"];
const HASH_EVENT = "hitex:hash";
const readView = (): View => {
  const h = window.location.hash.replace(/^#/, "") as View;
  return VIEWS.includes(h) ? h : "overview";
};
const subscribe = (cb: () => void) => {
  window.addEventListener("hashchange", cb);
  window.addEventListener(HASH_EVENT, cb);
  return () => { window.removeEventListener("hashchange", cb); window.removeEventListener(HASH_EVENT, cb); };
};

export function MemoryNavProvider({ children }: { children: ReactNode }) {
  const view = useSyncExternalStore(subscribe, readView, () => "overview" as View);
  const ready = useHydrated();
  const [params, setParams] = useState(() => new URLSearchParams());
  const lastDay = useRef<string | null>(null);

  const go = useCallback<NavApi["go"]>((v, p = {}) => {
    const base = new URLSearchParams();
    const carry = params.get("day") ?? lastDay.current;
    if (carry && (v === "schedule" || v === "explore") && !("day" in p)) base.set("day", carry);
    const next = mergeParams(base, p);
    if (next.get("day")) lastDay.current = next.get("day");
    setParams(next);
    if (v !== view) window.scrollTo({ top: 0 });
    try { history.replaceState(null, "", v === "overview" ? window.location.pathname + window.location.search : `#${v}`); } catch {}
    window.dispatchEvent(new Event(HASH_EVENT));
  }, [params, view]);

  const set = useCallback<NavApi["set"]>((patch) => {
    setParams((prev) => {
      const next = mergeParams(prev, patch);
      if (next.get("day")) lastDay.current = next.get("day");
      return next;
    });
  }, []);
  const href = useCallback((v: View, _p?: ParamPatch) => (v === "overview" ? "#" : `#${v}`), []);

  const value = useMemo<NavApi>(() => ({ view, params, ready, go, set, href }), [view, params, ready, go, set, href]);
  return <NavContext.Provider value={value}>{children}</NavContext.Provider>;
}
