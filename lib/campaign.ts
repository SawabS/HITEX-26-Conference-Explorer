/**
 * Night photography of the HITEX 26 outdoor campaign in Erbil, supplied by the site owner.
 * The wordmark overlay on the source photos was cropped off so the explorer never presents
 * HITEX's logo as its own branding; the billboards remain as documentary photography.
 */
import tower from "@/public/campaign/erbil-tower-night.webp";
import billboardPeople from "@/public/campaign/conference-billboard.webp";
import curvedScreen from "@/public/campaign/curved-screen-night.webp";
import treesBillboard from "@/public/campaign/billboard-trees-night.webp";

export type CampaignPhoto = { src: typeof tower | string; alt: string; caption: string };

export const PHOTOS = {
  tower: {
    src: tower,
    alt: "A tall LED tower in Erbil at night showing a red HITEX 26 advertisement, with Kurdistan flags and taxis in the foreground",
    caption: "LED tower near the citadel",
  },
  speakers: {
    src: billboardPeople,
    alt: "Illuminated billboard at night titled #HITEX26 Conference showing portraits of the conference speakers",
    caption: "The 2026 speakers billboard",
  },
  curved: {
    src: curvedScreen,
    alt: "Curved digital billboard at night displaying the HITEX 26 campaign in red and white",
    caption: "Curved screen, city centre",
  },
  trees: {
    src: treesBillboard,
    alt: "Large lit roadside billboard for the Erbil International Technology Exhibition framed by trees at night",
    caption: "Roadside billboard",
  },
} satisfies Record<string, CampaignPhoto>;

export const PHOTO_CREDIT = "HITEX 26 outdoor campaign, Erbil";
