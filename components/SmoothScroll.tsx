"use client";

import Lenis from "lenis";
import { useEffect } from "react";

import { useReveal } from "@/lib/useReveal";

/**
 * The weighted, unhurried scroll the whole piece is choreographed around —
 * and the observer that brings each section up as it is reached.
 *
 * Anyone who has asked their system for reduced motion keeps the browser's
 * own plain scrolling, untouched.
 */
export function SmoothScroll() {
  useReveal();

  useEffect(() => {
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
  }, []);

  return null;
}
