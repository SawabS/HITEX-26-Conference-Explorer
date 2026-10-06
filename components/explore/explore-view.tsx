"use client";
import dynamic from "next/dynamic";
import { BookmarkPlus, Check } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { DensityStrips, DurationDots } from "@/components/charts/density";
import { ThemeMatrix } from "@/components/charts/theme-matrix";
import { Avatar } from "@/components/ui/avatar";
import { PhotoBand } from "@/components/ui/photo-band";
import { PHOTOS } from "@/lib/campaign";
import { BookmarkButton, Segmented } from "@/components/ui/badges";
import { TOPICS, TOPIC_BY_ID } from "@/data/topics";
import { days, timedSessions } from "@/lib/data";
import { dateParts, fmtDate, fmtDuration } from "@/lib/format";
import { participantsOf, topicProfile, topicStats } from "@/lib/insights";
import { useDay, useDetail, useNav } from "@/lib/nav";
import { usePlanner } from "@/lib/planner";
import { TYPE_META } from "@/lib/session-meta";
import type { Speaker, TopicId } from "@/types";

const ThemeChart = dynamic(() => import("@/components/charts/theme-chart"), {
  ssr: false,
  loading: () => <div className="skeleton h-[480px] w-full" />,
});
const NetworkGraph = dynamic(() => import("@/components/graph/network-graph"), {
  ssr: false,
  loading: () => <div className="skeleton h-[560px] w-full" />,
});

const SECTIONS = [
  { id: "topics", label: "Themes" },
  { id: "matrix", label: "Theme × day" },
  { id: "rhythm", label: "Schedule rhythm" },
  { id: "network", label: "Network" },
];

export function ExploreView() {
  const { params, set, ready } = useNav();
  const topicParam = params.get("topic") ?? "";
  const selected = topicParam.split(",").filter((t): t is TopicId => t in TOPIC_BY_ID);
  const section = params.get("section");

  useEffect(() => {
    if (!ready) return;
    const target = section ?? (selected.length ? "topics" : null);
    if (!target) return;
    const t = setTimeout(() => document.getElementById(target)?.scrollIntoView({ behavior: "smooth", block: "start" }), 120);
    return () => clearTimeout(t);
  }, [ready, section]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleTopic = (id: TopicId) => {
    const next = selected.includes(id) ? selected.filter((t) => t !== id) : [...selected, id];
    set({ topic: next.join(",") || undefined, section: undefined }, { replace: true });
  };

  return (
    <>
    <PhotoBand photo={PHOTOS.trees} position="50% 40%">
      <header className="mx-auto max-w-[1320px] px-4 pb-10 pt-14 md:px-6 md:pb-14 md:pt-24">
        <p className="eyebrow">Explore · Conference intelligence</p>
        <h1 className="mt-3 text-[32px] font-bold leading-[1.05] tracking-tight md:text-[52px]">How the programme connects</h1>
        <p className="mt-3 max-w-[62ch] text-[15px] text-fg-2">
          Themes are this explorer’s analytical tags, derived from official titles and participant profiles. Every view links back to the sessions and people behind it.
        </p>
      </header>
    </PhotoBand>
    <div className="mx-auto max-w-[1320px] px-4 md:px-6">

      <nav aria-label="Explore sections" className="glass no-print sticky top-[calc(var(--nav-h)+env(safe-area-inset-top,0px))] z-30 -mx-4 border-b border-line px-4 py-2 md:-mx-6 md:px-6">
        <div className="scroll-x flex gap-1">
          {SECTIONS.map((s) => (
            <a key={s.id} href={`#${s.id}`} onClick={(e) => { e.preventDefault(); document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth", block: "start" }); }} className="chip !h-8">
              {s.label}
            </a>
          ))}
        </div>
      </nav>

      <section id="topics" className="scroll-mt-[calc(var(--nav-h)+64px)] pt-8" aria-labelledby="topics-h">
        <h2 id="topics-h" className="text-[20px] font-semibold tracking-tight">Theme explorer</h2>
        <p className="mt-1 text-[13.5px] text-muted">Select one theme to study it, or several to build a shortlist ranked by how many of your interests each session covers.</p>
        <div className="mt-3 flex flex-wrap gap-1.5" role="group" aria-label="Themes">
          {topicStats.map((t) => (
            <button key={t.id} className="chip" aria-pressed={selected.includes(t.id)} onClick={() => toggleTopic(t.id)}>
              {t.short} <span className="mono text-[11.5px] opacity-60">{t.count}</span>
            </button>
          ))}
        </div>
        <div className="mt-4">{selected.length ? <TopicPanel topics={selected} onToggle={toggleTopic} /> : <TopicEmpty onPick={toggleTopic} />}</div>
      </section>

      <section id="matrix" className="scroll-mt-[calc(var(--nav-h)+64px)] pt-14" aria-labelledby="matrix-h">
        <h2 id="matrix-h" className="text-[20px] font-semibold tracking-tight">Theme × day</h2>
        <p className="mb-3 mt-1 text-[13.5px] text-muted">Where each theme concentrates. Shade is minutes on stage; the number is sessions.</p>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
          <ThemeMatrix />
          <ThemeTotals onSelect={(id) => toggleTopic(id as TopicId)} />
        </div>
      </section>

      <section id="rhythm" className="scroll-mt-[calc(var(--nav-h)+64px)] pt-14" aria-labelledby="rhythm-h">
        <h2 id="rhythm-h" className="text-[20px] font-semibold tracking-tight">Schedule rhythm</h2>
        <p className="mb-3 mt-1 text-[13.5px] text-muted">Density through each day on one shared clock, and how long each format runs.</p>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <DensityStrips />
          <DurationDots />
        </div>
      </section>

      <NetworkSection />
    </div>
    </>
  );
}

function ThemeTotals({ onSelect }: { onSelect: (id: string) => void }) {
  const [metric, setMetric] = useState<"count" | "minutes">("count");
  return (
    <figure className="min-w-0 rounded-2xl border border-line bg-surface p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <figcaption className="text-[13.5px] font-medium">Sessions by theme</figcaption>
        <Segmented size="sm" label="Measure" value={metric} onChange={setMetric} options={[{ value: "count", label: "Sessions" }, { value: "minutes", label: "Time" }]} />
      </div>
      <ThemeChart metric={metric} onSelect={onSelect} />
      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[11.5px] text-muted">
        {days.filter((d) => d.track !== "opening").map((d) => (
          <span key={d.date} data-track={d.track} className="inline-flex items-center gap-1.5"><span className="tc-dot h-2 w-2 rounded-sm" /> {d.label}</span>
        ))}
      </div>
      <p className="sr-only">
        {topicStats.map((t) => `${t.label}: ${t.count} sessions, ${t.minutes} minutes.`).join(" ")}
      </p>
    </figure>
  );
}

function TopicEmpty({ onPick }: { onPick: (t: TopicId) => void }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {topicStats.slice(0, 6).map((t) => (
        <button key={t.id} onClick={() => onPick(t.id)} className="panel flex flex-col items-start p-4 text-left transition hover:border-line-strong hover:shadow-2">
          <span className="text-[15px] font-semibold">{t.label}</span>
          <span className="mt-1 text-[12.5px] text-muted">{TOPIC_BY_ID[t.id].description}</span>
          <span className="mono mt-3 text-[12px] text-fg-2">{t.count} sessions · {fmtDuration(t.minutes)}</span>
        </button>
      ))}
    </div>
  );
}

function TopicPanel({ topics, onToggle }: { topics: TopicId[]; onToggle: (t: TopicId) => void }) {
  const { openSession, openSpeaker } = useDetail();
  const planner = usePlanner();
  const multi = topics.length > 1;

  const ranked = useMemo(
    () =>
      timedSessions
        .map((s) => ({ s, hits: s.topics.filter((t) => topics.includes(t)) }))
        .filter((r) => r.hits.length)
        .sort((a, b) => b.hits.length - a.hits.length || (a.s.date + a.s.startTime).localeCompare(b.s.date + b.s.startTime)),
    [topics],
  );
  const profiles = topics.map((t) => topicProfile(t));
  const people = new Map<string, Speaker>();
  for (const r of ranked) for (const p of participantsOf(r.s)) people.set(p.id, p);
  const orgs = new Map<string, number>();
  for (const p of people.values()) for (const o of p.organizations) orgs.set(o, (orgs.get(o) ?? 0) + 1);
  const minutes = ranked.reduce((a, r) => a + r.s.durationMinutes!, 0);
  const adjacent = new Map<TopicId, number>();
  for (const r of ranked) for (const t of r.s.topics) if (!topics.includes(t)) adjacent.set(t, (adjacent.get(t) ?? 0) + 1);
  const contentDays = days.filter((d) => d.track !== "opening");
  const perDay = contentDays.map((d) => ({ d, n: ranked.filter((r) => r.s.date === d.date).length, m: ranked.filter((r) => r.s.date === d.date).reduce((a, r) => a + r.s.durationMinutes!, 0) }));
  const maxDay = Math.max(1, ...perDay.map((x) => x.m));
  const peak = [...perDay].sort((a, b) => b.m - a.m)[0];
  const allSaved = ranked.every((r) => planner.has(r.s.id));

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
      <div className="panel overflow-hidden">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line p-4">
          <div className="min-w-0">
            <h3 className="text-[18px] font-semibold tracking-tight">{topics.map((t) => TOPIC_BY_ID[t].label).join(" + ")}</h3>
            <p className="mt-1 text-[13px] text-muted">
              <span className="mono text-fg-2">{ranked.length}</span> sessions · <span className="mono text-fg-2">{fmtDuration(minutes)}</span> ·{" "}
              <span className="mono text-fg-2">{people.size}</span> people · most on <span className="text-fg-2">{peak.d.label} ({dateParts(peak.d.date).d} Oct)</span>
            </p>
            {!multi && <p className="mt-1 text-[12.5px] text-muted">{profiles[0].topic.description}</p>}
          </div>
          <button
            onClick={() => planner.add(ranked.map((r) => r.s.id))}
            disabled={allSaved}
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-fg px-3.5 text-[13px] font-medium text-bg transition disabled:bg-surface-2 disabled:text-muted"
          >
            {allSaved ? <><Check size={14} /> All saved</> : <><BookmarkPlus size={14} /> Save all {ranked.length}</>}
          </button>
        </div>
        <ol className="divide-y divide-line">
          {ranked.map(({ s, hits }) => {
            const ppl = participantsOf(s);
            return (
              <li key={s.id} data-track={s.track} className="flex items-start gap-3 px-4 py-3">
                <div className="mono w-[70px] shrink-0 text-[12px] leading-tight">
                  <span className="block font-semibold text-fg">{dateParts(s.date).d} Oct</span>
                  <span className="text-muted">{s.startTime}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-x-2 text-[11.5px] text-muted">
                    <span className="tc-dot h-1.5 w-1.5 rounded-full" aria-hidden />
                    {TYPE_META[s.type].label} · {s.durationMinutes} min
                    {multi && <span className="rounded bg-accent-soft px-1.5 text-[10.5px] font-medium text-accent-ink">{hits.length}/{topics.length} interests</span>}
                  </p>
                  <button onClick={() => openSession(s.slug)} className="mt-0.5 text-left text-[15px] font-semibold leading-snug tracking-tight hover:underline hover:decoration-line-strong hover:underline-offset-2">
                    {s.title}
                  </button>
                  <p className="mt-0.5 truncate text-[12.5px] text-muted">{ppl.map((p) => p.name).join(", ")}</p>
                </div>
                <BookmarkButton id={s.id} title={s.title} size="sm" />
              </li>
            );
          })}
        </ol>
      </div>

      <div className="flex flex-col gap-4">
        <div className="panel p-4">
          <p className="eyebrow mb-2.5">By day</p>
          <ul className="flex flex-col gap-2">
            {perDay.map(({ d, n, m }) => (
              <li key={d.date} data-track={d.track} className="flex items-center gap-2 text-[12.5px]">
                <span className="w-[74px] shrink-0 text-fg-2">{d.label}</span>
                <span className="relative h-5 flex-1 overflow-hidden rounded bg-surface-2">
                  <span className="tc-dot absolute inset-y-0 left-0 rounded" style={{ width: `${(m / maxDay) * 100}%` }} />
                </span>
                <span className="mono w-[78px] shrink-0 text-right text-muted">{n} · {m}′</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="panel p-4">
          <p className="eyebrow mb-2.5">People · {people.size}</p>
          <ul className="flex flex-wrap gap-1.5">
            {[...people.values()].map((p) => (
              <li key={p.id}>
                <button onClick={() => openSpeaker(p.slug)} className="flex items-center gap-1.5 rounded-full border border-line py-0.5 pl-0.5 pr-2.5 text-[12.5px] transition hover:border-line-strong hover:bg-surface-2">
                  <Avatar speaker={p} size={22} /> {p.name.replace(/\s*\(.*\)/, "")}
                </button>
              </li>
            ))}
          </ul>
        </div>
        {orgs.size > 0 && (
          <div className="panel p-4">
            <p className="eyebrow mb-2.5">Organisations</p>
            <ul className="flex flex-col gap-1 text-[13px]">
              {[...orgs.entries()].sort((a, b) => b[1] - a[1]).map(([o, n]) => (
                <li key={o} className="flex justify-between gap-2"><span className="text-fg-2">{o}</span>{n > 1 && <span className="mono text-muted">{n}</span>}</li>
              ))}
            </ul>
          </div>
        )}
        {adjacent.size > 0 && (
          <div className="panel p-4">
            <p className="eyebrow mb-2.5">Adjacent themes</p>
            <div className="flex flex-wrap gap-1.5">
              {[...adjacent.entries()].sort((a, b) => b[1] - a[1]).map(([t, n]) => (
                <button key={t} className="chip !h-7 !text-[12.5px]" onClick={() => onToggle(t)}>
                  + {TOPIC_BY_ID[t].short} <span className="mono opacity-60">{n}</span>
                </button>
              ))}
            </div>
            <p className="mt-2 text-[11.5px] text-muted">Themes that co-occur with your selection; add one to widen the shortlist.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function NetworkSection() {
  const [day, setDay] = useDay();
  const { params, set } = useNav();
  const scope = params.get("gscope") === "all" ? "all" : "day";
  const orgs = (params.get("orgs") as "shared" | "all" | "none" | null) ?? "shared";
  const gtopic = (params.get("gtopic") as TopicId | null) ?? null;
  const graphDay = scope === "all" ? "all" : day === "2026-10-06" ? "2026-10-07" : day;
  const topicsHere = TOPICS.filter((t) => timedSessions.some((s) => (graphDay === "all" || s.date === graphDay) && s.topics.includes(t.id)));

  return (
    <section id="network" className="scroll-mt-[calc(var(--nav-h)+64px)] pb-6 pt-14" aria-labelledby="network-h">
      <h2 id="network-h" className="text-[20px] font-semibold tracking-tight">Speaker ↔ session network</h2>
      <p className="mt-1 max-w-[70ch] text-[13.5px] text-muted">
        Who appears together and which organisations tie the programme together. Shown one day at a time by default to stay readable; switch to all days to see cross-day links.
      </p>
      <div className="mt-3 flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Segmented size="sm" label="Network scope" value={scope} onChange={(v) => set({ gscope: v === "all" ? "all" : undefined }, { replace: true })} options={[{ value: "day", label: "One day" }, { value: "all", label: "All days" }]} />
          {scope === "day" && (
            <div className="min-w-0">
              <DayNavigatorCompact value={graphDay} onChange={setDay} />
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 text-[12.5px] text-muted">
            Organisations
            <select value={orgs} onChange={(e) => set({ orgs: e.target.value === "shared" ? undefined : e.target.value }, { replace: true })} className="h-8 rounded-lg border border-line bg-surface px-2 text-[12.5px] text-fg">
              <option value="shared">Shared only</option>
              <option value="all">All</option>
              <option value="none">Hide</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-[12.5px] text-muted">
            Highlight
            <select value={gtopic ?? ""} onChange={(e) => set({ gtopic: e.target.value || undefined }, { replace: true })} className="h-8 rounded-lg border border-line bg-surface px-2 text-[12.5px] text-fg">
              <option value="">No theme</option>
              {topicsHere.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          </label>
        </div>
      </div>
      <div className="mt-3">
        <NetworkGraph key={`${graphDay}|${gtopic}|${orgs}`} day={graphDay} topic={gtopic} orgs={orgs} />
      </div>
    </section>
  );
}

function DayNavigatorCompact({ value, onChange }: { value: string; onChange: (d: string) => void }) {
  const list = days.filter((d) => d.track !== "opening");
  return (
    <div role="radiogroup" aria-label="Network day" className="inline-flex rounded-full border border-line bg-surface-2 p-0.5">
      {list.map((d) => (
        <button
          key={d.date}
          role="radio"
          aria-checked={value === d.date}
          onClick={() => onChange(d.date)}
          data-track={d.track}
          className={`inline-flex h-7 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-medium transition ${value === d.date ? "bg-surface text-fg shadow-1" : "text-muted hover:text-fg"}`}
        >
          <span className="tc-dot h-1.5 w-1.5 rounded-full" aria-hidden />
          {fmtDate(d.date).slice(4)}
        </button>
      ))}
    </div>
  );
}

