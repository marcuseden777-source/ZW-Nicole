"use client";

import { useEffect, useState } from "react";

export type Capability = {
  /** Settled once the browser has been measured. Render nothing heavy before this. */
  ready: boolean;
  /**
   * WebGL2 is present and the device looks willing to run it.
   *
   * This says only what the hardware can do. Whether a given piece should
   * MOVE is a separate question — see `reducedMotion` — because a still
   * object rendered in three dimensions moves no more than a photograph of
   * one, and refusing to draw it at all is not what the setting asks for.
   */
  webgl: boolean;
  /** The guest has asked their system for reduced motion. Always obeyed. */
  reducedMotion: boolean;
  /** Fewer particles, lower resolution — for modest phones. */
  lowPower: boolean;
};

const INITIAL: Capability = {
  ready: false,
  webgl: false,
  reducedMotion: false,
  lowPower: false,
};

function detectWebGL(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2");
    if (!gl) return false;
    // A software renderer will technically answer yes and then crawl.
    const debug = gl.getExtension("WEBGL_debug_renderer_info");
    if (debug) {
      const renderer = String(gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) ?? "");
      if (/swiftshader|llvmpipe|software/i.test(renderer)) return false;
    }
    return true;
  } catch {
    return false;
  }
}

function detectLowPower(): boolean {
  if (typeof navigator === "undefined") return false;
  const cores = navigator.hardwareConcurrency ?? 8;
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
  return cores <= 4 || memory <= 4;
}

/**
 * Measures what this particular guest's device can comfortably do, so the
 * invitation never asks more of a phone than it can give. Nobody should open
 * this link at a wedding and watch it stutter.
 */
export function useCapability(): Capability {
  const [capability, setCapability] = useState<Capability>(INITIAL);

  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    const measure = () => {
      const reducedMotion = motionQuery.matches;
      setCapability({
        ready: true,
        webgl: detectWebGL(),
        reducedMotion,
        lowPower: detectLowPower(),
      });
    };

    measure();
    motionQuery.addEventListener("change", measure);
    return () => motionQuery.removeEventListener("change", measure);
  }, []);

  return capability;
}
