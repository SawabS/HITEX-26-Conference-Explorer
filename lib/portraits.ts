import { publicAsset } from "./base-path";
/**
 * Speaker portraits. Each file in public/portraits is the official HITEX 2026
 * agenda photo for that speaker, cropped square around the face (256 px WebP).
 * The single-file preview swaps this module for one that inlines the same files.
 */
import ids from "@/data/portrait-ids.json";

const available = new Set<string>(ids);

export const portraitSrc = (speakerId: string): string | undefined =>
  available.has(speakerId) ? publicAsset(`/portraits/${speakerId}.webp`) : undefined;
