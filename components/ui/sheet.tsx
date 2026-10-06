"use client";
import { AnimatePresence, motion, useDragControls, useReducedMotion } from "motion/react";
import { X } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";
import { useMediaQuery } from "@/lib/use-hydrated";

const useIsDesktop = () => useMediaQuery("(min-width: 768px)", true);

type SheetProps = {
  open: boolean;
  onClose: () => void;
  label: string;
  children: ReactNode;
  header?: ReactNode;
  width?: number;
};

/**
 * Accessible modal sheet: right-hand side sheet on desktop, spring bottom sheet on phones.
 * Traps focus, closes on Escape / backdrop / downward drag, restores focus on close.
 */
export function Sheet({ open, onClose, label, children, header, width = 560 }: SheetProps) {
  const desktop = useIsDesktop();
  const reduce = useReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);
  const restore = useRef<HTMLElement | null>(null);
  const dragControls = useDragControls();

  useEffect(() => {
    if (!open) return;
    restore.current = document.activeElement as HTMLElement;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = setTimeout(() => panelRef.current?.querySelector<HTMLElement>("[data-autofocus]")?.focus() ?? panelRef.current?.focus(), 30);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.stopPropagation(); onClose(); }
      if (e.key === "Tab" && panelRef.current) {
        const f = panelRef.current.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])');
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
      restore.current?.focus?.();
    };
  }, [open, onClose]);

  const spring = reduce ? { duration: 0 } : { type: "spring" as const, damping: 34, stiffness: 380, mass: 0.9 };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60]" role="presentation">
          <motion.div
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.2 }}
            onClick={onClose}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={label}
            tabIndex={-1}
            className={
              desktop
                ? "absolute inset-y-2 right-2 flex flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-3 outline-none"
                : "absolute inset-x-0 bottom-0 flex max-h-[92dvh] flex-col overflow-hidden rounded-t-[22px] border-t border-line bg-surface shadow-3 outline-none"
            }
            style={desktop ? { width: `min(${width}px, calc(100vw - 16px))` } : undefined}
            initial={desktop ? { x: 40, opacity: 0 } : { y: "100%" }}
            animate={desktop ? { x: 0, opacity: 1 } : { y: 0 }}
            exit={desktop ? { x: 40, opacity: 0 } : { y: "100%" }}
            transition={spring}
            drag={desktop || reduce ? false : "y"}
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => { if (info.offset.y > 120 || info.velocity.y > 600) onClose(); }}
          >
            {!desktop && (
              <div className="flex touch-none justify-center pt-2.5 pb-1" aria-hidden onPointerDown={(e) => dragControls.start(e)}>
                <span className="h-1 w-10 rounded-full bg-line-strong" />
              </div>
            )}
            <div
              className="flex items-start gap-3 border-b border-line px-5 pb-3 pt-3 md:pt-4"
              onPointerDown={(e) => { if (!desktop && !(e.target as HTMLElement).closest("button,a")) dragControls.start(e); }}
            >
              <div className="min-w-0 flex-1">{header}</div>
              <button
                onClick={onClose}
                className="-mr-1.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted transition hover:bg-surface-2 hover:text-fg"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <div className="thin-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-[calc(env(safe-area-inset-bottom,0px)+28px)] pt-5">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
