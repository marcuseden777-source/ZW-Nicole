"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Whether an element is close enough to the screen to be worth building.
 *
 * The three-dimensional pieces in the sections — the parchment the story
 * unrolls on, the seal pressed at the end — each cost a WebGL context and a
 * render loop that runs for as long as they exist. Mounted on page load they
 * were both alive, and drawing, while the guest was still looking at a sealed
 * envelope several screens above them. On a phone that is two contexts and
 * two loops spent on something nobody can see.
 *
 * `rootMargin` is generous on purpose: the piece should be ready by the time
 * it is scrolled to, not start building when it arrives.
 */
export function useNearViewport<T extends HTMLElement>(margin = "60%") {
  const ref = useRef<T>(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // No observer, no way to tell — so assume yes rather than never showing it.
    if (typeof IntersectionObserver === "undefined") {
      setNear(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => setNear(entry.isIntersecting),
      { rootMargin: `${margin} 0px` },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [margin]);

  return { ref, near };
}
