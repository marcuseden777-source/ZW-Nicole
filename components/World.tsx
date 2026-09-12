"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

import { hasEntered, subscribeToEntry } from "@/lib/entryState";
import { usePageScroll } from "@/lib/usePageScroll";
import { useCapability } from "@/lib/useCapability";
import * as content from "@/content/wedding";

const WorldScene = dynamic(
  () => import("@/components/three/WorldScene").then((m) => m.WorldScene),
  { ssr: false },
);

/**
 * The world behind the page.
 *
 * Fixed, full-viewport, and underneath every section — so the invitation is
 * not a document with three separate 3D moments cut into it, but one scene
 * the reader travels down through.
 *
 * It mounts only after the door is open (nothing should compete with the
 * letter) and only where the device asked for it.
 */
export function World() {
  const capability = useCapability();
  const { progress } = usePageScroll();
  const [entered, setEntered] = useState(hasEntered);

  useEffect(() => subscribeToEntry(setEntered), []);

  if (!entered) return null;
  // Drifting layers carried by the scroll are motion, so a guest who asked
  // for less of it gets none of this at all.
  if (!capability.ready || !capability.webgl || capability.reducedMotion) return null;
  if (!content.motion.webgl) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true" data-no-print>
      <WorldScene progress={progress} lowPower={capability.lowPower} />
    </div>
  );
}
