"use client";
/**
 * The briefing visualiser: soft navy light fields with a restrained rose accent that breathe with the voice.
 * Driven by the precomputed envelope (loudness, low/mid/high bands, pitch) sampled at the
 * playhead, so it is identical on every device and needs no Web Audio graph. Transforms are
 * written straight to the DOM each frame; React never re-renders for animation.
 */
import { useEffect, useRef } from "react";
import { sampleEnvelope, type Episode } from "@/lib/podcasts";
import { usePodcast } from "./podcast-provider";

const BLOBS = [
  { color: "49 61 105", size: 95, left: -28, top: 30 },
  { color: "61 82 125", size: 70, left: 55, top: -22 },
  { color: "60 54 99", size: 80, left: 28, top: 58 },
  { color: "156 68 89", size: 34, left: 22, top: 14 },
];

const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 .55 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

export function Aura({ ep }: { ep: Episode | undefined }) {
  const { engine } = usePodcast();
  const refs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const v = [0, 0, 0, 0, 0];
    const s = [0, 0, 0, 0, 0];
    const t0 = performance.now();
    let raf = 0;
    const write = (now: number) => {
      const playing = engine.getState().playing;
      if (ep?.available && playing) sampleEnvelope(ep, engine.getTime(), v);
      else v.fill(0);
      const k = playing ? 0.24 : 0.04;
      for (let c = 0; c < 5; c++) s[c] += (v[c] - s[c]) * k;
      const [rms, low, mid, high, pitch] = s;
      const tm = (now - t0) / 1000;
      const idle = reduce ? 0.5 : 0.5 + 0.5 * Math.sin(tm * 0.55);
      const drift = reduce ? 0 : 1;
      const set = (i: number, x: number, y: number, sc: number, op: number) => {
        const el = refs.current[i];
        if (!el) return;
        el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) scale(${sc.toFixed(3)})`;
        el.style.opacity = op.toFixed(3);
      };
      set(0, Math.sin(tm * 0.13) * 40 * drift, Math.cos(tm * 0.11) * 24 * drift, 0.9 + 0.32 * low + 0.06 * idle, 0.72 + 0.28 * rms);
      set(1, Math.cos(tm * 0.17) * 36 * drift, (-pitch * 70 + Math.sin(tm * 0.15) * 26) * drift, 0.82 + 0.42 * mid + 0.05 * idle, 0.46 + 0.5 * mid);
      set(2, (pitch * 90 + Math.sin(tm * 0.09) * 50) * drift, Math.cos(tm * 0.12) * 30 * drift, 0.92 + 0.3 * high, 0.5 + 0.45 * high);
      set(3, 0, -rms * 18 * drift, 0.75 + 0.6 * rms + 0.04 * idle, 0.06 + 0.18 * rms);
      if (!reduce) raf = requestAnimationFrame(write);
    };
    raf = requestAnimationFrame(write);
    return () => cancelAnimationFrame(raf);
  }, [engine, ep]);

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden" style={{ background: "linear-gradient(165deg, #13132a 0%, #0b0b15 48%, #171a2d 100%)" }}>
      {BLOBS.map((b, i) => (
        <div
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          className="absolute rounded-full will-change-transform"
          style={{
            width: `${b.size}vmax`,
            height: `${b.size}vmax`,
            left: `${b.left}%`,
            top: `${b.top}%`,
            background: `radial-gradient(closest-side, rgb(${b.color} / 0.95), rgb(${b.color} / 0.55) 38%, rgb(${b.color} / 0.16) 68%, transparent 100%)`,
            opacity: 0.5,
          }}
        />
      ))}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{ backgroundImage: "linear-gradient(rgb(255 255 255 / 1) 1px, transparent 1px), linear-gradient(90deg, rgb(255 255 255 / 1) 1px, transparent 1px)", backgroundSize: "56px 56px" }}
      />
      <div className="absolute inset-0 opacity-[0.16] mix-blend-overlay" style={{ backgroundImage: GRAIN }} />
      <div className="absolute inset-0" style={{ background: "radial-gradient(120% 90% at 50% 42%, transparent 35%, rgb(11 11 21 / 0.65) 100%)" }} />
      <div className="absolute inset-x-0 bottom-0 h-[42%]" style={{ background: "linear-gradient(to top, rgb(11 11 21 / 0.9), rgb(11 11 21 / 0.4) 55%, transparent)" }} />
    </div>
  );
}

/** Small live orb used by the mini-player and play buttons: scales with loudness. */
export function VoiceOrb({ ep, size = 40, className = "" }: { ep: Episode | undefined; size?: number; className?: string }) {
  const { engine } = usePodcast();
  const ring = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const v = [0, 0, 0, 0, 0];
    let s = 0, raf = 0;
    const tick = () => {
      const playing = engine.getState().playing;
      if (ep?.available && playing) sampleEnvelope(ep, engine.getTime(), v); else v[0] = 0;
      s += (v[0] - s) * (playing ? 0.3 : 0.08);
      if (ring.current) {
        ring.current.style.transform = `scale(${(1 + s * 0.55).toFixed(3)})`;
        ring.current.style.opacity = (0.25 + s * 0.6).toFixed(3);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [engine, ep]);
  return (
    <span aria-hidden className={`relative inline-flex shrink-0 items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <span ref={ring} className="absolute inset-0 rounded-full bg-[radial-gradient(closest-side,rgb(126_147_194/0.5),rgb(67_81_126/0.2)_60%,transparent)] opacity-30" />
      <span className="relative h-[46%] w-[46%] rounded-full bg-[radial-gradient(circle_at_35%_30%,#c2cce5,#6276a4_55%,#303952)] shadow-[0_0_18px_rgb(91_112_163/0.3)]" />
    </span>
  );
}
