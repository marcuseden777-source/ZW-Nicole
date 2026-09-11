"use client";

import { useEffect, useRef } from "react";

/**
 * How far down the whole document the reader is, 0 to 1, read every frame
 * without ever re-rendering React.
 *
 * The persistent world behind the page is driven entirely from this ref —
 * a scene that re-rendered the React tree sixty times a second to move a
 * camera would cost far more than the camera move.
 */
export function usePageScroll() {
  const progress = useRef(0);
  const velocity = useRef(0);

  useEffect(() => {
    let frame = 0;
    let last = 0;

    const tick = () => {
      const doc = document.documentElement;
      const travel = doc.scrollHeight - window.innerHeight;
      const next = travel > 0 ? Math.min(1, Math.max(0, window.scrollY / travel)) : 0;
      // Smoothed, so a flick of the wheel does not snap the world.
      velocity.current += ((next - last) * 60 - velocity.current) * 0.08;
      last = next;
      progress.current = next;
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  return { progress, velocity };
}
