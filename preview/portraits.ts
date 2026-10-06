/** Preview build: the same portraits, inlined as data URIs (no external image hosts are allowed). */
const files = import.meta.glob("../public/portraits/*.webp", { eager: true, query: "?inline", import: "default" }) as Record<string, string>;

const byId = new Map(Object.entries(files).map(([path, uri]) => [path.split("/").pop()!.replace(/\.webp$/, ""), uri]));

export const portraitSrc = (speakerId: string): string | undefined => byId.get(speakerId);
