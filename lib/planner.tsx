"use client";
import { createContext, useContext, useMemo, useSyncExternalStore, type ReactNode } from "react";
import { sessionById } from "./data";
import { toMinutes } from "./format";
import { useHydrated } from "./use-hydrated";
import type { Session } from "@/types";

const KEY = "hitex-explorer:planner:v1";
const EMPTY: string[] = [];

/** Bookmarks live in localStorage; this tiny external store keeps tabs and components in sync. */
const store = (() => {
  let cache: string[] | null = null;
  const listeners = new Set<() => void>();
  const read = (): string[] => {
    try {
      const raw = localStorage.getItem(KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed.filter((id: string) => sessionById.has(id)) : [];
    } catch {
      return [];
    }
  };
  const emit = () => listeners.forEach((l) => l());
  return {
    get: () => (cache ??= read()),
    set: (next: string[]) => {
      cache = next;
      try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
      emit();
    },
    subscribe: (l: () => void) => {
      listeners.add(l);
      const onStorage = (e: StorageEvent) => { if (e.key === KEY) { cache = null; emit(); } };
      window.addEventListener("storage", onStorage);
      return () => { listeners.delete(l); window.removeEventListener("storage", onStorage); };
    },
  };
})();

type PlannerApi = {
  ids: string[];
  ready: boolean;
  has: (id: string) => boolean;
  toggle: (id: string) => void;
  add: (ids: string[]) => void;
  remove: (id: string) => void;
  clear: () => void;
};

const PlannerContext = createContext<PlannerApi | null>(null);

export function PlannerProvider({ children }: { children: ReactNode }) {
  const ids = useSyncExternalStore(store.subscribe, store.get, () => EMPTY);
  const ready = useHydrated();
  const api = useMemo<PlannerApi>(() => ({
    ids,
    ready,
    has: (id) => ids.includes(id),
    toggle: (id) => { const p = store.get(); store.set(p.includes(id) ? p.filter((x) => x !== id) : [...p, id]); },
    add: (add) => store.set([...new Set([...store.get(), ...add])]),
    remove: (id) => store.set(store.get().filter((x) => x !== id)),
    clear: () => store.set([]),
  }), [ids, ready]);
  return <PlannerContext.Provider value={api}>{children}</PlannerContext.Provider>;
}

export function usePlanner() {
  const ctx = useContext(PlannerContext);
  if (!ctx) throw new Error("usePlanner must be used inside PlannerProvider");
  return ctx;
}

/** Pairs of saved sessions on the same day whose times overlap. */
export function findConflicts(list: Session[]) {
  const timed = list.filter((s) => s.startTime && s.endTime);
  const out: [Session, Session][] = [];
  for (let i = 0; i < timed.length; i++) {
    for (let j = i + 1; j < timed.length; j++) {
      const a = timed[i], b = timed[j];
      if (a.date !== b.date) continue;
      if (toMinutes(a.startTime!) < toMinutes(b.endTime!) && toMinutes(b.startTime!) < toMinutes(a.endTime!)) out.push([a, b]);
    }
  }
  return out;
}

export const sortSessions = (list: Session[]) =>
  [...list].sort((a, b) => a.date.localeCompare(b.date) || (a.startTime ?? "00:00").localeCompare(b.startTime ?? "00:00"));
