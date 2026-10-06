export type SourceKind = "official" | "employer" | "government" | "institution" | "public";

export type Source = {
  label: string;
  url: string;
  official: boolean;
  /** Visual provenance class: Official HITEX, employer/company, government, institution, other public source. */
  kind: SourceKind;
  /** Which fields this source supports, e.g. ["title", "bio", "photo"]. */
  supports?: string[];
};

export type Track = "opening" | "economy" | "technology" | "content";

export type SessionType =
  | "presentation"
  | "panel"
  | "dialogue"
  | "fireside-chat"
  | "opening-ceremony"
  | "other";

export type TopicId =
  | "ai"
  | "gov-tech"
  | "investment"
  | "digital-economy"
  | "cybersecurity"
  | "data"
  | "fintech"
  | "infrastructure"
  | "enterprise"
  | "local-tech"
  | "regulation"
  | "climate"
  | "education"
  | "health"
  | "content-media"
  | "culture"
  | "real-estate"
  | "entrepreneurship";

export type Topic = {
  id: TopicId;
  label: string;
  short: string;
  description: string;
};

export type Speaker = {
  id: string;
  slug: string;
  name: string;
  nameKu?: string;
  /** Exactly as published by HITEX. */
  title?: string;
  /** Organisation, normalised from the official title or official biography (see orgBasis). */
  organization?: string;
  organizations: string[];
  orgBasis?: "official-title" | "official-bio" | "official-company-field" | "external";
  location?: string;
  bio?: string;
  bioBasis?: "official" | "external";
  image?: string;
  expertise: string[];
  socialLinks?: { linkedin?: string; website?: string };
  sources: Source[];
};

export type Participant = { speakerId: string; moderator: boolean };

export type Session = {
  id: string;
  slug: string;
  date: string;
  dayNumber: number;
  /** HH:MM, Asia/Baghdad local time. Undefined when HITEX has not published a time. */
  startTime?: string;
  endTime?: string;
  durationMinutes?: number;
  track: Track;
  type: SessionType;
  title: string;
  titleKu?: string;
  description?: string;
  /** Third-party context for the session subject, clearly separated from the official description. */
  context?: { text: string; sources: Source[] };
  speakerIds: string[];
  moderatorIds: string[];
  participants: Participant[];
  topics: TopicId[];
  /** How the topic tags were derived, shown in the UI for transparency. */
  topicBasis: string;
  venue?: string;
  sources: Source[];
};

export type ConferenceDay = {
  date: string;
  dayNumber: number;
  track: Track;
  label: string;
  short: string;
  sessionIds: string[];
};

export type ConferenceMeta = {
  name: string;
  dates: string;
  venue: string;
  timezone: string;
  lastVerified: string;
  officialUpdatedAt: string;
  officialFigures: { label: string; value: string }[];
  agendaUrl: string;
  agendaPdfUrl: string;
};
