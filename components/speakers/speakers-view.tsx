"use client";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { PhotoBand } from "@/components/ui/photo-band";
import { PHOTOS } from "@/lib/campaign";
import { days, organizations, sessionsBySpeaker, speakers } from "@/lib/data";
import { dateParts } from "@/lib/format";
import { useDetail, useNav } from "@/lib/nav";
import { TRACK_META, TYPE_META } from "@/lib/session-meta";
import type { SessionType, Speaker, Track } from "@/types";

const norm = (s: string) => s.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase();

const allExpertise = [...new Set(speakers.flatMap((s) => s.expertise))].sort((a, b) => a.localeCompare(b));
const sharedOrgs = organizations.filter((o) => o.speakerIds.length > 1);

function Select({ id, label, value, onChange, options }: { id: string; label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <label htmlFor={id} className="flex min-w-0 flex-col gap-1">
      <span className="eyebrow !text-[10px]">{label}</span>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`h-9 w-full min-w-0 rounded-lg border bg-surface px-2.5 text-[13.5px] outline-none transition focus:border-accent ${value ? "border-accent text-fg" : "border-line text-fg-2"}`}
      >
        <option value="">All</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}

export function SpeakersView() {
  const { params, set } = useNav();
  const { openSpeaker } = useDetail();
  const reduce = useReducedMotion();
  const [showFilters, setShowFilters] = useState(false);

  const q = params.get("q") ?? "";
  const day = params.get("sday") ?? "";
  const track = (params.get("track") ?? "") as Track | "";
  const type = (params.get("type") ?? "") as SessionType | "";
  const org = params.get("org") ?? "";
  const expertise = params.get("expertise") ?? "";
  const role = params.get("role") ?? "";

  const results = useMemo(() => {
    const tokens = norm(q).split(/\s+/).filter(Boolean);
    return speakers.filter((sp) => {
      const list = sessionsBySpeaker.get(sp.id) ?? [];
      const hay = norm([sp.name, sp.title, ...sp.organizations, ...sp.expertise].join(" "));
      if (tokens.some((t) => !hay.includes(t))) return false;
      if (day && !list.some((s) => s.date === day)) return false;
      if (track && !list.some((s) => s.track === track)) return false;
      if (type && !list.some((s) => s.type === type)) return false;
      if (org && !sp.organizations.includes(org)) return false;
      if (expertise && !sp.expertise.includes(expertise)) return false;
      if (role === "moderator" && !list.some((s) => s.moderatorIds.includes(sp.id))) return false;
      if (role === "speaker" && !list.some((s) => s.speakerIds.includes(sp.id))) return false;
      return true;
    });
  }, [q, day, track, type, org, expertise, role]);

  const activeCount = [day, track, type, org, expertise, role].filter(Boolean).length;
  const patch = (k: string) => (v: string) => set({ [k]: v || undefined }, { replace: true });

  return (
    <>
    <PhotoBand photo={PHOTOS.speakers} position="50% 55%" className="min-h-[300px] md:min-h-[440px]">
      <header className="mx-auto flex min-h-[300px] max-w-[1320px] flex-col justify-end px-4 pb-10 pt-16 md:min-h-[440px] md:px-6 md:pb-14">
        <p className="eyebrow">Presenters · HITEX 2026</p>
        <h1 className="mt-3 text-[34px] font-bold leading-[1.02] tracking-tight md:text-[56px]">Who is on stage</h1>
        <p className="mt-3 max-w-[60ch] text-[15px] text-fg-2">
          {speakers.length} people confirmed by the 2026 agenda. Profiles, portraits and titles are HITEX’s own; organisations and expertise are summarised from them.
        </p>
      </header>
    </PhotoBand>
    <div className="mx-auto max-w-[1320px] px-4 md:px-6">

      <div className="glass no-print sticky top-[calc(var(--nav-h)+env(safe-area-inset-top,0px))] z-30 -mx-4 border-b border-line px-4 py-2.5 md:-mx-6 md:px-6">
        <div className="flex items-center gap-2">
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">Search presenters</span>
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
            <input
              id="speaker-search"
              type="search"
              value={q}
              onChange={(e) => set({ q: e.target.value || undefined }, { replace: true })}
              placeholder="Name, organisation, title or expertise"
              className="h-10 w-full rounded-xl border border-line bg-surface pl-9 pr-3 text-[15px] outline-none transition placeholder:text-faint focus:border-accent"
            />
          </label>
          <button
            onClick={() => setShowFilters((v) => !v)}
            aria-expanded={showFilters}
            aria-controls="speaker-filters"
            className={`inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl border px-3 text-[13.5px] font-medium transition md:hidden ${activeCount ? "border-accent text-accent-ink" : "border-line text-fg-2"}`}
          >
            <SlidersHorizontal size={15} /> Filters{activeCount ? ` · ${activeCount}` : ""}
          </button>
        </div>
        <div id="speaker-filters" className={`${showFilters ? "grid" : "hidden"} mt-2.5 grid-cols-2 gap-2 md:grid md:grid-cols-6`}>
          <Select id="f-day" label="Day" value={day} onChange={patch("sday")} options={days.filter((d) => d.track !== "opening").map((d) => ({ value: d.date, label: `${dateParts(d.date).d} Oct · ${d.label}` }))} />
          <Select id="f-track" label="Track" value={track} onChange={patch("track")} options={(["economy", "technology", "content"] as Track[]).map((t) => ({ value: t, label: TRACK_META[t].label }))} />
          <Select id="f-type" label="Session type" value={type} onChange={patch("type")} options={(["presentation", "panel", "dialogue", "fireside-chat"] as SessionType[]).map((t) => ({ value: t, label: TYPE_META[t].label }))} />
          <Select id="f-role" label="Role" value={role} onChange={patch("role")} options={[{ value: "speaker", label: "Speaker" }, { value: "moderator", label: "Moderator" }]} />
          <Select id="f-org" label="Organisation" value={org} onChange={patch("org")} options={organizations.map((o) => ({ value: o.name, label: `${o.name}${o.speakerIds.length > 1 ? ` (${o.speakerIds.length})` : ""}` }))} />
          <Select id="f-exp" label="Expertise" value={expertise} onChange={patch("expertise")} options={allExpertise.map((e) => ({ value: e, label: e }))} />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 pt-4 text-[13px] text-muted" aria-live="polite">
        <span>
          <span className="mono text-fg">{results.length}</span> of {speakers.length} presenters
        </span>
        {(activeCount > 0 || q) && (
          <button onClick={() => set({ q: undefined, sday: undefined, track: undefined, type: undefined, org: undefined, expertise: undefined, role: undefined }, { replace: true })} className="inline-flex items-center gap-1 hover:text-fg">
            <X size={13} /> Clear all
          </button>
        )}
      </div>

      {!q && !activeCount && (
        <div className="scroll-x -mx-1 mb-4 flex items-center gap-1.5 px-1">
          <span className="eyebrow mr-1 shrink-0 !text-[10px]">Teams on stage</span>
          {sharedOrgs.map((o) => (
            <button key={o.name} className="chip !h-7 !text-[12.5px]" onClick={() => set({ org: o.name }, { replace: true })}>
              {o.name} <span className="mono text-muted">{o.speakerIds.length}</span>
            </button>
          ))}
        </div>
      )}

      {results.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line-strong px-6 py-16 text-center">
          <p className="text-[15px] font-medium">No presenter matches these filters.</p>
          <p className="mt-1 text-[13.5px] text-muted">Remove a filter or search for an organisation instead.</p>
        </div>
      ) : (
        <motion.ul layout={!reduce} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <AnimatePresence initial={false}>
            {results.map((sp) => (
              <motion.li
                key={sp.id}
                className="min-w-0"
                layout={!reduce}
                initial={{ opacity: 0, scale: reduce ? 1 : 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: reduce ? 1 : 0.98 }}
                transition={{ duration: reduce ? 0 : 0.18 }}
              >
                <SpeakerCard sp={sp} onOpen={() => openSpeaker(sp.slug)} />
              </motion.li>
            ))}
          </AnimatePresence>
        </motion.ul>
      )}
    </div>
    </>
  );
}

function SpeakerCard({ sp, onOpen }: { sp: Speaker; onOpen: () => void }) {
  const list = sessionsBySpeaker.get(sp.id) ?? [];
  return (
    <button onClick={onOpen} className="panel group flex h-full w-full min-w-0 flex-col [overflow-wrap:anywhere] p-4 text-left transition hover:-translate-y-0.5 hover:border-line-strong hover:shadow-2">
      <div className="flex w-full min-w-0 items-start gap-3.5">
        <Avatar speaker={sp} size={60} />
        <div className="min-w-0 flex-1">
          <p className="text-[15.5px] font-semibold leading-tight tracking-tight">{sp.name}</p>
          <p className="mt-1 text-[12.5px] leading-snug text-muted">{sp.title ?? "Title not publicly listed"}</p>
          <p className="mt-1 text-[12.5px] font-medium text-fg-2">{sp.organization ?? <span className="font-normal text-faint">Organisation not listed</span>}</p>
        </div>
      </div>
      {sp.expertise.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {sp.expertise.slice(0, 3).map((e) => (
            <span key={e} className="min-w-0 max-w-full rounded-md bg-surface-2 px-1.5 py-0.5 text-[11.5px] text-fg-2">{e}</span>
          ))}
          {sp.expertise.length > 3 && <span className="px-1 py-0.5 text-[11.5px] text-muted">+{sp.expertise.length - 3}</span>}
        </div>
      )}
      <ul className="mt-auto w-full min-w-0 flex flex-col gap-1 border-t border-line pt-3" style={{ marginTop: sp.expertise.length ? 12 : "auto" }}>
        {list.map((s) => (
          <li key={s.id} data-track={s.track} className="flex items-start gap-2 text-[12.5px]">
            <span className="tc-dot mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full" aria-hidden />
            <span className="mono shrink-0 text-muted">{dateParts(s.date).d} Oct {s.startTime}</span>
            <span className="min-w-0 truncate text-fg-2">{s.title}</span>
          </li>
        ))}
      </ul>
    </button>
  );
}
