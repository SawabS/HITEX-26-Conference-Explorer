import { useSyncExternalStore } from "react";

const noop = () => () => {};
/** False on the server and during hydration, true afterwards. No effect, no extra render pass. */
export const useHydrated = () => useSyncExternalStore(noop, () => true, () => false);

/** Subscribe to a media query; the server snapshot is used until hydration. */
export function useMediaQuery(query: string, serverValue = false) {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia(query).matches,
    () => serverValue,
  );
}
