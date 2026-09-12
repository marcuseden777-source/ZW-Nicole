"use client";

import { useEffect } from "react";

/**
 * Everything carrying `.u-reveal` rises into place the first time it is read,
 * and then stays put. One observer for the whole document — cheaper than a
 * hook per element, and it keeps the markup clean.
 */
export function useReveal() {
  useEffect(() => {
    // React is alive; the boot script's fallback is no longer needed.
    const timer = (window as Window & { __zwReveal?: number }).__zwReveal;
    if (timer) {
      clearTimeout(timer);
      document.documentElement.classList.add("js");
    }

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

    // Anything carrying `.u-reveal` that arrives after this ran — a client
    // component that renders nothing until it has measured the browser, a
    // section swapped in later — would otherwise never be observed, and would
    // sit at opacity 0 for the life of the page: present, focusable, and
    // invisible. That is a trap worth closing once here rather than
    // remembering at every future call site.
    const watcher =
      "MutationObserver" in window
        ? new MutationObserver((records) => {
            for (const record of records) {
              for (const node of record.addedNodes) {
                if (!(node instanceof HTMLElement)) continue;
                if (node.matches(".u-reveal:not([data-shown])")) observer.observe(node);
                node
                  .querySelectorAll?.(".u-reveal:not([data-shown])")
                  .forEach((el) => observer.observe(el));
              }
            }
          })
        : null;

    // childList only: the scroll-driven sections write inline styles every
    // frame, and watching attributes here would wake this on all of them.
    watcher?.observe(document.body, { childList: true, subtree: true });

    // The negative bottom margin above means an element is not revealed until
    // it is properly on screen rather than merely peeking over the edge. That
    // is right everywhere except the very end of the document, where it
    // carves out a band — 12% of the viewport — that nothing can ever reach,
    // because there is no scroll left to push it higher. Anything living
    // there would stay at opacity 0 for the life of the page.
    //
    // Reaching the bottom of a document means having read it, so that is the
    // moment to show whatever is left.
    const revealTheRest = () => {
      const atEnd =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
      if (!atEnd) return;
      document
        .querySelectorAll<HTMLElement>(".u-reveal:not([data-shown])")
        .forEach((el) => {
          el.setAttribute("data-shown", "true");
          observer.unobserve(el);
        });
    };

    window.addEventListener("scroll", revealTheRest, { passive: true });
    // And once now, for a document too short to scroll at all.
    revealTheRest();

    return () => {
      observer.disconnect();
      watcher?.disconnect();
      window.removeEventListener("scroll", revealTheRest);
    };
  });
}
