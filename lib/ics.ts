import type { Session } from "@/types";
import { participantsOf } from "./insights";
import { TYPE_META } from "./session-meta";

const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
const stamp = (date: string, hhmm: string) => `${date.replace(/-/g, "")}T${hhmm.replace(":", "")}00`;
const fold = (line: string) => {
  const out: string[] = [];
  let rest = line;
  while (rest.length > 74) { out.push(rest.slice(0, 74)); rest = " " + rest.slice(74); }
  out.push(rest);
  return out.join("\r\n");
};

/** RFC 5545 calendar with Asia/Baghdad local times (UTC+3, no daylight saving). */
export function sessionsToIcs(list: Session[], baseUrl = "https://www.hitex.tech/en/conferences/agenda") {
  const now = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z");
  const events = list
    .filter((s) => s.startTime && s.endTime)
    .map((s) => {
      const people = participantsOf(s)
        .map((p) => `${p.name}${s.moderatorIds.includes(p.id) ? " (moderator)" : ""}${p.title ? ` – ${p.title}` : ""}`)
        .join("\n");
      const desc = `${TYPE_META[s.type].label} · HITEX 2026\n\n${people}\n\nSource: ${baseUrl}`;
      return [
        "BEGIN:VEVENT",
        `UID:${s.id}@hitex-2026-explorer`,
        `DTSTAMP:${now}`,
        `DTSTART;TZID=Asia/Baghdad:${stamp(s.date, s.startTime!)}`,
        `DTEND;TZID=Asia/Baghdad:${stamp(s.date, s.endTime!)}`,
        `SUMMARY:${esc(s.title)}`,
        `LOCATION:${esc(s.venue ?? "Erbil International Fairground")}`,
        `DESCRIPTION:${esc(desc)}`,
        `URL:${baseUrl}`,
        "END:VEVENT",
      ].map(fold).join("\r\n");
    });
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//HITEX 2026 Explorer//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VTIMEZONE",
    "TZID:Asia/Baghdad",
    "BEGIN:STANDARD",
    "DTSTART:19700101T000000",
    "TZOFFSETFROM:+0300",
    "TZOFFSETTO:+0300",
    "TZNAME:+03",
    "END:STANDARD",
    "END:VTIMEZONE",
    ...events,
    "END:VCALENDAR",
  ].join("\r\n");
}

export function downloadText(filename: string, text: string, mime = "text/calendar") {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function sessionAsText(s: Session) {
  const people = participantsOf(s)
    .map((p) => `  • ${p.name}${s.moderatorIds.includes(p.id) ? " (moderator)" : ""}${p.title ? `, ${p.title}` : ""}`)
    .join("\n");
  const when = s.startTime ? `${s.date} ${s.startTime}–${s.endTime} (Erbil time)` : `${s.date}, time not published`;
  return `${s.title}\n${TYPE_META[s.type].label} · HITEX 2026 · ${when}\n${s.venue ?? ""}\n${people ? `\n${people}\n` : ""}\nSource: https://www.hitex.tech/en/conferences/agenda`;
}
