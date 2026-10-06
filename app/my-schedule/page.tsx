import type { Metadata } from "next";
import { MyScheduleView } from "@/components/planner/my-schedule-view";

export const metadata: Metadata = { title: "My Schedule" };

export default function Page() {
  return <MyScheduleView />;
}
