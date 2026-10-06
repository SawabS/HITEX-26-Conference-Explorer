import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AppShell } from "@/components/conference/app-shell";
import { OverviewView } from "@/components/conference/overview";
import { ExploreView } from "@/components/explore/explore-view";
import { MyScheduleView } from "@/components/planner/my-schedule-view";
import { AppProviders } from "@/components/providers/app-providers";
import { SpeakersView } from "@/components/speakers/speakers-view";
import { ScheduleView } from "@/components/timeline/schedule-view";
import { useNav } from "@/lib/nav";
import { MemoryNavProvider } from "./memory-nav";
import "@/app/globals.css";

function CurrentView() {
  const { view } = useNav();
  switch (view) {
    case "schedule": return <ScheduleView />;
    case "speakers": return <SpeakersView />;
    case "explore": return <ExploreView />;
    case "my-schedule": return <MyScheduleView />;
    default: return <OverviewView />;
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppProviders>
      <MemoryNavProvider>
        <AppShell>
          <CurrentView />
        </AppShell>
      </MemoryNavProvider>
    </AppProviders>
  </StrictMode>,
);
