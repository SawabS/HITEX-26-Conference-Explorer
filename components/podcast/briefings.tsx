"use client";
/** Entry points into the day briefings: Overview cards, the header button and the schedule button. */
import { Headphones, Pause, Play } from "lucide-react";
import { dateParts, erbilNow } from "@/lib/format";
import { availableEpisodes, episodeByDate, episodes, fmtClock, peaks, suggestedEpisode, type Episode } from "@/lib/podcasts";
import { VoiceOrb } from "./aura";
import { useEngineState, usePodcast } from "./podcast-provider";

export function BriefingsSection() {
  return (
    <section className="pt-12" aria-labelledby="brief-h">
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Listen</p>
          <h2 id="brief-h" className="mt-1 text-[22px] font-semibold tracking-tight">Each day, briefed in two minutes</h2>
        </div>
        <p className="max-w-[52ch] text-[13px] text-muted sm:text-right">
          Audio previews of every programme day with a word-by-word live transcript. Made with NotebookLM from the official agenda; names checked against it.
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {episodes.map((ep) => <BriefingCard key={ep.date} ep={ep} />)}
      </div>
    </section>
  );
}

function BriefingCard({ ep }: { ep: Episode }) {
  const { open } = usePodcast();
  const st = useEngineState();
  const p = dateParts(ep.date);
  const current = st.date === ep.date;
  const playing = current && st.playing;
  const sessionsCount = ep.chapters.filter((c) => c.session).length;
  const bars = ep.available ? peaks(ep, 56) : [];

  const body = (
    <>
      <span aria-hidden className="briefing-aura absolute inset-0" data-off={!ep.available || undefined} />
      <span aria-hidden className="absolute inset-0 bg-[linear-gradient(to_top,rgb(10_6_14/0.75),transparent_70%)]" />
      <span className="relative flex items-center justify-between text-[12px] text-white/75">
        <span className="mono">Day {ep.dayNumber} · {p.weekday} {p.d} Oct</span>
        {ep.available ? <span className="mono">{fmtClock(ep.duration)}</span> : <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide">Coming soon</span>}
      </span>
      <span className="relative mt-6 block text-[30px] font-bold leading-none tracking-[-0.03em]" style={{ fontFamily: "var(--font-display)" }}>{ep.label}</span>
      <span className="relative mt-2 block text-[13px] text-white/75">
        {ep.available ? `${sessionsCount} sessions previewed, with live transcript` : "The audio for this day has not been added yet."}
      </span>
      <span className="relative mt-auto flex items-end gap-3 pt-6">
        <span aria-hidden className="flex h-9 flex-1 items-center justify-between">
          {bars.map((b, i) => <span key={i} className="w-[2px] rounded-full bg-white/45" style={{ height: `${Math.max(12, b * 100)}%` }} />)}
        </span>
        {ep.available && (
          <span className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-[#394766] shadow-[0_10px_30px_-8px_rgb(66_82_126/0.35)] transition group-hover:scale-105`}>
            {playing ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="translate-x-px" />}
          </span>
        )}
      </span>
      {current && (
        <span className="absolute right-3 top-10 flex items-center gap-1.5 text-[11px] font-medium text-white/85">
          <VoiceOrb ep={ep} size={22} /> {playing ? "Playing" : "Paused"}
        </span>
      )}
    </>
  );

  const cls = "on-dark group relative flex min-h-[208px] flex-col overflow-hidden rounded-2xl p-4 text-left text-white ring-1 ring-white/10 md:p-5";
  return ep.available ? (
    <button onClick={() => open(ep.date, { autoplay: !playing })} className={`${cls} transition hover:-translate-y-0.5 hover:shadow-2 hover:ring-white/25`} aria-label={`Play the Day ${ep.dayNumber} ${ep.label} briefing, ${fmtClock(ep.duration)}`}>
      {body}
    </button>
  ) : (
    <div className={`${cls} opacity-80`}>{body}</div>
  );
}

/** Header button: resumes the loaded briefing, or starts the one for the next programme day. */
export function ListenButton() {
  const { open } = usePodcast();
  const st = useEngineState();
  if (!availableEpisodes.length) return null;
  const onClick = () => {
    if (st.date) open(st.date, { autoplay: false });
    else open(suggestedEpisode(erbilNow().date)!.date, { autoplay: true });
  };
  return (
    <button
      onClick={onClick}
      className="relative inline-flex h-9 w-9 items-center justify-center rounded-full text-muted transition hover:bg-surface-2 hover:text-fg"
      aria-label="Day briefings: listen"
      title="Day briefings"
    >
      <Headphones size={18} />
      {st.playing && <span aria-hidden className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#ff4d66] shadow-[0_0_8px_#ff4d66]" />}
    </button>
  );
}

export function ScheduleListenButton({ date }: { date: string }) {
  const { open } = usePodcast();
  const ep = episodeByDate.get(date);
  if (!ep?.available) return null;
  return (
    <button
      onClick={() => open(date, { autoplay: true })}
      className="no-print mt-5 inline-flex h-10 items-center gap-2.5 rounded-full bg-white pl-1.5 pr-4 text-[13.5px] font-semibold text-[#16050c] shadow-[0_10px_30px_-10px_rgb(66_82_126/0.35)] transition hover:-translate-y-0.5"
    >
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#52658e] text-white"><Headphones size={15} /></span>
      Listen to the Day {ep.dayNumber} briefing
      <span className="mono font-normal text-[#16050c]/60">{fmtClock(ep.duration)}</span>
    </button>
  );
}
