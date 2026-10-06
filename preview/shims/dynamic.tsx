import { lazy, Suspense, type ComponentType, type ReactNode } from "react";

/** Minimal stand-in for next/dynamic: React.lazy with the same loading fallback. */
export default function dynamic<P extends object>(loader: () => Promise<{ default: ComponentType<P> }>, opts?: { loading?: () => ReactNode; ssr?: boolean }) {
  const L = lazy(loader);
  return function Dynamic(props: P) {
    return (
      <Suspense fallback={opts?.loading?.() ?? null}>
        <L {...props} />
      </Suspense>
    );
  };
}
