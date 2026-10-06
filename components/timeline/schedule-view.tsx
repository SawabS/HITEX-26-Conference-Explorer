"use client";
import { CalendarRange, Clock3, Flag, List, MapPin, X } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import { ScheduleListenButton } from "@/components/podcast/briefings";
import { DayNavigator } from "@/components/conference/day-navigator";
import { NavLink } from "@/components/conference/app-shell";
import { Segmented } from "@/components/ui/badges";
import { TECH_DAY_TOPICS, TOPIC_BY_ID } from "@/data/topics";
import { dayByDate, sessions as allSessions, meta } from "@/lib/data";
import { fmtDate, fmtDuration, fromMinutes, toMinutes } from "@/lib/format";
import { dayDensity, sessionsAt } from "@/lib/insights";
import { useDay, useDetail, useNav } from "@/lib/nav";
import { TRACK_META, TYPE_META } from "@/lib/session-meta";
import type { Session, SessionType, TopicId } from "@/types";
import { AgendaList } from "./agenda-list";
import { TimelineHorizontal } from "./timeline-horizontal";
import { TimelineVertical } from "./timeline-vertical";
import { useErbilClock } from "./use-now";
import { PhotoBand } from "@/components/ui/photo-band";
import { PHOTOS } from "@/lib/campaign";

const TIME_SLOTS = Array.from({ length: (18 * 60 + 30 - 11 * 60) / 15 + 1 }, (_, i) => fromMinutes(11 * 60 + i * 15));

export function ScheduleView() {
  const { params, set } = useNav();
  const [day, setDay] = useDay();
  const { openSession } = useDetail();
  const clock = useErbilClock();
  const barRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const mode = params.get("mode") === "agenda" ? "agenda" : "timeline";
  const allDays = mode === "agenda" && params.get("range") === "all";
  const topic = params.get("topic") as TopicId | null;
  const type = params.get("type") as SessionType | null;
  const atRaw = params.get("at");
  const probe = atRaw && /^\d{2}:\d{2}$/.test(atRaw) ? toMinutes(atRaw) : null;

  const dayMeta = dayByDate.get(day)!;
  const daySessions = useMemo(() => allSessions.filter((s) => s.date === day), [day]);
  const timed = daySessions.filter((s) => s.startTime);
  const density = dayDensity(day);

  const isMatch = (s: Session) => (!topic || s.topics.includes(topic)) && (!type || s.type === type);
  const filterActive = !!(topic || type);
  const listForCount = allDays ? allSessions : daySessions;
  const matchCount = listForCount.filter(isMatch).length;

  const dayTopics = useMemo(() => {
    const present = new Set(daySessions.flatMap((s) => s.topics));
    const base = day === "2026-10-08" ? TECH_DAY_TOPICS : [];
    return [...new Set([...base, ...[...present].sort((a, b) => daySessions.filter((s) => s.topics.includes(b)).length - daySessions.filter((s) => s.topics.includes(a)).length)])].filter((t) => present.has(t));
  }, [day, daySessions]);

  // Expose the sticky control bar's height so the timeline ruler can stick right below it.
  useEffect(() => {
    const el = barRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => rootRef.current?.style.setProperty("--sched-bar", `${el.offsetHeight}px`));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const nowMin = clock && clock.date === day ? clock.minutes : null;
  const atHits = probe != null ? sessionsAt(day, probe) : [];

  return (
    <>
    <PhotoBand photo={PHOTOS.curved} position="50% 42%">
      <header className="mx-auto max-w-[1320px] px-4 pb-10 pt-12 md:px-6 md:pb-14 md:pt-20">
        <p className="eyebrow">Schedule · {meta.venue}</p>
        <h1 className="mt-3 text-[30px] font-bold leading-[1.05] tracking-tight sm:text-[40px] md:text-[52px]">
          <span className="sm:hidden">{fmtDate(day)}</span>
          <span className="hidden sm:inline">{fmtDate(day, "long").replace(/ 2026$/, "")}</span>
          <span data-track={dayMeta.track} className="tc-ink whitespace-nowrap"> · {dayMeta.label}</span>
        </h1>
        <p className="mt-3 max-w-[62ch] text-[15px] text-fg-2">
          {TRACK_META[dayMeta.track].theme}.{" "}
          {density
            ? <>
                <span className="mono text-fg-2">{density.count}</span> sessions from <span className="mono text-fg-2">{fromMinutes(density.start)}</span> to{" "}
                <span className="mono text-fg-2">{fromMinutes(density.end)}</span>, <span className="mono text-fg-2">{fmtDuration(density.busy)}</span> on stage.
              </>
            : "Official opening ceremony; panels begin October 7."}
        </p>
        <ScheduleListenButton date={day} />
      </header>
    </PhotoBand>
    <div ref={rootRef} className="mx-auto max-w-[1320px] px-4 md:px-6">

      <div
        ref={barRef}
        className="glass no-print sticky top-[calc(var(--nav-h)+env(safe-area-inset-top,0px))] z-30 -mx-4 border-b border-line px-4 pb-2.5 pt-2.5 md:-mx-6 md:px-6"
      >
        <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 lg:max-w-[560px] lg:flex-1">
            <DayNavigator value={day} onChange={setDay} layoutId="sched-day" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Segmented
              label="Schedule layout"
              value={mode}
              onChange={(m) => set({ mode: m === "agenda" ? "agenda" : undefined }, { replace: true })}
              options={[
                { value: "timeline", label: "Timeline", icon: CalendarRange },
                { value: "agenda", label: "Agenda", icon: List },
              ]}
            />
            {mode === "agenda" && (
              <Segmented
                size="sm"
                label="Agenda range"
                value={allDays ? "all" : "day"}
                onChange={(r) => set({ range: r === "all" ? "all" : undefined }, { replace: true })}
                options={[{ value: "day", label: "Day" }, { value: "all", label: "All days" }]}
              />
            )}
            <label className="ml-auto inline-flex h-8 items-center gap-1.5 rounded-full border border-line bg-surface pl-2.5 pr-1 text-[12.5px] text-muted lg:ml-0">
              <Clock3 size={14} aria-hidden />
              <span className="sr-only sm:not-sr-only">What’s on at</span>
              <select
                id="time-probe"
                value={atRaw ?? ""}
                onChange={(e) => set({ at: e.target.value || undefined }, { replace: true })}
                aria-label="Show what is happening at a specific time"
                className={`mono h-7 rounded-full bg-transparent pr-1 text-[12.5px] outline-none ${atRaw ? "text-fg" : "text-muted"}`}
              >
                <option value="">--:--</option>
                {TIME_SLOTS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
          </div>
        </div>
        {(dayTopics.length > 0 || type) && (
          <div className="scroll-x -mx-1 mt-2.5 flex items-center gap-1.5 px-1" role="group" aria-label="Highlight sessions by theme">
            {dayTopics.map((t) => (
              <button key={t} className="chip !h-7 !text-[12.5px]" aria-pressed={topic === t} onClick={() => set({ topic: topic === t ? undefined : t }, { replace: true })}>
                {TOPIC_BY_ID[t].short}
              </button>
            ))}
            {type && (
              <span className="chip !h-7 !text-[12.5px]" data-active="true">
                {TYPE_META[type].plural}
              </span>
            )}
            {filterActive && (
              <button className="inline-flex h-7 shrink-0 items-center gap-1 rounded-full px-2.5 text-[12.5px] text-muted hover:text-fg" onClick={() => set({ topic: undefined, type: undefined }, { replace: true })}>
                <X size={13} /> Clear · <span className="mono">{matchCount}</span> match
              </button>
            )}
          </div>
        )}
      </div>

      {probe != null && (
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-accent/30 bg-accent-soft px-4 py-3 text-[14px]" role="status">
          <Clock3 size={16} className="mt-0.5 shrink-0 text-accent-ink" aria-hidden />
          <p className="min-w-0">
            <span className="mono font-semibold text-accent-ink">{fromMinutes(probe)}</span> on {fmtDate(day)}:{" "}
            {atHits.length ? (
              atHits.map((s) => (
                <button key={s.id} onClick={() => openSession(s.slug)} className="font-semibold underline decoration-accent/40 underline-offset-2">
                  {s.title}
                </button>
              ))
            ) : (
              <span className="text-fg-2">
                no session is running.
                {(() => {
                  const next = timed.filter((s) => toMinutes(s.startTime!) > probe).sort((a, b) => toMinutes(a.startTime!) - toMinutes(b.startTime!))[0];
                  return next ? <> Next: <button onClick={() => openSession(next.slug)} className="font-semibold underline decoration-accent/40 underline-offset-2">{next.title}</button> at <span className="mono">{next.startTime}</span>.</> : null;
                })()}
              </span>
            )}
          </p>
          <button onClick={() => set({ at: undefined }, { replace: true })} className="ml-auto shrink-0 text-muted hover:text-fg" aria-label="Clear time">
            <X size={16} />
          </button>
        </div>
      )}

      <div className="pt-5">
        {dayMeta.track === "opening" && !allDays ? (
          <OpeningDay />
        ) : mode === "agenda" ? (
          <AgendaList sessions={allDays ? allSessions : daySessions} isMatch={isMatch} onOpen={openSession} showDay={allDays} />
        ) : (
          <>
            <div className="hidden md:block">
              <TimelineHorizontal sessions={timed} date={day} isMatch={isMatch} probe={probe} nowMin={nowMin} onOpen={openSession} />
              <Legend />
            </div>
            <div className="md:hidden">
              <TimelineVertical sessions={timed} date={day} isMatch={isMatch} probe={probe} nowMin={nowMin} onOpen={openSession} />
            </div>
          </>
        )}
      </div>
    </div>
    </>
  );
}

function Legend() {
  const types = (["presentation", "fireside-chat", "dialogue", "panel"] as const).map((t) => TYPE_META[t]);
  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[12px] text-muted">
      {types.map((t) => {
        const Icon = t.icon;
        return (
          <span key={t.label} className="inline-flex items-center gap-1.5">
            <Icon size={13} aria-hidden /> {t.label}
          </span>
        );
      })}
      <span className="inline-flex items-center gap-1.5"><span className="stripe inline-block h-3 w-5 rounded-sm border border-line" /> Break</span>
      <span className="inline-flex items-center gap-1.5"><span className="inline-block h-3 w-5 rounded-sm border-2 border-accent" /> In My Schedule</span>
      <span className="ml-auto">Block width is proportional to session length. Hover for a preview, click for details, ← → to step through.</span>
    </div>
  );
}

function OpeningDay() {
  const { openSession } = useDetail();
  const opening = allSessions.find((s) => s.type === "opening-ceremony");
  if (!opening) return null;
  return (
    <div className="grid gap-4 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
      <article data-track="opening" className="panel relative overflow-hidden p-5 md:p-7">
        <div className="flex items-center gap-2 text-[12.5px] text-muted">
          <Flag size={14} aria-hidden /> Opening ceremony · Tue 6 Oct
        </div>
        <h2 className="mt-2 text-[22px] font-semibold leading-tight tracking-tight md:text-[28px]">{opening.title}</h2>
        <p className="mt-3 max-w-[60ch] text-[14.5px] leading-relaxed text-fg-2">{opening.description}</p>
        <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-muted">
          <span className="inline-flex items-center gap-1.5"><MapPin size={14} /> {opening.venue}</span>
          <span className="inline-flex items-center gap-1.5"><Clock3 size={14} /> Start time not published by HITEX</span>
        </div>
        <button onClick={() => openSession(opening.slug)} className="mt-5 inline-flex h-9 items-center rounded-full bg-fg px-4 text-[13.5px] font-medium text-bg">
          Details & sources
        </button>
      </article>
      <aside className="panel flex flex-col justify-between gap-4 p-5 md:p-6">
        <div>
          <p className="eyebrow">Conference programme</p>
          <p className="mt-2 text-[15px] leading-relaxed text-fg-2">Panels, dialogues and fireside chats run October 7–9, each day themed around one track.</p>
        </div>
        <div className="flex flex-col gap-2">
          {(["2026-10-07", "2026-10-08", "2026-10-09"] as const).map((d) => {
            const dm = dayByDate.get(d)!;
            const dd = dayDensity(d)!;
            return (
              <NavLink key={d} view="schedule" params={{ day: d }} className="group flex items-center gap-3 rounded-xl border border-line px-3 py-2.5 transition hover:border-line-strong hover:bg-surface-2">
                <span data-track={dm.track} className="tc-dot h-2.5 w-2.5 rounded-full" aria-hidden />
                <span className="flex-1 text-[14px] font-medium">{fmtDate(d)} · {dm.label}</span>
                <span className="mono text-[12px] text-muted">{dd.count} sessions</span>
              </NavLink>
            );
          })}
        </div>
      </aside>
    </div>
  );
}
