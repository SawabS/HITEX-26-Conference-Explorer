"use client";
import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import type { CampaignPhoto } from "@/lib/campaign";

/**
 * Full-bleed photographic header. Content sits on a dark token scope (.on-dark) so it stays
 * legible in both themes; the photo fades into the page background at the bottom.
 */
export function PhotoBand({
  photo,
  position = "50% 50%",
  className = "",
  children,
  priority = false,
  credit = true,
}: {
  photo: CampaignPhoto;
  position?: string;
  className?: string;
  children: ReactNode;
  priority?: boolean;
  credit?: boolean;
}) {
  const reduce = useReducedMotion();
  return (
    <section className={`on-dark relative isolate overflow-hidden ${className}`}>
      <motion.div
        className="absolute inset-0 -z-10"
        initial={{ scale: reduce ? 1 : 1.07, opacity: 0.4 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: reduce ? 0 : 1.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <Image
          src={photo.src}
          alt={photo.alt}
          fill
          priority={priority}
          sizes="100vw"
          placeholder={typeof photo.src === "string" ? undefined : "blur"}
          className="object-cover"
          style={{ objectPosition: position }}
        />
      </motion.div>
      <div aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgb(11_11_21/0.92)_0%,rgb(11_11_21/0.7)_38%,rgb(11_11_21/0.15)_72%,rgb(11_11_21/0.05)_100%)]" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-[rgb(11_11_21/0.5)] lg:hidden" />
      <div aria-hidden className="absolute inset-x-0 bottom-0 -z-10 h-1/2 bg-[linear-gradient(180deg,transparent,var(--bg))]" />
      {children}
      {credit && (
        <p className="mono absolute bottom-3 right-4 z-10 text-[10.5px] tracking-wide text-white/55 md:right-6">
          {photo.caption}
        </p>
      )}
    </section>
  );
}
