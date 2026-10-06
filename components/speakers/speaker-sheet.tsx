"use client";
import { Building2, ExternalLink, MapPin } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { BookmarkButton, SourceList, TrackPill, TypeBadge } from "@/components/ui/badges";
import { Sheet } from "@/components/ui/sheet";
import { roleIn, sessionsBySpeaker, speakerBySlug } from "@/lib/data";
import { fmtDate } from "@/lib/format";
import { coPresenters } from "@/lib/insights";
import { useDetail, useNav } from "@/lib/nav";
import type { Speaker } from "@/types";

const ORG_BASIS: Record<NonNullable<Speaker["orgBasis"]>, string> = {
  "official-title": "as named in the official HITEX title",
  "official-bio": "as named in the official HITEX biography",
  "official-company-field": "as listed by HITEX",
  external: "from the cited public source",
};

export function SpeakerSheetHost() {
  const { speaker: slug, close } = useDetail();
  const sp = slug ? speakerBySlug.get(slug) : undefined;
  return (
    <Sheet
      open={!!sp}
      onClose={close}
      label={sp ? `Speaker: ${sp.name}` : "Speaker"}
      width={600}
      header={
        sp && (
          <div className="flex items-center gap-3">
            <p className="eyebrow">Presenter profile</p>
          </div>
        )
      }
    >
      {sp && <SpeakerDetail sp={sp} />}
    </Sheet>
  );
}

function SpeakerDetail({ sp }: { sp: Speaker }) {
  const { go } = useNav();
  const { openSession, openSpeaker } = useDetail();
  const list = sessionsBySpeaker.get(sp.id) ?? [];
  const peers = coPresenters(sp.id);

  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        <Avatar speaker={sp} size={104} priority />
        <div className="min-w-0">
          <h2 className="text-[24px] font-semibold leading-tight tracking-tight" data-autofocus tabIndex={-1}>{sp.name}</h2>
          {sp.nameKu && (
            <p className="mt-0.5 text-[14px] text-muted">
              <span lang="ckb" dir="rtl" className="inline-block">{sp.nameKu}</span>
            </p>
          )}
          <p className="mt-1.5 text-[14.5px] leading-snug text-fg-2">{sp.title ?? "Title not publicly listed"}</p>
          <div className="mt-2 flex flex-col gap-1 text-[13px] text-muted">
            {sp.organizations.length > 0 ? (
              <span className="flex items-start gap-1.5">
                <Building2 size={14} className="mt-0.5 shrink-0" aria-hidden />
                <span>
                  {sp.organizations.map((o, i) => (
                    <span key={o}>
                      {i > 0 && " · "}
                      <button onClick={() => go("speakers", { org: o })} className="text-fg-2 underline decoration-line-strong underline-offset-2 hover:text-fg">
                        {o}
                      </button>
                    </span>
                  ))}
                  {sp.orgBasis && <span className="block text-[11.5px]">Organisation {ORG_BASIS[sp.orgBasis]}</span>}
                </span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5"><Building2 size={14} aria-hidden /> Organisation not publicly listed</span>
            )}
            {sp.location && <span className="flex items-center gap-1.5"><MapPin size={14} aria-hidden /> {sp.location}</span>}
          </div>
        </div>
      </div>

      <section aria-labelledby="sp-bio">
        <h3 id="sp-bio" className="eyebrow mb-2">Biography</h3>
        {sp.bio ? (
          <>
            <p className="whitespace-pre-line text-[14.5px] leading-relaxed text-fg-2">{sp.bio}</p>
            <p className="mt-2 text-[12px] text-muted">
              {sp.bioBasis === "official"
                ? "Published by HITEX on the 2026 agenda."
                : `HITEX published no biography; compiled from ${sp.sources.find((x) => !x.official)?.label ?? "the public source listed below"}.`}
            </p>
          </>
        ) : (
          <p className="rounded-lg border border-dashed border-line-strong px-3 py-2.5 text-[13px] text-muted">Biography not publicly listed. HITEX has not published one and no reliable public source could be matched to this person.</p>
        )}
      </section>

      {sp.expertise.length > 0 && (
        <section aria-labelledby="sp-exp">
          <h3 id="sp-exp" className="eyebrow mb-2">Expertise</h3>
          <div className="flex flex-wrap gap-1.5">
            {sp.expertise.map((e) => (
              <button key={e} onClick={() => go("speakers", { expertise: e })} className="rounded-md border border-line bg-surface-2 px-2 py-1 text-[12.5px] text-fg-2 transition hover:border-line-strong hover:text-fg">
                {e}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[12px] text-muted">
            {sp.bioBasis === "external" ? "Summarised from the official title and the cited public source." : "Summarised from the official title and biography."}
          </p>
        </section>
      )}

      <section aria-labelledby="sp-sessions">
        <h3 id="sp-sessions" className="eyebrow mb-2">At HITEX 2026</h3>
        <ul className="flex flex-col gap-2">
          {list.map((s) => (
            <li key={s.id} data-track={s.track} className="tc-soft flex items-start gap-3 rounded-xl border border-line p-3">
              <div className="mono w-[62px] shrink-0 pt-0.5 text-[12px] leading-tight">
                <span className="block font-medium text-fg">{s.startTime ?? "—"}</span>
                <span className="block text-muted">{fmtDate(s.date)}</span>
              </div>
              <button onClick={() => openSession(s.slug)} className="min-w-0 flex-1 text-left">
                <span className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5">
                  <TrackPill track={s.track} />
                  <TypeBadge type={s.type} />
                  <span className="text-[12px] text-muted">· {roleIn(s, sp.id)}</span>
                </span>
                <span className="mt-1 block text-[14.5px] font-medium leading-snug text-fg hover:underline">{s.title}</span>
              </button>
              <BookmarkButton id={s.id} title={s.title} size="sm" />
            </li>
          ))}
        </ul>
      </section>

      {peers.length > 0 && (
        <section aria-labelledby="sp-peers">
          <h3 id="sp-peers" className="eyebrow mb-2">Shares the stage with</h3>
          <ul className="grid gap-1 sm:grid-cols-2">
            {peers.map(({ speaker: p }) => (
              <li key={p.id}>
                <button onClick={() => openSpeaker(p.slug)} className="flex w-full items-center gap-2.5 rounded-lg p-2 text-left transition hover:bg-surface-2">
                  <Avatar speaker={p} size={34} />
                  <span className="min-w-0">
                    <span className="block truncate text-[13.5px] font-medium">{p.name}</span>
                    <span className="block truncate text-[12px] text-muted">{p.organization ?? p.title ?? ""}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {(sp.socialLinks?.website || sp.socialLinks?.linkedin) && (
        <section aria-labelledby="sp-links">
          <h3 id="sp-links" className="eyebrow mb-2">Links</h3>
          <div className="flex flex-wrap gap-2">
            {sp.socialLinks?.website && (
              <a href={sp.socialLinks.website} target="_blank" rel="noreferrer noopener" className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line-strong bg-surface px-3.5 text-[13px] font-medium text-fg transition hover:border-accent">
                Personal website <ExternalLink size={13} aria-hidden />
              </a>
            )}
            {sp.socialLinks?.linkedin && (
              <a href={sp.socialLinks.linkedin} target="_blank" rel="noreferrer noopener" className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line-strong bg-surface px-3.5 text-[13px] font-medium text-fg transition hover:border-accent">
                LinkedIn <ExternalLink size={13} aria-hidden />
              </a>
            )}
          </div>
        </section>
      )}

      <section aria-labelledby="sp-src">
        <h3 id="sp-src" className="eyebrow mb-2">Sources</h3>
        <SourceList sources={sp.sources} />
      </section>
    </div>
  );
}
