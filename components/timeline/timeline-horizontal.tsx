"use client";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { FoldHorizontal, Maximize2, ZoomIn, ZoomOut } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
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

const ZOOMS = { fit: 0, comfort: 4.6, detail: 7.5 } as const;
type Zoom = keyof typeof ZOOMS;
const LANE_H = 196;
const PAD = 20;
/** Breaks of at least this length can be drawn compressed (clearly marked) to keep sessions readable. */
const LONG_BREAK = 60;
const COLLAPSED_W = 92;

export function axisFor(list: Session[]) {
  const start = Math.min(...list.map((s) => toMinutes(s.startTime!)));
  const end = Math.max(...list.map((s) => toMinutes(s.endTime!)));
  return { from: Math.floor(start / 30) * 30, to: Math.ceil(end / 30) * 30 };
}

export function TimelineHorizontal({ sessions, date, isMatch, probe, nowMin, onOpen }: Props) {
  const reduce = useReducedMotion();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(1100);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [zoom, setZoom] = useState<Zoom>("comfort");
  const [compress, setCompress] = useState(true);
  const [hover, setHover] = useState<{ s: Session; rect: DOMRect } | null>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { has } = usePlanner();

  const { from, to } = useMemo(() => axisFor(sessions), [sessions]);
  const span = to - from;
  const sorted = useMemo(() => [...sessions].sort((a, b) => toMinutes(a.startTime!) - toMinutes(b.startTime!)), [sessions]);
  const gaps = useMemo(() => {
    const g: { a: number; b: number }[] = [];
    for (let i = 1; i < sorted.length; i++) {
      const a = toMinutes(sorted[i - 1].endTime!), b = toMinutes(sorted[i].startTime!);
      if (b > a) g.push({ a, b });
    }
    return g;
  }, [sorted]);
  const folded = useMemo(() => (compress ? gaps.filter((g) => g.b - g.a >= LONG_BREAK) : []), [compress, gaps]);
  const foldedMin = folded.reduce((a, g) => a + (g.b - g.a), 0);
  const fitPpm = (width - PAD * 2 - folded.length * COLLAPSED_W) / (span - foldedMin);
  const ppm = zoom === "fit" ? fitPpm : Math.max(ZOOMS[zoom], fitPpm);
  const inner = Math.round((span - foldedMin) * ppm + folded.length * COLLAPSED_W + PAD * 2);
  /** Minute → pixel. Piecewise linear: real scale everywhere except inside compressed long breaks. */
  const x = useCallback(
    (m: number) => {
      let px = PAD + (m - from) * ppm;
      for (const g of folded) {
        if (m >= g.b) px -= (g.b - g.a) * ppm - COLLAPSED_W;
        else if (m > g.a) px -= (m - g.a) * ppm - ((m - g.a) / (g.b - g.a)) * COLLAPSED_W;
      }
      return px;
    },
    [from, ppm, folded],
  );
  const inFold = (m: number) => folded.some((g) => m > g.a && m < g.b);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  // Bring the interesting moment into view when the day, zoom or probe changes.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const focus = probe ?? (nowMin != null && nowMin >= from && nowMin <= to ? nowMin : null);
    const target = focus != null ? x(focus) - el.clientWidth / 3 : 0;
    el.scrollTo({ left: Math.max(0, target), behavior: reduce ? "auto" : "smooth" });
  }, [date, zoom, probe, compress]); // eslint-disable-line react-hooks/exhaustive-deps

  const ticks = useMemo(() => {
    const out: { m: number; major: boolean }[] = [];
    for (let m = from; m <= to; m += 15) if (!inFold(m)) out.push({ m, major: m % 60 === 0 });
    return out;
  }, [from, to, folded]); // eslint-disable-line react-hooks/exhaustive-deps
  const labelEvery = ppm < 3 ? 60 : 30;

  const showPreview = (s: Session, el: HTMLElement) => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => setHover({ s, rect: el.getBoundingClientRect() }), 260);
  };
  const hidePreview = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    setHover(null);
  };
  useEffect(() => {
    const el = scrollRef.current;
    const h = () => setHover(null);
    window.addEventListener("scroll", h, { passive: true });
    el?.addEventListener("scroll", h, { passive: true });
    return () => { window.removeEventListener("scroll", h); el?.removeEventListener("scroll", h); };
  }, []);

  const onKeyNav = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const btns = [...(e.currentTarget.querySelectorAll<HTMLButtonElement>("[data-block]"))];
    const i = btns.indexOf(document.activeElement as HTMLButtonElement);
    if (i < 0) return;
    e.preventDefault();
    const next = btns[Math.min(btns.length - 1, Math.max(0, i + (e.key === "ArrowRight" ? 1 : -1)))];
    next.focus();
    next.scrollIntoView({ inline: "center", block: "nearest", behavior: reduce ? "auto" : "smooth" });
  };

  const markers = [
    nowMin != null && nowMin >= from && nowMin <= to ? { m: nowMin, kind: "now" as const, label: `Now ${fromMinutes(nowMin)}` } : null,
    probe != null && probe >= from && probe <= to ? { m: probe, kind: "probe" as const, label: fromMinutes(probe) } : null,
  ].filter(Boolean) as { m: number; kind: "now" | "probe"; label: string }[];

  // Minimap geometry
  const mmScale = (width - 2) / inner;
  const viewW = Math.min(width, inner) * mmScale;

  return (
    <div className="relative">
      {/* Minimap: whole day at fit scale, doubles as a scrubber */}
      <div className="mb-3 flex items-center gap-3">
        <div
          className="relative h-9 min-w-0 flex-1 cursor-pointer overflow-hidden rounded-lg border border-line bg-surface"
          role="presentation"
          onPointerDown={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            const ratio = (e.clientX - r.left) / r.width;
            scrollRef.current?.scrollTo({ left: ratio * inner - width / 2, behavior: reduce ? "auto" : "smooth" });
          }}
        >
          {sorted.map((s) => {
            const l = (x(toMinutes(s.startTime!)) / inner) * 100;
            const w = ((x(toMinutes(s.endTime!)) - x(toMinutes(s.startTime!))) / inner) * 100;
            return (
              <span
                key={s.id}
                data-track={s.track}
                className={`absolute inset-y-1.5 rounded-[3px] ${isMatch(s) ? "tc-dot" : "bg-surface-3"}`}
                style={{ left: `calc(${l}% + 1px)`, width: `calc(${w}% - 2px)`, opacity: isMatch(s) ? 0.85 : 1 }}
              />
            );
          })}
          {inner > width && (
            <span
              className="pointer-events-none absolute inset-y-0.5 rounded-md border-2 border-fg/70"
              style={{ left: scrollLeft * mmScale, width: viewW }}
              aria-hidden
            />
          )}
          {markers.map((mk) => (
            <span key={mk.kind} className={`absolute inset-y-0 w-0.5 ${mk.kind === "now" ? "bg-now" : "bg-fg"}`} style={{ left: `${(x(mk.m) / inner) * 100}%` }} aria-hidden />
          ))}
        </div>
        <button
          onClick={() => setCompress((v) => !v)}
          aria-pressed={compress}
          disabled={!gaps.some((g) => g.b - g.a >= LONG_BREAK)}
          title={compress ? "Long breaks are drawn compressed. Click for an exact time scale." : "Exact time scale. Click to compress long breaks."}
          className={`inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-[12.5px] font-medium transition disabled:opacity-40 ${compress ? "border-line bg-surface text-fg-2" : "border-fg bg-fg text-bg"}`}
        >
          <FoldHorizontal size={14} aria-hidden /> {compress ? "Breaks compressed" : "Exact scale"}
        </button>
        <div className="flex shrink-0 items-center gap-0.5 rounded-full border border-line bg-surface p-0.5" role="group" aria-label="Timeline zoom">
          {([
            ["fit", Maximize2, "Fit whole day"],
            ["comfort", ZoomOut, "Comfortable zoom"],
            ["detail", ZoomIn, "Detailed zoom"],
          ] as const).map(([z, Icon, label]) => (
            <button
              key={z}
              onClick={() => setZoom(z)}
              aria-pressed={zoom === z}
              title={label}
              aria-label={label}
              className={`inline-flex h-7 w-8 items-center justify-center rounded-full transition ${zoom === z ? "bg-fg text-bg" : "text-muted hover:text-fg"}`}
            >
              <Icon size={14} />
            </button>
          ))}
        </div>
      </div>

      {/* Ruler: kept outside the scroller so it can stay sticky to the page while panning in sync */}
      <div className="sticky top-[calc(var(--nav-h)+var(--sched-bar,0px))] z-20 -mx-px overflow-hidden rounded-t-xl border border-b-0 border-line bg-surface/90 backdrop-blur" aria-hidden>
        <div className="relative h-9" style={{ width: inner, transform: `translateX(${-scrollLeft}px)` }}>
          {ticks.map((t) => (
            <span key={t.m} className="absolute bottom-0" style={{ left: x(t.m) }}>
              <span className={`absolute bottom-0 w-px ${t.major ? "h-3 bg-line-strong" : "h-1.5 bg-line"}`} />
              {t.m % labelEvery === 0 && (
                <span className={`mono absolute bottom-3.5 -translate-x-1/2 whitespace-nowrap text-[11px] ${t.major ? "font-medium text-fg-2" : "text-muted"}`}>
                  {fromMinutes(t.m)}
                </span>
              )}
            </span>
          ))}
          {markers.map((mk) => (
            <span
              key={mk.kind}
              className={`mono absolute bottom-0.5 -translate-x-1/2 rounded-full px-1.5 text-[10.5px] font-semibold ${mk.kind === "now" ? "bg-now text-white" : "bg-fg text-bg"}`}
              style={{ left: x(mk.m) }}
            >
              {mk.label}
            </span>
          ))}
        </div>
      </div>

      <div
        ref={scrollRef}
        className="thin-scroll relative overflow-x-auto overflow-y-hidden rounded-b-xl border border-line bg-surface"
        onScroll={(e) => setScrollLeft(e.currentTarget.scrollLeft)}
        onKeyDown={onKeyNav}
        role="list"
        aria-label="Sessions in time order. Use left and right arrow keys to move between sessions."
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={date}
            className="relative"
            style={{ width: inner, height: LANE_H + 28 }}
            initial={{ opacity: 0, x: reduce ? 0 : 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: reduce ? 0 : -16 }}
            transition={{ duration: reduce ? 0 : 0.22, ease: [0.2, 0.7, 0.2, 1] }}
          >
            {/* Grid */}
            {ticks.map((t) => (
              <span key={t.m} className={`absolute top-0 bottom-0 w-px ${t.major ? "bg-line" : "bg-line/50"}`} style={{ left: x(t.m) }} aria-hidden />
            ))}
            {/* Gaps */}
            {gaps.map((g) => {
              const w = x(g.b) - x(g.a);
              const isFolded = folded.includes(g);
              return (
                <div
                  key={g.a}
                  className={`stripe absolute top-3.5 flex flex-col items-center justify-end rounded-md ${isFolded ? "border border-dashed border-line-strong" : ""}`}
                  style={{ left: x(g.a) + 2, width: Math.max(0, w - 4), height: LANE_H }}
                  aria-hidden
                >
                  {isFolded && (
                    <svg className="absolute inset-x-0 top-1/2 -translate-y-1/2" height="14" width="100%" preserveAspectRatio="none" viewBox="0 0 40 14">
                      <path d="M0 7 L5 2 L10 12 L15 2 L20 12 L25 2 L30 12 L35 2 L40 7" fill="none" stroke="var(--faint)" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
                    </svg>
                  )}
                  {w > 50 && (
                    <span className="mono mb-2 rounded bg-surface px-1.5 text-center text-[10.5px] leading-tight text-muted">
                      {fmtDuration(g.b - g.a)} break{isFolded && <span className="block text-[9.5px] text-faint">not to scale</span>}
                    </span>
                  )}
                </div>
              );
            })}
            {/* Sessions */}
            {sorted.map((s) => {
              const left = x(toMinutes(s.startTime!)) + 2;
              const w = s.durationMinutes! * ppm - 4;
              const people = participantsOf(s);
              const TypeIcon = TYPE_META[s.type].icon;
              const narrow = w < 132;
              const tiny = w < 70;
              const match = isMatch(s);
              const saved = has(s.id);
              return (
                <div key={s.id} role="listitem" className="group absolute top-3.5" style={{ left, width: w, height: LANE_H }}>
                  <button
                    data-block
                    data-track={s.track}
                    onClick={() => onOpen(s.slug)}
                    onMouseEnter={(e) => showPreview(s, e.currentTarget)}
                    onMouseLeave={hidePreview}
                    onFocus={hidePreview}
                    aria-label={`${s.startTime} to ${s.endTime}, ${TYPE_META[s.type].label}: ${s.title}. ${people.map((p) => p.name).join(", ")}`}
                    className={`tc-soft relative flex h-full w-full flex-col overflow-hidden rounded-[10px] border text-left transition-[transform,box-shadow,opacity] duration-200 hover:-translate-y-0.5 hover:shadow-2 ${
                      saved ? "border-accent" : "tc-line"
                    } ${match ? "" : "opacity-30 saturate-50"}`}
                  >
                    <span className="tc-dot absolute inset-y-0 left-0 w-[3px]" aria-hidden />
                    <span className={`flex h-full flex-col ${tiny ? "px-2 py-2" : "px-3 py-2.5"}`}>
                      <span className="flex items-center gap-1.5 text-[11px] text-muted">
                        <TypeIcon size={12} className="tc-ink shrink-0" aria-hidden />
                        {!tiny && <span className="mono truncate">{narrow ? s.startTime : `${s.startTime}–${s.endTime}`}</span>}
                      </span>
                      <span
                        className={`mt-1.5 font-semibold leading-[1.22] tracking-tight text-fg ${narrow ? "text-[12.5px]" : "text-[14px]"}`}
                        style={{ display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: tiny ? 6 : narrow ? 5 : 3, overflow: "hidden" }}
                      >
                        {s.title}
                      </span>
                      {w >= 150 && people.length > 0 && (
                        <span className="mt-2 line-clamp-2 text-[11.5px] leading-snug text-muted">
                          {people.map((p) => p.name.replace(/\s*\(.*\)/, "")).join(" · ")}
                        </span>
                      )}
                      <span className="mt-auto flex items-end justify-between gap-1 pt-2">
                        {people.length > 0 && <AvatarStack people={people} size={tiny ? 20 : 24} max={tiny ? 2 : narrow ? 3 : 4} />}
                        {!narrow && <span className="mono text-[11px] text-muted">{fmtDuration(s.durationMinutes!)}</span>}
                      </span>
                    </span>
                  </button>
                  {!tiny && (
                    <span className="absolute right-1.5 top-1.5 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100" style={saved ? { opacity: 1 } : undefined}>
                      <BookmarkButton id={s.id} title={s.title} size="sm" />
                    </span>
                  )}
                </div>
              );
            })}
            {/* Markers */}
            {markers.map((mk) => (
              <span
                key={mk.kind}
                className={`pointer-events-none absolute top-0 bottom-0 z-10 w-0.5 ${mk.kind === "now" ? "bg-now" : "border-l-2 border-dashed border-fg"}`}
                style={{ left: x(mk.m) - 1 }}
                aria-hidden
              />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      <HoverPreview hover={hover} />
    </div>
  );
}

function HoverPreview({ hover }: { hover: { s: Session; rect: DOMRect } | null }) {
  const reduce = useReducedMotion();
  const W = 340;
  return (
    <AnimatePresence>
      {hover && (() => {
        const { s, rect } = hover;
        const people = participantsOf(s);
        const below = rect.bottom + 260 < window.innerHeight;
        const left = Math.min(Math.max(12, rect.left + rect.width / 2 - W / 2), window.innerWidth - W - 12);
        const top = below ? rect.bottom + 10 : Math.max(12, rect.top - 10);
        return (
          <motion.div
            key={s.id}
            role="tooltip"
            data-track={s.track}
            className="pointer-events-none fixed z-50 rounded-xl border border-line bg-surface p-3.5 shadow-3"
            style={{ left, top, width: W, translateY: below ? 0 : "-100%" }}
            initial={{ opacity: 0, y: reduce ? 0 : below ? -4 : 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.14 }}
          >
            <p className="mono text-[11.5px] text-muted">
              {s.startTime}–{s.endTime} · {fmtDuration(s.durationMinutes!)} · {TYPE_META[s.type].label}
            </p>
            <p className="mt-1 text-[15px] font-semibold leading-snug">{s.title}</p>
            <ul className="mt-2.5 flex flex-col gap-1.5">
              {people.map((p) => (
                <li key={p.id} className="flex items-center gap-2">
                  <Avatar speaker={p} size={24} />
                  <span className="min-w-0 text-[12.5px] leading-tight">
                    <span className="font-medium">{p.name}</span>
                    {s.moderatorIds.includes(p.id) && <span className="text-muted"> · moderator</span>}
                    <span className="block truncate text-muted">{p.title}</span>
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-2.5 flex flex-wrap gap-1">{s.topics.map((t) => <TopicTag key={t} id={t} />)}</div>
            <p className="mt-2 text-[11px] text-muted">Click for full details</p>
          </motion.div>
        );
      })()}
    </AnimatePresence>
  );
}
