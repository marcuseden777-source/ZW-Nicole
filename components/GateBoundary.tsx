"use client";

import { Component, type ReactNode } from "react";

import { setEntered } from "@/lib/entryState";
import { releaseScrollLock } from "@/lib/scrollLock";

/**
 * If the door throws, the door goes away.
 *
 * This is the one genuinely catastrophic failure mode of a full-screen gate:
 * a thrown render, a chunk that 404s, a lock that is taken and never given
 * back, and a guest on the morning of the wedding cannot scroll to the venue
 * and cannot tab to it either. The invitation underneath is a complete,
 * ordinary page — so the correct response to any failure up here is to
 * release everything and render nothing.
 */
export class GateBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    // Release first, explain second — the guest's page matters more than the log.
    releaseScrollLock();
    // If the door itself threw, nothing else is going to reveal the page.
    document.documentElement.classList.remove("gating");
    setEntered(true);
    console.error("[gate] failed, falling through to the invitation:", error);
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}
