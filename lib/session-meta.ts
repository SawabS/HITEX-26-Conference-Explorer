import { Flag, Flame, MessagesSquare, Presentation, Sparkles, Users, type LucideIcon } from "lucide-react";
import type { SessionType, Track } from "@/types";

export const TYPE_META: Record<SessionType, { label: string; plural: string; icon: LucideIcon; group: boolean }> = {
  presentation: { label: "Presentation", plural: "Presentations", icon: Presentation, group: false },
  panel: { label: "Panel", plural: "Panels", icon: Users, group: true },
  dialogue: { label: "Dialogue", plural: "Dialogues", icon: MessagesSquare, group: true },
  "fireside-chat": { label: "Fireside chat", plural: "Fireside chats", icon: Flame, group: true },
  "opening-ceremony": { label: "Opening ceremony", plural: "Opening ceremony", icon: Flag, group: false },
  other: { label: "Session", plural: "Sessions", icon: Sparkles, group: false },
};

export const TRACK_META: Record<Track, { label: string; theme: string }> = {
  opening: { label: "Opening", theme: "Official opening" },
  economy: { label: "Economy", theme: "Economy, investment & the digital economy" },
  technology: { label: "Technology", theme: "AI, data, security & digital government" },
  content: { label: "Content", theme: "Media, culture & the creator economy" },
};
