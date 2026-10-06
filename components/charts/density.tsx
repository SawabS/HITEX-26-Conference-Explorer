"use client";
import { days, timedSessions } from "@/lib/data";
import { dateParts, fmtDuration, fromMinutes, toMinutes } from "@/lib/format";
import { dayDensity } from "@/lib/insights";
import { useDetail } from "@/lib/nav";
import { TYPE_META } from "@/lib/session-meta";
import type { SessionType } from "@/types";

const FROM = 11 * 60;
const TO = 18 * 60 + 30;
const SPAN = TO - FROM;
const contentDays = days.filter((d) => d.track !== "opening");

/** Day strips on one shared clock: where the programme is dense and where it breaks. */
export function DensityStrips() {
  const { openSession } = useDetail();
  const hours = Array.from({ length: Math.floor(SPAN / 60) + 1 }, (_, i) => FROM + i * 60);
  return (
    <figure className="min-w-0">
      <div className="rounded-2xl border border-line bg-surface p-4">
        <div className="relative ml-[72px] h-5 sm:ml-[96px]" aria-hidden>
          {hours.map((h) => (
            <span key={h} className="mono absolute -translate-x-1/2 text-[10.5px] text-muted" style={{ left: `${((h - FROM) / SPAN) * 100}%` }}>
              {fromMinutes(h).slice(0, 2)}
            </span>
          ))}
        </div>
        <div className="flex flex-col gap-3">
          {contentDays.map((d) => {
            const dd = dayDensity(d.date)!;
            const list = timedSessions.filter((s) => s.date === d.date);
            return (
              <div key={d.date} className="flex items-center gap-2" data-track={d.track}>
                <div className="w-[64px] shrink-0 sm:w-[88px]">
                  <p className="tc-ink text-[12.5px] font-semibold leading-tight">{d.label}</p>
                  <p className="mono text-[10.5px] text-muted">{Math.round((dd.busy / dd.span) * 100)}% busy</p>
                </div>
                <div className="relative h-10 flex-1 rounded-md bg-surface-2">
                  {hours.map((h) => (
                    <span key={h} className="absolute inset-y-0 w-px bg-line" style={{ left: `${((h - FROM) / SPAN) * 100}%` }} aria-hidden />
                  ))}
                  {list.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => openSession(s.slug)}
                      title={`${s.startTime}–${s.endTime} ${s.title}`}
                      aria-label={`${s.startTime} to ${s.endTime}: ${s.title}`}
                      className="tc-dot absolute inset-y-1 rounded-[4px] opacity-85 transition hover:opacity-100 hover:ring-2 hover:ring-[var(--fg)]"
                      style={{ left: `calc(${((toMinutes(s.startTime!) - FROM) / SPAN) * 100}% + 1px)`, width: `calc(${(s.durationMinutes! / SPAN) * 100}% - 2px)` }}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <figcaption className="mt-2.5 text-[13px] text-muted">
        Each day opens with a single late-morning presentation, then a near-continuous afternoon block from 14:00 with 5-minute changeovers.{" "}
        {contentDays.map((d, i) => {
          const dd = dayDensity(d.date)!;
          return (
            <span key={d.date}>
              {i > 0 && "; "}
              {d.label}: <span className="mono text-fg-2">{fmtDuration(dd.busy)}</span> across <span className="mono text-fg-2">{fromMinutes(dd.start)}–{fromMinutes(dd.end)}</span>
            </span>
          );
        })}
        .
      </figcaption>
    </figure>
  );
}

/** Each session as a dot on a duration scale, grouped by format. */
export function DurationDots() {
  const { openSession } = useDetail();
  const types: SessionType[] = ["presentation", "fireside-chat", "dialogue", "panel"];
  const MIN = 15, MAX = 55;
  const ticks = [20, 30, 40, 50];
  const avg = (t: SessionType) => {
    const l = timedSessions.filter((s) => s.type === t);
    return l.reduce((a, s) => a + s.durationMinutes!, 0) / l.length;
  };
  return (
    <figure className="min-w-0">
      <div className="rounded-2xl border border-line bg-surface p-4">
        <div className="flex flex-col gap-2.5">
          {types.map((t) => {
            const list = timedSessions.filter((s) => s.type === t);
            const Icon = TYPE_META[t].icon;
            // Stack identical durations vertically so dots never overlap.
            const seen = new Map<number, number>();
            return (
              <div key={t} className="flex items-center gap-2">
                <p className="flex w-[64px] shrink-0 items-center gap-1 text-[12px] font-medium sm:w-[112px]">
                  <Icon size={13} className="text-muted" aria-hidden />
                  <span className="truncate">{TYPE_META[t].plural}</span>
                </p>
                <div className="relative h-11 flex-1 border-l border-line">
                  {ticks.map((m) => (
                    <span key={m} className="absolute inset-y-0 w-px bg-line" style={{ left: `${((m - MIN) / (MAX - MIN)) * 100}%` }} aria-hidden />
                  ))}
                  <span className="absolute inset-y-1 w-0.5 rounded bg-fg/40" style={{ left: `${((avg(t) - MIN) / (MAX - MIN)) * 100}%` }} title={`Average ${Math.round(avg(t))} min`} aria-hidden />
                  {list.map((s) => {
                    const k = seen.get(s.durationMinutes!) ?? 0;
                    seen.set(s.durationMinutes!, k + 1);
                    return (
                      <button
                        key={s.id}
                        data-track={s.track}
                        onClick={() => openSession(s.slug)}
                        aria-label={`${s.title}: ${s.durationMinutes} minutes, ${dateParts(s.date).d} October`}
                        title={`${s.title} · ${s.durationMinutes} min`}
                        className="tc-dot absolute h-3 w-3 -translate-x-1/2 rounded-full ring-2 ring-[var(--surface)] transition hover:scale-125"
                        style={{ left: `${((s.durationMinutes! - MIN) / (MAX - MIN)) * 100}%`, top: 4 + (k % 3) * 12 }}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
          <div className="ml-[72px] flex justify-between sm:ml-[120px]" aria-hidden>
            {[MIN, ...ticks, MAX].map((m) => (
              <span key={m} className="mono text-[10.5px] text-muted">{m}′</span>
            ))}
          </div>
        </div>
      </div>
      <figcaption className="mt-2.5 text-[13px] text-muted">
        Fireside chats are fixed at about 30 minutes; dialogues and panels run 40–50. The two shortest slots, 20 minutes each, are solo presentations: KRDPass and the closing culture talk. The grey tick marks each format’s average.
      </figcaption>
    </figure>
  );
}
