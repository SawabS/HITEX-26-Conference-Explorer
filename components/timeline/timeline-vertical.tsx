"use client";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowUpRight, ChevronDown } from "lucide-react";
import { Fragment, useState } from "react";
import { Avatar, AvatarStack } from "@/components/ui/avatar";
import { BookmarkButton, TopicTag } from "@/components/ui/badges";
import { fmtDuration, fromMinutes, toMinutes } from "@/lib/format";
import { participantsOf } from "@/lib/insights";
import { usePlanner } from "@/lib/planner";
import { TYPE_META } from "@/lib/session-meta";
import type { Session } from "@/types";

type Props = {
  sessions: Session[];
  date: string;
  isMatch: (s: Session) => boolean;
  probe?: number | null;
  nowMin?: number | null;
  onOpen: (slug: string) => void;
};

/**
 * Phone timeline. Card height grows with duration and gaps are drawn to a compressed but
 * monotonic scale, so chronology and relative length stay readable without horizontal scroll.
 */
export function TimelineVertical({ sessions, date, isMatch, probe, nowMin, onOpen }: Props) {
  const reduce = useReducedMotion();
  const [open, setOpen] = useState<string | null>(null);
  const { has } = usePlanner();
  const sorted = [...sessions].sort((a, b) => toMinutes(a.startTime!) - toMinutes(b.startTime!));

  const marker = (m: number | null | undefined, kind: "now" | "probe") => {
    if (m == null) return null;
    return (
      <div className="relative flex items-center gap-2 py-1.5" aria-label={kind === "now" ? `Current time ${fromMinutes(m)}` : `Selected time ${fromMinutes(m)}`}>
        <span className={`mono w-[52px] shrink-0 text-right text-[11px] font-semibold ${kind === "now" ? "text-now" : "text-fg"}`}>{fromMinutes(m)}</span>
        <span className={`relative h-0.5 flex-1 ${kind === "now" ? "bg-now" : "bg-fg"}`}>
          <span className={`absolute -left-1 -top-[3px] h-2 w-2 rounded-full ${kind === "now" ? "bg-now pulse-dot" : "bg-fg"}`} />
        </span>
        <span className={`text-[11px] font-semibold uppercase tracking-wide ${kind === "now" ? "text-now" : "text-fg"}`}>{kind === "now" ? "Now" : "At"}</span>
      </div>
    );
  };
  const placeMarker = (m: number | null | undefined, lo: number, hi: number) => m != null && m >= lo && m < hi;

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.ol
        key={date}
        className="relative"
        aria-label="Sessions in time order"
        initial={{ opacity: 0, y: reduce ? 0 : 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: reduce ? 0 : -6 }}
        transition={{ duration: reduce ? 0 : 0.2 }}
      >
        {sorted.map((s, i) => {
          const start = toMinutes(s.startTime!);
          const end = toMinutes(s.endTime!);
          const prevEnd = i ? toMinutes(sorted[i - 1].endTime!) : null;
          const gap = prevEnd != null ? start - prevEnd : 0;
          const people = participantsOf(s);
          const TypeIcon = TYPE_META[s.type].icon;
          const expanded = open === s.id;
          const match = isMatch(s);
          const minH = 84 + s.durationMinutes! * 1.1;
          return (
            <Fragment key={s.id}>
              {prevEnd != null && gap > 0 && (
                <li aria-hidden className="flex items-center gap-2" style={{ height: Math.min(64, 12 + gap * 0.35) }}>
                  <span className="w-[52px] shrink-0" />
                  <span className="relative flex h-full flex-1 items-center">
                    <span className="absolute left-[7px] top-0 bottom-0 border-l border-dashed border-line-strong" />
                    <span className="mono ml-6 text-[11px] text-muted">{fmtDuration(gap)} {gap >= 30 ? "break" : "changeover"}</span>
                  </span>
                </li>
              )}
              {prevEnd != null && placeMarker(nowMin, prevEnd, start) && <li>{marker(nowMin, "now")}</li>}
              {prevEnd != null && placeMarker(probe, prevEnd, start) && <li>{marker(probe, "probe")}</li>}
              <li data-track={s.track} className={`flex gap-2 transition-opacity ${match ? "" : "opacity-35"}`}>
                <div className="flex w-[52px] shrink-0 flex-col items-end pt-3 text-right">
                  <span className="mono text-[13.5px] font-semibold leading-none text-fg">{s.startTime}</span>
                  <span className="mono mt-1 text-[11px] leading-none text-muted">{s.endTime}</span>
                </div>
                <div className="relative w-4 shrink-0" aria-hidden>
                  <span className="tc-dot absolute left-[6px] top-3.5 bottom-0 w-[3px] rounded-full opacity-60" />
                  <span className="tc-dot absolute left-[3px] top-3 h-[9px] w-[9px] rounded-full ring-4 ring-[var(--bg)]" />
                </div>
                <div className={`tc-soft min-w-0 flex-1 rounded-2xl border ${has(s.id) ? "border-accent" : "border-line"} mb-1`} style={{ minHeight: minH }}>
                  <div className="flex items-start gap-1 p-3 pb-2.5">
                    <button
                      onClick={() => setOpen(expanded ? null : s.id)}
                      aria-expanded={expanded}
                      aria-controls={`tv-${s.id}`}
                      className="min-w-0 flex-1 text-left [overflow-wrap:anywhere]"
                    >
                      <span className="flex flex-wrap items-center gap-1.5 text-[11.5px] text-muted">
                        <TypeIcon size={13} className="tc-ink" aria-hidden />
                        {TYPE_META[s.type].label}
                        <span aria-hidden>·</span>
                        <span className="mono">{fmtDuration(s.durationMinutes!)}</span>
                      </span>
                      <span className="mt-1 block text-[15.5px] font-semibold leading-snug tracking-tight text-fg">{s.title}</span>
                      <span className="mt-2.5 flex items-center gap-2">
                        <AvatarStack people={people} size={26} max={4} />
                        <span className="min-w-0 truncate text-[12.5px] text-muted">
                          {people.slice(0, 2).map((p) => p.name.split(" (")[0]).join(", ")}
                          {people.length > 2 && ` +${people.length - 2}`}
                        </span>
                      </span>
                    </button>
                    <div className="-mr-1 -mt-1 flex flex-col items-center">
                      <BookmarkButton id={s.id} title={s.title} />
                      <button
                        onClick={() => setOpen(expanded ? null : s.id)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted"
                        aria-label={expanded ? "Collapse" : "Expand"}
                        aria-expanded={expanded}
                      >
                        <ChevronDown size={17} className={`transition ${expanded ? "rotate-180" : ""}`} />
                      </button>
                    </div>
                  </div>
                  <AnimatePresence initial={false}>
                    {expanded && (
                      <motion.div
                        id={`tv-${s.id}`}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: reduce ? 0 : 0.22 }}
                        className="overflow-hidden"
                      >
                        <div className="min-w-0 border-t border-line px-3 pb-3 pt-2.5">
                          <ul className="flex flex-col gap-2">
                            {people.map((p) => (
                              <li key={p.id} className="flex items-center gap-2.5">
                                <Avatar speaker={p} size={32} />
                                <span className="min-w-0 flex-1 break-words text-[13px] leading-tight">
                                  <span className="font-medium">{p.name}</span>
                                  {s.moderatorIds.includes(p.id) && <span className="text-muted"> · moderator</span>}
                                  <span className="mt-1 block break-words text-[12px] leading-snug text-muted">{p.title}</span>
                                </span>
                              </li>
                            ))}
                          </ul>
                          <div className="mt-3 flex flex-wrap gap-1">{s.topics.map((t) => <TopicTag key={t} id={t} />)}</div>
                          <button
                            onClick={() => onOpen(s.slug)}
                            className="mt-3 inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-fg text-[14px] font-medium text-bg"
                          >
                            Open session <ArrowUpRight size={15} />
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </li>
              {placeMarker(nowMin, start, end) && <li>{marker(nowMin, "now")}</li>}
              {placeMarker(probe, start, end) && !placeMarker(nowMin, start, end) && <li>{marker(probe, "probe")}</li>}
            </Fragment>
          );
        })}
      </motion.ol>
    </AnimatePresence>
  );
}
