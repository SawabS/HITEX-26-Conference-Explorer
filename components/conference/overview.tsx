"use client";
import { BriefingsSection } from "@/components/podcast/briefings";
import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, ArrowUpRight, Radio } from "lucide-react";
import { PHOTOS, PHOTO_CREDIT } from "@/lib/campaign";
import { AvatarStack } from "@/components/ui/avatar";
import { TOPIC_BY_ID, TECH_DAY_TOPICS } from "@/data/topics";
import { days, meta, sessions, stats, timedSessions } from "@/lib/data";
import { dateParts, fmtDate, fmtDuration, fromMinutes, toMinutes } from "@/lib/format";
import { dayDensity, fmtCountdown, liveState, orgsOf, participantsOf } from "@/lib/insights";
import { useDetail } from "@/lib/nav";
import { TRACK_META, TYPE_META } from "@/lib/session-meta";
import { useErbilClock } from "@/components/timeline/use-now";
import { NavLink } from "./app-shell";
import type { ParamPatch, View } from "@/lib/nav";

export function OverviewView() {
  return (
    <>
      <Hero />
      <div className="mx-auto max-w-[1320px] px-4 md:px-6">
        <StatsStrip />
        <BriefingsSection />
        <DayCards />
        <TechSpotlight />
        <CityGallery />
        <Questions />
      </div>
    </>
  );
}

const rise = (i: number) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, delay: 0.15 + i * 0.09, ease: [0.16, 1, 0.3, 1] as const },
});

function Hero() {
  const reduce = useReducedMotion();
  return (
    <section className="on-dark relative isolate -mt-[var(--nav-h)] overflow-hidden pt-[var(--nav-h)]">
      {/* Photograph: right-hand panel on desktop, top band on phones, feathered into the night ground */}
      <motion.div
        className="absolute inset-x-0 top-0 -z-10 h-[430px] [mask-image:linear-gradient(180deg,#000_40%,transparent_96%)] sm:h-[520px] lg:inset-y-0 lg:left-auto lg:right-0 lg:h-full lg:w-[60%] lg:[mask-image:linear-gradient(90deg,transparent_0%,#000_38%)]"
        initial={{ scale: reduce ? 1 : 1.08, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: reduce ? 0 : 1.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <Image
          src={PHOTOS.tower.src}
          alt={PHOTOS.tower.alt}
          fill
          priority
          sizes="(min-width: 1024px) 60vw, 100vw"
          placeholder={typeof PHOTOS.tower.src === "string" ? undefined : "blur"}
          className="object-cover object-[50%_8%] lg:object-[50%_28%]"
        />
        <div aria-hidden className="absolute inset-0 bg-[linear-gradient(180deg,rgb(11_11_21/0.5)_0%,transparent_30%,transparent_60%,rgb(11_11_21/0.75)_100%)]" />
      </motion.div>
      {/* Ambient light: red signal glow and a faint scan grid */}
      <div aria-hidden className="pointer-events-none absolute -left-40 bottom-0 -z-10 h-[560px] w-[560px] rounded-full bg-[radial-gradient(circle,rgb(227_23_58/0.28),transparent_62%)] blur-2xl" />
      <div className="mx-auto flex min-h-[680px] max-w-[1320px] flex-col justify-end gap-8 px-4 pb-24 pt-[330px] sm:pt-[420px] md:px-6 lg:min-h-[min(90vh,880px)] lg:flex-row lg:items-end lg:justify-between lg:pb-28 lg:pt-24">
        <div className="max-w-[640px]">
          <motion.p {...rise(0)} className="mono flex items-center gap-2.5 text-[10.5px] uppercase tracking-[0.1em] text-white/75 sm:text-[11.5px] sm:tracking-[0.16em]">
            <span className="h-px w-8 shrink-0 bg-accent" aria-hidden />
            <span className="sm:hidden">Erbil Fairground · 6–9 Oct 2026</span>
            <span className="hidden sm:inline">Erbil International Fairground · 6–9 Oct 2026</span>
          </motion.p>
          <motion.h1 {...rise(1)} className="mt-5 text-[58px] font-extrabold leading-[0.88] tracking-[-0.05em] text-white sm:text-[80px] lg:text-[112px]">
            HITEX
            <br />
            <span className="bg-[linear-gradient(100deg,#ff2d4f_10%,#ff8a5c_95%)] bg-clip-text text-transparent">2026</span>
          </motion.h1>
          <motion.p {...rise(2)} className="mt-4 text-[24px] font-semibold leading-tight tracking-[-0.02em] text-white/85 sm:text-[32px]" style={{ fontFamily: "var(--font-display)" }}>
            Conference Explorer
          </motion.p>
          <motion.p {...rise(3)} className="mt-4 max-w-[50ch] text-[15.5px] leading-relaxed text-white/70 md:text-[16.5px]">
            Twenty-two sessions, forty-nine people and three themed days, laid out at their real times. Trace who speaks where, how AI, data and security
            thread through the programme, and build your own agenda.
          </motion.p>
          <motion.div {...rise(4)} className="mt-7 flex flex-wrap gap-2.5">
            <NavLink view="schedule" className="inline-flex h-11 items-center gap-2 rounded-full bg-accent px-6 text-[14.5px] font-semibold text-white shadow-[0_10px_30px_-8px_rgb(227_23_58/0.75)] transition hover:brightness-110">
              Open the timeline <ArrowRight size={16} />
            </NavLink>
            <NavLink view="explore" params={{ topic: "ai" }} className="inline-flex h-11 items-center gap-2 rounded-full border border-white/25 bg-white/10 px-6 text-[14.5px] font-semibold text-white backdrop-blur-md transition hover:bg-white/20">
              Explore AI sessions
            </NavLink>
          </motion.div>
        </div>
        <motion.div {...rise(5)} className="w-full lg:mb-2 lg:max-w-[400px]">
          <LiveStatus />
        </motion.div>
      </div>
    </section>
  );
}

function CityGallery() {
  const items = [PHOTOS.tower, PHOTOS.speakers, PHOTOS.curved, PHOTOS.trees];
  return (
    <section className="pt-16" aria-labelledby="city-h">
      <div className="mb-4">
        <p className="eyebrow">{PHOTO_CREDIT}</p>
        <h2 id="city-h" className="mt-1.5 text-[22px] font-semibold tracking-tight md:text-[26px]">Erbil, the week of HITEX</h2>
      </div>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-[1.1fr_1fr_1fr] md:grid-rows-[220px_220px] md:gap-3">
        {items.map((p, i) => (
          <figure
            key={p.caption}
            className={`group relative overflow-hidden rounded-2xl bg-surface ${
              i === 0 ? "col-span-2 aspect-[4/3] md:col-span-1 md:row-span-2 md:aspect-auto" : i === 1 ? "col-span-2 aspect-[16/7] md:aspect-auto" : "aspect-[4/3] md:aspect-auto"
            }`}
          >
            <Image
              src={p.src}
              alt={p.alt}
              fill
              sizes="(min-width: 768px) 40vw, 100vw"
              placeholder={typeof p.src === "string" ? undefined : "blur"}
              className="object-cover transition duration-700 ease-out group-hover:scale-[1.03]"
              style={{ objectPosition: i === 0 ? "50% 30%" : "50% 50%" }}
            />
            <figcaption className="absolute inset-x-0 bottom-0 bg-[linear-gradient(transparent,rgb(12_12_22/0.85))] px-3 pb-2.5 pt-8 text-[12px] font-medium text-white/90">
              {p.caption}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

function LiveStatus() {
  const clock = useErbilClock();
  const { openSession } = useDetail();
  if (!clock) return <div className="h-[228px] rounded-2xl border border-white/15 bg-white/5 backdrop-blur-xl" aria-hidden />;
  const st = liveState();
  const first = Date.UTC(2026, 9, 6);
  const nowAbs = Date.UTC(+clock.date.slice(0, 4), +clock.date.slice(5, 7) - 1, +clock.date.slice(8, 10)) + clock.minutes * 60000;
  const progress = Math.min(1, Math.max(0, (nowAbs - first) / (4 * 86400000)));
  const dayIdx = days.findIndex((d) => d.date === clock.date);

  const label =
    st.phase === "before" ? "Conference opens October 6" : st.phase === "after" ? "HITEX 2026 has ended" : `Day ${dayIdx + 1} of 4 · ${days[dayIdx]?.label}`;


  return (
    <aside className="rounded-2xl border border-white/15 bg-[rgb(14_14_28/0.55)] p-4 shadow-[0_30px_80px_-20px_rgb(0_0_0/0.8)] backdrop-blur-xl md:p-5" aria-label="Conference status">
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-[13px] font-medium">
          {st.phase === "during" && <Radio size={14} className="pulse-dot text-now" aria-hidden />}
          {label}
        </p>
        <p className="mono text-[12px] text-muted">Erbil {fromMinutes(clock.minutes)}</p>
      </div>
      <div className="mt-3 grid grid-cols-4 gap-1" aria-hidden>
        {days.map((d, i) => {
          const fill = Math.min(1, Math.max(0, progress * 4 - i));
          return (
            <div key={d.date} data-track={d.track}>
              <div className="h-1.5 overflow-hidden rounded-full bg-surface-3">
                <div className="tc-dot h-full rounded-full" style={{ width: `${fill * 100}%` }} />
              </div>
              <p className={`mono mt-1 text-[10.5px] ${i === dayIdx ? "text-fg" : "text-muted"}`}>{dateParts(d.date).d} Oct</p>
            </div>
          );
        })}
      </div>
      <div className="mt-2 -mx-1.5">
        {st.phase === "before" && <StatusRow onOpen={openSession} kind={`First session in ${fmtCountdown(st.nextStartsInMin)}`} s={st.next} />}
        {st.phase === "during" && (
          <>
            {dayIdx === 0 && !st.current && (
              <div className="flex items-start gap-3 rounded-xl p-2.5" data-track="opening">
                <span className="tc-dot mt-1.5 h-2 w-2 shrink-0 rounded-full" />
                <span>
                  <span className="eyebrow !text-[10px]">Today</span>
                  <span className="mt-0.5 block text-[15px] font-semibold leading-snug">Official opening and exhibition tour</span>
                  <span className="mt-0.5 block text-[12px] text-muted">Ceremony time not published by HITEX</span>
                </span>
              </div>
            )}
            {st.current && <StatusRow onOpen={openSession} kind="Happening now" s={st.current} extra={`ends ${st.current.endTime}`} />}
            {st.next && <StatusRow onOpen={openSession} kind={`Next · in ${fmtCountdown(st.nextStartsInMin!)}`} s={st.next} />}
          </>
        )}
        {st.phase === "after" && <p className="p-2.5 text-[14px] text-muted">The programme has finished. Every session remains explorable below.</p>}
      </div>
    </aside>
  );
}

function StatusRow({ kind, s, extra, onOpen }: { kind: string; s: (typeof sessions)[number]; extra?: string; onOpen: (slug: string) => void }) {
  return (
    <button onClick={() => onOpen(s.slug)} data-track={s.track} className="group flex w-full items-start gap-3 rounded-xl p-2.5 text-left transition hover:bg-surface-2">
      <span className="tc-dot mt-1.5 h-2 w-2 shrink-0 rounded-full" />
      <span className="min-w-0 flex-1">
        <span className="eyebrow !text-[10px]">{kind}</span>
        <span className="mt-0.5 block text-[15px] font-semibold leading-snug">{s.title}</span>
        <span className="mono mt-0.5 block text-[12px] text-muted">
          {fmtDate(s.date)} · {s.startTime}–{s.endTime}{extra ? ` · ${extra}` : ""}
        </span>
      </span>
      <ArrowUpRight size={15} className="mt-1 shrink-0 text-faint transition group-hover:text-fg" />
    </button>
  );
}

function StatsStrip() {
  const items = [
    { k: "Conference sessions", v: String(stats.sessions), sub: "plus the opening ceremony" },
    { k: "Identified people", v: String(stats.people), sub: `${stats.speakersOnly} speakers · ${stats.moderators} moderators` },
    { k: "Time on stage", v: fmtDuration(stats.totalMinutes), sub: "across Oct 7–9" },
    { k: "Tracks", v: String(stats.tracks), sub: "Economy · Technology · Content" },
    { k: "Organisations", v: String(stats.organizations), sub: "named in official profiles" },
  ];
  return (
    <section aria-label="Programme at a glance" className="relative z-10 -mt-12 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line shadow-2 sm:grid-cols-3 lg:grid-cols-5">
      {items.map((it, i) => (
        <div key={it.k} className={`bg-surface px-4 py-4 md:px-5 ${i === items.length - 1 ? "col-span-2 sm:col-span-1" : ""}`}>
          <p className="eyebrow !text-[10px]">{it.k}</p>
          <p className="mono mt-1.5 whitespace-nowrap text-[22px] font-medium leading-none tracking-tight sm:text-[26px] md:text-[30px]">{it.v}</p>
          <p className="mt-1.5 text-[12px] text-muted">{it.sub}</p>
        </div>
      ))}
    </section>
  );
}

function DayCards() {
  return (
    <section className="pt-12" aria-labelledby="days-h">
      <div className="mb-4 flex items-end justify-between">
        <h2 id="days-h" className="text-[22px] font-semibold tracking-tight">Four days, one theme each</h2>
        <NavLink view="schedule" className="hidden items-center gap-1 text-[13.5px] text-muted hover:text-fg sm:inline-flex">
          Full schedule <ArrowRight size={14} />
        </NavLink>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {days.map((d) => {
          const dd = dayDensity(d.date);
          const list = timedSessions.filter((s) => s.date === d.date);
          const p = dateParts(d.date);
          return (
            <NavLink
              key={d.date}
              view="schedule"
              params={{ day: d.date }}
              className="panel group flex flex-col p-4 transition hover:-translate-y-0.5 hover:shadow-2"
            >
              <div data-track={d.track} className="flex items-baseline justify-between">
                <span className="mono text-[12px] text-muted">{p.weekday} {p.d} Oct</span>
                <span className="tc-ink text-[12px] font-semibold">{d.label}</span>
              </div>
              <p className="mt-3 text-[15px] font-semibold leading-snug">{TRACK_META[d.track].theme}</p>
              <div className="mt-4" aria-hidden>
                {dd ? (
                  <div className="relative h-6 rounded-md bg-surface-2">
                    {list.map((s) => (
                      <span
                        key={s.id}
                        data-track={s.track}
                        className="tc-dot absolute inset-y-1 rounded-[3px]"
                        style={{ left: `calc(${((toMinutes(s.startTime!) - 660) / 450) * 100}% + 1px)`, width: `calc(${(s.durationMinutes! / 450) * 100}% - 2px)` }}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="stripe flex h-6 items-center rounded-md px-2 text-[10.5px] text-muted">Opening ceremony</div>
                )}
                <div className="mono mt-1 flex justify-between text-[10px] text-faint"><span>11:00</span><span>18:30</span></div>
              </div>
              <p className="mt-3 text-[12.5px] text-muted">
                {dd ? <><span className="mono text-fg-2">{dd.count}</span> sessions · <span className="mono text-fg-2">{fmtDuration(dd.busy)}</span></> : "Guests of honour tour the exhibition"}
              </p>
            </NavLink>
          );
        })}
      </div>
    </section>
  );
}

const SPOTLIGHT_SLUGS = ["the-ai-era-government-innovation-and-global", "prompt-or-think", "the-power-of-data", "trust-no-one", "can-we-build-what-we-use"];

function TechSpotlight() {
  const { openSession, openSpeaker } = useDetail();
  const list = sessions.filter((s) => s.date === "2026-10-08" && s.startTime).sort((a, b) => a.startTime!.localeCompare(b.startTime!));
  return (
    <section className="pt-14" aria-labelledby="tech-h">
      <div data-track="technology" className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="eyebrow tc-ink !text-[var(--tc-ink)]">Thursday 8 October · Technology</p>
          <h2 id="tech-h" className="mt-1.5 text-[22px] font-semibold tracking-tight md:text-[26px]">The Technology day, mapped</h2>
          <p className="mt-1 max-w-[60ch] text-[14px] text-muted">Seven sessions on AI, data, security and digital government. Follow a theme or a person across the afternoon.</p>
        </div>
        <div className="scroll-x -mx-1 flex gap-1.5 px-1">
          {TECH_DAY_TOPICS.map((t) => (
            <NavLink key={t} view="explore" params={{ topic: t }} className="chip">
              {TOPIC_BY_ID[t].short}
            </NavLink>
          ))}
        </div>
      </div>
      <ol className="panel divide-y divide-line overflow-hidden">
        {list.map((s) => {
          const people = participantsOf(s);
          const orgs = orgsOf(s);
          const key = SPOTLIGHT_SLUGS.includes(s.slug);
          return (
            <li key={s.id} data-track={s.track} className="grid gap-3 p-4 md:grid-cols-[96px_minmax(0,1.3fr)_minmax(0,1fr)] md:items-start md:gap-5 md:px-5">
              <div className="mono flex items-baseline gap-2 text-[13px] md:block">
                <span className="font-semibold text-fg">{s.startTime}</span>
                <span className="text-muted md:block">{fmtDuration(s.durationMinutes!)}</span>
              </div>
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-[11.5px] text-muted">
                  {TYPE_META[s.type].label}
                  {key && <span className="rounded bg-accent-soft px-1.5 py-px text-[10.5px] font-medium text-accent-ink">Key session</span>}
                </p>
                <button onClick={() => openSession(s.slug)} className="mt-0.5 text-left text-[16px] font-semibold leading-snug tracking-tight hover:underline hover:decoration-line-strong hover:underline-offset-2">
                  {s.title}
                </button>
                <div className="mt-2 flex flex-wrap gap-1">
                  {s.topics.map((t) => (
                    <NavLink key={t} view="explore" params={{ topic: t }} className="inline-flex h-6 items-center rounded-md border border-line bg-surface-2 px-2 text-[12px] text-fg-2 hover:border-line-strong">
                      {TOPIC_BY_ID[t].short}
                    </NavLink>
                  ))}
                </div>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <AvatarStack people={people} size={28} />
                </div>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted">
                  {people.map((p, i) => (
                    <span key={p.id}>
                      {i > 0 && ", "}
                      <button onClick={() => openSpeaker(p.slug)} className="text-fg-2 hover:text-fg hover:underline">{p.name}</button>
                    </span>
                  ))}
                </p>
                {orgs.length > 0 && <p className="mt-1 text-[12px] text-muted">{orgs.join(" · ")}</p>}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

const QUESTIONS: { q: string; view: View; params: ParamPatch; hint: string }[] = [
  { q: "What is happening at 15:30 on October 8?", view: "schedule", params: { day: "2026-10-08", at: "15:30" }, hint: "Timeline with a time probe" },
  { q: "Which sessions concern artificial intelligence?", view: "explore", params: { topic: "ai" }, hint: "Theme explorer" },
  { q: "Who is speaking about cybersecurity?", view: "explore", params: { topic: "cybersecurity" }, hint: "Sessions, people, organisations" },
  { q: "Which people appear together?", view: "explore", params: { section: "network" }, hint: "Speaker ↔ session network" },
  { q: "Which day has the most AI-related content?", view: "explore", params: { section: "matrix" }, hint: "Theme × day matrix" },
  { q: "What should I attend for AI and enterprise technology?", view: "explore", params: { topic: "ai,enterprise" }, hint: "Ranked shortlist you can save" },
];

function Questions() {
  return (
    <section className="pb-6 pt-14" aria-labelledby="q-h">
      <h2 id="q-h" className="mb-4 text-[22px] font-semibold tracking-tight">Start with a question</h2>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {QUESTIONS.map((x) => (
          <NavLink key={x.q} view={x.view} params={x.params} className="group flex items-start justify-between gap-4 rounded-2xl border border-line bg-surface p-4 transition hover:border-line-strong hover:shadow-1">
            <span>
              <span className="block text-[15px] font-medium leading-snug">{x.q}</span>
              <span className="mt-1 block text-[12.5px] text-muted">{x.hint}</span>
            </span>
            <ArrowRight size={16} className="mt-0.5 shrink-0 text-faint transition group-hover:translate-x-0.5 group-hover:text-fg" />
          </NavLink>
        ))}
      </div>
    </section>
  );
}
