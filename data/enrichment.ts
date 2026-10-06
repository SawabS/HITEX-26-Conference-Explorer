/**
 * Curated enrichment layered on top of the official HITEX agenda data.
 *
 * Rules applied when this file was compiled (research pass of 6 Oct 2026):
 *  - Organisations are recorded only when the official HITEX title, the official
 *    company field or the official HITEX biography names them. orgBasis says which.
 *  - Expertise tags paraphrase what the official biography or title states. Speakers
 *    with no official biography get tags only where the official title supports them.
 *  - External sources are used only for people HITEX published without a biography,
 *    and only where a reliable public source could be matched to the same person.
 *  - Session topic tags are an analytical layer derived from official titles and the
 *    participants' official profiles; the basis is shown in the UI. HITEX publishes no
 *    session descriptions for 2026, so none are written here.
 */
import type { Source, TopicId } from "@/types";

export type SpeakerEnrichment = {
  organizations?: string[];
  orgBasis?: "official-title" | "official-bio" | "official-company-field" | "external";
  location?: string;
  expertise: string[];
  /** Used only when HITEX published no biography. */
  externalBio?: string;
  extraSources?: Source[];
  /** Public profile links taken from a cited source. */
  links?: { website?: string; linkedin?: string };
};

const kapitaHiwa: Source = {
  label: "Kapita: article by Hiwa Afandi on the KRG Department of IT",
  url: "https://kapita.iq/content/issue/navigating-digital-frontier-role-department-information-technology-transformation-kurdistan",
  official: false,
  kind: "public",
  supports: ["bio"],
};

export const speakerEnrichment: Record<string, SpeakerEnrichment> = {
  // Mazen Mahmoud Bayadh
  "9756403e-be1f-41a8-81e1-7ba655efd642": {
    organizations: ["Arcella"], orgBasis: "official-title",
    expertise: ["ERP", "Digital transformation", "Cybersecurity", "IT audit", "AI readiness"],
  },
  // Mevan Hassan
  "4694ae57-4936-4c99-824f-74e61db73c5a": {
    organizations: ["Invest Kurdistan"], orgBasis: "official-bio",
    expertise: ["Investment promotion", "Investor relations", "Strategic communications", "FDI"],
  },
  // Redwan Akram
  "d9d2b330-4f1c-4227-a12f-c44ece2a93b0": {
    organizations: ["Invest Kurdistan"], orgBasis: "official-bio",
    expertise: ["Investment law", "Company law", "Investment climate"],
  },
  // Ala Ibrahim Musa
  "87e9fe67-076e-447c-b54d-03cc3d0d070e": {
    organizations: ["Invest Kurdistan"], orgBasis: "official-bio",
    expertise: ["Agribusiness investment", "Agriculture", "Private-sector development"],
  },
  // Israa Saefulla Mustafa
  "de42468d-db7f-452f-b13d-34395353ecd4": {
    organizations: ["Invest Kurdistan"], orgBasis: "official-company-field", location: "Kurdistan Region, Iraq",
    expertise: ["FDI", "Tourism investment", "Financial analysis", "Sector research"],
  },
  // Rahbar Omer
  "3abaaad6-7253-4c97-861b-3a9c210a3c2f": {
    organizations: ["Nishan Engineering Team"], orgBasis: "official-bio",
    expertise: ["Construction", "Architectural design", "Engineering media"],
  },
  // Danya Kawa Faeq
  "7d18ddb7-837b-4637-957a-589bc75a1f99": {
    organizations: ["SK Group", "SK Estate"], orgBasis: "official-title",
    expertise: ["ERP transformation", "Real estate development", "Mobility", "Business modernisation"],
  },
  // Mahnaz Sabah Abdullah (no official biography)
  "b9837e30-090c-47b7-bb5e-3162e05fb599": {
    organizations: ["Kurdneft"], orgBasis: "official-title",
    expertise: ["HR & administration"],
  },
  // Abdurrahman Bapir
  "03d0d6a0-2b63-411f-b1c4-a1807f76892f": {
    organizations: ["Kurdcoin", "OKX"], orgBasis: "official-title",
    expertise: ["Digital assets", "Crypto markets", "Financial regulation", "Emerging markets"],
  },
  // Delband Rawanduzi
  "3d60480c-3847-4ed8-ba8e-bb88352bd804": {
    organizations: ["Soran University (CCSDRC)"], orgBasis: "official-bio",
    expertise: ["Climate change", "Geology", "Project coordination"],
  },
  // Herish Sabah Nori
  "842d91d6-0277-4aeb-92d2-5d43842e569a": {
    organizations: ["EV Mall"], orgBasis: "official-title", location: "Erbil",
    expertise: ["EV charging infrastructure", "Electric mobility"],
  },
  // Mohammed Allaf
  "a5814585-314c-4e34-a3da-daecddabd3a7": {
    organizations: ["MAPCOM"], orgBasis: "official-title",
    expertise: ["GIS", "Remote sensing", "Climate resilience", "Disaster risk reduction"],
  },
  // Barkar Azad
  "91afe548-e16e-447a-ab4f-798ef3c407f8": {
    organizations: ["DIL Technology"], orgBasis: "official-title", location: "Erbil",
    expertise: ["Internet service provision", "Networking", "Telecommunications"],
  },
  // Jamal Ahmed Hussein Barznjy
  "1cfa6c20-3b39-44dd-9426-f1315f5f0068": {
    organizations: ["KRG Ministry of Transport and Communications"], orgBasis: "official-title",
    expertise: ["Telecom regulation", "Digital infrastructure", "Postal services", "Signal processing"],
  },
  // Bewar Lateef
  "e8dfd2e3-d0ec-40af-ab91-52aab7238d2c": {
    organizations: ["Catholic University in Erbil"], orgBasis: "official-title",
    expertise: ["International relations", "Women's empowerment"],
  },
  // Wisam S. Hayder
  "02dbff0b-ca73-4741-aebd-73dab0e3268e": {
    organizations: ["FastPay"], orgBasis: "official-title",
    expertise: ["Enterprise architecture", "Cybersecurity", "Cloud-native systems", "Fintech"],
  },
  // Sara Ibrahim
  "d777f332-803e-4838-98de-3c3f1e2e13cc": {
    organizations: ["NBI"], orgBasis: "official-title", location: "Erbil",
    expertise: ["Private banking", "Business development", "Auditing", "Risk"],
  },
  // Karam Alshukur (no official biography)
  "7e27d8ef-d02d-45bb-ac6a-f5fbb288c0c9": {
    organizations: ["Arcella"], orgBasis: "official-title",
    expertise: ["Technology leadership"],
  },
  // Hiwa Afandy (no official biography; external article authored by him)
  "15cc2b99-52bd-4bb1-9485-d6a21170d75c": {
    organizations: ["KRG Department of Information Technology"], orgBasis: "official-title",
    location: "Kurdistan Region, Iraq",
    expertise: ["Digital government", "Digital identity", "Public-sector platforms"],
    externalBio:
      "Head of the Kurdistan Regional Government's Department of Information Technology (DIT). In an article he authored for Kapita, he describes the department's digital-transformation mandate across digital governance, architecture, human capital, user-centred design, security and procurement, and platforms it has delivered, including the Population Information System, the Kurdistan Financial Management System, the Business Registration System, the Citizen Complaint System and an e-visa border-control system.",
    extraSources: [kapitaHiwa],
  },
  // Doaa Nabeel
  "9fcb02b4-e1a8-4796-b273-2f6d0a295ab4": {
    organizations: ["Sardar Group"], orgBasis: "official-title",
    expertise: ["Software engineering", "IT management", "Artificial intelligence"],
  },
  // Dr. Shamal Al-Duhoki: HITEX published a title only. Profile completed from his personal
  // academic website, which matches the HITEX title (head of CS & IT).
  "5ec5097f-0f5e-4f79-bf76-80ecdb5f075a": {
    organizations: ["American University of Kurdistan"], orgBasis: "external",
    location: "Kurdistan Region, Iraq",
    expertise: ["Visual analytics", "Data visualization", "Urban trajectory data", "Machine learning", "Data security"],
    externalBio:
      "Dr. Shamal Al-Dohuki (also published as Shamal Taha) has chaired the Department of Computer Science and IT in the College of Arts and Sciences at the American University of Kurdistan since August 2024. He previously headed the Computer Science Department at the University of Duhok from 2020 to 2024. He holds a PhD in Computer Science from Kent State University (2019), where he led the TrajAnalytics project, and an MSc (2008) and BSc (2005) in Computer Science from the University of Duhok. His research covers visual analytics, urban trajectory data, data visualization and management, AI, machine learning, deep learning, data mining, image processing and data security. He served on the IEEE VIS programme committee in 2019 and 2020 and has published in IEEE Transactions on Visualization and Computer Graphics, IEEE Transactions on Intelligent Transportation Systems and IEEE Computer Graphics and Applications.",
    extraSources: [
      { label: "Dr. Shamal Al-Dohuki: personal academic website", url: "https://shamal-dohuki.github.io/", official: false, kind: "public", supports: ["bio", "organization", "expertise"] },
    ],
    links: { website: "https://shamal-dohuki.github.io/", linkedin: "https://iq.linkedin.com/in/dr-shamal-al-dohuki-5439a58a" },
  },
  // Chrakhan Faraj Hamid
  "acd0c165-c74d-456e-b9d3-ef60ce2348bf": {
    organizations: ["HITEX", "American University of Kurdistan"], orgBasis: "official-title",
    expertise: ["Conference organising", "Community engagement", "Computer science"],
  },
  // Shkar Taib Noori
  "1fa4e352-3eef-40df-93bb-6774ae193990": {
    organizations: ["KRG Department of Information Technology"], orgBasis: "official-bio",
    expertise: ["DevSecOps", "Kubernetes", "GitOps", "Data sovereignty"],
  },
  // Akam Omar
  "695827f5-23be-4ecb-96aa-ca82b2086a77": {
    organizations: ["Standing Company", "KurdAI", "Kurdistan Accrediting Association for Education"], orgBasis: "official-bio",
    expertise: ["Digital transformation", "Artificial intelligence", "Cybersecurity", "Digital communications"],
  },
  // Rayan Swar Sulaiman
  "080694a0-16d4-473a-9ae6-957f77c16c00": {
    organizations: ["Lexus Iraq"], orgBasis: "official-bio",
    expertise: ["Strategic communications", "Digital affairs", "Privacy", "Governance"],
  },
  // Dr. Sarmad I. Majeed
  "8c44ab86-00a9-4bdc-aa62-6a48b6f445eb": {
    organizations: ["American University of Kurdistan", "Duhok Polytechnic University"], orgBasis: "official-title",
    expertise: ["AI governance", "Data protection", "Cybersecurity law", "Regulatory compliance"],
  },
  // Sarkawt Shaban
  "f2cab466-18b3-44ef-ba4f-6c9b1e9f3571": {
    organizations: ["PROTEX Company"], orgBasis: "official-title", location: "Erbil",
    expertise: ["Cybersecurity", "Digital privacy", "Security awareness"],
  },
  // Noor Abdulqader
  "86bd4300-ae01-4a62-840f-decd6622e5e2": {
    location: "Erbil",
    expertise: ["Learning science", "Coaching", "Education"],
  },
  // Dr. Hemin Ibrahim
  "877b369c-3386-47b7-9e1e-9fd7f58ce090": {
    organizations: ["Tishk International University"], orgBasis: "official-title",
    expertise: ["Artificial intelligence", "Software engineering"],
  },
  // Dr. Hawraz Auny Ahmad
  "94f9641a-24ff-4b04-92b1-e5128f4aac5f": {
    organizations: ["Kurdistan Engineering Syndicate", "Salahaddin University", "Gigant Technology"], orgBasis: "official-title",
    expertise: ["Artificial intelligence", "NLP", "Speech technology", "Machine learning"],
  },
  // Hevi Khosrawi
  "9ced4dc1-f577-452c-b6ab-69ca1bc5eb0c": {
    organizations: ["Aynda Private Technical Institute", "Tishk International University"], orgBasis: "official-bio",
    location: "Erbil",
    expertise: ["Artificial intelligence", "Computer science education", "Digital media"],
  },
  // Buhar Amedi
  "33151a9a-2421-445a-93a5-4c391334b6a3": {
    organizations: ["Buhar Innovation Lab", "TEDx Barzani Park"], orgBasis: "official-bio", location: "Duhok",
    expertise: ["Robotics", "STEM education", "Coding", "Innovation programmes"],
  },
  // Mohammed Alsada
  "595e730b-1f61-46a1-b226-b7a7c8979c4d": {
    organizations: ["Erbil Makers Hub"], orgBasis: "official-title", location: "Erbil",
    expertise: ["Embedded systems", "IoT", "Industrial automation", "Digital fabrication"],
  },
  // Dana Mahmood
  "ab35a618-b960-4b38-a85b-ed6e0ccad3c2": {
    organizations: ["Medverus AI", "Diafold"], orgBasis: "official-bio",
    expertise: ["Large language models", "Computer vision", "Production AI", "AI alignment"],
  },
  // Yahya Lazgin (no official biography)
  "980325fd-6779-429a-8041-8e5f9761605a": {
    organizations: ["Ovanya"], orgBasis: "official-title",
    expertise: [],
  },
  // Begard Sarbast Yasin
  "639b5ae1-d0af-4313-b700-c5fb3ca8c569": {
    organizations: ["Diwaxan Podcast", "MarsLabs Agency"], orgBasis: "official-bio",
    expertise: ["Podcasting", "Video production", "Kurdish history storytelling"],
  },
  // Botan Luqman
  "e296579a-f801-4a6b-8e98-ff7a13fbd627": {
    location: "Erbil",
    expertise: ["Social media content", "National awareness", "Technology journalism"],
  },
  // Mustafa Ali Mustafa
  "91c93898-b53d-4b40-ad94-3e9bfa53218a": {
    organizations: ["Speda TV"], orgBasis: "official-bio",
    expertise: ["Technology broadcasting", "AI tools", "Digital marketing"],
  },
  // Mihabad Aref Hassan
  "92323cba-1178-46df-baa1-6c4302511f0c": {
    expertise: ["Clinical nutrition", "Metabolism", "Health content"],
  },
  // Kazhan Abdulwahab
  "999db105-3510-447a-b254-126b0cb8240d": {
    organizations: ["Kurdmax"], orgBasis: "official-bio",
    expertise: ["Television presenting", "Broadcasting"],
  },
  // Talaat Tahir
  "52c3f5e1-6f12-44ba-b91b-4809f5ce26ac": {
    organizations: ["Gelaywezh Cultural Center", "Kurdish Writers' Union"], orgBasis: "official-bio",
    expertise: ["Poetry", "Literary criticism", "Translation", "Publishing"],
  },
  // Yousif A Al-Kazragy
  "00fce42e-8006-4cb6-9d11-eb355d6610ca": {
    organizations: ["Arido International Oil & Gas"], orgBasis: "official-title",
    expertise: ["Personal branding", "Content creation", "Business development"],
  },
  // Evin Aso
  "47266182-ca76-4e14-b97a-b727695b70d2": {
    expertise: ["Television presenting", "Production", "Social programming"],
  },
  // Lana Mohammed Tahir
  "6d9931d3-4dba-4932-8cdc-4e4fbaad32f3": {
    expertise: ["Education", "Digital media"],
  },
  // Rastgo Yadgar Gharib
  "88aebfbb-ea37-449d-9da2-a756f58fd332": {
    location: "Erbil",
    expertise: ["Brand filmmaking", "Creative direction", "Mobile filmmaking"],
  },
  // Zina Jabbary
  "d6ea0b04-69e9-4aed-af54-69aec7567fea": {
    organizations: ["SK Estate", "Dare to Hire"], orgBasis: "official-title",
    expertise: ["Marketing", "Recruitment", "Real estate", "Humanitarian programmes"],
  },
  // Bilal Saeed Faraj
  "6ddc8c7c-abc2-4b04-8402-29b6f5b69a7f": {
    organizations: ["Mulk Foundation", "Mulk News"], orgBasis: "official-company-field",
    expertise: ["Real estate journalism", "Market analysis"],
  },
  // Miran Safiny
  "f91b8f83-ea44-4805-94ca-48e484e42d03": {
    organizations: ["MIRAN Real Estate"], orgBasis: "official-company-field", location: "Erbil",
    expertise: ["Property market", "Real estate advisory", "Sales training"],
  },
  // Hersh Sekh Omar
  "08595e03-38c9-4b44-a9d2-a786ed93ff2b": {
    organizations: ["Agora Vision"], orgBasis: "official-title",
    expertise: ["Digital publishing", "Audiobooks", "Kurdish culture"],
  },
};

export type SessionEnrichment = {
  topics: TopicId[];
  topicBasis: string;
  context?: { text: string; sources: Source[] };
};

const T = "Derived from the official session title";
const TP = "Derived from the official title and the participants' official profiles";

export const sessionEnrichment: Record<string, SessionEnrichment> = {
  // From Chaos to AI
  "a98fe015-facc-4263-978d-de63d061cab2": { topics: ["ai", "enterprise", "data"], topicBasis: TP },
  // The Future of FDI
  "cbf84e1e-c2e5-43ed-b7d6-83e26ef1afbf": { topics: ["investment", "ai", "digital-economy"], topicBasis: T },
  // From Concrete to Code
  "5bccdb64-4683-488d-a880-4140409eab71": { topics: ["real-estate", "enterprise", "digital-economy"], topicBasis: TP },
  // Unlocking Innovation: regulation
  "46515d49-ab9b-49b1-a06f-7be1287c2c2e": { topics: ["regulation", "digital-economy", "fintech"], topicBasis: TP },
  // A Greener World
  "37cac8b4-ed66-45a4-a294-75131b2e59f8": { topics: ["climate", "infrastructure"], topicBasis: TP },
  // Who Owns the Next Connection?
  "dd42af3b-9efb-4e4a-a6eb-e129ae83e708": { topics: ["infrastructure", "gov-tech", "regulation"], topicBasis: TP },
  // Goodbye, Cash!
  "db12d799-3cb7-4341-bbf0-8c0e8e3957aa": { topics: ["fintech", "digital-economy", "cybersecurity"], topicBasis: TP },
  // AI-Ready Data Center
  "daf14e5e-5895-44aa-90c4-ec8fce4f8bde": { topics: ["ai", "infrastructure", "data"], topicBasis: T },
  // KRDPass
  "c0805993-d60d-4c80-93c4-bfa9697dc9c3": {
    topics: ["gov-tech", "local-tech", "cybersecurity"],
    topicBasis: TP,
    context: {
      text:
        "KRDPass is the Kurdistan Region's digital authentication system, operated by the KRG Department of Information Technology. It gives citizens biometric digital identity (facial recognition plus a personal identification number) to access government documents and services. By February 2026 the app was available on Android and iOS, held electronic driving licences, and showed traffic fines.",
      sources: [
        { label: "KRDPass: About", url: "https://pass.krd/en/about", official: false, kind: "government", supports: ["context"] },
        { label: "Rudaw, 18 Feb 2026", url: "https://rudaw.net/english/kurdistan/18022026", official: false, kind: "public", supports: ["context"] },
      ],
    },
  },
  // The Power of Data
  "41da2f92-d5dd-4171-a059-85f1ab5e2665": { topics: ["data", "ai", "education"], topicBasis: TP },
  // The AI Era
  "c906d468-ddb3-479d-b375-3e8b74959055": { topics: ["ai", "gov-tech", "cybersecurity", "local-tech"], topicBasis: TP },
  // Trust No One
  "51177339-a2da-481f-b192-1cc45b88e289": { topics: ["cybersecurity", "regulation", "data"], topicBasis: TP },
  // Prompt or Think
  "904c85d3-a9f9-410d-a030-2c5ab96795ba": { topics: ["ai", "education"], topicBasis: TP },
  // Can We Build What We Use?
  "46a948eb-fed0-4021-8cbe-4d603bfc5a6a": { topics: ["local-tech", "ai", "entrepreneurship", "education"], topicBasis: TP },
  // The New Era of AI
  "6410627a-b197-4032-ad55-5774aaecc8af": { topics: ["ai"], topicBasis: T },
  // The Kurdish Side of Technology
  "0a46d9af-addc-44a8-993e-2dbd713e5b53": { topics: ["culture", "content-media", "local-tech"], topicBasis: TP },
  // Beyond the Clinic
  "b470224c-f4e4-4ef2-8c2a-0411e8821f1d": { topics: ["health", "content-media"], topicBasis: TP },
  // Books in the Age of Technology
  "d7c05b1a-365e-4e24-a966-2bb96336a50d": { topics: ["culture", "content-media"], topicBasis: TP },
  // Being Famous or Being Influential?
  "e1e2c2e5-2860-4bc5-bff6-09b907dd2601": { topics: ["content-media", "entrepreneurship"], topicBasis: TP },
  // Are We Watching Humans Anymore?
  "6016dd0d-3d53-42bf-8e93-d1ecd8279ab3": { topics: ["content-media", "ai"], topicBasis: T },
  // From Scroll to Sold
  "fd29bfab-f9e4-4c5d-91d4-a720025d7c42": { topics: ["real-estate", "content-media", "digital-economy"], topicBasis: T },
  // Using Technology to Serve Identity and Culture
  "8b555a3c-3ab5-4c76-a870-c98f72e0793c": { topics: ["culture", "content-media"], topicBasis: TP },
};
