"use client";
/**
 * Audio engine for the day briefings. One <audio> element lives outside React; components
 * subscribe to two small external stores: engine state (episode, playing, rate) and the
 * playhead time, which ticks every animation frame while playing. Opening the full-screen
 * player is URL state (?listen=<date>), so it deep-links and closes with the Back button.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import { useNav } from "@/lib/nav";
import { episodeByDate, type Episode } from "@/lib/podcasts";

export type EngineState = {
  date: string | null;
  playing: boolean;
  waiting: boolean;
  rate: number;
  error: string | null;
};

const INITIAL: EngineState = { date: null, playing: false, waiting: false, rate: 1, error: null };
const POS_KEY = (d: string) => `hitex-briefing-pos:${d}`;

class PodcastEngine {
  state: EngineState = INITIAL;
  time = 0;
  private audio: HTMLAudioElement | null = null;
  private stateListeners = new Set<() => void>();
  private timeListeners = new Set<() => void>();
  private raf = 0;
  private lastSave = 0;

  subscribe = (cb: () => void) => (this.stateListeners.add(cb), () => void this.stateListeners.delete(cb));
  subscribeTime = (cb: () => void) => (this.timeListeners.add(cb), () => void this.timeListeners.delete(cb));
  getState = () => this.state;
  getTime = () => this.time;

  private patch(p: Partial<EngineState>) {
    this.state = { ...this.state, ...p };
    this.stateListeners.forEach((l) => l());
  }
  private setTime(t: number) {
    if (t === this.time) return;
    this.time = t;
    this.timeListeners.forEach((l) => l());
    if (this.state.date && Math.abs(t - this.lastSave) > 2) this.savePos();
  }
  private savePos() {
    if (!this.state.date) return;
    this.lastSave = this.time;
    try { localStorage.setItem(POS_KEY(this.state.date), String(Math.round(this.time))); } catch { /* storage unavailable */ }
  }
  private readPos(date: string) {
    try { return Number(localStorage.getItem(POS_KEY(date)) ?? 0) || 0; } catch { return 0; }
  }

  private el() {
    if (this.audio) return this.audio;
    const a = document.createElement("audio");
    a.preload = "auto";
    a.addEventListener("play", () => { this.patch({ playing: true, error: null }); this.loop(); });
    a.addEventListener("pause", () => { this.patch({ playing: false }); cancelAnimationFrame(this.raf); this.setTime(a.currentTime); this.savePos(); });
    a.addEventListener("ended", () => { this.patch({ playing: false }); this.setTime(a.duration || this.time); try { if (this.state.date) localStorage.removeItem(POS_KEY(this.state.date)); } catch { /* ignore */ } });
    a.addEventListener("waiting", () => this.patch({ waiting: true }));
    a.addEventListener("playing", () => this.patch({ waiting: false }));
    a.addEventListener("canplay", () => this.patch({ waiting: false }));
    a.addEventListener("seeked", () => this.setTime(a.currentTime));
    a.addEventListener("timeupdate", () => { if (!this.state.playing) this.setTime(a.currentTime); });
    a.addEventListener("ratechange", () => this.patch({ rate: a.playbackRate }));
    a.addEventListener("error", () => this.patch({ playing: false, waiting: false, error: "This briefing could not be loaded." }));
    this.audio = a;
    return a;
  }

  private loop = () => {
    cancelAnimationFrame(this.raf);
    const tick = () => {
      if (this.audio) this.setTime(this.audio.currentTime);
      this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
  };

  load(ep: Episode, autoplay: boolean) {
    const a = this.el();
    if (this.state.date !== ep.date) {
      this.savePos();
      a.pause();
      a.src = ep.audio;
      a.playbackRate = this.state.rate;
      const resume = this.readPos(ep.date);
      const start = resume > 5 && resume < ep.duration - 5 ? resume : 0;
      this.time = start;
      this.lastSave = start;
      if (start) a.addEventListener("loadedmetadata", () => { a.currentTime = start; }, { once: true });
      this.patch({ date: ep.date, playing: false, waiting: autoplay, error: null });
      this.timeListeners.forEach((l) => l());
      this.mediaSession(ep);
    }
    if (autoplay) this.play();
  }

  private mediaSession(ep: Episode) {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: `Day ${ep.dayNumber} briefing: ${ep.label}`,
      artist: "HITEX 2026 Conference Explorer",
      album: "HITEX 2026 day briefings",
    });
    const ms = navigator.mediaSession;
    ms.setActionHandler("play", () => this.play());
    ms.setActionHandler("pause", () => this.pause());
    ms.setActionHandler("seekbackward", () => this.skip(-10));
    ms.setActionHandler("seekforward", () => this.skip(10));
    try { ms.setActionHandler("seekto", (d) => d.seekTime != null && this.seek(d.seekTime)); } catch { /* unsupported */ }
  }

  play() {
    const a = this.el();
    if (!a.src) return;
    if (a.ended) a.currentTime = 0;
    a.play().catch((e: unknown) => {
      const name = e instanceof DOMException ? e.name : "";
      this.patch({ playing: false, waiting: false, error: name === "NotAllowedError" || name === "AbortError" ? null : "Playback failed in this browser." });
    });
  }
  pause() { this.audio?.pause(); }
  toggle() { if (this.state.playing) this.pause(); else this.play(); }
  seek(t: number) {
    const a = this.el();
    const d = a.duration || (this.state.date ? episodeByDate.get(this.state.date)?.duration : 0) || 0;
    const v = Math.max(0, Math.min(d || t, t));
    a.currentTime = v;
    this.setTime(v);
  }
  skip(delta: number) { this.seek(this.time + delta); }
  setRate(r: number) { const a = this.el(); a.playbackRate = r; this.patch({ rate: r }); }
  stop() {
    this.savePos();
    this.audio?.pause();
    if (this.audio) { this.audio.removeAttribute("src"); this.audio.load(); }
    cancelAnimationFrame(this.raf);
    this.time = 0;
    this.patch({ ...INITIAL, rate: this.state.rate });
    this.timeListeners.forEach((l) => l());
  }
}

type PodcastApi = {
  engine: PodcastEngine;
  /** Episode open in the full-screen player (from ?listen=), if any. */
  openDate: string | null;
  open: (date: string, opts?: { autoplay?: boolean }) => void;
  close: () => void;
};

const Ctx = createContext<PodcastApi | null>(null);

export function PodcastProvider({ children }: { children: ReactNode }) {
  const [engine] = useState(() => new PodcastEngine());
  const { params, set } = useNav();
  const listen = params.get("listen");
  const openDate = listen && episodeByDate.has(listen) ? listen : null;

  // Deep link: load (without autoplay, which browsers block) the episode named in the URL.
  useEffect(() => {
    const ep = openDate ? episodeByDate.get(openDate) : undefined;
    if (ep?.available && engine.getState().date !== ep.date) engine.load(ep, false);
  }, [openDate, engine]);

  const open = useCallback(
    (date: string, opts?: { autoplay?: boolean }) => {
      const ep = episodeByDate.get(date);
      if (ep?.available) engine.load(ep, opts?.autoplay ?? true);
      set({ listen: date });
    },
    [engine, set],
  );
  const close = useCallback(() => set({ listen: undefined }), [set]);

  const value = useMemo(() => ({ engine, openDate, open, close }), [engine, openDate, open, close]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePodcast() {
  const c = useContext(Ctx);
  if (!c) throw new Error("usePodcast must be used inside PodcastProvider");
  return c;
}

export function useEngineState() {
  const { engine } = usePodcast();
  return useSyncExternalStore(engine.subscribe, engine.getState, () => INITIAL);
}

/** Subscribe to a derived value of the playhead; re-renders only when the selected value changes. */
export function useTimeSelect<T extends string | number | boolean>(select: (t: number) => T): T {
  const { engine } = usePodcast();
  return useSyncExternalStore(engine.subscribeTime, () => select(engine.getTime()), () => select(0));
}
