/**
 * Regenerates data/hitex-2026.official.json from the public HITEX agenda page.
 *
 *   npm run data:update                       # fetch https://www.hitex.tech/en/conferences/agenda
 *   npm run data:update:file -- ./agenda.html # parse a saved copy of the page
 *
 * The agenda page is server-rendered with React Router. Its loader data is
 * streamed into the HTML as a "turbo-stream" payload passed to
 * window.__reactRouterContext.streamController.enqueue(...). That payload holds
 * every session, the speaker records (title, biography, portrait URL) and the
 * moderator flag, so no client-side rendering or private endpoint is needed.
 *
 * Only public page content is read. Curated enrichment (organisation
 * normalisation, expertise tags, topic tags, external sources) lives separately
 * in data/enrichment.ts and is never overwritten by this script.
 */
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const AGENDA_URL = "https://www.hitex.tech/en/conferences/agenda";
const OUT = resolve(process.cwd(), "data/hitex-2026.official.json");

type L10n = { en?: string; ku?: string; ar?: string };

/** Decode React Router's flat, index-referenced turbo-stream encoding. */
export function decodeTurboStream(payload: string): unknown {
  const arr: unknown[] = JSON.parse(payload);
  const memo = new Map<number, unknown>();
  const hydrate = (i: number): unknown => {
    if (i < 0) return undefined; // negative indices encode undefined/null/NaN etc.
    if (memo.has(i)) return memo.get(i);
    const v = arr[i];
    if (Array.isArray(v)) {
      // Typed tuples such as ["D", iso] (Date) or ["P", n] (Promise)
      if (typeof v[0] === "string" && v.length <= 3 && /^[A-Z]$/.test(v[0])) {
        return v[0] === "D" ? String(v[1]) : undefined;
      }
      const out: unknown[] = [];
      memo.set(i, out);
      for (const idx of v as number[]) out.push(hydrate(idx));
      return out;
    }
    if (v && typeof v === "object") {
      const out: Record<string, unknown> = {};
      memo.set(i, out);
      for (const [k, idx] of Object.entries(v as Record<string, number>)) {
        const key = arr[Number(k.slice(1))] as string;
        out[key] = hydrate(idx);
      }
      return out;
    }
    return v;
  };
  return hydrate(0);
}

function extractPayload(html: string): string {
  const m = html.match(/streamController\.enqueue\(("(?:[^"\\]|\\.)*")\)/s);
  if (!m) throw new Error("Could not find the React Router payload in the agenda HTML.");
  return JSON.parse(m[1]) as string;
}

const clean = (s?: string | null) => {
  const t = (s ?? "").replace(/‌/g, "").replace(/\s+\n/g, "\n").trim();
  return t.length ? t : undefined;
};
const l10n = (v: unknown): L10n => {
  const o = (v ?? {}) as L10n;
  return { en: clean(o.en), ku: clean(o.ku), ar: clean(o.ar) };
};

async function main() {
  const fileArg = process.argv.indexOf("--file");
  const html =
    fileArg > -1
      ? await readFile(resolve(process.argv[fileArg + 1]), "utf8")
      : await (await fetch(AGENDA_URL, { headers: { "user-agent": "hitex-explorer-data/1.0" } })).text();

  const root = decodeTurboStream(extractPayload(html)) as {
    loaderData: Record<string, Record<string, unknown>>;
  };
  const route = root.loaderData["routes/conferences.agenda"];
  if (!route) throw new Error("Agenda route data missing; the page structure may have changed.");

  type RawSpeaker = Record<string, unknown> & { SessionSpeaker?: { sort_order: number; is_moderator: boolean } };
  type RawSession = Record<string, unknown> & { speakers: RawSpeaker[] };
  type RawDay = Record<string, unknown> & { sessions: RawSession[] };

  const speakers = new Map<string, Record<string, unknown>>();
  const days = (route.agendas as RawDay[]).map((d) => ({
    id: d.id as string,
    date: d.date as string,
    dayNumber: d.day_number as number,
    title: l10n(d.title),
    updatedAt: d.updated_at as string,
    sessions: (d.sessions ?? [])
      .filter((s) => s.is_active !== false)
      .sort((a, b) => String(a.start_time).localeCompare(String(b.start_time)))
      .map((s) => {
        for (const p of s.speakers) {
          if (!speakers.has(p.id as string)) {
            speakers.set(p.id as string, {
              id: p.id,
              name: l10n(p.name),
              title: l10n(p.title),
              company: l10n(p.company),
              country: l10n(p.country),
              bio: l10n(p.bio),
              photoUrl: (p.photo_url as string) || undefined,
              linkedin: (p.linkedin_url as string) || undefined,
              facebook: (p.facebook_url as string) || undefined,
              instagram: (p.instagram_url as string) || undefined,
              twitter: (p.twitter_url as string) || undefined,
              year: p.year,
              updatedAt: p.updated_at,
            });
          }
        }
        return {
          id: s.id as string,
          title: l10n(s.title),
          description: l10n(s.description),
          type: s.type as string,
          typeLabel: l10n(s.topic_tag),
          location: l10n(s.location),
          start: String(s.start_time).slice(0, 5),
          end: String(s.end_time).slice(0, 5),
          updatedAt: s.updated_at as string,
          participants: [...s.speakers]
            .sort((a, b) => (a.SessionSpeaker?.sort_order ?? 0) - (b.SessionSpeaker?.sort_order ?? 0))
            .map((p) => ({ speakerId: p.id as string, moderator: !!p.SessionSpeaker?.is_moderator })),
        };
      }),
  }));

  const opening = route.opening as Record<string, unknown> | undefined;
  const openingDetails = (route.openingDetails ?? {}) as Record<string, unknown>;
  const live = route.live as { figures?: { label: L10n; value: string }[] } | undefined;

  const out = {
    source: AGENDA_URL,
    fetchedAt: new Date().toISOString(),
    opening: opening && {
      title: l10n(opening.title),
      description: l10n(opening.subtitle),
      venue: l10n(openingDetails.venue),
      entry: l10n(openingDetails.entry),
      guest: l10n(openingDetails.guest),
      guestNote: l10n(openingDetails.guest_note),
      time: clean(openingDetails.time as string),
    },
    officialFigures: (live?.figures ?? []).map((f) => ({ label: clean(f.label.en), value: f.value })),
    days,
    speakers: [...speakers.values()],
  };

  await writeFile(OUT, JSON.stringify(out, null, 2) + "\n");
  const n = days.reduce((a, d) => a + d.sessions.length, 0);
  console.log(`Wrote ${OUT}\n  ${days.length} days, ${n} sessions, ${speakers.size} people`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
