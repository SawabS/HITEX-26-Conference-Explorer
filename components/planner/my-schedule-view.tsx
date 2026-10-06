"use client";
import { AlertTriangle, BookmarkPlus, CalendarPlus, Check, Copy, Printer, Trash2 } from "lucide-react";
import { useState } from "react";
import { NavLink } from "@/components/conference/app-shell";
import { useErbilClock } from "@/components/timeline/use-now";
import { AvatarStack } from "@/components/ui/avatar";
import { days, sessionById, timedSessions } from "@/lib/data";
import { fmtDate, fmtDuration, toMinutes } from "@/lib/format";
import { copyText, downloadText, sessionAsText, sessionsToIcs } from "@/lib/ics";
import { fmtCountdown, participantsOf } from "@/lib/insights";
import { useDetail } from "@/lib/nav";
import { findConflicts, sortSessions, usePlanner } from "@/lib/planner";
import { TYPE_META } from "@/lib/session-meta";
import type { Session } from "@/types";

/** True in the single-file preview build, where downloads and printing are unavailable. */
const IS_PREVIEW = process.env.NEXT_PUBLIC_HITEX_PREVIEW === "1";

const PRESETS = [
  { label: "Technology day essentials", note: "AI, data, security and local tech on Oct 8", ids: () => timedSessions.filter((s) => s.date === "2026-10-08").map((s) => s.id) },
  { label: "Every AI session", note: "Across all three days", ids: () => timedSessions.filter((s) => s.topics.includes("ai")).map((s) => s.id) },
  { label: "Investment & digital economy", note: "FDI, regulation, payments", ids: () => timedSessions.filter((s) => s.topics.some((t) => ["investment", "fintech", "digital-economy"].includes(t))).map((s) => s.id) },
];

export function MyScheduleView() {
  const planner = usePlanner();
  const clock = useErbilClock();
  const { openSession } = useDetail();
  const [flash, setFlash] = useState<string | null>(null);
  const list = sortSessions(planner.ids.map((id) => sessionById.get(id)).filter((s): s is Session => !!s));
  const conflicts = findConflicts(list);
  const conflictIds = new Set(conflicts.flat().map((s) => s.id));
  const total = list.reduce((a, s) => a + (s.durationMinutes ?? 0), 0);

  const nowKey = clock ? `${clock.date} ${String(Math.floor(clock.minutes / 60)).padStart(2, "0")}:${String(clock.minutes % 60).padStart(2, "0")}` : null;
  const next = nowKey ? list.find((s) => s.startTime && `${s.date} ${s.startTime}` > nowKey) : undefined;
  const nextIn = next && clock ? (Date.UTC(+next.date.slice(0, 4), +next.date.slice(5, 7) - 1, +next.date.slice(8)) - Date.UTC(+clock.date.slice(0, 4), +clock.date.slice(5, 7) - 1, +clock.date.slice(8))) / 60000 + toMinutes(next.startTime!) - clock.minutes : 0;

  const note = (k: string) => { setFlash(k); setTimeout(() => setFlash(null), 1800); };
  const ics = () => sessionsToIcs(list);

  if (!planner.ready) return <div className="mx-auto max-w-[920px] px-4 pt-10"><div className="skeleton h-40" /></div>;

  return (
    <div className="mx-auto max-w-[920px] px-4 md:px-6">
      <header className="pb-5 pt-6 md:pt-10">
        <p className="eyebrow">Personal planner · saved on this device</p>
        <h1 className="mt-2 text-[28px] font-semibold leading-[1.1] tracking-tight md:text-[40px]">My Schedule</h1>
        <p className="print-only mt-1 text-[13px]">HITEX 2026 · Erbil International Fairground · times are Erbil local (UTC+3)</p>
      </header>

      {list.length === 0 ? (
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border border-dashed border-line-strong px-6 py-10 text-center">
            <p className="text-[16px] font-semibold">Nothing saved yet</p>
            <p className="mx-auto mt-1 max-w-[46ch] text-[14px] text-muted">
              Use the bookmark on any session to build your own agenda. It is stored in this browser only; no account needed.
            </p>
            <NavLink view="schedule" className="mt-4 inline-flex h-9 items-center rounded-full bg-fg px-4 text-[13.5px] font-medium text-bg">Browse the schedule</NavLink>
          </div>
          <p className="eyebrow mt-2">Or start from a preset</p>
          <div className="grid gap-2 sm:grid-cols-3">
            {PRESETS.map((p) => (
              <button key={p.label} onClick={() => planner.add(p.ids())} className="panel flex flex-col items-start p-4 text-left transition hover:border-line-strong hover:shadow-2">
                <BookmarkPlus size={16} className="text-accent" />
                <span className="mt-2 text-[14.5px] font-semibold">{p.label}</span>
                <span className="mt-0.5 text-[12.5px] text-muted">{p.note} · {p.ids().length} sessions</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-4">
            {[
              { k: "Saved", v: String(list.length) },
              { k: "Time at talks", v: fmtDuration(total) },
              { k: "Conflicts", v: String(conflicts.length), warn: conflicts.length > 0 },
              { k: "Next up", v: next ? `in ${fmtCountdown(Math.round(nextIn))}` : "—" },
            ].map((x) => (
              <div key={x.k} className="bg-surface px-4 py-3.5">
                <p className="eyebrow !text-[10px]">{x.k}</p>
                <p className={`mono mt-1 text-[20px] font-medium leading-tight ${x.warn ? "text-warn" : ""}`}>{x.v}</p>
              </div>
            ))}
          </div>

          {next && (
            <button onClick={() => openSession(next.slug)} data-track={next.track} className="tc-soft mt-3 flex w-full items-center gap-3 rounded-xl border border-line px-4 py-3 text-left">
              <span className="tc-dot h-2 w-2 shrink-0 rounded-full" />
              <span className="min-w-0 flex-1">
                <span className="eyebrow !text-[10px]">Next selected session</span>
                <span className="block truncate text-[14.5px] font-semibold">{next.title}</span>
              </span>
              <span className="mono shrink-0 text-[12.5px] text-muted">{fmtDate(next.date)} {next.startTime}</span>
            </button>
          )}

          {conflicts.length > 0 ? (
            <div className="mt-3 rounded-xl border border-warn/40 bg-warn-soft px-4 py-3 text-[13.5px]" role="alert">
              <p className="flex items-center gap-2 font-semibold text-warn"><AlertTriangle size={15} /> Overlapping sessions</p>
              <ul className="mt-1 list-inside list-disc text-fg-2">
                {conflicts.map(([a, b]) => <li key={a.id + b.id}>{a.title} ({a.startTime}–{a.endTime}) overlaps {b.title} ({b.startTime}–{b.endTime})</li>)}
              </ul>
            </div>
          ) : (
            <p className="mt-3 flex items-center gap-2 text-[13px] text-muted"><Check size={14} className="text-[var(--ok)]" /> No saved sessions overlap.</p>
          )}

          <div className="no-print mt-4 flex flex-wrap gap-2">
            {!IS_PREVIEW && (
              <button onClick={() => downloadText("hitex-2026-my-schedule.ics", ics())} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-fg px-4 text-[13px] font-medium text-bg">
                <CalendarPlus size={14} /> Export to calendar (.ics)
              </button>
            )}
            <button onClick={async () => { if (await copyText(ics())) note("ics"); }} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line bg-surface px-4 text-[13px] font-medium">
              {flash === "ics" ? <Check size={14} /> : <Copy size={14} />} Copy calendar data
            </button>
            <button onClick={async () => { if (await copyText(list.map(sessionAsText).join("\n\n———\n\n"))) note("text"); }} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line bg-surface px-4 text-[13px] font-medium">
              {flash === "text" ? <Check size={14} /> : <Copy size={14} />} Copy as text
            </button>
            {!IS_PREVIEW && (
              <button onClick={() => window.print()} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line bg-surface px-4 text-[13px] font-medium">
                <Printer size={14} /> Print
              </button>
            )}
            <button onClick={planner.clear} className="ml-auto inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[13px] text-muted hover:text-warn">
              <Trash2 size={14} /> Clear all
            </button>
          </div>

          <div className="mt-6 flex flex-col gap-7">
            {days.map((d) => {
              const dl = list.filter((s) => s.date === d.date);
              if (!dl.length) return null;
              return (
                <section key={d.date} aria-label={fmtDate(d.date, "long")}>
                  <h2 data-track={d.track} className="mb-2 flex items-center gap-2 text-[13.5px] font-semibold">
                    <span className="tc-dot h-2 w-2 rounded-full" /> {fmtDate(d.date, "long")} · {d.label}
                    <span className="mono ml-auto text-[12px] font-normal text-muted">{fmtDuration(dl.reduce((a, s) => a + (s.durationMinutes ?? 0), 0))}</span>
                  </h2>
                  <ol className="overflow-hidden rounded-2xl border border-line bg-surface">
                    {dl.map((s, i) => {
                      const prev = dl[i - 1];
                      const free = prev?.endTime && s.startTime ? toMinutes(s.startTime) - toMinutes(prev.endTime) : 0;
                      return (
                        <li key={s.id}>
                          {free > 0 && (
                            <p className="mono border-t border-dashed border-line bg-surface-2/60 px-4 py-1 text-[11.5px] text-muted">{fmtDuration(free)} free</p>
                          )}
                          <div data-track={s.track} className={`flex items-start gap-3 px-4 py-3 ${i && free <= 0 ? "border-t border-line" : ""} ${conflictIds.has(s.id) ? "bg-warn-soft" : ""}`}>
                            <div className="mono w-[92px] shrink-0 text-[13px]">
                              <span className="font-semibold">{s.startTime ?? "TBA"}</span>
                              {s.endTime && <span className="text-muted">–{s.endTime}</span>}
                            </div>
                            <button onClick={() => openSession(s.slug)} className="min-w-0 flex-1 text-left">
                              <span className="text-[11.5px] text-muted">{TYPE_META[s.type].label} · {s.durationMinutes ? `${s.durationMinutes} min` : "time not published"}</span>
                              <span className="block text-[15px] font-semibold leading-snug hover:underline">{s.title}</span>
                              <span className="mt-1.5 flex items-center gap-2">
                                <AvatarStack people={participantsOf(s)} size={22} />
                                <span className="truncate text-[12px] text-muted">{participantsOf(s).map((p) => p.name).join(", ")}</span>
                              </span>
                            </button>
                            <button onClick={() => planner.remove(s.id)} className="no-print inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted hover:bg-surface-2 hover:text-warn" aria-label={`Remove ${s.title}`}>
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                </section>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
