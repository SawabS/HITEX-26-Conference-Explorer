"use client";
/**
 * Seek bar drawn as the episode's loudness waveform. Played bars are revealed by a clip
 * path written every frame; chapter starts are marked and named on hover. Exposed to
 * assistive technology as a slider (arrow keys ±5 s, Page keys ±10 %, Home and End).
 */
import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { chapterAt, fmtClock, peaks, type Episode } from "@/lib/podcasts";
import { usePodcast, useTimeSelect } from "./podcast-provider";

export function Waveform({ ep, compact = false, className = "" }: { ep: Episode; compact?: boolean; className?: string }) {
  const { engine } = usePodcast();
  const box = useRef<HTMLDivElement>(null);
  const played = useRef<HTMLDivElement>(null);
  const head = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [hover, setHover] = useState<number | null>(null);
  const dragging = useRef(false);
  const bar = compact ? 2 : 3;
  const gap = compact ? 1.5 : 2;
  const n = Math.max(24, Math.floor(width / (bar + gap)));
  const bars = useMemo(() => (width ? peaks(ep, n) : []), [ep, n, width]);
  const sec = useTimeSelect((t) => Math.floor(t));
  const dur = ep.duration;

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const paint = () => {
      const p = Math.min(1, engine.getTime() / (dur || 1));
      if (played.current) played.current.style.clipPath = `inset(0 ${((1 - p) * 100).toFixed(3)}% 0 0)`;
      if (head.current) head.current.style.left = `${(p * 100).toFixed(3)}%`;
    };
    paint();
    return engine.subscribeTime(paint);
  }, [engine, dur, width]);

  const posFrom = (e: PointerEvent) => {
    const r = box.current!.getBoundingClientRect();
    return Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * dur;
  };
  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    dragging.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    engine.seek(posFrom(e));
  };
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const t = posFrom(e);
    if (e.pointerType === "mouse") setHover(t);
    if (dragging.current) engine.seek(t);
  };
  const onUp = () => { dragging.current = false; };
  const onKey = (e: KeyboardEvent) => {
    const map: Record<string, number> = { ArrowRight: 5, ArrowUp: 5, ArrowLeft: -5, ArrowDown: -5, PageUp: dur * 0.1, PageDown: -dur * 0.1 };
    if (e.key in map) { e.preventDefault(); engine.skip(map[e.key]); }
    else if (e.key === "Home") { e.preventDefault(); engine.seek(0); }
    else if (e.key === "End") { e.preventDefault(); engine.seek(dur - 0.5); }
  };

  const h = compact ? 22 : 44;
  const hoverCh = hover != null ? ep.chapters[chapterAt(ep, hover)] : null;

  return (
    <div className={`relative select-none ${className}`}>
      <div
        ref={box}
        role="slider"
        tabIndex={0}
        aria-label="Seek"
        aria-valuemin={0}
        aria-valuemax={Math.round(dur)}
        aria-valuenow={sec}
        aria-valuetext={`${fmtClock(sec)} of ${fmtClock(dur)}`}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onPointerLeave={() => setHover(null)}
        onKeyDown={onKey}
        className="group relative cursor-pointer touch-none rounded-md outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-4 focus-visible:ring-offset-transparent"
        style={{ height: h }}
      >
        <Bars bars={bars} bar={bar} cls="bg-white/25" />
        <div ref={played} className="absolute inset-0" style={{ clipPath: "inset(0 100% 0 0)" }}>
          <Bars bars={bars} bar={bar} cls="bg-white shadow-[0_0_8px_rgb(255_255_255/0.35)]" />
        </div>
        {!compact &&
          ep.chapters.slice(1).map((c) => (
            <span key={c.word} className="pointer-events-none absolute -top-2 h-1.5 w-[3px] -translate-x-1/2 rounded-full bg-white/60" style={{ left: `${(c.start / dur) * 100}%` }} />
          ))}
        <div ref={head} className="pointer-events-none absolute -inset-y-1.5 w-[2px] -translate-x-1/2 rounded-full bg-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" />
        {hover != null && !compact && (
          <div className="pointer-events-none absolute bottom-full mb-3 -translate-x-1/2 whitespace-nowrap rounded-lg bg-black/70 px-2.5 py-1.5 text-[12px] text-white shadow-lg backdrop-blur-md" style={{ left: `${(hover / dur) * 100}%` }}>
            <span className="mono">{fmtClock(hover)}</span>
            {hoverCh && <span className="ml-2 text-white/75">{hoverCh.title.length > 42 ? `${hoverCh.title.slice(0, 40)}…` : hoverCh.title}</span>}
          </div>
        )}
      </div>
    </div>
  );
}

function Bars({ bars, bar, cls }: { bars: number[]; bar: number; cls: string }) {
  return (
    <div className="absolute inset-0 flex items-center justify-between">
      {bars.map((p, i) => (
        <span key={i} className={`rounded-full ${cls}`} style={{ width: bar, height: `${Math.max(10, p * 100)}%` }} />
      ))}
    </div>
  );
}
