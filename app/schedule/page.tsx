import type { Metadata } from "next";
import { ScheduleView } from "@/components/timeline/schedule-view";

export const metadata: Metadata = { title: "Schedule" };

export default function Page() {
  return <ScheduleView />;
}
