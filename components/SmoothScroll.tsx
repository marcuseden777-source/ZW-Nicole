"use client";

import Lenis from "lenis";
import { useEffect, useState } from "react";

import { subscribeToEntry, hasEntered } from "@/lib/entryState";
import { startCandle, startMotion, startSplit } from "@/lib/motion";
import { useReveal } from "@/lib/useReveal";

/**
 * The weighted, unhurried scroll the whole piece is choreographed around —
 * and the observer that brings each section up as it is reached.
 *
 * Lenis only starts once the guest is through the door. Starting it earlier
 * would let the page scroll underneath the gate: Lenis moves the page itself,
 * so `overflow: hidden` on the body does not stop it.
 *
 * Anyone who has asked their system for reduced motion keeps the browser's own
 * plain scrolling, untouched.
 */
export function SmoothScroll() {
  useReveal();

  const [entered, setEntered] = useState(hasEntered);

  useEffect(() => subscribeToEntry(setEntered), []);

  // The choreography, started once for the life of the page and deliberately
  // NOT waiting on the door. The page behind the envelope is laid out and
  // measured while the guest is still looking at the wax, so the first thing
  // they see after it opens is already in the right place rather than
  // catching up.
  //
  // Each of these is independent and each returns its own teardown, so one
  // failing to start never takes the others with it.
  useEffect(() => {
    const stop = [startMotion(), startSplit(), startCandle()];
    return () => stop.forEach((s) => s());
  }, []);

  useEffect(() => {
    if (!entered) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({
      duration: 1.25,
      // A long, soft settle — paper rather than glass.
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      touchMultiplier: 1.6,
    });

    let frame = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    };
    frame = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(frame);
      lenis.destroy();
    };
  }, [entered]);

  return null;
}
