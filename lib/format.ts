export const slugify = (s: string) =>
  s
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

export const fromMinutes = (m: number) =>
  `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

export const fmtDuration = (mins: number) => {
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
};

const MONTH = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEKDAY_LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** "2026-10-08" → parts without timezone drift. */
export const dateParts = (iso: string) => {
  const [y, mo, d] = iso.split("-").map(Number);
  const wd = new Date(Date.UTC(y, mo - 1, d)).getUTCDay();
  return { y, mo, d, month: MONTH[mo - 1], weekday: WEEKDAY[wd], weekdayLong: WEEKDAY_LONG[wd] };
};

export const fmtDate = (iso: string, style: "short" | "long" = "short") => {
  const p = dateParts(iso);
  return style === "long" ? `${p.weekdayLong}, ${p.d} ${p.month} ${p.y}` : `${p.weekday} ${p.d} ${p.month}`;
};

export const fmtIsoDate = (iso: string) => {
  const p = dateParts(iso);
  return `${p.d} ${p.month} ${p.y}`;
};

/** Current wall-clock date and minutes in Erbil (Asia/Baghdad, UTC+3, no DST). */
export const erbilNow = (now = new Date()) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Baghdad",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    minutes: Number(get("hour")) * 60 + Number(get("minute")),
  };
};

export const initials = (name: string) =>
  name
    .replace(/^(Dr|Eng|H\.E\.|Mr|Ms|Mrs)\.?\s+/i, "")
    .replace(/\(.*?\)/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
