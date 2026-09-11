"use client";

/**
 * Holding the page still — and, more importantly, always giving it back.
 *
 * A module singleton rather than React state because the release has to be
 * reachable from outside React: an error boundary, a `pagehide`, and a
 * bfcache restore all need to unlock a page whose owning component may no
 * longer exist. A lock taken by a script that then died must not outlive the
 * page.
 *
 * Two things take this lock and they want different behaviour. The entry
 * gate wants the document held at the very top, because the door is the
 * beginning of the invitation and opening it should not drop you into the
 * middle of it. A lightbox opened from a photograph halfway down wants the
 * document held exactly where the guest left it, so closing the photograph
 * returns them to the picture they tapped. Hence `pinTo`.
 *
 * The owner token exists so that one holder can never release another's
 * lock — a lightbox closing must not unlock a page the gate is still holding.
 */

type Owner = string;

let owner: Owner | null = null;
let pinnedTo = 0;
let restore: { overflow: string; touchAction: string } | null = null;

function pin() {
  window.scrollTo(0, pinnedTo);
}

/**
 * Take the lock for `who`.
 *
 * `pinTo` defaults to wherever the page currently sits, which is what any
 * overlay opened mid-document wants. Pass 0 to hold it at the top.
 * Does nothing if somebody else already holds it.
 */
export function takeScrollLock(who: Owner, pinTo?: number) {
  if (owner !== null || typeof document === "undefined") return;
  owner = who;
  pinnedTo = pinTo ?? window.scrollY;

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

/**
 * Give the lock back.
 *
 * With no argument this releases unconditionally — that is the emergency
 * path, for an error boundary or a page being torn down, where the holder
 * may be gone and leaving the page frozen is the worst outcome. With an
 * owner it releases only if that owner actually holds it.
 */
export function releaseScrollLock(who?: Owner) {
  if (owner === null || typeof document === "undefined") return;
  if (who !== undefined && who !== owner) return;

  owner = null;
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
  window.addEventListener("pagehide", () => releaseScrollLock());
}
