/** Preview build: the briefing audio, inlined as data URIs (no external hosts are allowed). */
const files = import.meta.glob("../public/podcasts/*.mp3", { eager: true, query: "?inline", import: "default" }) as Record<string, string>;

const byDate = new Map(
  Object.entries(files).map(([path, uri]) => [path.split("/").pop()!.replace(/\.mp3$/, ""), uri.replace(/^data:[^;]*;/, "data:audio/mpeg;")]),
);

export const podcastAudioSrc = (date: string): string => byDate.get(date) ?? "";
