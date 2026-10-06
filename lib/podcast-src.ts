import { publicAsset } from "./base-path";
/** Audio file for a day briefing. The preview build swaps this module for one that inlines the files. */
export const podcastAudioSrc = (date: string): string => publicAsset(`/podcasts/${date}.mp3`);
