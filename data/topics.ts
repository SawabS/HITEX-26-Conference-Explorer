import type { Topic, TopicId } from "@/types";

export const TOPICS: Topic[] = [
  { id: "ai", label: "Artificial intelligence", short: "AI", description: "AI adoption, AI-ready infrastructure, prompting, AI research and AI in government." },
  { id: "gov-tech", label: "Digital government", short: "Digital Gov", description: "Public digital services, digital identity and government technology partnerships." },
  { id: "investment", label: "Investment", short: "Investment", description: "Foreign direct investment and how technology reshapes key economic sectors." },
  { id: "digital-economy", label: "Digital economy", short: "Digital Economy", description: "How digital markets, platforms and regulation reshape commerce." },
  { id: "cybersecurity", label: "Cybersecurity", short: "Cybersecurity", description: "Security, privacy, trust and protecting digital systems." },
  { id: "data", label: "Data", short: "Data", description: "Data strategy, data centres, data protection and data-driven decisions." },
  { id: "fintech", label: "Fintech & payments", short: "Fintech", description: "Digital payments, cashless transition, banking and digital assets." },
  { id: "infrastructure", label: "Infrastructure & connectivity", short: "Infrastructure", description: "Telecom, connectivity, data centres and physical infrastructure." },
  { id: "enterprise", label: "Enterprise technology", short: "Enterprise", description: "ERP, digital transformation and modernising established organisations." },
  { id: "local-tech", label: "Local tech", short: "Local Tech", description: "Building technology in Kurdistan and Iraq rather than importing it." },
  { id: "regulation", label: "Regulation & policy", short: "Regulation", description: "Regulatory frameworks, telecom policy and technology law." },
  { id: "climate", label: "Climate & sustainability", short: "Climate", description: "Clean technology, electric mobility and climate resilience." },
  { id: "education", label: "Education & skills", short: "Education", description: "Learning, academia, maker culture and technical skills." },
  { id: "health", label: "Health", short: "Health", description: "Health and nutrition in a digital context." },
  { id: "content-media", label: "Media & creators", short: "Media", description: "Social media, broadcasting, creators and audiences." },
  { id: "culture", label: "Culture & identity", short: "Culture", description: "Kurdish language, literature, identity and cultural heritage." },
  { id: "real-estate", label: "Real estate", short: "Real Estate", description: "Construction, property markets and real-estate marketing." },
  { id: "entrepreneurship", label: "Entrepreneurship", short: "Entrepreneurship", description: "Founders, makers and building ventures." },
];

export const TOPIC_BY_ID = Object.fromEntries(TOPICS.map((t) => [t.id, t])) as Record<TopicId, Topic>;

/** Topic chips surfaced prominently for the Technology day. */
export const TECH_DAY_TOPICS: TopicId[] = ["ai", "data", "cybersecurity", "gov-tech", "local-tech", "infrastructure"];
