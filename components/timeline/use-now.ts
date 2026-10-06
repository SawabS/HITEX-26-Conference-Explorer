"use client";
import { useEffect, useState } from "react";
import { erbilNow } from "@/lib/format";

/** Erbil wall clock, refreshed every 30 s. Null until mounted (avoids hydration mismatch). */
export function useErbilClock() {
  const [now, setNow] = useState<{ date: string; minutes: number } | null>(null);
  useEffect(() => {
    const tick = () => setNow(erbilNow());
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);
  return now;
}
