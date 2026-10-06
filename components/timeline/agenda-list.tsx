"use client";
import { BookmarkButton } from "@/components/ui/badges";
import { days } from "@/lib/data";
import { fmtDate, fmtDuration } from "@/lib/format";
import { participantsOf } from "@/lib/insights";
import { TYPE_META } from "@/lib/session-meta";
import type { Session } from "@/types";

/** Dense, conventional list for fast scanning. Grouped by day when several days are shown. */
export function AgendaList({ sessions, isMatch, onOpen, showDay }: { sessions: Session[]; isMatch: (s: Session) => boolean; onOpen: (slug: string) => void; showDay: boolean }) {
  const groups = days
    .map((d) => ({ day: d, list: sessions.filter((s) => s.date === d.date) }))
    .filter((g) => g.list.length);
  return (
    <div className="flex flex-col gap-8">
      {groups.map(({ day, list }) => (
        <section key={day.date} aria-label={`${fmtDate(day.date, "long")}, ${day.label}`}>
          {showDay && (
            <h3 data-track={day.track} className="mb-2 flex items-center gap-2 text-[13px] font-semibold">
              <span className="tc-dot h-2 w-2 rounded-full" aria-hidden />
              {fmtDate(day.date, "long")} · {day.label}
            </h3>
          )}
          <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
            {list.map((s) => {
              const people = participantsOf(s);
              const Icon = TYPE_META[s.type].icon;
              const match = isMatch(s);
              return (
                <li key={s.id} data-track={s.track} className={`group flex items-start gap-3 px-3 py-3 transition hover:bg-surface-2 sm:gap-4 sm:px-4 ${match ? "" : "opacity-35"}`}>
                  <div className="mono w-[58px] shrink-0 pt-0.5 text-[13px] leading-tight sm:w-[104px]">
                    {s.startTime ? (
                      <>
                        <span className="block font-semibold text-fg sm:inline">{s.startTime}</span>
                        <span className="block text-muted sm:inline">
                          <span className="hidden sm:inline">–</span>
                          {s.endTime}
                        </span>
                        <span className="mt-0.5 block text-[11px] text-muted">{fmtDuration(s.durationMinutes!)}</span>
                      </>
                    ) : (
                      <span className="block font-sans text-[11.5px] leading-snug text-muted">Time not published</span>
                    )}
                  </div>
                  <button onClick={() => onOpen(s.slug)} className="min-w-0 flex-1 text-left">
                    <span className="flex items-center gap-1.5 text-[11.5px] text-muted">
                      <span className="tc-dot h-1.5 w-1.5 rounded-full" aria-hidden />
                      <Icon size={12} aria-hidden /> {TYPE_META[s.type].label}
                    </span>
                    <span className="mt-0.5 block text-[15px] font-semibold leading-snug tracking-tight text-fg group-hover:underline group-hover:decoration-line-strong group-hover:underline-offset-2">
                      {s.title}
                    </span>
                    {people.length > 0 && (
                      <span className="mt-1 block text-[12.5px] leading-snug text-muted">
                        {people.map((p, i) => (
                          <span key={p.id}>
                            {i > 0 && ", "}
                            <span className="text-fg-2">{p.name}</span>
                            {s.moderatorIds.includes(p.id) && " (mod.)"}
                          </span>
                        ))}
                      </span>
                    )}
                  </button>
                  <BookmarkButton id={s.id} title={s.title} size="sm" />
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
