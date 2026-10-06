/**
 * Data layer. Builds typed, provenance-tagged Session and Speaker records from
 * the official HITEX payload (data/hitex-2026.official.json) plus curated
 * enrichment (data/enrichment.ts). Presentation code imports only from here.
 */
import officialJson from "@/data/hitex-2026.official.json";
import { sessionEnrichment, speakerEnrichment } from "@/data/enrichment";
import type {
  ConferenceDay,
  ConferenceMeta,
  Session,
  SessionType,
  Source,
  Speaker,
  Track,
} from "@/types";
import { slugify, toMinutes } from "./format";
import { portraitSrc } from "@/lib/portraits";

type L10n = { en?: string; ku?: string; ar?: string };
/** Shape written by scripts/update-hitex-data.ts. */
type OfficialData = {
  source: string;
  fetchedAt: string;
  opening?: { title: L10n; description: L10n; venue?: L10n; entry?: L10n; guest?: L10n; guestNote?: L10n; time?: string };
  officialFigures: { label?: string; value: string }[];
  days: {
    id: string;
    date: string;
    dayNumber: number;
    title: L10n;
    updatedAt: string;
    sessions: {
      id: string;
      title: L10n;
      description: L10n;
      type: string;
      typeLabel: L10n;
      location: L10n;
      start: string;
      end: string;
      updatedAt: string;
      participants: { speakerId: string; moderator: boolean }[];
    }[];
  }[];
  speakers: {
    id: string;
    name: L10n;
    title: L10n;
    company: L10n;
    country: L10n;
    bio: L10n;
    photoUrl?: string;
    linkedin?: string;
    facebook?: string;
    instagram?: string;
    twitter?: string;
    updatedAt?: string;
  }[];
};
const official = officialJson as unknown as OfficialData;

const AGENDA_URL = "https://www.hitex.tech/en/conferences/agenda";
const AGENDA_PDF = "https://hitex.s3.us-east-1.amazonaws.com/uploads/xVXd6F_uHTX50iQORvPNO.pdf";

const officialAgenda = (supports: string[]): Source => ({
  label: "Official HITEX 2026 agenda",
  url: AGENDA_URL,
  official: true,
  kind: "official",
  supports,
});

const TYPE_MAP: Record<string, SessionType> = {
  presentation: "presentation",
  panel: "panel",
  dialogue: "dialogue",
  fireside_chat: "fireside-chat",
};

const TRACK_BY_DAY: Record<number, Track> = { 1: "opening", 2: "economy", 3: "technology", 4: "content" };

/** Normalise official name spacing quirks, e.g. "Dr. Shamal Al- Duhoki". */
const tidyName = (n: string) => n.replace(/-\s+/g, "-").replace(/\s{2,}/g, " ").trim();

type OfficialSpeaker = (typeof official.speakers)[number];

function buildSpeaker(o: OfficialSpeaker): Speaker {
  const e = speakerEnrichment[o.id] ?? { expertise: [] };
  const name = tidyName(o.name.en ?? "");
  const officialBio = o.bio?.en;
  const country = o.country?.en;
  const sources: Source[] = [
    officialAgenda(["name", "title", ...(officialBio ? ["bio"] : []), ...(o.photoUrl ? ["photo"] : [])]),
    ...(e.extraSources ?? []),
  ];
  const linkedin = o.linkedin ?? e.links?.linkedin;
  const website = e.links?.website;
  const socialLinks = linkedin || website ? { linkedin, website } : undefined;
  return {
    id: o.id,
    slug: slugify(name.replace(/^Dr\.\s*/, "")),
    name,
    nameKu: o.name.ku,
    title: o.title?.en,
    organization: e.organizations?.[0],
    organizations: e.organizations ?? [],
    orgBasis: e.orgBasis,
    location: e.location ?? country,
    bio: officialBio ?? e.externalBio,
    bioBasis: officialBio ? "official" : e.externalBio ? "external" : undefined,
    image: o.photoUrl ? portraitSrc(o.id) : undefined,
    expertise: e.expertise,
    socialLinks,
    sources,
  };
}

export const speakers: Speaker[] = official.speakers
  .map(buildSpeaker)
  .sort((a, b) => a.name.replace(/^Dr\.\s*/, "").localeCompare(b.name.replace(/^Dr\.\s*/, "")));

export const speakerById = new Map(speakers.map((s) => [s.id, s]));
export const speakerBySlug = new Map(speakers.map((s) => [s.slug, s]));

const OPENING_ID = "opening-ceremony-2026";

function buildSessions(): Session[] {
  const out: Session[] = [];
  for (const day of official.days) {
    const track = TRACK_BY_DAY[day.dayNumber] ?? "opening";
    if (day.dayNumber === 1 && official.opening) {
      const op = official.opening;
      out.push({
        id: OPENING_ID,
        slug: "official-opening",
        date: day.date,
        dayNumber: 1,
        track: "opening",
        type: "opening-ceremony",
        title: op.title.en ?? "Official Opening",
        titleKu: op.title.ku,
        description: [op.description.en, op.guest?.en && `Guests of honour: ${op.guest.en}${op.guestNote?.en ? `, ${op.guestNote.en}` : ""}.`, op.entry?.en]
          .filter(Boolean)
          .join(" "),
        speakerIds: [],
        moderatorIds: [],
        participants: [],
        topics: ["gov-tech"],
        topicBasis: "Derived from the official ceremony description",
        venue: op.venue?.en,
        sources: [officialAgenda(["title", "description", "venue"])],
      });
    }
    for (const s of day.sessions) {
      const e = sessionEnrichment[s.id] ?? { topics: [], topicBasis: "Not yet tagged" };
      const start = toMinutes(s.start);
      const end = toMinutes(s.end);
      const title = (s.title.en ?? "").replace(/\.$/, "");
      out.push({
        id: s.id,
        slug: slugify(title).split("-").slice(0, 7).join("-"),
        date: day.date,
        dayNumber: day.dayNumber,
        startTime: s.start,
        endTime: s.end,
        durationMinutes: end - start,
        track,
        type: TYPE_MAP[s.type] ?? "other",
        title,
        titleKu: s.title.ku,
        description: s.description?.en,
        context: e.context,
        speakerIds: s.participants.filter((p) => !p.moderator).map((p) => p.speakerId),
        moderatorIds: s.participants.filter((p) => p.moderator).map((p) => p.speakerId),
        participants: s.participants,
        topics: e.topics,
        topicBasis: e.topicBasis,
        venue: "Erbil International Fairground",
        sources: [officialAgenda(["title", "time", "type", "participants", "moderator"])],
      });
    }
  }
  return out;
}

export const sessions: Session[] = buildSessions();
export const sessionById = new Map(sessions.map((s) => [s.id, s]));
export const sessionBySlug = new Map(sessions.map((s) => [s.slug, s]));
export const timedSessions = sessions.filter((s) => s.startTime && s.endTime);

const DAY_META: Record<Track, { label: string; short: string }> = {
  opening: { label: "Opening", short: "Opening" },
  economy: { label: "Economy", short: "Economy" },
  technology: { label: "Technology", short: "Tech" },
  content: { label: "Content", short: "Content" },
};

export const days: ConferenceDay[] = official.days.map((d) => {
  const track = TRACK_BY_DAY[d.dayNumber] ?? "opening";
  return {
    date: d.date,
    dayNumber: d.dayNumber,
    track,
    label: DAY_META[track].label,
    short: DAY_META[track].short,
    sessionIds: sessions.filter((s) => s.date === d.date).map((s) => s.id),
  };
});

export const dayByDate = new Map(days.map((d) => [d.date, d]));

/** Sessions each speaker appears in, in chronological order. */
export const sessionsBySpeaker = new Map<string, Session[]>();
for (const s of sessions) {
  for (const p of s.participants) {
    const list = sessionsBySpeaker.get(p.speakerId) ?? [];
    list.push(s);
    sessionsBySpeaker.set(p.speakerId, list);
  }
}

export const roleIn = (session: Session, speakerId: string) =>
  session.moderatorIds.includes(speakerId) ? "Moderator" : "Speaker";

const latest = (dates: string[]) => dates.filter(Boolean).sort().at(-1) ?? "";

export const meta: ConferenceMeta = {
  name: "HITEX 2026",
  dates: "October 6–9, 2026",
  venue: "Erbil International Fairground",
  timezone: "Asia/Baghdad",
  lastVerified: "2026-10-06",
  officialUpdatedAt: latest([
    ...official.days.map((d) => d.updatedAt),
    ...official.days.flatMap((d) => d.sessions.map((s) => s.updatedAt)),
  ]),
  officialFigures: official.officialFigures.map((f) => ({ label: f.label ?? "", value: f.value })),
  agendaUrl: AGENDA_URL,
  agendaPdfUrl: AGENDA_PDF,
};

export const organizations: { name: string; speakerIds: string[] }[] = (() => {
  const m = new Map<string, string[]>();
  for (const sp of speakers) for (const o of sp.organizations) m.set(o, [...(m.get(o) ?? []), sp.id]);
  return [...m.entries()]
    .map(([name, speakerIds]) => ({ name, speakerIds }))
    .sort((a, b) => b.speakerIds.length - a.speakerIds.length || a.name.localeCompare(b.name));
})();

export const stats = {
  sessions: timedSessions.length,
  people: speakers.length,
  moderators: new Set(sessions.flatMap((s) => s.moderatorIds)).size,
  speakersOnly: new Set(sessions.flatMap((s) => s.speakerIds)).size,
  totalMinutes: timedSessions.reduce((a, s) => a + (s.durationMinutes ?? 0), 0),
  tracks: 3,
  days: days.length,
  organizations: organizations.length,
};
