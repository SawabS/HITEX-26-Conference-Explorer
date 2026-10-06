"use client";
/**
 * Full-screen briefing player. A crimson light field reacts to the voice while the
 * transcript is set in large white type and lit word by word. Two reading modes: Live
 * (the current sentence, karaoke style) and Transcript (the whole text by chapter, with
 * click-to-seek and follow-along scrolling). Chapters link each passage to its session.
 */
import { AnimatePresence, motion } from "motion/react";
import { AudioLines, ChevronDown, Loader2, Pause, Play, RotateCcw, RotateCw, SkipBack, SkipForward, TextQuote } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { AvatarStack } from "@/components/ui/avatar";
import { speakerById } from "@/lib/data";
import { useNav } from "@/lib/nav";
import { chapterAt, episodeByDate, episodes, fmtClock, sentenceOf, wordAt, type Chapter, type Episode } from "@/lib/podcasts";
import { Aura, VoiceOrb } from "./aura";
import { useEngineState, usePodcast, useTimeSelect } from "./podcast-provider";
import { Waveform } from "./waveform";

const LEAD = 0.08; // highlight a word a touch before it is heard
const FORMAT: Record<string, string> = { presentation: "Presentation", panel: "Panel", dialogue: "Dialogue", "fireside-chat": "Fireside chat" };

export function BriefingPlayer() {
  const { openDate } = usePodcast();
  return <AnimatePresence>{openDate && <PlayerDialog key="player" date={openDate} />}</AnimatePresence>;
}

function PlayerDialog({ date }: { date: string }) {
  const { engine, close, open } = usePodcast();
  const { set } = useNav();
  const ep = episodeByDate.get(date)!;
  const state = useEngineState();
  const [mode, setMode] = useState<"live" | "transcript">("live");
  const root = useRef<HTMLDivElement>(null);
  const playBtn = useRef<HTMLButtonElement>(null);

  // Focus, scroll lock and focus restore.
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    const html = document.documentElement;
    const overflow = html.style.overflow;
    html.style.overflow = "hidden";
    const id = requestAnimationFrame(() => playBtn.current?.focus({ preventScroll: true }));
    return () => {
      cancelAnimationFrame(id);
      html.style.overflow = overflow;
      prev?.focus?.({ preventScroll: true });
    };
  }, []);

  // Keyboard shortcuts.
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement;
      const onControl = !!t.closest("button, a, input, [role=slider], [role=tab]");
      if (e.key === "Escape") { e.preventDefault(); close(); return; }
      if (!ep.available) return;
      if ((e.key === " " && !onControl) || e.key === "k") { e.preventDefault(); engine.toggle(); }
      else if (e.key === "ArrowLeft" && !t.closest("[role=slider]")) { e.preventDefault(); engine.skip(-5); }
      else if (e.key === "ArrowRight" && !t.closest("[role=slider]")) { e.preventDefault(); engine.skip(5); }
      else if (e.key === "j") engine.skip(-10);
      else if (e.key === "l") engine.skip(10);
      else if (e.key === "t") setMode((m) => (m === "live" ? "transcript" : "live"));
    };
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  }, [engine, close, ep.available]);

  const trap = (e: ReactKeyboardEvent) => {
    if (e.key !== "Tab" || !root.current) return;
    const f = [...root.current.querySelectorAll<HTMLElement>("button:not([disabled]), a[href], [tabindex='0']")].filter((x) => x.offsetParent !== null);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };

  const openSession = useCallback((slug: string) => set({ listen: undefined, session: slug }), [set]);
  const switchTo = (d: string) => {
    if (d === date) return;
    const next = episodeByDate.get(d)!;
    if (next.available) open(d, { autoplay: state.playing });
    else set({ listen: d }, { replace: true });
  };

  return (
    <motion.div
      ref={root}
      role="dialog"
      aria-modal="true"
      aria-label={`Day ${ep.dayNumber} briefing: ${ep.label}`}
      onKeyDown={trap}
      className="on-dark fixed inset-0 z-[58] flex flex-col overflow-hidden text-white"
      initial={{ opacity: 0, scale: 1.02 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.02 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
    >
      <Aura ep={ep} />

      <div className="relative flex min-h-0 flex-1 flex-col pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)]">
        {/* Top bar */}
        <div className="mx-auto flex w-full max-w-[1180px] items-center gap-3 px-4 pt-3 md:px-8 md:pt-5">
          <div className="flex min-w-0 items-baseline gap-2">
            <span className="text-[17px] font-extrabold leading-none tracking-[-0.04em]" style={{ fontFamily: "var(--font-display)" }}>
              HITEX<span className="ml-[0.26em] text-[#ff4d66]">26</span>
            </span>
            <span className="truncate border-l border-white/25 pl-2 text-[12.5px] font-medium leading-none text-white/70">Day briefings</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {ep.available && (
              <div role="group" aria-label="Reading mode" className="flex rounded-full bg-white/10 p-0.5 ring-1 ring-white/15 backdrop-blur-md">
                {(["live", "transcript"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    aria-pressed={mode === m}
                    className={`inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 text-[12.5px] font-medium transition sm:px-3 ${mode === m ? "bg-white text-[#16050c]" : "text-white/80 hover:text-white"}`}
                  >
                    {m === "live" ? <AudioLines size={14} aria-hidden /> : <TextQuote size={14} aria-hidden />}
                    <span className={m === mode ? "" : "sr-only sm:not-sr-only"}>{m === "live" ? "Live" : "Transcript"}</span>
                  </button>
                ))}
              </div>
            )}
            <button
              onClick={close}
              aria-label="Minimise player"
              title="Minimise (Esc)"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/15 backdrop-blur-md transition hover:bg-white/20"
            >
              <ChevronDown size={18} aria-hidden />
            </button>
          </div>
        </div>

        {/* Episode tabs */}
        <div role="tablist" aria-label="Briefing" className="no-scrollbar mx-auto mt-3 flex w-full max-w-[1180px] gap-1.5 overflow-x-auto px-4 md:mt-4 md:px-8">
          {episodes.map((e) => {
            const active = e.date === date;
            return (
              <button
                key={e.date}
                role="tab"
                aria-selected={active}
                ref={active ? (el) => el?.scrollIntoView({ block: "nearest", inline: "center" }) : undefined}
                onClick={() => switchTo(e.date)}
                className={`inline-flex h-9 shrink-0 items-center gap-2 rounded-full px-3.5 text-[13px] font-medium ring-1 transition ${
                  active ? "bg-white text-[#16050c] ring-white" : "bg-black/20 text-white/80 ring-white/15 backdrop-blur-md hover:text-white hover:ring-white/30"
                }`}
              >
                <span className="mono hidden text-[11.5px] opacity-70 sm:inline">Day {e.dayNumber}</span>
                {e.label}
                {!e.available && <span className={`rounded-full px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide ${active ? "bg-[#16050c]/10" : "bg-white/10"}`}>Soon</span>}
              </button>
            );
          })}
        </div>

        {ep.available ? (
          <>
            <div className="relative min-h-0 flex-1">
              {mode === "live" ? <LiveTranscript ep={ep} /> : <FullTranscript ep={ep} onOpenSession={openSession} />}
            </div>
            <div className="mx-auto w-full max-w-[1180px] px-4 pb-4 md:px-8 md:pb-8">
              <NowDiscussing ep={ep} onOpenSession={openSession} />
              <Waveform ep={ep} className="mt-4 md:mt-5" />
              <TimeRow ep={ep} />
              <Controls ep={ep} playRef={playBtn} />
              {state.error && <p role="alert" className="mt-2 text-center text-[13px] text-white/85">{state.error}</p>}
            </div>
          </>
        ) : (
          <Unavailable ep={ep} />
        )}
      </div>
    </motion.div>
  );
}

/* ---------- Live (karaoke) view ---------- */

function LiveTranscript({ ep }: { ep: Episode }) {
  const { engine } = usePodcast();
  const wi = useTimeSelect((t) => wordAt(ep, t + LEAD));
  const ended = useTimeSelect((t) => t >= ep.duration - 0.3);
  const si = sentenceOf(ep, wi);
  const [a, b] = ep.sentences[si];
  const words = ep.words.slice(a, b + 1);
  const count = words.length;
  const size = count > 30 ? "text-[22px] sm:text-[30px] lg:text-[38px]" : count > 20 ? "text-[24px] sm:text-[34px] lg:text-[44px]" : "text-[27px] sm:text-[40px] lg:text-[52px]";
  const sentenceText = (i: number) => {
    const s = ep.sentences[i];
    return s ? ep.words.slice(s[0], s[1] + 1).map((w) => w.text).join(" ") : "";
  };

  return (
    <div className="mx-auto flex h-full w-full max-w-[1040px] flex-col justify-center px-5 md:px-10">
      <p aria-hidden className="mb-5 line-clamp-2 max-w-[60ch] text-[14px] leading-snug text-white/35 transition-all sm:text-[16px] md:mb-8">
        {sentenceText(si - 1)}
      </p>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.p
          key={si}
          initial={{ opacity: 0, y: 28, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -28, filter: "blur(6px)" }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className={`${size} font-semibold leading-[1.16] tracking-[-0.025em] [text-wrap:pretty]`}
          style={{ fontFamily: "var(--font-display)" }}
        >
          {words.map((w, k) => {
            const i = a + k;
            const state = ended || i < wi ? "said" : i === wi ? "now" : "next";
            return (
              <span key={i}>
                <span
                  onClick={() => { engine.seek(w.start); engine.play(); }}
                  className={`cursor-pointer rounded-md transition-[color,text-shadow] duration-200 ${
                    state === "said" ? "text-white" : state === "now" ? "text-white [text-shadow:0_0_22px_rgb(255_255_255/0.55)]" : "text-white/30 hover:text-white/60"
                  }`}
                >
                  {w.text}
                </span>{" "}
              </span>
            );
          })}
        </motion.p>
      </AnimatePresence>
      <p aria-hidden className="mt-5 line-clamp-2 max-w-[60ch] text-[14px] leading-snug text-white/30 sm:text-[16px] md:mt-8">
        {sentenceText(si + 1)}
      </p>
    </div>
  );
}

/* ---------- Full transcript view ---------- */

function FullTranscript({ ep, onOpenSession }: { ep: Episode; onOpenSession: (slug: string) => void }) {
  const scroller = useRef<HTMLDivElement>(null);
  const [follow, setFollow] = useState(true);
  const lastUser = useRef(0);
  const markUser = () => { lastUser.current = Date.now(); setFollow(false); };

  return (
    <div className="relative h-full">
      <div
        ref={scroller}
        onWheel={markUser}
        onTouchMove={markUser}
        className="no-scrollbar h-full overflow-y-auto px-5 py-6 [mask-image:linear-gradient(to_bottom,transparent,black_6%,black_90%,transparent)] md:px-10"
      >
        <div className="mx-auto max-w-[760px] pb-16">
          {ep.chapters.map((c, ci) => (
            <TranscriptChapter key={c.word} ep={ep} index={ci} follow={follow} scroller={scroller} onOpenSession={onOpenSession} />
          ))}
        </div>
      </div>
      {!follow && (
        <button
          onClick={() => setFollow(true)}
          className="absolute bottom-3 left-1/2 inline-flex h-9 -translate-x-1/2 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold text-[#16050c] shadow-xl"
        >
          <AudioLines size={14} aria-hidden /> Follow along
        </button>
      )}
    </div>
  );
}

function TranscriptChapter({
  ep,
  index,
  follow,
  scroller,
  onOpenSession,
}: {
  ep: Episode;
  index: number;
  follow: boolean;
  scroller: React.RefObject<HTMLDivElement | null>;
  onOpenSession: (slug: string) => void;
}) {
  const { engine } = usePodcast();
  const c = ep.chapters[index];
  const from = c.word;
  const to = (ep.chapters[index + 1]?.word ?? ep.words.length) - 1;
  // Clamp so this chapter re-renders only while the playhead is inside it.
  const wi = useTimeSelect((t) => {
    const w = wordAt(ep, t + LEAD);
    return w < from ? from - 1 : w > to ? to + 1 : w;
  });
  const active = wi >= from && wi <= to;
  const activeEl = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!follow || !active || !activeEl.current || !scroller.current) return;
    const el = activeEl.current, sc = scroller.current;
    const top = sc.scrollTop + (el.getBoundingClientRect().top - sc.getBoundingClientRect().top) - sc.clientHeight * 0.4;
    sc.scrollTo({ top, behavior: "smooth" });
  }, [wi, follow, active, scroller]);

  return (
    <section className={`relative border-l-2 py-4 pl-4 transition-colors md:pl-6 ${active ? "border-white" : "border-white/15"}`}>
      <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1">
        <button onClick={() => { engine.seek(c.start); engine.play(); }} className="mono rounded-md bg-white/10 px-1.5 py-0.5 text-[12px] text-white/85 transition hover:bg-white/20">
          {fmtClock(c.start)}
        </button>
        <h3 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-white/70">{c.session ? `${c.session.startTime} · ${c.title}` : c.title}</h3>
        {c.session && (
          <button onClick={() => onOpenSession(c.session!.slug)} className="text-[12.5px] text-white/60 underline decoration-white/30 underline-offset-2 hover:text-white">
            Session details
          </button>
        )}
      </div>
      <p className="text-[19px] leading-[1.55] md:text-[22px]" style={{ fontFamily: "var(--font-display)" }}>
        {ep.words.slice(from, to + 1).map((w, k) => {
          const i = from + k;
          const now = i === wi;
          return (
            <span key={i}>
              <span
                ref={now ? activeEl : undefined}
                onClick={() => { engine.seek(w.start); engine.play(); }}
                className={`cursor-pointer rounded-[5px] px-[1px] transition-colors duration-150 ${
                  now ? "bg-white text-[#16050c]" : i < wi ? "text-white" : "text-white/50 hover:text-white/80"
                }`}
              >
                {w.text}
              </span>{" "}
            </span>
          );
        })}
      </p>
    </section>
  );
}

/* ---------- Now discussing ---------- */

function NowDiscussing({ ep, onOpenSession }: { ep: Episode; onOpenSession: (slug: string) => void }) {
  const ci = useTimeSelect((t) => chapterAt(ep, t + LEAD));
  const c: Chapter = ep.chapters[ci];
  const sessionsInEp = ep.chapters.filter((x) => x.session);
  const n = c.session ? sessionsInEp.findIndex((x) => x.word === c.word) + 1 : 0;
  const people = c.session ? c.session.participants.map((p) => speakerById.get(p.speakerId)).filter((x) => !!x) : [];

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={ci}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.25 }}
        className="flex min-h-[64px] items-center gap-3 rounded-2xl bg-black/25 p-3 ring-1 ring-white/12 backdrop-blur-xl md:gap-4 md:p-3.5"
      >
        {c.session ? (
          <>
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-x-2 text-[11.5px] font-medium uppercase tracking-[0.08em] text-white/60">
                <span>Now discussing</span>
                <span aria-hidden>·</span>
                <span className="mono normal-case tracking-normal">{c.session.startTime}–{c.session.endTime}</span>
                <span aria-hidden className="hidden sm:inline">·</span>
                <span className="hidden sm:inline">{FORMAT[c.session.type] ?? "Session"}</span>
                <span aria-hidden className="hidden sm:inline">·</span>
                <span className="hidden normal-case tracking-normal sm:inline">Session {n} of {sessionsInEp.length}</span>
              </p>
              <p className="mt-1 truncate text-[15px] font-semibold md:text-[16px]">{c.session.title}</p>
            </div>
            <span className="hidden sm:block"><AvatarStack people={people} size={30} max={4} /></span>
            <button
              onClick={() => onOpenSession(c.session!.slug)}
              className="shrink-0 rounded-full bg-white px-3.5 py-2 text-[12.5px] font-semibold text-[#16050c] transition hover:bg-white/90"
            >
              Details
            </button>
          </>
        ) : (
          <div className="min-w-0 flex-1">
            <p className="text-[11.5px] font-medium uppercase tracking-[0.08em] text-white/60">{c.title}</p>
            <p className="mt-1 truncate text-[15px] font-semibold md:text-[16px]">
              Day {ep.dayNumber} · {ep.label} · {sessionsInEp.length} sessions in {fmtClock(ep.duration)}
            </p>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

/* ---------- Transport ---------- */

function TimeRow({ ep }: { ep: Episode }) {
  const sec = useTimeSelect((t) => Math.floor(t));
  return (
    <div className="mono mt-2 flex justify-between text-[12px] text-white/70" aria-hidden>
      <span>{fmtClock(sec)}</span>
      <span>-{fmtClock(ep.duration - sec)}</span>
    </div>
  );
}

const RATES = [1, 1.25, 1.5, 2, 0.75];

function Controls({ ep, playRef }: { ep: Episode; playRef: React.RefObject<HTMLButtonElement | null> }) {
  const { engine } = usePodcast();
  const st = useEngineState();
  const ci = useTimeSelect((t) => chapterAt(ep, t + LEAD));
  const prevChapter = () => {
    const c = ep.chapters[ci];
    const target = engine.getTime() - c.start > 2 || ci === 0 ? c : ep.chapters[ci - 1];
    engine.seek(target.start);
  };
  const nextChapter = () => { const c = ep.chapters[ci + 1]; if (c) engine.seek(c.start); };
  const nextRate = RATES[(RATES.indexOf(st.rate) + 1) % RATES.length] ?? 1;
  const icon = "inline-flex h-11 w-11 items-center justify-center rounded-full text-white/85 transition hover:bg-white/10 hover:text-white disabled:opacity-30";

  return (
    <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center">
      <div>
        <button
          onClick={() => engine.setRate(nextRate)}
          className="mono inline-flex h-9 min-w-[52px] items-center justify-center rounded-full bg-white/10 px-2.5 text-[12.5px] font-medium ring-1 ring-white/15 transition hover:bg-white/20"
          aria-label={`Playback speed ${st.rate}×, change to ${nextRate}×`}
        >
          {st.rate}×
        </button>
      </div>
      <div className="flex items-center gap-1 sm:gap-3">
        <button onClick={prevChapter} className={`${icon} hidden sm:inline-flex`} aria-label="Previous chapter"><SkipBack size={20} /></button>
        <button onClick={() => engine.skip(-10)} className={icon} aria-label="Back 10 seconds"><RotateCcw size={21} /></button>
        <button
          ref={playRef}
          onClick={() => engine.toggle()}
          aria-label={st.playing ? "Pause" : "Play"}
          className="relative mx-1 inline-flex h-[68px] w-[68px] items-center justify-center rounded-full bg-white text-[#c3102f] shadow-[0_12px_40px_-8px_rgb(227_23_58/0.8)] transition hover:scale-[1.04] active:scale-95 md:h-[76px] md:w-[76px]"
        >
          {st.waiting && st.playing ? <Loader2 size={28} className="animate-spin" /> : st.playing ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" className="translate-x-[2px]" />}
        </button>
        <button onClick={() => engine.skip(10)} className={icon} aria-label="Forward 10 seconds"><RotateCw size={21} /></button>
        <button onClick={nextChapter} disabled={ci >= ep.chapters.length - 1} className={`${icon} hidden sm:inline-flex`} aria-label="Next chapter"><SkipForward size={20} /></button>
      </div>
      <div className="flex justify-end">
        <VoiceOrb ep={ep} size={36} />
      </div>
    </div>
  );
}

function Unavailable({ ep }: { ep: Episode }) {
  const { go } = useNav();
  return (
    <div className="mx-auto flex w-full max-w-[640px] flex-1 flex-col items-center justify-center px-6 text-center">
      <VoiceOrb ep={undefined} size={72} />
      <p className="mt-6 text-[13px] font-medium uppercase tracking-[0.1em] text-white/60">Day {ep.dayNumber} · {ep.label}</p>
      <h2 className="mt-2 text-[28px] font-semibold leading-tight tracking-tight md:text-[40px]" style={{ fontFamily: "var(--font-display)" }}>
        This briefing is on its way.
      </h2>
      <p className="mt-3 max-w-[46ch] text-[15px] leading-relaxed text-white/75">
        The audio overview for the {ep.label} day has not been added yet. In the meantime, the full {ep.label} programme is in the schedule.
      </p>
      <button
        onClick={() => go("schedule", { day: ep.date })}
        className="mt-6 rounded-full bg-white px-5 py-2.5 text-[14px] font-semibold text-[#16050c] transition hover:bg-white/90"
      >
        Open the {ep.label} schedule
      </button>
    </div>
  );
}
