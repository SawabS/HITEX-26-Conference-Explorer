"use client";
import { days } from "@/lib/data";
import { dateParts, fmtDuration } from "@/lib/format";
import { topicStats } from "@/lib/insights";
import { useNav } from "@/lib/nav";

const contentDays = days.filter((d) => d.track !== "opening");

/** Theme × day matrix. Cell shade encodes minutes on stage; the number is the session count. */
export function ThemeMatrix() {
  const { go } = useNav();
  const max = Math.max(...topicStats.flatMap((t) => contentDays.map((d) => t.byDay[d.date].minutes)));
  const ai = topicStats.find((t) => t.id === "ai");
  const aiPeak = ai && [...contentDays].sort((a, b) => ai.byDay[b.date].minutes - ai.byDay[a.date].minutes)[0];

  return (
    <figure className="min-w-0">
      <div className="thin-scroll overflow-x-auto rounded-2xl border border-line bg-surface">
        <table className="w-full min-w-0 sm:min-w-[460px] border-collapse text-[13px]">
          <caption className="sr-only">Sessions per theme on each conference day, with minutes on stage.</caption>
          <thead>
            <tr className="border-b border-line">
              <th scope="col" className="px-3 py-2.5 text-left font-medium text-muted">Theme</th>
              {contentDays.map((d) => (
                <th key={d.date} scope="col" data-track={d.track} className="px-2 py-2.5 text-left font-medium">
                  <span className="mono block text-[11px] text-muted">{dateParts(d.date).d} Oct</span>
                  <span className="tc-ink">{d.label}</span>
                </th>
              ))}
              <th scope="col" className="hidden px-3 py-2.5 text-right font-medium text-muted sm:table-cell">Total</th>
            </tr>
          </thead>
          <tbody>
            {topicStats.map((t) => (
              <tr key={t.id} className="border-b border-line last:border-0">
                <th scope="row" className="px-3 py-1.5 text-left font-medium">
                  <button onClick={() => go("explore", { topic: t.id, section: "topics" })} className="text-left hover:underline">
                    <span className="sm:hidden">{t.short}</span>
                    <span className="hidden sm:inline">{t.label}</span>
                  </button>
                </th>
                {contentDays.map((d) => {
                  const c = t.byDay[d.date];
                  const a = c.minutes / max;
                  return (
                    <td key={d.date} className="p-1" data-track={d.track}>
                      <button
                        disabled={!c.count}
                        onClick={() => go("schedule", { day: d.date, topic: t.id })}
                        aria-label={`${t.label}, ${d.label}: ${c.count} sessions, ${c.minutes} minutes`}
                        className="flex h-9 w-full items-center justify-between rounded-md px-2 text-left transition enabled:hover:ring-2 enabled:hover:ring-[var(--tc)]"
                        style={{ background: c.count ? `color-mix(in oklab, var(--tc) ${Math.round(10 + a * 62)}%, var(--surface))` : "transparent" }}
                      >
                        <span className={`mono text-[13px] font-semibold ${a > 0.55 ? "text-[var(--surface)]" : "text-fg"}`}>{c.count || <span className="font-normal text-faint">·</span>}</span>
                        {c.count > 0 && <span className={`mono text-[10.5px] ${a > 0.55 ? "text-[var(--surface)]" : "text-muted"}`}>{c.minutes}′</span>}
                      </button>
                    </td>
                  );
                })}
                <td className="mono hidden px-3 text-right text-fg-2 sm:table-cell">{t.count} <span className="hidden text-[11px] text-muted sm:inline">· {fmtDuration(t.minutes)}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {ai && aiPeak && (
        <figcaption className="mt-2.5 text-[13px] text-muted">
          AI runs through every day: <span className="mono text-fg-2">{ai.count}</span> sessions in total, peaking on{" "}
          <span className="text-fg-2">{aiPeak.label} day ({dateParts(aiPeak.date).d} Oct)</span> with <span className="mono text-fg-2">{ai.byDay[aiPeak.date].count}</span> sessions and{" "}
          <span className="mono text-fg-2">{fmtDuration(ai.byDay[aiPeak.date].minutes)}</span> on stage. Select a cell to open that day with the theme highlighted.
        </figcaption>
      )}
    </figure>
  );
}
