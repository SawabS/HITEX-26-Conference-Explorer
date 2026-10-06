"use client";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, CalendarPlus, Check, ChevronDown, Copy, Info, Link2, MapPin } from "lucide-react";
import { useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { BookmarkButton, SourceList, TopicTag, TrackPill, TypeBadge } from "@/components/ui/badges";
import { Sheet } from "@/components/ui/sheet";
import { sessionBySlug, sessionsBySpeaker } from "@/lib/data";
import { fmtDate, fmtDuration } from "@/lib/format";
import { copyText, downloadText, sessionAsText, sessionsToIcs } from "@/lib/ics";
import { participantsOf, relatedSessions } from "@/lib/insights";
import { useDetail, useNav } from "@/lib/nav";
import { TYPE_META } from "@/lib/session-meta";
import type { Session, Speaker } from "@/types";

/** The single-file preview cannot hand viewers files, so file downloads are offered only in the full app. */
const IS_PREVIEW = process.env.NEXT_PUBLIC_HITEX_PREVIEW === "1";

export function SessionSheetHost() {
  const { session: slug, close } = useDetail();
  const session = slug ? sessionBySlug.get(slug) : undefined;
  return (
    <Sheet
      open={!!session}
      onClose={close}
      label={session ? `Session: ${session.title}` : "Session"}
      header={session && <SessionHeader s={session} />}
    >
      {session && <SessionDetail s={session} />}
    </Sheet>
  );
}

function SessionHeader({ s }: { s: Session }) {
  return (
    <div data-track={s.track}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <TrackPill track={s.track} />
        <span className="h-3 w-px bg-line-strong" aria-hidden />
        <TypeBadge type={s.type} />
      </div>
      <h2 className="mt-2 text-[21px] font-semibold leading-tight tracking-tight md:text-[23px]" data-autofocus tabIndex={-1}>
        {s.title}
      </h2>
    </div>
  );
}

function ActionButton({ onClick, icon: Icon, label, done }: { onClick: () => void; icon: typeof Copy; label: string; done?: boolean }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line bg-surface px-3.5 text-[13px] font-medium text-fg-2 transition hover:border-line-strong hover:text-fg"
    >
      {done ? <Check size={14} className="text-[var(--ok)]" /> : <Icon size={14} aria-hidden />}
      {label}
    </button>
  );
}

function SessionDetail({ s }: { s: Session }) {
  const { go, href } = useNav();
  const { openSession, openSpeaker } = useDetail();
  const [copied, setCopied] = useState<string | null>(null);
  const people = participantsOf(s);
  const related = relatedSessions(s);
  const flash = (k: string) => { setCopied(k); setTimeout(() => setCopied(null), 1600); };

  return (
    <div className="flex flex-col gap-7" data-track={s.track}>
      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line text-[13px] sm:grid-cols-4">
        {[
          { k: "Date", v: fmtDate(s.date, "long").replace(/ 2026$/, "") },
          { k: "Time", v: s.startTime ? `${s.startTime}–${s.endTime}` : "Not published", mono: true },
          { k: "Duration", v: s.durationMinutes ? fmtDuration(s.durationMinutes) : "—", mono: true },
          { k: "Format", v: TYPE_META[s.type].label },
        ].map((r) => (
          <div key={r.k} className="bg-surface px-3 py-2.5">
            <dt className="eyebrow !text-[10px]">{r.k}</dt>
            <dd className={`mt-0.5 font-medium text-fg ${r.mono ? "mono" : ""}`}>{r.v}</dd>
          </div>
        ))}
      </dl>

      <div className="no-print -mt-3 flex flex-wrap items-center gap-2">
        <div className="mr-1 flex items-center gap-1.5 rounded-full bg-surface-2 py-0.5 pl-0.5 pr-3 text-[13px] font-medium">
          <BookmarkButton id={s.id} title={s.title} size="sm" />
          My Schedule
        </div>
        {s.startTime && !IS_PREVIEW && (
          <ActionButton
            icon={CalendarPlus}
            label="Add to calendar"
            onClick={() => downloadText(`hitex-2026-${s.slug}.ics`, sessionsToIcs([s]))}
          />
        )}
        <ActionButton icon={Copy} label="Copy details" done={copied === "text"} onClick={async () => { if (await copyText(sessionAsText(s))) flash("text"); }} />
        <ActionButton
          icon={Link2}
          label="Copy link"
          done={copied === "link"}
          onClick={async () => {
            const url = new URL(href("schedule", { day: s.date, session: s.slug }), window.location.href).toString();
            if (await copyText(url)) flash("link");
          }}
        />
      </div>

      {s.venue && (
        <p className="-mt-3 flex items-center gap-1.5 text-[13px] text-muted">
          <MapPin size={14} aria-hidden /> {s.venue}
        </p>
      )}

      <section aria-labelledby="sd-topics">
        <h3 id="sd-topics" className="eyebrow mb-2">Themes</h3>
        <div className="flex flex-wrap gap-1.5">
          {s.topics.map((t) => (
            <TopicTag key={t} id={t} onClick={() => go("explore", { topic: t })} />
          ))}
        </div>
        <p className="mt-2 text-[12px] text-muted">{s.topicBasis}. Tags are this explorer’s analysis, not HITEX’s.</p>
      </section>

      <section aria-labelledby="sd-about">
        <h3 id="sd-about" className="eyebrow mb-2">About this session</h3>
        {s.description ? (
          <p className="text-[14.5px] leading-relaxed text-fg-2">{s.description}</p>
        ) : (
          <p className="flex items-start gap-2 rounded-lg border border-dashed border-line-strong px-3 py-2.5 text-[13px] text-muted">
            <Info size={15} className="mt-0.5 shrink-0" aria-hidden />
            HITEX has not published a description for this session. The title, format and participants below are as listed on the official agenda.
          </p>
        )}
        {s.context && (
          <div className="mt-3 rounded-xl border border-line bg-surface-2 p-3.5">
            <p className="eyebrow mb-1.5 !text-[10px]">Background · not from HITEX</p>
            <p className="text-[13.5px] leading-relaxed text-fg-2">{s.context.text}</p>
            <div className="mt-3">
              <SourceList sources={s.context.sources} />
            </div>
          </div>
        )}
      </section>

      {people.length > 0 && <Participants s={s} people={people} onOpen={(p) => openSpeaker(p.slug)} />}

      {related.length > 0 && (
        <section aria-labelledby="sd-related">
          <h3 id="sd-related" className="eyebrow mb-2">Related sessions</h3>
          <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line">
            {related.map((r) => (
              <li key={r.session.id}>
                <button
                  onClick={() => openSession(r.session.slug)}
                  className="flex w-full items-start gap-3 px-3.5 py-3 text-left transition hover:bg-surface-2"
                  data-track={r.session.track}
                >
                  <span className="tc-dot mt-1.5 h-2 w-2 shrink-0 rounded-full" aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[14px] font-medium leading-snug text-fg">{r.session.title}</span>
                    <span className="mt-0.5 block text-[12px] text-muted">
                      <span className="mono">{fmtDate(r.session.date)} · {r.session.startTime}</span>
                      {r.sharedOrgs.length > 0 && <> · same organisation: {r.sharedOrgs.join(", ")}</>}
                      {r.sharedTopics.length > 0 && <> · shared themes: {r.sharedTopics.length}</>}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="sd-sources">
        <h3 id="sd-sources" className="eyebrow mb-2">Sources</h3>
        <SourceList sources={s.sources} note="Title, time, format, participants and moderator roles come from the official agenda." />
      </section>
    </div>
  );
}

function Participants({ s, people, onOpen }: { s: Session; people: Speaker[]; onOpen: (p: Speaker) => void }) {
  const [expanded, setExpanded] = useState(false);
  const mods = people.filter((p) => s.moderatorIds.includes(p.id));
  const guests = people.filter((p) => !s.moderatorIds.includes(p.id));
  const isGroup = TYPE_META[s.type].group && people.length > 1;

  const Person = ({ p, role }: { p: Speaker; role: string }) => (
    <button onClick={() => onOpen(p)} className="group flex w-full min-w-0 items-center gap-3 rounded-xl p-2 text-left transition hover:bg-surface-2">
      <Avatar speaker={p} size={44} />
      <span className="min-w-0 flex-1">
        <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
          <span className="min-w-0 break-words text-[14px] font-semibold text-fg">{p.name}</span>
          {role === "Moderator" && <span className="rounded border border-line-strong px-1 text-[10px] font-medium uppercase tracking-wide text-muted">Mod</span>}
        </span>
        <span className="mt-1 block break-words text-[12.5px] leading-snug text-muted">{p.title ?? "Title not publicly listed"}</span>
      </span>
    </button>
  );

  return (
    <section aria-labelledby="sd-people" className="min-w-0 [overflow-wrap:anywhere]">
      <div className="mb-2 flex items-center justify-between">
        <h3 id="sd-people" className="eyebrow">
          {isGroup ? `On stage · ${people.length}` : "Presenter"}
        </h3>
        <button
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="inline-flex h-8 items-center gap-1 rounded-full px-3 text-[13px] font-medium text-accent-ink transition hover:bg-accent-soft"
        >
          {expanded ? "Hide presenters" : "View presenters"}
          <ChevronDown size={15} className={`transition ${expanded ? "rotate-180" : ""}`} aria-hidden />
        </button>
      </div>

      {isGroup ? (
        <div className="tc-soft rounded-2xl border border-line p-2">
          {mods.length > 0 && (
            <div className="rounded-xl bg-surface p-1">
              <p className="px-2 pt-1 text-[11px] font-medium text-muted">Moderator</p>
              {mods.map((p) => <Person key={p.id} p={p} role="Moderator" />)}
            </div>
          )}
          <div className={`grid min-w-0 grid-cols-1 gap-1 ${mods.length ? "mt-2" : ""} ${guests.length > 1 ? "sm:grid-cols-2" : ""}`}>
            {guests.map((p) => (
              <div key={p.id} className="min-w-0 rounded-xl bg-surface p-1">
                <Person p={p} role="Speaker" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-line p-1">
          {people.map((p) => <Person key={p.id} p={p} role="Speaker" />)}
        </div>
      )}

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.2, 0.7, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="mt-3 flex flex-col gap-3">
              {people.map((p) => (
                <PresenterProfile key={p.id} p={p} role={s.moderatorIds.includes(p.id) ? "Moderator" : "Speaker"} onOpen={() => onOpen(p)} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function PresenterProfile({ p, role, onOpen }: { p: Speaker; role: string; onOpen: () => void }) {
  const other = (sessionsBySpeaker.get(p.id) ?? []).length - 1;
  return (
    <article className="min-w-0 rounded-xl border border-line p-4 [overflow-wrap:anywhere]">
      <div className="flex items-start gap-3">
        <Avatar speaker={p} size={52} />
        <div className="min-w-0 flex-1">
          <p className="eyebrow !text-[10px]">{role}</p>
          <h4 className="text-[15px] font-semibold leading-snug">{p.name}</h4>
          <p className="text-[13px] leading-snug text-muted">{p.title ?? "Title not publicly listed"}</p>
          {p.organization && <p className="mt-0.5 text-[12.5px] text-fg-2">{p.organizations.join(" · ")}</p>}
        </div>
      </div>
      {p.bio ? (
        <p className="mt-3 line-clamp-5 whitespace-pre-line text-[13.5px] leading-relaxed text-fg-2">{p.bio}</p>
      ) : (
        <p className="mt-3 text-[13px] text-muted">Biography not publicly listed.</p>
      )}
      {p.bioBasis === "external" && <p className="mt-1 text-[11.5px] text-muted">Biography compiled from a non-HITEX public source.</p>}
      {p.expertise.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {p.expertise.map((e) => (
            <span key={e} className="min-w-0 max-w-full rounded-md bg-surface-2 px-2 py-0.5 text-[11.5px] text-fg-2">{e}</span>
          ))}
        </div>
      )}
      <button onClick={onOpen} className="mt-3 inline-flex items-center gap-1 text-[13px] font-medium text-accent-ink hover:underline">
        Full profile{other > 0 ? ` · ${other} more session${other > 1 ? "s" : ""}` : ""} <ArrowRight size={13} aria-hidden />
      </button>
    </article>
  );
}
