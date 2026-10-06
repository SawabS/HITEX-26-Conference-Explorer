"use client";
/**
 * Next.js navigation adapter.
 * View changes go through the App Router (real routes: /schedule, /speakers…).
 * Query-state changes (day, session, topic…) use the native History API, which the
 * App Router integrates with, so they never trigger a server round trip.
 * Query params are read from window.location through useSyncExternalStore instead of
 * useSearchParams, so every route stays statically pre-rendered (no CSR bailout).
 */
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useMemo, useSyncExternalStore, type ReactNode } from "react";
import { NavContext, VIEW_PATH, mergeParams, pathToView, type NavApi, type ParamPatch, type View } from "@/lib/nav";
import { useHydrated } from "@/lib/use-hydrated";

import { BASE_PATH } from "@/lib/base-path";

const DAY_KEY = "hitex-explorer:last-day";
const NAV_EVENT = "hitex:navigate";

const subscribe = (cb: () => void) => {
  window.addEventListener("popstate", cb);
  window.addEventListener(NAV_EVENT, cb);
  return () => {
    window.removeEventListener("popstate", cb);
    window.removeEventListener(NAV_EVENT, cb);
  };
};

const rememberDay = (qs: URLSearchParams) => {
  const d = qs.get("day");
  if (d) try { sessionStorage.setItem(DAY_KEY, d); } catch {}
};
const lastDay = () => { try { return sessionStorage.getItem(DAY_KEY); } catch { return null; } };

export function NextNavProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const view = pathToView(pathname);
  const ready = useHydrated();
  // Re-read on every pathname change as well (router navigations update location first).
  const search = useSyncExternalStore(subscribe, () => window.location.search, () => "");
  const params = useMemo(() => new URLSearchParams(search), [search, pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  const href = useCallback((v: View, p: ParamPatch = {}) => {
    const base = new URLSearchParams();
    const carry = params.get("day") ?? (ready ? lastDay() : null);
    if (carry && (v === "schedule" || v === "explore") && !("day" in p)) base.set("day", carry);
    const qs = mergeParams(base, p).toString();
    return `${BASE_PATH}${VIEW_PATH[v]}${v === "overview" ? "" : "/"}${qs ? `?${qs}` : ""}`;
  }, [params, ready]);

  const go = useCallback<NavApi["go"]>((v, p = {}, opts) => {
    const url = href(v, p);
    rememberDay(new URLSearchParams(url.split("?")[1] ?? ""));
    if (v === view) {
      window.history[opts?.replace ? "replaceState" : "pushState"](null, "", url);
      window.dispatchEvent(new Event(NAV_EVENT));
      return;
    }
    if (opts?.replace) router.replace(url.slice(BASE_PATH.length));
    else router.push(url.slice(BASE_PATH.length));
  }, [href, router, view]);

  const set = useCallback<NavApi["set"]>((patch, opts) => {
    const next = mergeParams(new URLSearchParams(window.location.search), patch);
    rememberDay(next);
    const qs = next.toString();
    window.history[opts?.replace ? "replaceState" : "pushState"](null, "", `${BASE_PATH}${VIEW_PATH[view]}${view === "overview" ? "" : "/"}${qs ? `?${qs}` : ""}`);
    window.dispatchEvent(new Event(NAV_EVENT));
  }, [view]);

  const value = useMemo<NavApi>(() => ({ view, params, ready, go, set, href }), [view, params, ready, go, set, href]);
  return <NavContext.Provider value={value}>{children}</NavContext.Provider>;
}
