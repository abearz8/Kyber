"use client";

import { useEffect, useRef } from "react";
import { track } from "@/lib/analytics";

// Monotonic clock, immune to wall-clock jumps. performance.now() preferred;
// Date.now() is an acceptable fallback (both fine in app code).
function nowMs(): number {
  return typeof performance !== "undefined" && performance.now
    ? performance.now()
    : Date.now();
}

/**
 * Fires `screen_viewed` when `screen` becomes non-null (with `from` = the
 * previously-viewed screen) and `screen_dwell` with elapsed seconds when the
 * screen changes or the component unmounts. Pass `null` to track nothing.
 *
 * Safe for React 18/19 StrictMode dev double-invoke: a transient mount→unmount
 * produces a ~0ms dwell which the 0.15s floor discards, so dwell data isn't
 * corrupted. Depends only on `[screen]`, so it never fires on plain re-renders.
 */
export function useScreenTime(screen: string | null) {
  const enteredAt = useRef<number | null>(null);
  const current = useRef<string | null>(null);

  useEffect(() => {
    if (screen == null) return;

    const from = current.current;
    current.current = screen;
    enteredAt.current = nowMs();
    track.screenViewed(screen, from);

    return () => {
      if (enteredAt.current != null) {
        const seconds = (nowMs() - enteredAt.current) / 1000;
        // Drop sub-threshold dwells: filters StrictMode dev double-invoke and
        // instantaneous pass-throughs. 0.15s is well below any real view.
        if (seconds >= 0.15) {
          track.screenDwell(screen, Math.round(seconds * 10) / 10);
        }
      }
      enteredAt.current = null;
    };
  }, [screen]);
}
