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
export function World({ blossom }: { blossom?: string | null }) {
  const capability = useCapability();
  const { progress } = usePageScroll();
  const [entered, setEntered] = useState(hasEntered);
  const [wantsHeavyAssets, setWantsHeavyAssets] = useState(true);

  useEffect(() => subscribeToEntry(setEntered), []);

  // A modelled branch is two megabytes. It is decoration, and decoration is
  // the first thing that should go when the connection is poor — a guest
  // opening this on hotel wifi at the venue, or on a train, should not spend
  // their signal on flowers. The code-written branch takes its place and
  // costs nothing to fetch, so nobody ever sees a bare page instead.
  //
  // Deliberately NOT gated on `lowPower`. That measures cores and memory, and
  // this is a download: a four-core laptop fetches and draws thirty thousand
  // triangles without noticing, and gating on it hid the model from a large
  // share of perfectly capable machines. What matters here is the pipe.
  useEffect(() => {
    type Slow = { saveData?: boolean; effectiveType?: string };
    const link = (navigator as Navigator & { connection?: Slow }).connection;
    if (!link) return;
    const decide = () =>
      setWantsHeavyAssets(
        !link.saveData && !/^(slow-)?2g$/.test(link.effectiveType ?? ""),
      );
    decide();
    const target = link as Slow & {
      addEventListener?: (t: string, f: () => void) => void;
      removeEventListener?: (t: string, f: () => void) => void;
    };
    target.addEventListener?.("change", decide);
    return () => target.removeEventListener?.("change", decide);
  }, []);

  if (!entered) return null;
  // Drifting layers carried by the scroll are motion, so a guest who asked
  // for less of it gets none of this at all.
  if (!capability.ready || !capability.webgl || capability.reducedMotion) return null;
  if (!content.motion.webgl) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true" data-no-print>
      <WorldScene
        progress={progress}
        lowPower={capability.lowPower}
        blossom={wantsHeavyAssets ? blossom : null}
      />
    </div>
  );
}
