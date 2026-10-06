"use client";
import { Bookmark, CalendarClock, Compass, Home, Search, Users } from "lucide-react";
import { useEffect, useState, type ReactNode, type MouseEvent } from "react";
import { meta } from "@/lib/data";
import { fmtIsoDate } from "@/lib/format";
import { useNav, type View, type ParamPatch } from "@/lib/nav";
import { usePlanner } from "@/lib/planner";
import { CommandPalette, useCommandPalette } from "@/components/search/command-palette";
import { SessionSheetHost } from "./session-sheet";
import { SpeakerSheetHost } from "@/components/speakers/speaker-sheet";
import { BriefingPlayer } from "@/components/podcast/briefing-player";
import { ListenButton } from "@/components/podcast/briefings";
import { MiniPlayer } from "@/components/podcast/mini-player";
import { PodcastProvider } from "@/components/podcast/podcast-provider";

const AUTHOR = { name: "Sawab Sarkavri", handle: "SawabS", url: "https://github.com/SawabS" };

function GithubMark({ size = 16 }: { size?: number }) {
  return (
    <svg viewBox="0 0 16 16" width={size} height={size} aria-hidden fill="currentColor">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}

const TABS: { view: View; label: string; short: string; icon: typeof Home }[] = [
  { view: "overview", label: "Overview", short: "Overview", icon: Home },
  { view: "schedule", label: "Schedule", short: "Schedule", icon: CalendarClock },
  { view: "speakers", label: "Speakers", short: "Speakers", icon: Users },
  { view: "explore", label: "Explore", short: "Explore", icon: Compass },
  { view: "my-schedule", label: "My Schedule", short: "Mine", icon: Bookmark },
];

export function NavLink({
  view,
  params,
  className,
  children,
  ariaCurrent,
  onNavigate,
  ...rest
}: {
  view: View;
  params?: ParamPatch;
  className?: string;
  children: ReactNode;
  ariaCurrent?: boolean;
  onNavigate?: () => void;
  "aria-label"?: string;
}) {
  const { go, href } = useNav();
  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    onNavigate?.();
    go(view, params);
  };
  return (
    <a href={href(view, params)} onClick={onClick} className={className} aria-current={ariaCurrent ? "page" : undefined} {...rest}>
      {children}
    </a>
  );
}

/** Text wordmark: "HITEX 26" set in the display face; white on the always-dark navigation bar. */
function BrandMark() {
  return (
    <NavLink view="overview" className="group flex items-baseline gap-2 rounded-lg" aria-label="HITEX 26 Conference Explorer, overview">
      <span className="text-[19px] font-extrabold leading-none tracking-[-0.04em] text-white" style={{ fontFamily: "var(--font-display)" }}>
        HITEX<span className="ml-[0.28em] text-accent">26</span>
      </span>
      <span className="hidden border-l border-white/20 pl-2 text-[12.5px] font-medium leading-none text-white/60 lg:inline">Conference Explorer</span>
    </NavLink>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { view } = useNav();
  const { ids, ready } = usePlanner();
  const palette = useCommandPalette();
  const saved = ready ? ids.length : 0;
  const [atTop, setAtTop] = useState(true);
  useEffect(() => {
    const on = () => setAtTop(window.scrollY < 24);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  // Over the Overview hero photo the bar is transparent and uses the dark token scope.
  const overPhoto = view === "overview" && atTop;

  return (
    <PodcastProvider>
    <div className="min-h-dvh">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[80] focus:rounded-md focus:bg-surface focus:px-3 focus:py-2 focus:shadow-2">
        Skip to content
      </a>
      <header
        className={`on-dark no-print sticky top-[env(safe-area-inset-top,0px)] z-40 border-b transition-[background-color,border-color] duration-300 ${
          overPhoto ? "border-transparent bg-transparent" : "border-white/10 bg-[rgb(12_12_22/0.82)] backdrop-blur-xl backdrop-saturate-150"
        }`}
      >
        <div className="mx-auto flex h-[var(--nav-h)] max-w-[1320px] items-center gap-3 px-4 md:px-6">
          <BrandMark />
          <nav aria-label="Primary" className="ml-4 hidden items-center gap-0.5 md:flex">
            {TABS.map((t) => {
              const active = view === t.view;
              return (
                <NavLink
                  key={t.view}
                  view={t.view}
                  ariaCurrent={active}
                  className={`relative inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[13.5px] font-medium transition ${
                    active ? "bg-surface-2 text-fg" : "text-muted hover:text-fg"
                  }`}
                >
                  {t.label}
                  {t.view === "my-schedule" && saved > 0 && (
                    <span className="mono inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accent px-1 text-[10.5px] text-accent-fg">{saved}</span>
                  )}
                </NavLink>
              );
            })}
          </nav>
          <div className="ml-auto flex items-center gap-1.5">
            <ListenButton />
            <button
              onClick={palette.open}
              className="hidden h-8 items-center gap-2 rounded-full border border-line bg-surface pl-3 pr-1.5 text-[13px] text-muted transition hover:border-line-strong hover:text-fg sm:inline-flex"
              aria-label="Search sessions, speakers and topics"
            >
              <Search size={14} aria-hidden />
              <span>Search</span>
              <kbd className="mono rounded-md border border-line bg-surface-2 px-1.5 py-0.5 text-[10.5px] text-muted">{palette.shortcut}</kbd>
            </button>
            <button
              onClick={palette.open}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted transition hover:bg-surface-2 hover:text-fg sm:hidden"
              aria-label="Search"
            >
              <Search size={18} />
            </button>
            <a
              href={AUTHOR.url}
              target="_blank"
              rel="noreferrer noopener"
              title={`@${AUTHOR.handle} on GitHub`}
              aria-label={`${AUTHOR.name} on GitHub (opens in a new tab)`}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted transition hover:bg-surface-2 hover:text-fg"
            >
              <GithubMark size={18} />
            </a>
          </div>
        </div>
      </header>

      <main id="main" className="pb-tabbar">{children}</main>

      <footer className="no-print mx-auto max-w-[1320px] px-4 pb-[calc(var(--tabbar-h)+env(safe-area-inset-bottom,0px)+20px)] md:px-6 md:pb-10">
        <div className="flex flex-col gap-2 border-t border-line pt-5 text-[12.5px] text-muted md:flex-row md:items-center md:justify-between">
          <p>
            Conference data last verified: <span className="text-fg-2">{fmtIsoDate(meta.lastVerified)}</span> · Official agenda last updated{" "}
            <span className="text-fg-2">{fmtIsoDate(meta.officialUpdatedAt.slice(0, 10))}</span> · All times Erbil (UTC+3)
          </p>
          <p>
            Independent explorer built on the{" "}
            <a className="underline decoration-line-strong underline-offset-2 hover:text-fg" href={meta.agendaUrl} target="_blank" rel="noreferrer">
              official HITEX agenda
            </a>
            . Not affiliated with HITEX.
          </p>
        </div>
        <div className="mt-6 flex flex-col items-start gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[14px] font-bold text-fg">Designed and built by {AUTHOR.name}.</p>
          <a
            href={AUTHOR.url}
            target="_blank"
            rel="noreferrer noopener"
            className="group inline-flex h-10 items-center gap-2 rounded-full border border-line-strong bg-surface pl-2 pr-3.5 text-[13px] font-medium text-fg shadow-1 transition hover:-translate-y-0.5 hover:border-accent hover:shadow-2"
            aria-label={`${AUTHOR.name} on GitHub, @${AUTHOR.handle} (opens in a new tab)`}
          >
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-fg text-bg">
              <GithubMark size={15} />
            </span>
            <span className="mono">@{AUTHOR.handle}</span>
            <span className="text-muted transition group-hover:text-accent-ink" aria-hidden>↗</span>
          </a>
        </div>
      </footer>

      <nav
        aria-label="Primary"
        className="glass no-print fixed inset-x-0 bottom-0 z-40 border-t border-line pb-[env(safe-area-inset-bottom,0px)] md:hidden"
      >
        <ul className="mx-auto grid h-[var(--tabbar-h)] max-w-md grid-cols-5">
          {TABS.map((t) => {
            const active = view === t.view;
            const Icon = t.icon;
            return (
              <li key={t.view} className="flex">
                <NavLink
                  view={t.view}
                  ariaCurrent={active}
                  className={`relative flex flex-1 flex-col items-center justify-center gap-1 text-[10.5px] font-medium transition ${active ? "text-fg" : "text-muted"}`}
                >
                  <span className={`relative inline-flex h-7 w-12 items-center justify-center rounded-full transition ${active ? "bg-surface-2" : ""}`}>
                    <Icon size={19} strokeWidth={active ? 2.2 : 1.8} aria-hidden />
                    {t.view === "my-schedule" && saved > 0 && (
                      <span className="mono absolute -right-0.5 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[9.5px] text-accent-fg">{saved}</span>
                    )}
                  </span>
                  {t.short}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      <SessionSheetHost />
      <SpeakerSheetHost />
      <CommandPalette state={palette} />
      <MiniPlayer />
      <BriefingPlayer />
    </div>
    </PodcastProvider>
  );
}
