import type { Metadata } from "next";
import { SpeakersView } from "@/components/speakers/speakers-view";

export const metadata: Metadata = { title: "Speakers" };

export default function Page() {
  return <SpeakersView />;
}
