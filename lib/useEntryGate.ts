"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { setEntered } from "./entryState";
import { releaseScrollLock, takeScrollLock } from "./scrollLock";

export type GateStage = "sealed" | "opening" | "entering" | "done";

const SESSION_KEY = "zw-nicole:entered";

/**
 * The entry gate's state machine.
 *
 *   sealed   → the letter is closed, waiting. The film is already loading.
 *   opening  → the wax breaks, the flap swings, the card rises.
 *   entering → the gate clears away and the film beneath is revealed.
 *   done     → the gate is gone entirely; the page is an ordinary page.
 *
 * Deliberately a machine rather than a pair of booleans: every one of these
 * beats needs a different scroll state, a different focus target and a
 * different thing on screen, and "isOpen && !isGone" spellings of that get
 * one of the three wrong.
 */
export function useEntryGate({
  openDuration,
  clearDuration,
  rememberForSession,
  enabled,
}: {
  openDuration: number;
  clearDuration: number;
  rememberForSession: boolean;
  /** False when the door should never appear at all. */
  enabled: boolean;
}) {
  // Always starts sealed, on both server and client, so hydration matches.
  // A guest who has already entered is skipped forward in an effect instead.
  const [stage, setStage] = useState<GateStage>("sealed");
  const [progress, setProgress] = useState(0);
  const live = useRef(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // A guest who arrived at a specific section — a shared deep link, a back
    // navigation, a reload partway down — asked for that place, not for a
    // ceremony. Let them straight through.
    const deepLinked =
      window.location.hash.length > 1 ||
      window.scrollY > 0 ||
      (performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined)
        ?.type === "back_forward";

    if (!enabled || deepLinked) {
      live.current = 1;
      setProgress(1);
      setStage("done");
      setEntered(true);
      return;
    }

    if (rememberForSession) {
      try {
        if (sessionStorage.getItem(SESSION_KEY) === "1") {
          live.current = 1;
          setProgress(1);
          setStage("done");
          setEntered(true);
        }
      } catch {
        // Private browsing and blocked storage both throw. Showing the gate
        // again is the harmless outcome, so there is nothing to handle.
      }
    }
  }, [rememberForSession, enabled]);

  const open = useCallback(() => {
    setStage((current) => (current === "sealed" ? "opening" : current));
  }, []);

  // The opening tween.
  useEffect(() => {
    if (stage !== "opening") return;

    let frame = 0;
    let start = 0;

    const tick = (now: number) => {
      if (!start) start = now;
      const t = Math.min(1, (now - start) / openDuration);
      // Eased out, so the flap settles rather than stopping dead.
      const eased = 1 - Math.pow(1 - t, 3);
      live.current = eased;
      setProgress(eased);
      if (t < 1) frame = requestAnimationFrame(tick);
      else setStage("entering");
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [stage, openDuration]);

  // Clearing away, then gone.
  useEffect(() => {
    if (stage !== "entering") return;

    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      // As above — not remembering is harmless.
    }

    // Releases the scroll driver. Nothing else is watching for this, and
    // nothing else should be: the page is the page once the door is open.
    setEntered(true);

    const id = setTimeout(() => setStage("done"), clearDuration);
    return () => clearTimeout(id);
  }, [stage, clearDuration]);

  // The page must not scroll underneath a gate that covers it. Released the
  // moment the gate starts clearing, so the guest is never held.
  useEffect(() => {
    if (stage === "entering" || stage === "done") return;
    if (!mounted) return;

    takeScrollLock();
    return releaseScrollLock;
  }, [stage, mounted]);

  return { stage, progress, live, open, mounted };
}
