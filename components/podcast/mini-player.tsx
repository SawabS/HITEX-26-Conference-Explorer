"use client";
/** Compact player that keeps a briefing playing while the visitor browses the explorer. */
import { AnimatePresence, motion } from "motion/react";
import { Maximize2, Pause, Play, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { chapterAt, episodeByDate } from "@/lib/podcasts";
import { VoiceOrb } from "./aura";
import { useEngineState, usePodcast, useTimeSelect } from "./podcast-provider";

export function MiniPlayer() {
  const { engine, openDate, open } = usePodcast();
  const st = useEngineState();
  const ep = st.date ? episodeByDate.get(st.date) : undefined;
  const show = !!ep && !openDate;
  const ci = useTimeSelect((t) => (ep ? chapterAt(ep, t) : 0));
  const bar = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!ep) return;
    const paint = () => { if (bar.current) bar.current.style.transform = `scaleX(${Math.min(1, engine.getTime() / ep.duration)})`; };
    paint();
    return engine.subscribeTime(paint);
  }, [engine, ep, show]);

  const chapter = ep?.chapters[ci];
  return (
    <AnimatePresence>
      {show && ep && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ type: "spring", stiffness: 380, damping: 32 }}
          className="on-dark no-print fixed inset-x-2 bottom-[calc(var(--tabbar-h)+env(safe-area-inset-bottom,0px)+8px)] z-[45] md:inset-x-auto md:bottom-5 md:right-5 md:w-[400px]"
          role="region"
          aria-label="Briefing player"
        >
          <div className="relative overflow-hidden rounded-2xl bg-[linear-gradient(120deg,#181b30,#10111f_60%,#13132a)] text-white shadow-[0_18px_50px_-12px_rgb(0_0_0/0.8)] ring-1 ring-white/12">
            <div className="flex items-center gap-2.5 p-2.5 pr-2">
              <button onClick={() => open(ep.date, { autoplay: false })} className="flex min-w-0 flex-1 items-center gap-2.5 text-left" aria-label="Open full-screen player">
                <VoiceOrb ep={ep} size={40} />
                <span className="min-w-0">
                  <span className="block truncate text-[13.5px] font-semibold">Day {ep.dayNumber} briefing · {ep.label}</span>
                  <span className="block truncate text-[12px] text-white/65">{chapter?.session ? `${chapter.session.startTime} · ${chapter.title}` : chapter?.title}</span>
                </span>
              </button>
              <button onClick={() => engine.toggle()} aria-label={st.playing ? "Pause" : "Play"} className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-[#c3102f] transition active:scale-95">
                {st.playing ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="translate-x-px" />}
              </button>
              <button onClick={() => open(ep.date, { autoplay: false })} aria-label="Expand player" className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full text-white/75 transition hover:bg-white/10 hover:text-white sm:inline-flex">
                <Maximize2 size={16} />
              </button>
              <button onClick={() => engine.stop()} aria-label="Close player" className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white/75 transition hover:bg-white/10 hover:text-white">
                <X size={17} />
              </button>
            </div>
            <span aria-hidden className="absolute inset-x-0 bottom-0 h-[2px] bg-white/10">
              <span ref={bar} className="absolute inset-0 origin-left bg-[#8b9cc3]" style={{ transform: "scaleX(0)" }} />
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
