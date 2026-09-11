"use client";

import { useEffect } from "react";

/**
 * Everything carrying `.u-reveal` rises into place the first time it is read,
 * and then stays put. One observer for the whole document — cheaper than a
 * hook per element, and it keeps the markup clean.
 */
export function useReveal() {
  useEffect(() => {
    const targets = document.querySelectorAll<HTMLElement>(".u-reveal:not([data-shown])");
    if (!targets.length) return;

    if (!("IntersectionObserver" in window)) {
      targets.forEach((el) => el.setAttribute("data-shown", "true"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.setAttribute("data-shown", "true");
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.08 },
    );

    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  });
}
