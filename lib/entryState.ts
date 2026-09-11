"use client";

/**
 * Whether the guest has come through the door yet.
 *
 * A module-level store rather than React context because the two things that
 * care about it — the gate and the smooth-scroll driver — are siblings, and
 * threading a provider between them to carry one boolean would be more
 * machinery than the fact deserves.
 *
 * It exists because setting `overflow: hidden` on the body does NOT hold the
 * page still: Lenis scrolls programmatically and goes straight past it. The
 * gate has to actually stop the scroll driver, not merely ask CSS to.
 */

let entered = false;
const listeners = new Set<(value: boolean) => void>();

export function hasEntered() {
  return entered;
}

export function setEntered(value: boolean) {
  if (entered === value) return;
  entered = value;
  for (const listener of listeners) listener(value);
}

export function subscribeToEntry(listener: (value: boolean) => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
