"use client";
import { Bookmark, BookmarkCheck, ExternalLink, Landmark, Building2, GraduationCap, Globe, BadgeCheck } from "lucide-react";
import { TOPIC_BY_ID } from "@/data/topics";
import { usePlanner } from "@/lib/planner";
import { TRACK_META, TYPE_META } from "@/lib/session-meta";
import type { SessionType, Source, SourceKind, TopicId, Track } from "@/types";

export function TypeBadge({ type, className = "" }: { type: SessionType; className?: string }) {
  const m = TYPE_META[type];
  const Icon = m.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 text-[12px] font-medium text-fg-2 ${className}`}>
      <Icon size={13} strokeWidth={2} aria-hidden className="text-muted" />
      {m.label}
    </span>
  );
}

export function TrackPill({ track, className = "" }: { track: Track; className?: string }) {
  return (
    <span data-track={track} className={`inline-flex items-center gap-1.5 text-[12px] font-medium tc-ink ${className}`}>
      <span className="tc-dot h-2 w-2 rounded-full" aria-hidden />
      {TRACK_META[track].label}
    </span>
  );
}

export function TopicTag({ id, onClick, active }: { id: TopicId; onClick?: () => void; active?: boolean }) {
  const t = TOPIC_BY_ID[id];
  const cls = "inline-flex h-6 items-center rounded-md border px-2 text-[12px] transition";
  if (!onClick) return <span className={`${cls} border-line bg-surface-2 text-fg-2`}>{t.short}</span>;
  return (
    <button
      onClick={onClick}
      aria-pressed={!!active}
      className={`${cls} ${active ? "border-accent bg-accent-soft text-accent-ink" : "border-line bg-surface-2 text-fg-2 hover:border-line-strong hover:text-fg"}`}
    >
      {t.short}
    </button>
  );
}

export function BookmarkButton({ id, title, size = "md" }: { id: string; title: string; size?: "sm" | "md" }) {
  const { has, toggle, ready } = usePlanner();
  const on = ready && has(id);
  const dim = size === "sm" ? "h-8 w-8" : "h-9 w-9";
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); toggle(id); }}
      aria-pressed={on}
      aria-label={on ? `Remove “${title}” from My Schedule` : `Save “${title}” to My Schedule`}
      title={on ? "Saved to My Schedule" : "Save to My Schedule"}
      className={`inline-flex ${dim} shrink-0 items-center justify-center rounded-full transition ${on ? "bg-accent text-accent-fg" : "text-muted hover:bg-surface-2 hover:text-fg"}`}
    >
      {on ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
    </button>
  );
}

const KIND_META: Record<SourceKind, { label: string; icon: typeof Globe }> = {
  official: { label: "Official HITEX", icon: BadgeCheck },
  employer: { label: "Employer / company", icon: Building2 },
  government: { label: "Government", icon: Landmark },
  institution: { label: "Institution", icon: GraduationCap },
  public: { label: "Other public source", icon: Globe },
};

export function SourceList({ sources, note }: { sources: Source[]; note?: string }) {
  return (
    <div>
      <ul className="flex flex-col gap-1.5">
        {sources.map((s) => {
          const k = KIND_META[s.kind];
          const Icon = k.icon;
          return (
            <li key={s.url + s.label}>
              <a
                href={s.url}
                target="_blank"
                rel="noreferrer noopener"
                className="group flex items-center gap-3 rounded-lg border border-line px-3 py-2 text-[13px] transition hover:border-line-strong hover:bg-surface-2"
              >
                <Icon size={15} className={s.official ? "text-accent" : "text-muted"} aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-fg">{s.label}</span>
                  <span className="block text-[11.5px] text-muted">
                    {k.label}
                    {s.supports?.length ? ` · ${s.supports.join(", ")}` : ""}
                  </span>
                </span>
                <ExternalLink size={13} className="text-faint transition group-hover:text-fg" aria-hidden />
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            </li>
          );
        })}
      </ul>
      {note && <p className="mt-2 text-[12px] text-muted">{note}</p>}
    </div>
  );
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
  size = "md",
}: {
  value: T;
  options: { value: T; label: string; icon?: typeof Globe }[];
  onChange: (v: T) => void;
  label: string;
  size?: "sm" | "md";
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-full border border-line bg-surface-2 p-0.5">
      {options.map((o) => {
        const active = o.value === value;
        const Icon = o.icon;
        return (
          <button
            key={o.value}
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 ${size === "sm" ? "h-7 text-[12.5px]" : "h-8 text-[13px]"} font-medium transition ${
              active ? "bg-surface text-fg shadow-1" : "text-muted hover:text-fg"
            }`}
          >
            {Icon && <Icon size={14} aria-hidden />}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
