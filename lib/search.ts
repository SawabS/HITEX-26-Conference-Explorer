import { TOPICS } from "@/data/topics";
import { organizations, sessions, speakers } from "./data";
import { fmtDate } from "./format";
import { participantsOf } from "./insights";
import { TYPE_META } from "./session-meta";
import type { SessionType } from "@/types";

export type SearchGroup = "Sessions" | "Speakers" | "Organisations" | "Themes" | "Formats";

export type SearchItem = {
  key: string;
  group: SearchGroup;
  label: string;
  sub: string;
  haystack: string;
  /** Where selecting the item leads. */
  target:
    | { kind: "session"; slug: string; date: string }
    | { kind: "speaker"; slug: string }
    | { kind: "org"; name: string }
    | { kind: "topic"; id: string }
    | { kind: "type"; type: SessionType };
};

const norm = (s: string) =>
  s.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9؀-ۿ]+/g, " ").trim();

export const searchIndex: SearchItem[] = [
  ...sessions.map<SearchItem>((s) => ({
    key: `s:${s.id}`,
    group: "Sessions",
    label: s.title,
    sub: `${fmtDate(s.date)}${s.startTime ? ` · ${s.startTime}–${s.endTime}` : ""} · ${TYPE_META[s.type].label}`,
    haystack: norm([s.title, s.titleKu, TYPE_META[s.type].label, s.track, ...s.topics, ...participantsOf(s).map((p) => p.name)].join(" ")),
    target: { kind: "session", slug: s.slug, date: s.date },
  })),
  ...speakers.map<SearchItem>((p) => ({
    key: `p:${p.id}`,
    group: "Speakers",
    label: p.name,
    sub: [p.title, p.organization].filter(Boolean).join(" · "),
    haystack: norm([p.name, p.nameKu, p.title, ...p.organizations, ...p.expertise].join(" ")),
    target: { kind: "speaker", slug: p.slug },
  })),
  ...organizations.map<SearchItem>((o) => ({
    key: `o:${o.name}`,
    group: "Organisations",
    label: o.name,
    sub: `${o.speakerIds.length} ${o.speakerIds.length === 1 ? "person" : "people"}`,
    haystack: norm(o.name),
    target: { kind: "org", name: o.name },
  })),
  ...TOPICS.map<SearchItem>((t) => ({
    key: `t:${t.id}`,
    group: "Themes",
    label: t.label,
    sub: t.description,
    haystack: norm(`${t.label} ${t.short} ${t.id} ${t.description}`),
    target: { kind: "topic", id: t.id },
  })),
  ...(Object.keys(TYPE_META) as SessionType[])
    .filter((t) => t !== "other" && sessions.some((s) => s.type === t))
    .map<SearchItem>((t) => ({
      key: `f:${t}`,
      group: "Formats",
      label: TYPE_META[t].plural,
      sub: `${sessions.filter((s) => s.type === t).length} on the programme`,
      haystack: norm(`${TYPE_META[t].label} ${TYPE_META[t].plural}`),
      target: { kind: "type", type: t },
    })),
];

const ORDER: SearchGroup[] = ["Sessions", "Speakers", "Organisations", "Themes", "Formats"];

/** Token-prefix search with light ranking: label matches beat body matches. */
export function search(query: string, limitPerGroup = 6) {
  const q = norm(query);
  if (!q) return [];
  const tokens = q.split(" ");
  const scored = searchIndex
    .map((item) => {
      const label = norm(item.label);
      const words = item.haystack.split(" ");
      let score = 0;
      for (const t of tokens) {
        if (label.startsWith(t)) score += 6;
        else if (label.split(" ").some((w) => w.startsWith(t))) score += 4;
        else if (words.some((w) => w.startsWith(t))) score += 2;
        else if (item.haystack.includes(t)) score += 1;
        else return null;
      }
      return { item, score };
    })
    .filter((x): x is { item: SearchItem; score: number } => !!x)
    .sort((a, b) => b.score - a.score);
  return ORDER.map((g) => ({ group: g, items: scored.filter((x) => x.item.group === g).slice(0, limitPerGroup).map((x) => x.item) })).filter((g) => g.items.length);
}
