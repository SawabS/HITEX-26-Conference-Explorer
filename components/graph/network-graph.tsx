"use client";
import { ArrowUpRight, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { TOPIC_BY_ID } from "@/data/topics";
import { sessionsBySpeaker } from "@/lib/data";
import { fmtDate } from "@/lib/format";
import { buildGraph, clip, neighbours, shortTitle, type GNode } from "@/lib/graph";
import { useDetail } from "@/lib/nav";
import { TYPE_META } from "@/lib/session-meta";
import type { TopicId } from "@/types";

type Props = { day: string | "all"; topic: TopicId | null; orgs: "shared" | "all" | "none" };

export default function NetworkGraph({ day, topic, orgs }: Props) {
  const [hover, setHover] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const { openSession, openSpeaker } = useDetail();

  const g = useMemo(() => buildGraph({ day, topic, orgs }), [day, topic, orgs]);
  const byId = useMemo(() => new Map(g.nodes.map((n) => [n.id, n])), [g]);
  const focusId = hover ?? selected;
  const focus = useMemo(() => (focusId && byId.has(focusId) ? neighbours(g, focusId) : null), [g, focusId, byId]);
  const sel = selected ? byId.get(selected) : undefined;
  const sessionsDrawn = g.nodes.filter((n) => n.kind === "session");
  const peopleCount = new Set(g.nodes.filter((n) => n.kind === "speaker").map((n) => n.speaker!.id)).size;
  const orgCount = g.nodes.filter((n) => n.kind === "org").length;

  const lit = (id: string) => !focus || focus.has(id);
  const nodeOpacity = (n: GNode) => (focus ? (lit(n.id) ? 1 : 0.14) : n.dimmed ? 0.22 : 1);

  const handlers = (n: GNode) => ({
    tabIndex: 0,
    role: "button" as const,
    onMouseEnter: () => setHover(n.id),
    onMouseLeave: () => setHover(null),
    onFocus: () => setHover(n.id),
    onBlur: () => setHover(null),
    onClick: (e: React.MouseEvent) => { e.stopPropagation(); setSelected(n.id === selected ? null : n.id); },
    onKeyDown: (e: React.KeyboardEvent) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelected(n.id); } },
    style: { opacity: nodeOpacity(n), transition: "opacity .2s", cursor: "pointer" } as React.CSSProperties,
    className: "outline-none [&:focus-visible>.ring]:stroke-[var(--accent)] [&:focus-visible>.ring]:[stroke-width:2.5]",
  });

  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="relative min-w-0 overflow-hidden rounded-2xl border border-line bg-surface">
        <div className="thin-scroll overflow-x-auto">
          <svg
            viewBox={`0 0 ${g.width} ${g.height}`}
            width={g.width}
            height={g.height}
            className="block"
            role="img"
            aria-label={`Network of ${sessionsDrawn.length} sessions and ${peopleCount} people${orgCount ? `, linked by ${orgCount} shared organisations` : ""}. Select a node for details.`}
            onClick={(e) => { if (e.target === e.currentTarget) setSelected(null); }}
          >
            {/* Organisation links */}
            {g.links.filter((l) => l.kind === "represents").map((l, i) => {
              const a = byId.get(l.source)!, b = byId.get(l.target)!;
              const on = focus ? focus.has(l.source) && focus.has(l.target) : false;
              const my = (a.y + b.y) / 2;
              return (
                <path
                  key={i}
                  d={`M ${b.x} ${b.y + 9} C ${b.x} ${my}, ${a.x} ${my}, ${a.x} ${a.y}`}
                  fill="none"
                  stroke="var(--accent)"
                  strokeDasharray="3 4"
                  strokeOpacity={focus ? (on ? 0.85 : 0.05) : a.dimmed ? 0.06 : 0.28}
                  strokeWidth={on ? 1.6 : 1}
                  style={{ transition: "stroke-opacity .2s" }}
                />
              );
            })}
            {/* Session columns: pill + participation bracket + people */}
            {g.nodes.filter((n) => n.kind === "session").map((n) => {
              const s = n.session!;
              const people = g.nodes.filter((p) => p.instance === s.id);
              const last = people.at(-1);
              const left = n.x - g.colW / 2 + 8;
              const w = g.colW - 16;
              const spineOn = !focus || focus.has(n.id);
              return (
                <g key={n.id} data-track={s.track}>
                  {last && (
                    <path
                      d={`M ${left + 14} ${n.y + 20} L ${left + 14} ${last.y}`}
                      stroke="var(--tc)"
                      strokeWidth={2}
                      strokeOpacity={focus ? (spineOn ? 0.9 : 0.1) : n.dimmed ? 0.15 : 0.55}
                      style={{ transition: "stroke-opacity .2s" }}
                    />
                  )}
                  <g transform={`translate(${left},${n.y - 20})`} aria-label={`Session: ${s.title}, ${fmtDate(s.date)} ${s.startTime}`} {...handlers(n)}>
                    <rect className="ring" width={w} height={40} rx={9} fill="var(--surface)" stroke="var(--tc)" strokeWidth={selected === n.id ? 2.5 : 1.4} />
                    <rect width={w} height={40} rx={9} fill="var(--tc)" opacity={0.12} />
                    <text x={10} y={16} fontSize={11.5} fontWeight={600} fill="var(--fg)">{shortTitle(s.title, 23)}</text>
                    <title>{`${s.title} · ${TYPE_META[s.type].label}`}</title>
                    <text x={10} y={31} fontSize={10} fill="var(--muted)" style={{ fontFamily: "var(--font-mono)" }}>
                      {day === "all" ? `${fmtDate(s.date).slice(4)} · ` : ""}{s.startTime}–{s.endTime}
                    </text>
                  </g>
                  {people.map((p) => (
                    <g key={p.id} transform={`translate(${p.x},${p.y})`} aria-label={`${p.moderator ? "Moderator" : "Speaker"}: ${p.speaker!.name}`} {...handlers(p)}>
                      <circle r={13} fill="transparent" />
                      <circle className="ring" r={7.5} fill={p.moderator ? "var(--surface)" : "var(--tc)"} stroke="var(--tc)" strokeWidth={selected === p.id ? 3 : 2} />
                      <text x={14} y={4} fontSize={11.5} fill="var(--fg)" fontWeight={focus?.has(p.id) && focusId ? 600 : 400}>
                        {clip(p.label, p.moderator ? 18 : 22)}
                        {p.moderator && <tspan fill="var(--muted)" fontSize={10}> · mod</tspan>}
                      </text>
                    </g>
                  ))}
                </g>
              );
            })}
            {/* Organisations */}
            {g.nodes.filter((n) => n.kind === "org").map((n) => (
              <g key={n.id} transform={`translate(${n.x},${n.y})`} aria-label={`Organisation: ${n.label}`} {...handlers(n)}>
                <rect className="ring" x={-6.5} y={-6.5} width={13} height={13} transform="rotate(45)" fill="var(--accent)" stroke="var(--surface)" strokeWidth={2} />
                <text x={12} y={4} fontSize={11} fontWeight={600} fill="var(--accent-ink)" paintOrder="stroke" stroke="var(--surface)" strokeWidth={3}>
                  {clip(n.label, 20)}
                </text>
              </g>
            ))}
          </svg>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-line px-3 py-2 text-[11.5px] text-muted">
          <span className="inline-flex items-center gap-1.5"><span className="inline-block h-3 w-5 rounded border border-fg-2/50 bg-surface-2" /> Session</span>
          <span className="inline-flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-full bg-fg-2" /> Speaker</span>
          <span className="inline-flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-full border-2 border-fg-2" /> Moderator</span>
          {orgs !== "none" && <span className="inline-flex items-center gap-1.5"><span className="inline-block h-2 w-2 rotate-45 bg-accent" /> Organisation (dashed links)</span>}
          <span className="ml-auto hidden sm:inline">Scroll sideways for later sessions</span>
        </div>
      </div>

      <aside className="panel flex min-h-[180px] flex-col p-4" aria-live="polite">
        {!sel ? (
          <div className="text-[13.5px] text-muted">
            <p className="font-medium text-fg">Read the network</p>
            <p className="mt-1.5 leading-relaxed">
              Sessions run left to right in time order, each with the people on stage stacked beneath it. Dashed lines join colleagues from the same organisation; that is where links across sessions and days appear.
            </p>
            <p className="mt-2 leading-relaxed">Hover or focus to trace connections. Select a node to pin it.</p>
            <p className="mono mt-3 text-[12px]">{sessionsDrawn.length} sessions · {peopleCount} people · {orgCount} {orgCount === 1 ? "organisation" : "organisations"}</p>
          </div>
        ) : (
          <SelectedPanel n={sel} onClear={() => setSelected(null)} openSession={openSession} openSpeaker={openSpeaker} neighbourIds={neighbours(g, sel.id)} byId={byId} />
        )}
      </aside>
    </div>
  );
}

function SelectedPanel({ n, onClear, openSession, openSpeaker, neighbourIds, byId }: {
  n: GNode;
  onClear: () => void;
  openSession: (slug: string) => void;
  openSpeaker: (slug: string) => void;
  neighbourIds: Set<string>;
  byId: Map<string, GNode>;
}) {
  const seen = new Set<string>();
  const others = [...neighbourIds]
    .map((id) => byId.get(id)!)
    .filter((o) => o && o.id !== n.id && !(o.kind === "speaker" && n.kind === "speaker" && o.speaker!.id === n.speaker!.id))
    .filter((o) => {
      const k = o.kind === "speaker" ? o.speaker!.id : o.id;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  return (
    <div className="flex flex-col gap-3 text-[13.5px]">
      <div className="flex items-start justify-between gap-2">
        <p className="eyebrow !text-[10px]">{n.kind === "session" ? "Session" : n.kind === "org" ? "Organisation" : "Person"}</p>
        <button onClick={onClear} className="-mr-1 -mt-1 inline-flex h-7 w-7 items-center justify-center rounded-full text-muted hover:bg-surface-2 hover:text-fg" aria-label="Clear selection">
          <X size={14} />
        </button>
      </div>
      {n.kind === "session" && (
        <>
          <p className="text-[15px] font-semibold leading-snug">{n.session!.title}</p>
          <p className="mono text-[12px] text-muted">{fmtDate(n.session!.date)} · {n.session!.startTime}–{n.session!.endTime} · {TYPE_META[n.session!.type].label}</p>
          <div className="flex flex-wrap gap-1">{n.session!.topics.map((t) => <span key={t} className="rounded bg-surface-2 px-1.5 py-0.5 text-[11.5px]">{TOPIC_BY_ID[t].short}</span>)}</div>
          <button onClick={() => openSession(n.session!.slug)} className="inline-flex items-center gap-1 self-start font-medium text-accent-ink hover:underline">Open session <ArrowUpRight size={14} /></button>
        </>
      )}
      {n.kind === "speaker" && (
        <>
          <div className="flex items-center gap-3">
            <Avatar speaker={n.speaker!} size={44} />
            <div className="min-w-0">
              <p className="text-[15px] font-semibold leading-tight">{n.speaker!.name}</p>
              <p className="line-clamp-2 text-[12.5px] text-muted">{n.speaker!.title}</p>
            </div>
          </div>
          <ul className="flex flex-col gap-1">
            {(sessionsBySpeaker.get(n.speaker!.id) ?? []).map((s) => (
              <li key={s.id}><button onClick={() => openSession(s.slug)} className="text-left text-fg-2 hover:underline"><span className="mono text-muted">{fmtDate(s.date).slice(4)} {s.startTime}</span> {s.title}</button></li>
            ))}
          </ul>
          <button onClick={() => openSpeaker(n.speaker!.slug)} className="inline-flex items-center gap-1 self-start font-medium text-accent-ink hover:underline">Open profile <ArrowUpRight size={14} /></button>
        </>
      )}
      {n.kind === "org" && <p className="text-[15px] font-semibold leading-snug">{n.label}</p>}
      {others.length > 0 && (
        <div>
          <p className="eyebrow mb-1 !text-[10px]">Connected</p>
          <ul className="flex flex-col gap-0.5">
            {others.slice(0, 10).map((o) => (
              <li key={o.id} className="truncate text-[12.5px] text-fg-2">
                {o.kind === "speaker" ? (
                  <button className="hover:underline" onClick={() => openSpeaker(o.speaker!.slug)}>{o.label}</button>
                ) : o.kind === "session" ? (
                  <button className="hover:underline" onClick={() => openSession(o.session!.slug)}>{o.label}</button>
                ) : (
                  o.label
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

