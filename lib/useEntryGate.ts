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
  ready,
  reducedMotion,
}: {
  openDuration: number;
  clearDuration: number;
  rememberForSession: boolean;
  /**
   * Whether the capability probe has finished.
   *
   * Kept separate from `reducedMotion` on purpose. Collapsing the two into
   * one `enabled` boolean means the first render — when nothing has been
   * measured yet — reads as "disabled", and the gate latches itself done
   * before it has ever been seen. The door has to wait to be told, not
   * assume silence means no.
   */
  ready: boolean;
  reducedMotion: boolean;
}) {
  // Always starts sealed, on both server and client, so hydration matches.
  // A guest who has already entered is skipped forward in an effect instead.
  const [stage, setStage] = useState<GateStage>("sealed");
  const [progress, setProgress] = useState(0);
  const live = useRef(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Nothing is decided until the device has actually been measured.
    if (!ready) return;

    const skip = () => {
      live.current = 1;
      setProgress(1);
      setStage("done");
      setEntered(true);
    };

    // A guest who asked their system for reduced motion never meets the door.
    if (reducedMotion) return skip();

    // A guest who arrived at a specific section — a shared deep link, a back
    // navigation, a reload partway down — asked for that place, not for a
    // ceremony. Let them straight through.
    const navigation = performance.getEntriesByType("navigation")[0] as
      | PerformanceNavigationTiming
      | undefined;
    if (window.location.hash.length > 1 || window.scrollY > 0 || navigation?.type === "back_forward") {
      return skip();
    }

    if (rememberForSession) {
      try {
        if (sessionStorage.getItem(SESSION_KEY) === "1") return skip();
      } catch {
        // Private browsing and blocked storage both throw. Showing the door
        // again is the harmless outcome, so there is nothing to handle.
      }
    }

    // Only now is it certain the door should be shown.
    setMounted(true);
  }, [ready, reducedMotion, rememberForSession]);

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
