import { TOPICS, TOPIC_BY_ID } from "@/data/topics";
import type { Session, Speaker, TopicId } from "@/types";
import { days, sessions, sessionsBySpeaker, speakerById, timedSessions } from "./data";
import { erbilNow, toMinutes } from "./format";

export const participantsOf = (s: Session): Speaker[] =>
  s.participants.map((p) => speakerById.get(p.speakerId)).filter((x): x is Speaker => !!x);

export const orgsOf = (s: Session) => [...new Set(participantsOf(s).flatMap((p) => p.organizations))];

/** Related sessions scored by shared topics, shared organisations and adjacency in the same day. */
export function relatedSessions(s: Session, limit = 4) {
  const myOrgs = new Set(orgsOf(s));
  return sessions
    .filter((o) => o.id !== s.id && o.type !== "opening-ceremony")
    .map((o) => {
      const sharedTopics = o.topics.filter((t) => s.topics.includes(t));
      const sharedOrgs = orgsOf(o).filter((x) => myOrgs.has(x));
      const score = sharedTopics.length * 2 + sharedOrgs.length * 3 + (o.date === s.date ? 0.5 : 0);
      return { session: o, sharedTopics, sharedOrgs, score };
    })
    .filter((r) => r.sharedTopics.length || r.sharedOrgs.length)
    .sort((a, b) => b.score - a.score || (a.session.date + a.session.startTime).localeCompare(b.session.date + b.session.startTime))
    .slice(0, limit);
}

export const coPresenters = (speakerId: string) => {
  const out = new Map<string, { speaker: Speaker; session: Session }>();
  for (const s of sessionsBySpeaker.get(speakerId) ?? []) {
    for (const p of participantsOf(s)) if (p.id !== speakerId) out.set(p.id, { speaker: p, session: s });
  }
  return [...out.values()];
};

export type TopicStat = {
  id: TopicId;
  label: string;
  short: string;
  count: number;
  minutes: number;
  byDay: Record<string, { count: number; minutes: number }>;
};

export const topicStats: TopicStat[] = TOPICS.map((t) => {
  const list = timedSessions.filter((s) => s.topics.includes(t.id));
  const byDay: TopicStat["byDay"] = {};
  for (const d of days) {
    const dl = list.filter((s) => s.date === d.date);
    byDay[d.date] = { count: dl.length, minutes: dl.reduce((a, s) => a + (s.durationMinutes ?? 0), 0) };
  }
  return { id: t.id, label: t.label, short: t.short, count: list.length, minutes: list.reduce((a, s) => a + (s.durationMinutes ?? 0), 0), byDay };
})
  .filter((t) => t.count > 0)
  .sort((a, b) => b.count - a.count || b.minutes - a.minutes);

export function topicProfile(id: TopicId) {
  const list = timedSessions.filter((s) => s.topics.includes(id));
  const people = new Map<string, Speaker>();
  for (const s of list) for (const p of participantsOf(s)) people.set(p.id, p);
  const orgs = new Map<string, number>();
  for (const p of people.values()) for (const o of p.organizations) orgs.set(o, (orgs.get(o) ?? 0) + 1);
  const adjacent = new Map<TopicId, number>();
  for (const s of list) for (const t of s.topics) if (t !== id) adjacent.set(t, (adjacent.get(t) ?? 0) + 1);
  return {
    topic: TOPIC_BY_ID[id],
    sessions: list,
    speakers: [...people.values()],
    organizations: [...orgs.entries()].sort((a, b) => b[1] - a[1]).map(([name, n]) => ({ name, n })),
    adjacent: [...adjacent.entries()].sort((a, b) => b[1] - a[1]).map(([t, n]) => ({ topic: TOPIC_BY_ID[t], n })),
    minutes: list.reduce((a, s) => a + (s.durationMinutes ?? 0), 0),
  };
}

export type LiveState =
  | { phase: "before"; next: Session; nextStartsInMin: number }
  | { phase: "during"; today: string; current?: Session; next?: Session; nextStartsInMin?: number }
  | { phase: "after" };

/** Conference status relative to Erbil local time. */
export function liveState(now = new Date()): LiveState {
  const { date, minutes } = erbilNow(now);
  const first = days[0].date;
  const last = days[days.length - 1].date;
  const ordered = [...timedSessions].sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime));
  const absMin = (d: string, m: number) => Math.round((Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10)) / 60000)) + m;
  const nowAbs = absMin(date, minutes);
  const upcoming = ordered.find((s) => absMin(s.date, toMinutes(s.startTime!)) > nowAbs);
  if (date < first) return { phase: "before", next: ordered[0], nextStartsInMin: absMin(ordered[0].date, toMinutes(ordered[0].startTime!)) - nowAbs };
  if (date > last || (!upcoming && date === last && minutes > toMinutes(ordered.at(-1)!.endTime!))) return { phase: "after" };
  const current = ordered.find((s) => s.date === date && toMinutes(s.startTime!) <= minutes && minutes < toMinutes(s.endTime!));
  return {
    phase: "during",
    today: date,
    current,
    next: upcoming,
    nextStartsInMin: upcoming ? absMin(upcoming.date, toMinutes(upcoming.startTime!)) - nowAbs : undefined,
  };
}

export const fmtCountdown = (mins: number) => {
  if (mins < 1) return "now";
  const d = Math.floor(mins / 1440);
  const h = Math.floor((mins % 1440) / 60);
  const m = mins % 60;
  if (d) return `${d} d ${h} h`;
  if (h) return `${h} h ${m} min`;
  return `${m} min`;
};

/** Sessions running at a given minute of a given day. */
export const sessionsAt = (date: string, minute: number) =>
  timedSessions.filter((s) => s.date === date && toMinutes(s.startTime!) <= minute && minute < toMinutes(s.endTime!));

/** Busy minutes vs. programme span for a day. */
export function dayDensity(date: string) {
  const list = timedSessions.filter((s) => s.date === date);
  if (!list.length) return null;
  const start = Math.min(...list.map((s) => toMinutes(s.startTime!)));
  const end = Math.max(...list.map((s) => toMinutes(s.endTime!)));
  const busy = list.reduce((a, s) => a + (s.durationMinutes ?? 0), 0);
  const gaps: { from: number; to: number }[] = [];
  const sorted = [...list].sort((a, b) => toMinutes(a.startTime!) - toMinutes(b.startTime!));
  for (let i = 1; i < sorted.length; i++) {
    const a = toMinutes(sorted[i - 1].endTime!), b = toMinutes(sorted[i].startTime!);
    if (b > a) gaps.push({ from: a, to: b });
  }
  return { start, end, busy, span: end - start, gaps, count: list.length };
}
