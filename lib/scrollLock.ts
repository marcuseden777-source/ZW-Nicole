"use client";

/**
 * Holding the page still while the door is up — and, more importantly, always
 * giving it back.
 *
 * A module singleton rather than React state because the release has to be
 * reachable from outside React: an error boundary, a `pagehide`, and a
 * bfcache restore all need to unlock a page whose owning component may no
 * longer exist. A lock taken by a script that then died must not outlive the
 * page.
 */

let locked = false;
let restore: { overflow: string; touchAction: string } | null = null;

function pin() {
  window.scrollTo(0, 0);
}

export function takeScrollLock() {
  if (locked || typeof document === "undefined") return;
  locked = true;

  restore = {
    overflow: document.body.style.overflow,
    touchAction: document.body.style.touchAction,
  };
  document.body.style.overflow = "hidden";
  document.body.style.touchAction = "none";

  // CSS alone does not hold it: a smooth-scroll driver moves the document
  // itself and sails straight past `overflow: hidden`.
  window.addEventListener("scroll", pin, { passive: true });
  pin();
}

export function releaseScrollLock() {
  if (!locked || typeof document === "undefined") return;
  locked = false;

  window.removeEventListener("scroll", pin);
  document.body.style.overflow = restore?.overflow ?? "";
  document.body.style.touchAction = restore?.touchAction ?? "";
  restore = null;
}

/**
 * A page restored from the back/forward cache comes back with whatever styles
 * it had when it left. If it left locked, it returns locked — and nothing in
 * React re-runs to notice.
 */
if (typeof window !== "undefined") {
  window.addEventListener("pageshow", (event) => {
    if ((event as PageTransitionEvent).persisted) releaseScrollLock();
  });
  window.addEventListener("pagehide", releaseScrollLock);
}
