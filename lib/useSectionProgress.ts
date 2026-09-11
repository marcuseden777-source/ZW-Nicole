"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Where the middle of the screen currently falls within an element, from 0
 * (its top is level with the centre of the viewport) to 1 (its bottom is).
 *
 * This is deliberately not "how far through the section have we scrolled":
 * a marker driven by that races ahead of the reader on short sections. Tying
 * it to the centre line means the rose always sits beside whatever the guest
 * is actually looking at, which is the entire point of it.
 */
export function useSectionProgress<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame = 0;
    let last = -1;

    const tick = () => {
      const el = ref.current;
      if (el) {
        const rect = el.getBoundingClientRect();
        const centre = window.innerHeight / 2;
        const raw = rect.height > 0 ? (centre - rect.top) / rect.height : 0;
        const next = Math.min(1, Math.max(0, raw));
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

  return { ref, progress };
}
