"use client";

import { useEffect, useRef, useState } from "react";

/**
 * How far the guest has scrolled *through* a section that pins a sticky child
 * to the viewport, from 0 (nothing scrolled yet) to 1 (the pin is about to
 * release). This is what breaks the wax seal and swings the envelope open.
 *
 * The measurement has to match the pin, not the element: a sticky child stays
 * put while its parent travels, so the travel available is the parent's height
 * less one viewport. Measuring the parent's entry into view instead would
 * start the animation already part-way through — the seal would be broken
 * before the guest had touched anything.
 *
 * Read from rAF rather than a scroll listener, so the value stays smooth under
 * Lenis and never blocks the main thread.
 */
export function useScrollProgress<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [progress, setProgress] = useState(0);
  // The 3D scene reads this every frame without re-rendering React.
  const live = useRef(0);

  useEffect(() => {
    let frame = 0;
    let last = -1;

    const tick = () => {
      const el = ref.current;
      if (el) {
        const rect = el.getBoundingClientRect();
        const travel = rect.height - window.innerHeight;
        // A section no taller than the viewport has nothing to scroll through.
        const raw = travel > 0 ? -rect.top / travel : 0;
        const next = Math.min(1, Math.max(0, raw));
        live.current = next;
        // Only wake React when the change is visible to the eye.
        if (Math.abs(next - last) > 0.002) {
          last = next;
          setProgress(next);
        }
      }
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  return { ref, progress, live };
}
