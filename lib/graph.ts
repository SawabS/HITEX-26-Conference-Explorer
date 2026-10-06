import type { Session, Speaker, TopicId } from "@/types";
import { days, speakerById, timedSessions } from "./data";

export type GNode = {
  id: string;
  kind: "session" | "speaker" | "org";
  label: string;
  x: number;
  y: number;
  session?: Session;
  speaker?: Speaker;
  /** For people: the session column they are drawn in (a person in two sessions is drawn twice). */
  instance?: string;
  moderator?: boolean;
  dimmed?: boolean;
};
export type GLink = { source: string; target: string; kind: "participates" | "represents" };
export type Graph = { nodes: GNode[]; links: GLink[]; width: number; height: number; colW: number };
export type GraphFilter = { day: string | "all"; topic?: TopicId | null; orgs: "shared" | "all" | "none" };

const PAD = 24;
const COL_W = 184;
const ORG_BAND = 92;
const PILL_Y = 34;
const PERSON_GAP = 30;

const cache = new Map<string, Graph>();

/**
 * Deterministic, chronological layout (no physics, so it never tangles):
 *  - one row per day, sessions left→right in time order;
 *  - each session's participants stacked beneath it, moderator first;
 *  - organisations shared by several people in a band on top, linked with dashed lines.
 * Edges "speaker participates in session" are drawn as a bracket under each session, which
 * also shows who shares a stage without an edge per pair of people.
 */
export function buildGraph(f: GraphFilter): Graph {
  const key = JSON.stringify(f);
  const hit = cache.get(key);
  if (hit) return hit;

  const rows = days
    .filter((d) => d.track !== "opening" && (f.day === "all" || d.date === f.day))
    .map((d) => timedSessions.filter((s) => s.date === d.date).sort((a, b) => a.startTime!.localeCompare(b.startTime!)));

  const nodes: GNode[] = [];
  const links: GLink[] = [];
  const peopleNodes = new Map<string, GNode[]>();
  const orgBand = f.orgs === "none" ? 12 : ORG_BAND;
  let y0 = orgBand;
  const maxCols = Math.max(...rows.map((r) => r.length));

  for (const row of rows) {
    const rowMax = Math.max(...row.map((s) => s.participants.length));
    row.forEach((s, i) => {
      const cx = PAD + i * COL_W + COL_W / 2;
      const dim = !!f.topic && !s.topics.includes(f.topic);
      nodes.push({ id: s.id, kind: "session", label: s.title, x: cx, y: y0 + PILL_Y, session: s, dimmed: dim });
      s.participants.forEach((p, k) => {
        const sp = speakerById.get(p.speakerId);
        if (!sp) return;
        const n: GNode = {
          id: `${sp.id}@${s.id}`,
          kind: "speaker",
          label: sp.name.replace(/\s*\(.*\)/, ""),
          x: cx - COL_W / 2 + 22,
          y: y0 + PILL_Y + 44 + k * PERSON_GAP,
          speaker: sp,
          instance: s.id,
          moderator: p.moderator,
          dimmed: dim,
        };
        nodes.push(n);
        links.push({ source: n.id, target: s.id, kind: "participates" });
        peopleNodes.set(sp.id, [...(peopleNodes.get(sp.id) ?? []), n]);
      });
    });
    y0 += PILL_Y + 44 + rowMax * PERSON_GAP + 40;
  }

  if (f.orgs !== "none") {
    const byOrg = new Map<string, GNode[]>();
    for (const list of peopleNodes.values()) {
      const sp = list[0].speaker!;
      for (const o of sp.organizations) byOrg.set(o, [...(byOrg.get(o) ?? []), ...list]);
    }
    const orgNodes: GNode[] = [];
    for (const [org, members] of byOrg) {
      const distinct = new Set(members.map((m) => m.speaker!.id));
      if (f.orgs === "shared" && distinct.size < 2) continue;
      const x = members.reduce((a, m) => a + m.x, 0) / members.length + 40;
      const n: GNode = { id: `org:${org}`, kind: "org", label: org, x, y: 30, dimmed: members.every((m) => m.dimmed) };
      orgNodes.push(n);
      for (const m of members) links.push({ source: m.id, target: n.id, kind: "represents" });
    }
    // Spread organisation labels so they never overlap; stagger into two lines when crowded.
    orgNodes.sort((a, b) => a.x - b.x);
    const MIN = 128;
    for (let i = 1; i < orgNodes.length; i++) if (orgNodes[i].x - orgNodes[i - 1].x < MIN) orgNodes[i].x = orgNodes[i - 1].x + MIN;
    const maxX = PAD + maxCols * COL_W - 60;
    for (let i = orgNodes.length - 1; i >= 0; i--) {
      const limit = i === orgNodes.length - 1 ? maxX : orgNodes[i + 1].x - MIN;
      if (orgNodes[i].x > limit) orgNodes[i].x = limit;
    }
    orgNodes.forEach((n, i) => { n.x = Math.max(PAD + 50, n.x); n.y = i % 2 ? 54 : 24; });
    nodes.push(...orgNodes);
  }

  const g: Graph = { nodes, links, width: PAD * 2 + maxCols * COL_W, height: y0, colW: COL_W };
  cache.set(key, g);
  return g;
}

/** Ids lit when a node is focused: the node, its direct neighbours, and every drawn copy of the same person. */
export function neighbours(g: Graph, id: string) {
  const node = g.nodes.find((n) => n.id === id);
  const seed = new Set<string>([id]);
  if (node?.kind === "speaker") for (const n of g.nodes) if (n.speaker?.id === node.speaker!.id) seed.add(n.id);
  const out = new Set(seed);
  for (const l of g.links) {
    if (seed.has(l.source)) out.add(l.target);
    if (seed.has(l.target)) out.add(l.source);
  }
  // A focused session also lights its participants' organisations.
  if (node?.kind === "session") for (const l of g.links) if (l.kind === "represents" && out.has(l.source)) out.add(l.target);
  return out;
}

/** Truncate plain text (names, organisations) without splitting on punctuation. */
export const clip = (t: string, n: number) => (t.length > n ? t.slice(0, n - 1).trimEnd() + "…" : t);

/** Session titles: keep the part before a colon or question mark, then truncate. */
export const shortTitle = (t: string, n = 26) => {
  const base = t.split(/[:?.!]/)[0].trim();
  return base.length > n ? base.slice(0, n - 1).trimEnd() + "…" : base;
};
