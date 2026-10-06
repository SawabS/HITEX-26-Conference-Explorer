/**
 * Writes one Markdown briefing per programme day (Economy, Technology, Content)
 * from the official HITEX 2026 agenda data, for use as source documents in
 * tools such as NotebookLM. Usage: npx tsx scripts/export-day-briefs.ts <outDir>
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { days, meta, roleIn, sessions, sessionsBySpeaker, speakerById } from "@/lib/data";
import type { Session, Speaker } from "@/types";

const outDir = process.argv[2] ?? "briefs";
mkdirSync(outDir, { recursive: true });

const FORMAT: Record<string, string> = {
  presentation: "Presentation",
  panel: "Panel discussion",
  dialogue: "Dialogue",
  "fireside-chat": "Fireside chat",
  "opening-ceremony": "Opening ceremony",
  other: "Session",
};

const WEEKDAY = (iso: string) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

/** House style for these briefs avoids em dashes; punctuation only, wording unchanged. */
const clean = (s: string) => s.replace(/\s*—\s*/g, ", ").replace(/\r/g, "").trim();
const paras = (s: string) => clean(s).split(/\n+/).map((p) => p.trim()).filter(Boolean).join("\n\n");

const ORG_BASIS: Record<string, string> = {
  "official-title": "as named in the official HITEX title",
  "official-bio": "as named in the official HITEX biography",
  "official-company-field": "as listed by HITEX",
  external: "from the cited public source",
};

const opening = sessions.find((s) => s.type === "opening-ceremony");
const PLURAL: Record<string, string> = { company: "companies", startups: "startups", speakers: "speakers" };
const figures = meta.officialFigures.map((f) => `${f.value} ${PLURAL[f.label.toLowerCase()] ?? f.label.toLowerCase()}`).join(", ").replace(/, ([^,]*)$/, " and $1");

function conferenceContext(dayNumber: number) {
  const programmeDays = days.filter((d) => d.dayNumber > 1);
  const lines = [
    `HITEX 2026 is a technology exhibition and conference held at the ${meta.venue} in Erbil, Kurdistan Region of Iraq, from 6 to 9 October 2026. HITEX's own headline figures for this edition are ${figures}.`,
    opening
      ? `The first day, Tuesday 6 October, is the official opening. ${clean(opening.description ?? "")}`
      : "",
    `The conference programme then runs for three themed days: ${programmeDays
      .map((d) => `${d.label} on ${WEEKDAY(d.date).replace(/ \d{4}$/, "")}`)
      .join(", ")}. This document covers Day ${dayNumber} of HITEX 2026, the ${["first", "second", "third"][dayNumber - 2]} of those three programme days.`,
  ];
  return lines.filter(Boolean).join(" ");
}

function profile(sp: Speaker, session: Session, dayDate: string) {
  const out: string[] = [];
  const role = roleIn(session, sp.id);
  out.push(`##### ${sp.name}${role === "Moderator" ? " (moderator)" : ""}`);
  const facts: string[] = [];
  if (sp.nameKu) facts.push(`Name in Kurdish: ${sp.nameKu}`);
  facts.push(`Role in this session: ${role}`);
  facts.push(`Official title: ${sp.title ? clean(sp.title) : "not published by HITEX"}`);
  if (sp.organizations.length)
    facts.push(`Organisation: ${sp.organizations.join("; ")}${sp.orgBasis ? ` (${ORG_BASIS[sp.orgBasis]})` : ""}`);
  if (sp.location) facts.push(`Location: ${sp.location}`);
  out.push(facts.map((f) => `- ${f}`).join("\n"));

  if (sp.bio && sp.bioBasis === "official") {
    out.push(`**Biography (published by HITEX):**\n\n${paras(sp.bio)}`);
  } else if (sp.bio) {
    const src = sp.sources.find((x) => !x.official);
    out.push(
      `**Biography:** HITEX did not publish a biography for ${sp.name}. The following is compiled from a public source (${src ? `${src.label}, ${src.url}` : "cited public source"}), not from HITEX.\n\n${paras(sp.bio)}`,
    );
  } else {
    out.push(`**Biography:** HITEX has not published a biography for ${sp.name}, and no reliable public source could be matched.`);
  }

  const links = [sp.socialLinks?.website && `Website: ${sp.socialLinks.website}`, sp.socialLinks?.linkedin && `LinkedIn: ${sp.socialLinks.linkedin}`].filter(Boolean);
  if (links.length) out.push(links.join("  \n"));

  const others = (sessionsBySpeaker.get(sp.id) ?? []).filter((s) => s.id !== session.id);
  if (others.length) {
    out.push(
      `Also appears at HITEX 2026 in: ${others
        .map((o) => `"${o.title}" (${o.date === dayDate ? "later or earlier this same day" : WEEKDAY(o.date).replace(/ \d{4}$/, "")}, ${o.startTime}, ${roleIn(o, sp.id).toLowerCase()})`)
        .join("; ")}.`,
    );
  }
  return out.join("\n\n");
}

const people = (ids: string[]) => ids.map((id) => speakerById.get(id)).filter((x): x is Speaker => !!x);

for (const day of days.filter((d) => d.dayNumber > 1)) {
  const list = sessions
    .filter((s) => s.date === day.date && s.startTime)
    .sort((a, b) => a.startTime!.localeCompare(b.startTime!));
  const ids = new Set(list.flatMap((s) => s.participants.map((p) => p.speakerId)));
  const formatCounts = new Map<string, number>();
  for (const s of list) formatCounts.set(FORMAT[s.type], (formatCounts.get(FORMAT[s.type]) ?? 0) + 1);
  const minutes = list.reduce((a, s) => a + (s.durationMinutes ?? 0), 0);

  const md: string[] = [];
  md.push(`# HITEX 2026 Conference, Day ${day.dayNumber}: ${day.label}`);
  md.push(`**${WEEKDAY(day.date)}, ${meta.venue}, Erbil (times are Erbil local time, UTC+3)**`);
  md.push(
    `## About this document\n\nThis is a complete briefing on the ${day.label} day of the HITEX 2026 conference. It lists every session on that day in running order with its official title, time, length and format, and gives a full profile of every person on stage. All session and speaker information comes from the official HITEX 2026 agenda (${meta.agendaUrl}), retrieved on 6 October 2026; the agenda was last updated by HITEX on ${meta.officialUpdatedAt.slice(0, 10)}. Where information did not come from HITEX, the text says so and names the source.\n\nHITEX has not published written descriptions for the 2026 sessions. What each session is about can therefore be inferred only from its official title, its format and the backgrounds of the people speaking in it. Each session below states this explicitly.`,
  );
  md.push(`## The conference in context\n\n${conferenceContext(day.dayNumber)}`);

  const first = list[0], last = list.at(-1)!;
  md.push(
    `## The ${day.label} day at a glance\n\nThe ${day.label} day has ${list.length} sessions running from ${first.startTime} to ${last.endTime}, ${minutes} minutes of programme in total, with ${ids.size} different people on stage. By format it contains ${[...formatCounts.entries()].map(([f, n]) => `${n} ${f.toLowerCase()}${n > 1 ? "s" : ""}`).join(", ")}.\n\nRunning order:\n\n${list
      .map((s, i) => {
        const who = people(s.participants.map((p) => p.speakerId)).map((p) => p.name).join(", ");
        return `${i + 1}. ${s.startTime} to ${s.endTime} (${s.durationMinutes} min), ${FORMAT[s.type]}: "${s.title}"${who ? `, with ${who}` : ""}`;
      })
      .join("\n")}`,
  );

  md.push(`## Sessions in detail`);
  list.forEach((s, i) => {
    const mods = people(s.moderatorIds);
    const spk = people(s.speakerIds);
    const block: string[] = [];
    block.push(`### Session ${i + 1}: ${s.title}`);
    const facts = [
      `Time: ${s.startTime} to ${s.endTime}, ${WEEKDAY(s.date)}`,
      `Length: ${s.durationMinutes} minutes`,
      `Format: ${FORMAT[s.type]}`,
      `Day theme: ${day.label}`,
      s.titleKu ? `Official Kurdish title: ${s.titleKu}` : "",
      `Speakers: ${spk.length ? spk.map((p) => p.name).join(", ") : "none listed"}`,
      mods.length ? `Moderator: ${mods.map((p) => p.name).join(", ")}` : "Moderator: none listed",
    ].filter(Boolean);
    block.push(facts.map((f) => `- ${f}`).join("\n"));
    block.push(
      s.description
        ? `**Official description:** ${paras(s.description)}`
        : `**Official description:** not published by HITEX. The session's subject is indicated by its title and by the speaker profiles below.`,
    );
    if (s.context) {
      block.push(
        `**Background (not from HITEX):** ${clean(s.context.text)} Sources: ${s.context.sources.map((x) => `${x.label} (${x.url})`).join("; ")}.`,
      );
    }
    block.push(`#### People on stage`);
    for (const p of [...mods, ...spk]) block.push(profile(p, s, day.date));
    md.push(block.join("\n\n"));
  });

  md.push(
    `## Sources\n\nOfficial HITEX 2026 agenda: ${meta.agendaUrl}  \nOfficial agenda PDF: ${meta.agendaPdfUrl}\n\nCompiled by Sawab Sarkavri's HITEX 2026 Conference Explorer from the official agenda data. Session titles, times, formats, speaker titles and biographies are HITEX's own; any non-HITEX material is labelled where it appears.`,
  );

  const file = join(outDir, `HITEX-2026-Day-${day.dayNumber}-${day.label}-${day.date}.md`);
  writeFileSync(file, md.join("\n\n") + "\n");
  console.log(file, list.length, "sessions", ids.size, "people");
}
