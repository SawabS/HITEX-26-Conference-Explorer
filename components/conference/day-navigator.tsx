"use client";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { days } from "@/lib/data";
import { dateParts, erbilNow } from "@/lib/format";

export function useToday() {
  const [today, setToday] = useState<string | null>(null);
  useEffect(() => {
    const tick = () => setToday(erbilNow().date);
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);
  return today;
}

/** Compact segmented date selector; Oct 6 Opening → Oct 9 Content. */
export function DayNavigator({ value, onChange, layoutId = "day-pill", allOption }: { value: string; onChange: (d: string) => void; layoutId?: string; allOption?: boolean }) {
  const today = useToday();
  const reduce = useReducedMotion();
  const items = [...days.map((d) => ({ key: d.date, track: d.track, top: `${dateParts(d.date).weekday} ${dateParts(d.date).d}`, bottom: d.label, short: d.short })), ...(allOption ? [{ key: "all", track: undefined, top: "All", bottom: "4 days", short: "4 days" }] : [])];
  return (
    <div role="tablist" aria-label="Conference day" className="scroll-x -mx-1 flex gap-1 px-1">
      {items.map((d) => {
        const active = d.key === value;
        return (
          <button
            key={d.key}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(d.key)}
            data-track={d.track}
            aria-label={`${d.top}, ${d.bottom}${today === d.key ? ", today" : ""}`}
            className={`relative flex min-w-0 flex-1 flex-col items-start rounded-xl px-2 py-1.5 text-left transition sm:min-w-[104px] sm:px-3 ${active ? "text-fg" : "text-muted hover:text-fg"}`}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 rounded-xl border border-line-strong bg-surface shadow-1"
                transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 40 }}
              />
            )}
            <span className="relative flex items-center gap-1.5 text-[11.5px]">
              <span className="mono">{d.top}</span>
              {today === d.key && (
                <>
                  <span className="h-1.5 w-1.5 rounded-full bg-now sm:hidden" aria-hidden />
                  <span className="hidden rounded-full bg-now px-1.5 text-[9.5px] font-semibold uppercase tracking-wide text-white sm:inline">Today</span>
                </>
              )}
            </span>
            <span className="relative flex max-w-full items-center gap-1.5 text-[12px] font-semibold sm:text-[13.5px]">
              {d.track && <span className="tc-dot h-1.5 w-1.5 shrink-0 rounded-full" aria-hidden />}
              <span className="truncate sm:hidden">{d.short}</span>
              <span className="hidden truncate sm:inline">{d.bottom}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
