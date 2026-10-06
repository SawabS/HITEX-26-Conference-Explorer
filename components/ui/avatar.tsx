"use client";
import Image from "next/image";
import { useState } from "react";
import { initials } from "@/lib/format";
import type { Speaker } from "@/types";

const HUES = [212, 168, 32, 330, 262, 12, 190, 140];
const hueFor = (id: string) => HUES[[...id].reduce((a, c) => a + c.charCodeAt(0), 0) % HUES.length];

type Props = {
  speaker: Pick<Speaker, "id" | "name" | "image">;
  size?: number;
  className?: string;
  ring?: boolean;
  priority?: boolean;
};

/** Circular portrait (official HITEX photo, face-centred). Falls back to a tinted monogram. */
export function Avatar({ speaker, size = 32, className = "", ring = false, priority = false }: Props) {
  const [failed, setFailed] = useState(false);
  const hue = hueFor(speaker.id);
  const style = {
    width: size,
    height: size,
    fontSize: Math.max(10, Math.round(size * 0.36)),
    background: `color-mix(in oklab, hsl(${hue} 60% 50%) 24%, var(--surface-2))`,
    color: `hsl(${hue} 75% 80%)`,
  } as const;
  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-medium tracking-tight select-none ${ring ? "ring-2 ring-[var(--surface)]" : ""} ${className}`}
      style={style}
    >
      <span aria-hidden={!failed && !!speaker.image}>{initials(speaker.name)}</span>
      {speaker.image && !failed && (
        <Image
          src={speaker.image}
          alt={`Portrait of ${speaker.name}`}
          fill
          sizes={`${size * 2}px`}
          priority={priority}
          className="object-cover"
          onError={() => setFailed(true)}
        />
      )}
    </span>
  );
}

export function AvatarStack({ people, size = 26, max = 4 }: { people: Pick<Speaker, "id" | "name" | "image">[]; size?: number; max?: number }) {
  const shown = people.slice(0, max);
  const extra = people.length - shown.length;
  return (
    <span className="inline-flex items-center" aria-label={people.map((p) => p.name).join(", ")}>
      {shown.map((p, i) => (
        <span key={p.id} style={{ marginLeft: i ? -size * 0.28 : 0, zIndex: shown.length - i }} className="relative">
          <Avatar speaker={p} size={size} ring />
        </span>
      ))}
      {extra > 0 && (
        <span
          className="relative -ml-2 inline-flex items-center justify-center rounded-full bg-surface-2 text-[11px] font-medium text-muted ring-2 ring-[var(--surface)] tnum"
          style={{ width: size, height: size }}
        >
          +{extra}
        </span>
      )}
    </span>
  );
}
