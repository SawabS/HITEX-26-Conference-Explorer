"use client";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Building2, CalendarClock, CornerDownLeft, Hash, Layers, Search, User } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { TOPIC_BY_ID } from "@/data/topics";
import { useNav } from "@/lib/nav";
import { search, type SearchGroup, type SearchItem } from "@/lib/search";
import type { TopicId } from "@/types";

const ICON: Record<SearchGroup, typeof Search> = {
  Sessions: CalendarClock,
  Speakers: User,
  Organisations: Building2,
  Themes: Hash,
  Formats: Layers,
};

const SUGGESTIONS = ["AI", "Cybersecurity", "Invest Kurdistan", "Data", "Fintech", "Arcella", "Real estate"];

export function useCommandPalette() {
  const [isOpen, setOpen] = useState(false);
  const shortcut = useSyncExternalStore(
    noopSubscribe,
    () => (/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent) ? "⌘K" : "Ctrl K"),
    () => "Ctrl K",
  );
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === "/" && !isTyping(e.target)) {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return { isOpen, open: useCallback(() => setOpen(true), []), close: useCallback(() => setOpen(false), []), shortcut };
}

const noopSubscribe = () => () => {};

const isTyping = (t: EventTarget | null) =>
  t instanceof HTMLElement && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);

export function CommandPalette({ state }: { state: ReturnType<typeof useCommandPalette> }) {
  return <AnimatePresence>{state.isOpen && <PaletteDialog key="palette" close={state.close} />}</AnimatePresence>;
}

/** Mounted fresh on every open, so the query and highlight always start clean. */
function PaletteDialog({ close }: { close: () => void }) {
  const state = { close };
  const { go } = useNav();
  const reduce = useReducedMotion();
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const groups = useMemo(() => search(q), [q]);
  const flat = useMemo(() => groups.flatMap((g) => g.items), [groups]);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 20);
    return () => clearTimeout(t);
  }, []);
  const query = (v: string) => { setQ(v); setActive(0); };
  useEffect(() => {
    listRef.current?.querySelector(`[data-idx="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const choose = (item: SearchItem) => {
    state.close();
    const t = item.target;
    if (t.kind === "session") go("schedule", { day: t.date, session: t.slug });
    else if (t.kind === "speaker") go("speakers", { speaker: t.slug });
    else if (t.kind === "org") go("speakers", { org: t.name });
    else if (t.kind === "topic") go("explore", { topic: t.id });
    else go("schedule", { mode: "agenda", type: t.type, range: "all" });
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(flat.length - 1, a + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
    else if (e.key === "Enter" && flat[active]) { e.preventDefault(); choose(flat[active]); }
    else if (e.key === "Escape") { e.preventDefault(); state.close(); }
  };

  return (
        <div className="fixed inset-0 z-[70] flex items-start justify-center px-3 pt-[max(12px,env(safe-area-inset-top,0px))] sm:px-4 sm:pt-[12vh]">
          <motion.div
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.15 }}
            onClick={state.close}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Search the conference"
            className="relative flex max-h-[min(640px,84dvh)] w-full max-w-[640px] flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-3"
            initial={{ opacity: 0, y: reduce ? 0 : -8, scale: reduce ? 1 : 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: reduce ? 0 : -6, scale: reduce ? 1 : 0.985 }}
            transition={{ duration: reduce ? 0 : 0.16, ease: [0.2, 0.7, 0.2, 1] }}
            onKeyDown={onKeyDown}
          >
            <div className="flex items-center gap-3 border-b border-line px-4">
              <Search size={18} className="shrink-0 text-muted" aria-hidden />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => query(e.target.value)}
                placeholder="Sessions, speakers, organisations, themes…"
                className="h-14 min-w-0 flex-1 bg-transparent text-[16px] text-fg outline-none placeholder:text-faint"
                role="combobox"
                aria-expanded={flat.length > 0}
                aria-controls="cmdk-list"
                aria-activedescendant={flat[active] ? `cmdk-${flat[active].key}` : undefined}
                aria-autocomplete="list"
                id="cmdk-input"
              />
              <button onClick={state.close} className="mono rounded-md border border-line px-1.5 py-0.5 text-[11px] text-muted hover:text-fg">
                Esc
              </button>
            </div>

            <div ref={listRef} id="cmdk-list" role="listbox" aria-label="Results" className="thin-scroll min-h-0 flex-1 overflow-y-auto p-2">
              {!q && (
                <div className="p-2">
                  <p className="eyebrow mb-2 px-1">Try</p>
                  <div className="flex flex-wrap gap-1.5">
                    {SUGGESTIONS.map((s) => (
                      <button key={s} className="chip" onClick={() => query(s)}>{s}</button>
                    ))}
                  </div>
                </div>
              )}
              {q && !flat.length && <p className="px-3 py-8 text-center text-[14px] text-muted">No sessions, speakers or themes match “{q}”.</p>}
              {groups.map((g) => {
                const Icon = ICON[g.group];
                return (
                  <div key={g.group} className="mb-1" role="group" aria-label={g.group}>
                    <p className="eyebrow px-2.5 pb-1 pt-2.5">{g.group}</p>
                    {g.items.map((item) => {
                      const i = flat.indexOf(item);
                      const on = i === active;
                      return (
                        <button
                          key={item.key}
                          id={`cmdk-${item.key}`}
                          data-idx={i}
                          role="option"
                          aria-selected={on}
                          onMouseMove={() => setActive(i)}
                          onClick={() => choose(item)}
                          className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors ${on ? "bg-surface-2" : ""}`}
                        >
                          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line bg-surface text-muted">
                            <Icon size={15} aria-hidden />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[14px] font-medium text-fg">
                              {item.target.kind === "topic" ? TOPIC_BY_ID[item.target.id as TopicId].label : item.label}
                            </span>
                            <span className="block truncate text-[12.5px] text-muted">{item.sub}</span>
                          </span>
                          {on && <CornerDownLeft size={14} className="shrink-0 text-muted" aria-hidden />}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
            <div className="hidden items-center gap-4 border-t border-line px-4 py-2 text-[11.5px] text-muted sm:flex">
              <span><kbd className="mono">↑↓</kbd> move</span>
              <span><kbd className="mono">↵</kbd> open</span>
              <span><kbd className="mono">esc</kbd> close</span>
            </div>
          </motion.div>
        </div>
  );
}
